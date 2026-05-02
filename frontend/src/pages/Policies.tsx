import React, { useEffect, useState } from 'react';
import { Plus, Shield, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
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
import { policiesApi } from '../lib/api';
import { formatDate } from '../lib/utils';

interface Policy {
  id: string;
  name: string;
  type: 'PAYMENT' | 'APPROVAL' | 'ALERT' | 'PAYROLL';
  rules: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
}

const typeConfig = {
  PAYMENT: { label: 'Payment', color: 'bg-blue-100 text-blue-700' },
  APPROVAL: { label: 'Approval', color: 'bg-green-100 text-green-700' },
  ALERT: { label: 'Alert', color: 'bg-yellow-100 text-yellow-700' },
  PAYROLL: { label: 'Payroll', color: 'bg-purple-100 text-purple-700' },
};

interface RuleEntry {
  key: string;
  value: string;
}

export function Policies() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [newPolicy, setNewPolicy] = useState({
    name: '',
    type: 'APPROVAL',
    rules: [{ key: '', value: '' }] as RuleEntry[],
  });

  useEffect(() => {
    loadPolicies();
  }, []);

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await policiesApi.list();
      setPolicies(response.data);
    } catch {
      setError('Failed to load policies');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (policy: Policy) => {
    setActionLoading(policy.id);
    try {
      await policiesApi.update(policy.id, { isActive: !policy.isActive });
      await loadPolicies();
    } catch {
      setError('Failed to update policy');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this policy?')) return;
    setActionLoading(id);
    try {
      await policiesApi.delete(id);
      await loadPolicies();
    } catch {
      setError('Failed to delete policy');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddPolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    const rulesObj: Record<string, string> = {};
    newPolicy.rules.forEach((r) => {
      if (r.key && r.value) rulesObj[r.key] = r.value;
    });

    try {
      await policiesApi.create({
        name: newPolicy.name,
        type: newPolicy.type,
        rules: rulesObj,
      });
      setShowAddModal(false);
      setNewPolicy({ name: '', type: 'APPROVAL', rules: [{ key: '', value: '' }] });
      await loadPolicies();
    } catch {
      setError('Failed to create policy');
    }
  };

  const addRuleRow = () => {
    setNewPolicy((p) => ({ ...p, rules: [...p.rules, { key: '', value: '' }] }));
  };

  const updateRule = (index: number, field: 'key' | 'value', value: string) => {
    setNewPolicy((p) => ({
      ...p,
      rules: p.rules.map((r, i) => (i === index ? { ...r, [field]: value } : r)),
    }));
  };

  const removeRule = (index: number) => {
    setNewPolicy((p) => ({ ...p, rules: p.rules.filter((_, i) => i !== index) }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            {policies.filter((p) => p.isActive).length} active policies
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Policy
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Policies list */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border bg-white p-5 shadow-sm animate-pulse">
              <div className="flex items-center justify-between mb-3">
                <div className="h-5 w-48 rounded bg-gray-200" />
                <div className="h-6 w-16 rounded-full bg-gray-200" />
              </div>
              <div className="h-4 w-full rounded bg-gray-200" />
            </div>
          ))}
        </div>
      ) : policies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Shield className="h-12 w-12 text-gray-300 mb-3" />
          <p className="text-sm font-medium text-gray-500">No policies yet</p>
          <p className="text-xs text-gray-400 mt-1">
            Create policies to automate business decisions
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => setShowAddModal(true)}
          >
            Create your first policy
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {policies.map((policy) => (
            <div
              key={policy.id}
              className={`rounded-xl border bg-white p-5 shadow-sm transition-opacity ${
                !policy.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${typeConfig[policy.type].color}`}>
                    {typeConfig[policy.type].label}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900">{policy.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">Created {formatDate(policy.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={policy.isActive ? 'success' : 'secondary'}>
                    {policy.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <button
                    onClick={() => handleToggle(policy)}
                    disabled={actionLoading === policy.id}
                    className="text-gray-400 hover:text-indigo-600 transition-colors"
                    title={policy.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {actionLoading === policy.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : policy.isActive ? (
                      <ToggleRight className="h-5 w-5 text-indigo-600" />
                    ) : (
                      <ToggleLeft className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(policy.id)}
                    disabled={actionLoading === policy.id}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Rules */}
              {Object.keys(policy.rules).length > 0 && (
                <div className="mt-4 rounded-lg bg-gray-50 p-3">
                  <p className="text-xs font-medium text-gray-500 mb-2">Rules</p>
                  <div className="space-y-1">
                    {Object.entries(policy.rules).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        <span className="rounded bg-white border px-2 py-0.5 font-mono text-gray-600">{key}</span>
                        <span className="text-gray-400">→</span>
                        <span className="text-gray-700">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add Policy Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create New Policy</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddPolicy} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="policyName">Policy Name</Label>
              <Input
                id="policyName"
                value={newPolicy.name}
                onChange={(e) => setNewPolicy((p) => ({ ...p, name: e.target.value }))}
                placeholder="Auto-approve expenses under $100"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Policy Type</Label>
              <Select
                value={newPolicy.type}
                onValueChange={(v) => setNewPolicy((p) => ({ ...p, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAYMENT">Payment</SelectItem>
                  <SelectItem value="APPROVAL">Approval</SelectItem>
                  <SelectItem value="ALERT">Alert</SelectItem>
                  <SelectItem value="PAYROLL">Payroll</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Rules builder */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Rules</Label>
                <button
                  type="button"
                  onClick={addRuleRow}
                  className="text-xs text-indigo-600 hover:text-indigo-700"
                >
                  + Add rule
                </button>
              </div>
              {newPolicy.rules.map((rule, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    value={rule.key}
                    onChange={(e) => updateRule(index, 'key', e.target.value)}
                    placeholder="Key (e.g. max_amount)"
                    className="flex-1"
                  />
                  <span className="text-gray-400 text-sm">:</span>
                  <Input
                    value={rule.value}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                    placeholder="Value (e.g. 100)"
                    className="flex-1"
                  />
                  {newPolicy.rules.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRule(index)}
                      className="text-gray-300 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Policy</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
