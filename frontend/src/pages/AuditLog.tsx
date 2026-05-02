import React, { useEffect, useState } from 'react';
import { ClipboardList, Filter } from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { auditApi } from '../lib/api';
import { formatDate } from '../lib/utils';

interface AuditEntry {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  oldData: unknown;
  newData: unknown;
  ipAddress?: string;
  createdAt: string;
  user: { id: string; name: string; email: string };
}

interface PaginatedResult {
  data: AuditEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

const actionConfig: Record<string, { variant: 'success' | 'destructive' | 'warning' | 'secondary'; label: string }> = {
  CREATE: { variant: 'success', label: 'Create' },
  DELETE: { variant: 'destructive', label: 'Delete' },
  UPDATE: { variant: 'secondary', label: 'Update' },
  APPROVE: { variant: 'success', label: 'Approve' },
  APPROVED: { variant: 'success', label: 'Approved' },
  REJECT: { variant: 'destructive', label: 'Reject' },
  REJECTED: { variant: 'destructive', label: 'Rejected' },
  PAID: { variant: 'success', label: 'Paid' },
  FLAGGED: { variant: 'warning', label: 'Flagged' },
  PAYROLL_RUN: { variant: 'secondary', label: 'Payroll Run' },
  EMPLOYEE_CREATED: { variant: 'success', label: 'Employee Created' },
  DEACTIVATED: { variant: 'destructive', label: 'Deactivated' },
  ACTIVATED: { variant: 'success', label: 'Activated' },
};

const RESOURCES = ['Invoice', 'Expense', 'Employee', 'Vendor', 'Payroll'];

export function AuditLog() {
  const [result, setResult] = useState<PaginatedResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [resourceFilter, setResourceFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [resourceFilter, startDate, endDate, page]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await auditApi.getLogs({
        resource: resourceFilter === 'all' ? undefined : resourceFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 20,
      });
      setResult(response.data);
    } catch {
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionConfig = (action: string) => {
    return actionConfig[action] || { variant: 'secondary' as const, label: action };
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Events', value: result?.pagination.total.toString() || '0' },
          { label: 'This Page', value: result?.data.length.toString() || '0' },
          { label: 'Total Pages', value: result?.pagination.totalPages.toString() || '0' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Resources" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Resources</SelectItem>
            {RESOURCES.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          type="date"
          value={startDate}
          onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
          className="w-40"
          placeholder="Start date"
        />
        <Input
          type="date"
          value={endDate}
          onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
          className="w-40"
          placeholder="End date"
        />
        {(resourceFilter !== 'all' || startDate || endDate) && (
          <button
            onClick={() => { setResourceFilter('all'); setStartDate(''); setEndDate(''); setPage(1); }}
            className="text-sm text-indigo-600 hover:text-indigo-700"
          >
            Clear filters
          </button>
        )}
      </div>

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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(8)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(5)].map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <div className="h-4 w-full rounded bg-gray-200" />
                    </td>
                  ))}
                </tr>
              ))
            ) : !result?.data.length ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center">
                  <ClipboardList className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No audit events found</p>
                </td>
              </tr>
            ) : (
              result.data.map((entry) => {
                const actionCfg = getActionConfig(entry.action);
                return (
                  <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-500">{formatDate(entry.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={actionCfg.variant}>{actionCfg.label}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className="text-sm font-medium text-gray-900">{entry.resource}</span>
                        <p className="text-xs text-gray-400 font-mono mt-0.5 truncate max-w-[120px]">
                          {entry.resourceId.substring(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 max-w-xs truncate">
                        {entry.newData
                          ? `Updated ${entry.resource.toLowerCase()}`
                          : entry.oldData
                          ? `Deleted ${entry.resource.toLowerCase()}`
                          : `${entry.action} on ${entry.resource.toLowerCase()}`}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{entry.user?.name || 'System'}</p>
                        <p className="text-xs text-gray-400">{entry.user?.email}</p>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {result && result.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {result.pagination.page} of {result.pagination.totalPages} ({result.pagination.total} total)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={!result.pagination.hasPrev}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!result.pagination.hasNext}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
