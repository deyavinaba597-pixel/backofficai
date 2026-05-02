import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../db/prisma';

const router = Router();

function getPeriodStart(period: string): Date {
  const now = new Date();
  if (period === '90d') {
    return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  }
  if (period === '1y') {
    return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
  }
  // Default: 30d
  return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
}

function groupByMonth<T extends { createdAt?: Date; date?: Date; amount: number }>(
  items: T[],
  dateField: 'createdAt' | 'date' = 'createdAt'
): Array<{ month: string; total: number }> {
  const map = new Map<string, number>();
  for (const item of items) {
    const d = item[dateField] as Date;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    map.set(key, (map.get(key) || 0) + item.amount);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }));
}

// GET /overview
router.get('/overview', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const period = (req.query.period as string) || '30d';
    const since = getPeriodStart(period);

    const [invoices, expenses, employees, transactions] = await Promise.all([
      prisma.invoice.findMany({ where: { userId } }),
      prisma.expense.findMany({ where: { userId, createdAt: { gte: since } } }),
      prisma.employee.findMany({ where: { userId, status: 'ACTIVE' } }),
      prisma.bankTransaction.findMany({ where: { userId, date: { gte: since } } }),
    ]);

    // Revenue: paid invoices in period
    const paidInvoices = invoices.filter((i) => i.status === 'PAID' && i.paidAt && i.paidAt >= since);
    const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
    const revenueByMonth = groupByMonth(paidInvoices.map((i) => ({ ...i, createdAt: i.paidAt! })));

    // Expenses
    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
    const expensesByMonth = groupByMonth(expenses);

    // Expense by category
    const categoryMap = new Map<string, number>();
    for (const e of expenses) {
      categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
    }
    const byCategory = Array.from(categoryMap.entries()).map(([category, total]) => ({ category, total }));

    // Invoice stats
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
    const paidAll = invoices.filter((i) => i.status === 'PAID' && i.paidAt);
    const avgDaysToPayment =
      paidAll.length > 0
        ? paidAll.reduce((s, i) => {
            const days = (i.paidAt!.getTime() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return s + days;
          }, 0) / paidAll.length
        : 0;

    // Cash flow
    const credits = transactions.filter((t) => t.type === 'CREDIT').reduce((s, t) => s + t.amount, 0);
    const debits = transactions.filter((t) => t.type === 'DEBIT').reduce((s, t) => s + t.amount, 0);
    const currentCashFlow = credits - debits;

    // Monthly payroll burn
    const monthlyPayroll = employees.reduce((s, e) => {
      if (e.payFrequency === 'MONTHLY') return s + e.salary / 12;
      if (e.payFrequency === 'BIWEEKLY') return s + e.salary / 26;
      return s + e.salary / 52;
    }, 0);

    // Top vendors by invoice amount
    const vendorMap = new Map<string, number>();
    for (const inv of invoices) {
      vendorMap.set(inv.vendorName, (vendorMap.get(inv.vendorName) || 0) + inv.amount);
    }
    const topVendors = Array.from(vendorMap.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, total]) => ({ name, total }));

    // Growth (compare to previous period)
    const prevSince = new Date(since.getTime() - (new Date().getTime() - since.getTime()));
    const prevExpenses = await prisma.expense.findMany({
      where: { userId, createdAt: { gte: prevSince, lt: since } },
    });
    const prevTotal = prevExpenses.reduce((s, e) => s + e.amount, 0);
    const expenseGrowth = prevTotal > 0 ? ((totalExpenses - prevTotal) / prevTotal) * 100 : 0;

    res.json({
      revenue: {
        total: totalRevenue,
        byMonth: revenueByMonth,
        growth: 0,
      },
      expenses: {
        total: totalExpenses,
        byMonth: expensesByMonth,
        byCategory,
        growth: expenseGrowth,
      },
      invoices: {
        total: invoices.length,
        paid: paidAll.length,
        overdue: overdueInvoices.length,
        avgDaysToPayment: Math.round(avgDaysToPayment),
      },
      cashFlow: {
        current: currentCashFlow,
        projected30d: currentCashFlow - monthlyPayroll,
        burnRate: monthlyPayroll,
      },
      topVendors,
      expenseCategories: byCategory,
    });
  } catch (err) {
    next(err);
  }
});

// GET /cashflow
router.get('/cashflow', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const months = parseInt((req.query.months as string) || '6');
    const since = new Date();
    since.setMonth(since.getMonth() - months);

    const transactions = await prisma.bankTransaction.findMany({
      where: { userId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    // Group by month
    const monthMap = new Map<string, { income: number; expenses: number }>();
    for (const tx of transactions) {
      const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
      const existing = monthMap.get(key) || { income: 0, expenses: 0 };
      if (tx.type === 'CREDIT') {
        existing.income += tx.amount;
      } else {
        existing.expenses += tx.amount;
      }
      monthMap.set(key, existing);
    }

    const data = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { income, expenses }]) => ({
        month,
        income,
        expenses,
        net: income - expenses,
      }));

    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
