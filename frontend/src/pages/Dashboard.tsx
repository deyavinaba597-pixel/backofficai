import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DollarSign,
  FileText,
  AlertTriangle,
  Receipt,
  Users,
  CreditCard,
  Bot,
  Plus,
  Play,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { StatCard } from '../components/StatCard';
import { AgentActivityFeed } from '../components/AgentActivityFeed';
import { Button } from '../components/ui/button';
import { dashboardApi, analyticsApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface DashboardStats {
  cashBalance: number;
  pendingInvoicesAmount: number;
  overdueInvoicesCount: number;
  monthlyExpenses: number;
  payrollDue: number;
  activeEmployeesCount: number;
  recentTransactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: 'CREDIT' | 'DEBIT';
    date: string;
    category?: string;
  }>;
  recentAgentActivity: Array<{
    id: string;
    action: string;
    details: string;
    status: 'SUCCESS' | 'FAILED' | 'PENDING';
    createdAt: string;
  }>;
}

const fallbackMonthlyData = [
  { month: 'Jul', revenue: 42000, expenses: 28000 },
  { month: 'Aug', revenue: 38000, expenses: 31000 },
  { month: 'Sep', revenue: 51000, expenses: 29000 },
  { month: 'Oct', revenue: 47000, expenses: 33000 },
  { month: 'Nov', revenue: 55000, expenses: 35000 },
  { month: 'Dec', revenue: 61000, expenses: 38000 },
];

const PIE_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [monthlyData, setMonthlyData] = useState(fallbackMonthlyData);
  const [cashFlowData, setCashFlowData] = useState<Array<{ month: string; income: number; expenses: number; net: number }>>([]);
  const [expenseCategories, setExpenseCategories] = useState<Array<{ category: string; total: number }>>([]);

  useEffect(() => {
    loadStats();
    loadAnalytics();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getStats();
      setStats(response.data);
    } catch {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      const [overviewRes, cashFlowRes] = await Promise.all([
        analyticsApi.getOverview('30d'),
        analyticsApi.getCashFlow(6),
      ]);
      const overview = overviewRes.data;
      setCashFlowData(cashFlowRes.data);
      setExpenseCategories(overview.expenseCategories || []);

      const map = new Map<string, { month: string; revenue: number; expenses: number }>();
      for (const r of (overview.revenue?.byMonth || [])) {
        map.set(r.month, { month: r.month, revenue: r.total, expenses: 0 });
      }
      for (const e of (overview.expenses?.byMonth || [])) {
        const existing = map.get(e.month) || { month: e.month, revenue: 0, expenses: 0 };
        existing.expenses = e.total;
        map.set(e.month, existing);
      }
      const combined = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
      if (combined.length > 0) setMonthlyData(combined);
    } catch {
      // Use fallback data silently
    }
  };

  return (
    <div className="space-y-6">
      {/* Quick actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Quick Actions</h3>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/agent')} className="gap-2">
            <Bot className="h-4 w-4" />
            Ask AI Agent
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/invoices')} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Invoice
          </Button>
          <Button size="sm" onClick={() => navigate('/payroll')} className="gap-2">
            <Play className="h-4 w-4" />
            Run Payroll
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Cash Balance" value={stats ? formatCurrency(stats.cashBalance) : '$0.00'} icon={DollarSign} color="green" loading={loading} />
        <StatCard title="Pending Invoices" value={stats ? formatCurrency(stats.pendingInvoicesAmount) : '$0.00'} icon={FileText} color="blue" loading={loading} />
        <StatCard title="Overdue Invoices" value={stats ? stats.overdueInvoicesCount.toString() : '0'} icon={AlertTriangle} color={stats && stats.overdueInvoicesCount > 0 ? 'red' : 'green'} loading={loading} />
        <StatCard title="Monthly Expenses" value={stats ? formatCurrency(stats.monthlyExpenses) : '$0.00'} icon={Receipt} color="yellow" loading={loading} />
        <StatCard title="Payroll Due" value={stats ? formatCurrency(stats.payrollDue) : '$0.00'} icon={CreditCard} color="purple" loading={loading} />
        <StatCard title="Active Employees" value={stats ? stats.activeEmployeesCount.toString() : '0'} icon={Users} color="indigo" loading={loading} />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Revenue vs Expenses */}
        <div className="lg:col-span-2 rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Revenue vs Expenses</h3>
            <p className="text-sm text-gray-500">Last 6 months overview</p>
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
              <Legend />
              <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Agent Activity */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900">AI Agent Activity</h3>
              <p className="text-sm text-gray-500">Recent actions</p>
            </div>
            <button onClick={() => navigate('/agent')} className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </button>
          </div>
          <AgentActivityFeed logs={stats?.recentAgentActivity || []} loading={loading} maxItems={5} />
        </div>
      </div>

      {/* Charts row 2: Cash Flow + Expense Breakdown */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cash Flow Area Chart */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Cash Flow Trend</h3>
            <p className="text-sm text-gray-500">Income vs expenses over time</p>
          </div>
          {cashFlowData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No cash flow data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={cashFlowData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '8px' }} />
                <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" fill="url(#incomeGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense Breakdown Pie */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900">Expense Breakdown</h3>
            <p className="text-sm text-gray-500">By category this month</p>
          </div>
          {expenseCategories.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No expense data yet</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={180}>
                <PieChart>
                  <Pie data={expenseCategories} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={70}>
                    {expenseCategories.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {expenseCategories.slice(0, 5).map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 truncate max-w-[80px]">{cat.category}</span>
                    </div>
                    <span className="font-medium text-gray-900">{formatCurrency(cat.total)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
            <p className="text-sm text-gray-500">Latest bank activity</p>
          </div>
        </div>
        <div className="divide-y">
          {loading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-6 py-4 animate-pulse">
                <div className="h-9 w-9 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
                <div className="h-4 w-20 rounded bg-gray-200" />
              </div>
            ))
          ) : stats?.recentTransactions.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <p className="text-sm text-gray-500">No transactions yet</p>
            </div>
          ) : (
            stats?.recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full ${tx.type === 'CREDIT' ? 'bg-green-100' : 'bg-red-100'}`}>
                  {tx.type === 'CREDIT' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-4 w-4 text-red-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                  <p className="text-xs text-gray-400">
                    {tx.category && <span className="mr-2">{tx.category}</span>}
                    {formatDate(tx.date)}
                  </p>
                </div>
                <span className={`text-sm font-semibold ${tx.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'CREDIT' ? '+' : '-'}{formatCurrency(tx.amount)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
