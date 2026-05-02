import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, XCircle, Receipt, Loader2, Download } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { expensesApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Expense {
  id: string;
  category: string;
  amount: number;
  description: string;
  submittedBy: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'warning' as const },
  APPROVED: { label: 'Approved', variant: 'success' as const },
  REJECTED: { label: 'Rejected', variant: 'destructive' as const },
};

const CATEGORIES = [
  'Travel', 'Meals', 'Software', 'Office Supplies', 'Marketing',
  'Utilities', 'Rent', 'Insurance', 'Equipment', 'Other',
];

export function Expenses() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [newExpense, setNewExpense] = useState({
    category: '',
    amount: '',
    description: '',
    submittedBy: '',
  });

  useEffect(() => {
    loadExpenses();
    setSelectedIds(new Set());
  }, [statusFilter]);

  const loadExpenses = async () => {
    try {
      setLoading(true);
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await expensesApi.list(status ? { status } : {});
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setExpenses(data);
    } catch {
      setError('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      await expensesApi.approve(id);
      await loadExpenses();
    } catch {
      setError('Failed to approve expense');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setActionLoading(id + '-reject');
    try {
      await expensesApi.reject(id, reason);
      await loadExpenses();
    } catch {
      setError('Failed to reject expense');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await expensesApi.create({
        category: newExpense.category,
        amount: parseFloat(newExpense.amount),
        description: newExpense.description,
        submittedBy: newExpense.submittedBy,
      });
      setShowAddModal(false);
      setNewExpense({ category: '', amount: '', description: '', submittedBy: '' });
      await loadExpenses();
    } catch {
      setError('Failed to create expense');
    }
  };

  const handleBulkAction = async (action: 'approve' | 'reject') => {
    if (selectedIds.size === 0) return;
    let reason: string | undefined;
    if (action === 'reject') {
      reason = prompt('Enter rejection reason for selected expenses:') || undefined;
      if (!reason) return;
    }
    setBulkLoading(true);
    try {
      await expensesApi.bulk(action, Array.from(selectedIds), reason);
      setSelectedIds(new Set());
      await loadExpenses();
    } catch {
      setError('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const status = statusFilter === 'all' ? undefined : statusFilter;
      const response = await expensesApi.export(status ? { status } : {});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenses.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export expenses');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === expenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(expenses.map((e) => e.id)));
    }
  };

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter((e) => e.status === 'PENDING').length;
  const approvedAmount = expenses.filter((e) => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Expenses', value: expenses.length.toString() },
          { label: 'Total Amount', value: formatCurrency(totalAmount) },
          { label: 'Pending Review', value: pendingCount.toString() },
          { label: 'Approved Amount', value: formatCurrency(approvedAmount) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Expenses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg bg-indigo-50 border border-indigo-200 px-4 py-3">
          <span className="text-sm font-medium text-indigo-700">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('approve')}
              disabled={bulkLoading}
              className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="h-3 w-3" />
              Approve Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('reject')}
              disabled={bulkLoading}
              className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <XCircle className="h-3 w-3" />
              Reject Selected
            </Button>
            <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={expenses.length > 0 && selectedIds.size === expenses.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-indigo-600"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(8)].map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 w-full rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : expenses.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center">
                  <Receipt className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No expenses found</p>
                </td>
              </tr>
            ) : (
              expenses.map((expense) => (
                <tr key={expense.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(expense.id) ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(expense.id)}
                      onChange={() => toggleSelect(expense.id)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                      {expense.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(expense.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-600 max-w-xs truncate">{expense.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{expense.submittedBy}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{formatDate(expense.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusConfig[expense.status].variant}>
                      {statusConfig[expense.status].label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    {expense.status === 'PENDING' && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleApprove(expense.id)}
                          disabled={actionLoading === expense.id + '-approve'}
                          className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                        >
                          {actionLoading === expense.id + '-approve' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Approve
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReject(expense.id)}
                          disabled={actionLoading === expense.id + '-reject'}
                          className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
                        >
                          {actionLoading === expense.id + '-reject' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Reject
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddExpense} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={newExpense.category} onValueChange={(v) => setNewExpense((p) => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expAmount">Amount ($)</Label>
              <Input id="expAmount" type="number" step="0.01" min="0.01" value={newExpense.amount} onChange={(e) => setNewExpense((p) => ({ ...p, amount: e.target.value }))} placeholder="250.00" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expDesc">Description</Label>
              <Input id="expDesc" value={newExpense.description} onChange={(e) => setNewExpense((p) => ({ ...p, description: e.target.value }))} placeholder="Business lunch with client..." required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="submittedBy">Submitted By</Label>
              <Input id="submittedBy" value={newExpense.submittedBy} onChange={(e) => setNewExpense((p) => ({ ...p, submittedBy: e.target.value }))} placeholder="John Smith" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={!newExpense.category}>Submit Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
