import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as bankService from '../services/bankService';
import * as notificationService from '../services/notificationService';
import prisma from '../db/prisma';

const router = Router();

// GET /
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [balance, invoices, expenses, employees, recentTx, recentActivity] = await Promise.all([
      bankService.getBalance(userId),
      prisma.invoice.findMany({ where: { userId } }),
      prisma.expense.findMany({
        where: {
          userId,
          createdAt: { gte: startOfMonth },
        },
      }),
      prisma.employee.findMany({ where: { userId, status: 'ACTIVE' } }),
      bankService.getTransactions(userId, 10),
      notificationService.getRecentActivity(userId, 5),
    ]);

    const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
    const monthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

    const payrollDue = employees.reduce((sum, e) => {
      if (e.payFrequency === 'MONTHLY') return sum + e.salary / 12;
      if (e.payFrequency === 'BIWEEKLY') return sum + e.salary / 26;
      return sum + e.salary / 52;
    }, 0);

    res.json({
      cashBalance: balance,
      pendingInvoicesAmount: pendingInvoices.reduce((sum, i) => sum + i.amount, 0),
      overdueInvoicesCount: overdueInvoices.length,
      monthlyExpenses,
      payrollDue,
      activeEmployeesCount: employees.length,
      recentTransactions: recentTx,
      recentAgentActivity: recentActivity,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
