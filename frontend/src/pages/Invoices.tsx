import React, { useEffect, useState } from 'react';
import { Plus, CheckCircle, Flag, FileText, Loader2, Download, Trash2 } from 'lucide-react';
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
import { invoicesApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Invoice {
  id: string;
  vendorName: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'FLAGGED';
  description?: string;
  paidAt?: string;
  createdAt: string;
}

const statusConfig = {
  PENDING: { label: 'Pending', variant: 'warning' as const },
  PAID: { label: 'Paid', variant: 'success' as const },
  OVERDUE: { label: 'Overdue', variant: 'destructive' as const },
  FLAGGED: { label: 'Flagged', variant: 'secondary' as const },
};

const tabs = ['All', 'PENDING', 'PAID', 'OVERDUE', 'FLAGGED'] as const;

export function Invoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('All');
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const [newInvoice, setNewInvoice] = useState({
    vendorName: '',
    amount: '',
    dueDate: '',
    description: '',
  });

  useEffect(() => {
    loadInvoices();
    setSelectedIds(new Set());
  }, [activeTab]);

  const loadInvoices = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'All' ? undefined : activeTab;
      const response = await invoicesApi.list(status ? { status } : {});
      // Handle both paginated and plain array responses
      const data = Array.isArray(response.data) ? response.data : response.data.data || [];
      setInvoices(data);
    } catch {
      setError('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async (id: string) => {
    setActionLoading(id);
    try {
      await invoicesApi.markPaid(id);
      await loadInvoices();
    } catch {
      setError('Failed to mark invoice as paid');
    } finally {
      setActionLoading(null);
    }
  };

  const handleFlag = async (id: string) => {
    const reason = prompt('Enter reason for flagging:');
    if (!reason) return;
    setActionLoading(id);
    try {
      await invoicesApi.flag(id, reason);
      await loadInvoices();
    } catch {
      setError('Failed to flag invoice');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoicesApi.create({
        vendorName: newInvoice.vendorName,
        amount: parseFloat(newInvoice.amount),
        dueDate: newInvoice.dueDate,
        description: newInvoice.description || undefined,
      });
      setShowAddModal(false);
      setNewInvoice({ vendorName: '', amount: '', dueDate: '', description: '' });
      await loadInvoices();
    } catch {
      setError('Failed to create invoice');
    }
  };

  const handleBulkAction = async (action: 'mark_paid' | 'flag' | 'delete') => {
    if (selectedIds.size === 0) return;
    let reason: string | undefined;
    if (action === 'flag') {
      reason = prompt('Enter reason for flagging selected invoices:') || undefined;
      if (!reason) return;
    }
    if (action === 'delete' && !confirm(`Delete ${selectedIds.size} invoice(s)?`)) return;

    setBulkLoading(true);
    try {
      await invoicesApi.bulk(action, Array.from(selectedIds), reason);
      setSelectedIds(new Set());
      await loadInvoices();
    } catch {
      setError('Bulk action failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const status = activeTab === 'All' ? undefined : activeTab;
      const response = await invoicesApi.export(status ? { status } : {});
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'invoices.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export invoices');
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
    if (selectedIds.size === invoices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(invoices.map((i) => i.id)));
    }
  };

  const counts = {
    All: invoices.length,
    PENDING: invoices.filter((i) => i.status === 'PENDING').length,
    PAID: invoices.filter((i) => i.status === 'PAID').length,
    OVERDUE: invoices.filter((i) => i.status === 'OVERDUE').length,
    FLAGGED: invoices.filter((i) => i.status === 'FLAGGED').length,
  };

  const totalAmount = invoices.reduce((sum, i) => sum + i.amount, 0);
  const pendingAmount = invoices.filter((i) => i.status === 'PENDING').reduce((sum, i) => sum + i.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Invoices', value: invoices.length.toString(), color: 'text-gray-900' },
          { label: 'Total Amount', value: formatCurrency(totalAmount), color: 'text-gray-900' },
          { label: 'Pending', value: formatCurrency(pendingAmount), color: 'text-yellow-600' },
          { label: 'Overdue', value: counts.OVERDUE.toString(), color: counts.OVERDUE > 0 ? 'text-red-600' : 'text-gray-900' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className={`text-xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-all ${
                activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'All' ? 'All' : statusConfig[tab].label}
              <span className="ml-1.5 text-xs text-gray-400">({counts[tab]})</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Invoice
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
              onClick={() => handleBulkAction('mark_paid')}
              disabled={bulkLoading}
              className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              <CheckCircle className="h-3 w-3" />
              Mark All Paid
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('flag')}
              disabled={bulkLoading}
              className="gap-1 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
            >
              <Flag className="h-3 w-3" />
              Flag Selected
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleBulkAction('delete')}
              disabled={bulkLoading}
              className="gap-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="h-3 w-3" />
              Delete
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
                  checked={invoices.length > 0 && selectedIds.size === invoices.length}
                  onChange={toggleSelectAll}
                  className="rounded border-gray-300 text-indigo-600"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-4 py-4"><div className="h-4 w-4 rounded bg-gray-200" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-32 rounded bg-gray-200" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-20 rounded bg-gray-200" /></td>
                  <td className="px-6 py-4"><div className="h-4 w-24 rounded bg-gray-200" /></td>
                  <td className="px-6 py-4"><div className="h-5 w-16 rounded-full bg-gray-200" /></td>
                  <td className="px-6 py-4"><div className="h-8 w-24 rounded bg-gray-200 ml-auto" /></td>
                </tr>
              ))
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No invoices found</p>
                </td>
              </tr>
            ) : (
              invoices.map((invoice) => (
                <tr key={invoice.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(invoice.id) ? 'bg-indigo-50/50' : ''}`}>
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(invoice.id)}
                      onChange={() => toggleSelect(invoice.id)}
                      className="rounded border-gray-300 text-indigo-600"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{invoice.vendorName}</p>
                    {invoice.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">{invoice.description}</p>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(invoice.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm ${invoice.status === 'OVERDUE' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                      {formatDate(invoice.dueDate)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={statusConfig[invoice.status].variant}>
                      {statusConfig[invoice.status].label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.status !== 'PAID' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkPaid(invoice.id)}
                          disabled={actionLoading === invoice.id}
                          className="gap-1 text-green-600 border-green-200 hover:bg-green-50"
                        >
                          {actionLoading === invoice.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle className="h-3 w-3" />}
                          Paid
                        </Button>
                      )}
                      {invoice.status !== 'FLAGGED' && invoice.status !== 'PAID' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFlag(invoice.id)}
                          disabled={actionLoading === invoice.id}
                          className="gap-1 text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                        >
                          <Flag className="h-3 w-3" />
                          Flag
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Invoice Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Invoice</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddInvoice} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input id="vendorName" value={newInvoice.vendorName} onChange={(e) => setNewInvoice((p) => ({ ...p, vendorName: e.target.value }))} placeholder="Acme Corp" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount ($)</Label>
              <Input id="amount" type="number" step="0.01" min="0.01" value={newInvoice.amount} onChange={(e) => setNewInvoice((p) => ({ ...p, amount: e.target.value }))} placeholder="1000.00" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input id="dueDate" type="date" value={newInvoice.dueDate} onChange={(e) => setNewInvoice((p) => ({ ...p, dueDate: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description">Description (optional)</Label>
              <Input id="description" value={newInvoice.description} onChange={(e) => setNewInvoice((p) => ({ ...p, description: e.target.value }))} placeholder="Services rendered..." />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit">Create Invoice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
