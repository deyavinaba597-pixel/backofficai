import React, { useEffect, useState } from 'react';
import { Plus, Building2, Search, Trash2, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { vendorsApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Vendor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
  totalPaid: number;
  lastPaidAt?: string;
  createdAt: string;
}

export function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [newVendor, setNewVendor] = useState({
    name: '',
    email: '',
    phone: '',
    paymentTerms: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const response = await vendorsApi.list();
      setVendors(response.data);
    } catch {
      setError('Failed to load vendors');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await vendorsApi.create({
        name: newVendor.name,
        email: newVendor.email || undefined,
        phone: newVendor.phone || undefined,
        paymentTerms: newVendor.paymentTerms || undefined,
      });
      setShowAddModal(false);
      setNewVendor({ name: '', email: '', phone: '', paymentTerms: '' });
      await loadVendors();
    } catch {
      setError('Failed to add vendor');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this vendor?')) return;
    setDeleteLoading(id);
    try {
      await vendorsApi.delete(id);
      await loadVendors();
    } catch {
      setError('Failed to delete vendor');
    } finally {
      setDeleteLoading(null);
    }
  };

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.email?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPaid = vendors.reduce((sum, v) => sum + v.totalPaid, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Vendors', value: vendors.length.toString() },
          { label: 'Total Paid', value: formatCurrency(totalPaid) },
          { label: 'Active Relationships', value: vendors.filter((v) => v.lastPaidAt).length.toString() },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search vendors..."
            className="pl-9"
          />
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Vendor
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Vendor grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-5 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded bg-gray-200" />
                  <div className="h-3 w-24 rounded bg-gray-200" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3 w-full rounded bg-gray-200" />
                <div className="h-3 w-3/4 rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredVendors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Building2 className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">
            {search ? 'No vendors match your search' : 'No vendors yet'}
          </p>
          {!search && (
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => setShowAddModal(true)}
            >
              Add your first vendor
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-semibold text-sm">
                    {vendor.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{vendor.name}</p>
                    {vendor.email && (
                      <p className="text-xs text-gray-400">{vendor.email}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(vendor.id)}
                  disabled={deleteLoading === vendor.id}
                  className="text-gray-300 hover:text-red-500 transition-colors"
                >
                  {deleteLoading === vendor.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {vendor.phone && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Phone</span>
                    <span className="text-gray-700">{vendor.phone}</span>
                  </div>
                )}
                {vendor.paymentTerms && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Payment Terms</span>
                    <span className="text-gray-700">{vendor.paymentTerms}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Total Paid</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(vendor.totalPaid)}</span>
                </div>
                {vendor.lastPaidAt && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-400">Last Payment</span>
                    <span className="text-gray-700">{formatDate(vendor.lastPaidAt)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Vendor Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddVendor} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={newVendor.name}
                onChange={(e) => setNewVendor((p) => ({ ...p, name: e.target.value }))}
                placeholder="Acme Supplies Inc."
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendorEmail">Email (optional)</Label>
              <Input
                id="vendorEmail"
                type="email"
                value={newVendor.email}
                onChange={(e) => setNewVendor((p) => ({ ...p, email: e.target.value }))}
                placeholder="billing@acme.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendorPhone">Phone (optional)</Label>
              <Input
                id="vendorPhone"
                value={newVendor.phone}
                onChange={(e) => setNewVendor((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentTerms">Payment Terms (optional)</Label>
              <Input
                id="paymentTerms"
                value={newVendor.paymentTerms}
                onChange={(e) => setNewVendor((p) => ({ ...p, paymentTerms: e.target.value }))}
                placeholder="Net 30"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Vendor</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
