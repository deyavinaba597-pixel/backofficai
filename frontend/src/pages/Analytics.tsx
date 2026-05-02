import React, { useEffect, useState } from 'react';
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
import { TrendingUp, TrendingDown, DollarSign, Clock, Flame, BarChart2 } from 'lucide-react';
import { analyticsApi } from '../lib/api';
import { formatCurrency } from '../lib/utils';

type Period = '30d' | '90d' | '1y';

interface OverviewData {
  revenue: { total: number; byMonth: Array<{ month: string; total: number }>; growth: number };
  expenses: {
    total: number;
    byMonth: Array<{ month: string; total: number }>;
    byCategory: Array<{ category: string; total: number }>;
    growth: number;
  };
  invoices: { total: number; paid: number; overdue: number; avgDaysToPayment: number };
  cashFlow: { current: number; projected30d: number; burnRate: number };
  topVendors: Array<{ name: string; total: number }>;
  expenseCategories: Array<{ category: string; total: number }>;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444'];

const periodLabels: Record<Period, string> = {
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '1y': 'Last Year',
};

export function Analytics() {
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<OverviewData | null>(null);
  const [cashFlowData, setCashFlowData] = useState<Array<{ month: string; income: number; expenses: number; net: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const months = period === '1y' ? 12 : period === '90d' ? 3 : 1;
      const [overviewRes, cashFlowRes] = await Promise.all([
        analyticsApi.getOverview(period),
        analyticsApi.getCashFlow(Math.max(months, 6)),
      ]);
      setData(overviewRes.data);
      setCashFlowData(cashFlowRes.data);
    } catch {
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  // Merge revenue and expense by month for combined chart
  const combinedMonthly = React.useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { month: string; revenue: number; expenses: number }>();
    for (const r of data.revenue.byMonth) {
      map.set(r.month, { month: r.month, revenue: r.total, expenses: 0 });
    }
    for (const e of data.expenses.byMonth) {
      const existing = map.get(e.month) || { month: e.month, revenue: 0, expenses: 0 };
      existing.expenses = e.total;
      map.set(e.month, existing);
    }
    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [data]);

  // Financial health score (0-100)
  const healthScore = React.useMemo(() => {
    if (!data) return 0;
    const overdueRatio = data.invoices.total > 0 ? data.invoices.overdue / data.invoices.total : 0;
    const overdueScore = Math.max(0, 40 - overdueRatio * 100);
    const growthScore = data.expenses.growth < 0 ? 30 : data.expenses.growth < 10 ? 25 : data.expenses.growth < 20 ? 15 : 5;
    const cashScore = data.cashFlow.current > 0 ? 30 : 10;
    return Math.round(overdueScore + growthScore + cashScore);
  }, [data]);

  const healthColor = healthScore >= 70 ? 'text-green-600' : healthScore >= 40 ? 'text-yellow-600' : 'text-red-600';
  const healthLabel = healthScore >= 70 ? 'Healthy' : healthScore >= 40 ? 'Fair' : 'At Risk';

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
          <div className="h-9 w-64 rounded bg-gray-200 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-4 shadow-sm animate-pulse">
              <div className="h-3 w-24 rounded bg-gray-200 mb-2" />
              <div className="h-7 w-32 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Financial Analytics</h2>
          <p className="text-sm text-gray-500">{periodLabels[period]}</p>
        </div>
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {(['30d', '90d', '1y'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Revenue', value: formatCurrency(data?.revenue.total || 0), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Expenses', value: formatCurrency(data?.expenses.total || 0), icon: TrendingDown, color: 'text-red-600', bg: 'bg-red-50' },
          { label: 'Overdue Invoices', value: (data?.invoices.overdue || 0).toString(), icon: TrendingUp, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Avg Payment Days', value: `${data?.invoices.avgDaysToPayment || 0}d`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Monthly Burn', value: formatCurrency(data?.cashFlow.burnRate || 0), icon: Flame, color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Health Score', value: `${healthScore}/100`, icon: BarChart2, color: healthColor, bg: 'bg-indigo-50' },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${metric.bg} mb-2`}>
              <metric.icon className={`h-4 w-4 ${metric.color}`} />
            </div>
            <p className="text-xs text-gray-500">{metric.label}</p>
            <p className={`text-lg font-bold mt-0.5 ${metric.color}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Financial Health Score */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Financial Health Score</h3>
            <p className="text-sm text-gray-500">Based on overdue ratio, expense growth, and cash flow</p>
          </div>
          <div className="text-right">
            <span className={`text-3xl font-bold ${healthColor}`}>{healthScore}</span>
            <span className="text-gray-400 text-lg">/100</span>
            <p className={`text-sm font-medium ${healthColor}`}>{healthLabel}</p>
          </div>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              healthScore >= 70 ? 'bg-green-500' : healthScore >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${healthScore}%` }}
          />
        </div>
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue vs Expenses */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
          {combinedMonthly.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data for this period</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={combinedMonthly} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="#e0e7ff" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Expense by Category */}
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Expenses by Category</h3>
          {!data?.expenseCategories.length ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No expense data</div>
          ) : (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie
                    data={data.expenseCategories}
                    dataKey="total"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                  >
                    {data.expenseCategories.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex-1 space-y-2">
                {data.expenseCategories.slice(0, 6).map((cat, i) => (
                  <div key={cat.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
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

      {/* Cash Flow Chart */}
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Cash Flow Trend</h3>
        {cashFlowData.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No cash flow data</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
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
              <Legend />
              <Area type="monotone" dataKey="income" name="Income" stroke="#6366f1" fill="url(#incomeGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#expenseGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top Vendors */}
      {data?.topVendors && data.topVendors.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-base font-semibold text-gray-900">Top Vendors by Spend</h3>
          </div>
          <div className="divide-y">
            {data.topVendors.map((vendor, i) => (
              <div key={vendor.name} className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{vendor.name}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(vendor.total)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
