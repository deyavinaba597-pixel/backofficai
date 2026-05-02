import React, { useEffect, useState } from 'react';
import { Plus, Play, Users, Loader2, CheckCircle, Download, Pencil, UserX, UserCheck } from 'lucide-react';
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
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { payrollApi } from '../lib/api';
import { formatCurrency, formatDate } from '../lib/utils';

interface Employee {
  id: string;
  name: string;
  email: string;
  salary: number;
  payFrequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY';
  bankAccount?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

interface PayrollHistory {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
}

interface PayrollResult {
  employeesProcessed: number;
  totalAmount: number;
  employees: Array<{ id: string; name: string; salary: number; payFrequency: string }>;
}

export function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [history, setHistory] = useState<PayrollHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRunModal, setShowRunModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [payrollResult, setPayrollResult] = useState<PayrollResult | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [newEmployee, setNewEmployee] = useState({
    name: '',
    email: '',
    salary: '',
    payFrequency: 'MONTHLY',
    bankAccount: '',
  });

  const [editForm, setEditForm] = useState({
    salary: '',
    payFrequency: 'MONTHLY',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, histRes] = await Promise.all([
        payrollApi.listEmployees(),
        payrollApi.getHistory(),
      ]);
      const empData = Array.isArray(empRes.data) ? empRes.data : empRes.data.data || [];
      setEmployees(empData);
      setHistory(histRes.data);
    } catch {
      setError('Failed to load payroll data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await payrollApi.createEmployee({
        name: newEmployee.name,
        email: newEmployee.email,
        salary: parseFloat(newEmployee.salary),
        payFrequency: newEmployee.payFrequency,
        bankAccount: newEmployee.bankAccount || undefined,
      });
      setShowAddModal(false);
      setNewEmployee({ name: '', email: '', salary: '', payFrequency: 'MONTHLY', bankAccount: '' });
      await loadData();
    } catch {
      setError('Failed to add employee');
    }
  };

  const handleEditEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmployee) return;
    try {
      await payrollApi.updateEmployee(editingEmployee.id, {
        salary: parseFloat(editForm.salary),
        payFrequency: editForm.payFrequency,
      });
      setShowEditModal(false);
      setEditingEmployee(null);
      await loadData();
    } catch {
      setError('Failed to update employee');
    }
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEditForm({ salary: emp.salary.toString(), payFrequency: emp.payFrequency });
    setShowEditModal(true);
  };

  const handleToggleStatus = async (emp: Employee) => {
    setActionLoading(emp.id);
    try {
      if (emp.status === 'ACTIVE') {
        await payrollApi.deactivateEmployee(emp.id);
      } else {
        await payrollApi.activateEmployee(emp.id);
      }
      await loadData();
    } catch {
      setError('Failed to update employee status');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunPayroll = async () => {
    setRunLoading(true);
    try {
      const response = await payrollApi.runPayroll();
      setPayrollResult(response.data);
      await loadData();
    } catch {
      setError('Failed to run payroll');
    } finally {
      setRunLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await payrollApi.export();
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees.csv';
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      setError('Failed to export payroll data');
    }
  };

  const activeEmployees = employees.filter((e) => e.status === 'ACTIVE');
  const totalMonthlyPayroll = activeEmployees.reduce((sum, e) => {
    if (e.payFrequency === 'MONTHLY') return sum + e.salary / 12;
    if (e.payFrequency === 'BIWEEKLY') return sum + e.salary / 26;
    return sum + e.salary / 52;
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Total Employees', value: employees.length.toString() },
          { label: 'Active', value: activeEmployees.length.toString() },
          { label: 'Monthly Payroll', value: formatCurrency(totalMonthlyPayroll) },
          { label: 'Annual Payroll', value: formatCurrency(totalMonthlyPayroll * 12) },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border bg-white p-4 shadow-sm">
            <p className="text-xs text-gray-500">{stat.label}</p>
            <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Employees</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
          <Button variant="outline" onClick={() => setShowAddModal(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Employee
          </Button>
          <Button onClick={() => setShowRunModal(true)} className="gap-2">
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

      {/* Employee table */}
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Salary</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pay Frequency</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {[...Array(6)].map((_, j) => (
                    <td key={j} className="px-6 py-4"><div className="h-4 w-full rounded bg-gray-200" /></td>
                  ))}
                </tr>
              ))
            ) : employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <Users className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No employees yet</p>
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600">{emp.email}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900">{formatCurrency(emp.salary)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                      {emp.payFrequency.charAt(0) + emp.payFrequency.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={emp.status === 'ACTIVE' ? 'success' : 'secondary'}>
                      {emp.status.charAt(0) + emp.status.slice(1).toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(emp)}
                        className="gap-1"
                      >
                        <Pencil className="h-3 w-3" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(emp)}
                        disabled={actionLoading === emp.id}
                        className={`gap-1 ${emp.status === 'ACTIVE' ? 'text-red-600 border-red-200 hover:bg-red-50' : 'text-green-600 border-green-200 hover:bg-green-50'}`}
                      >
                        {actionLoading === emp.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : emp.status === 'ACTIVE' ? (
                          <UserX className="h-3 w-3" />
                        ) : (
                          <UserCheck className="h-3 w-3" />
                        )}
                        {emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Payroll History */}
      {history.length > 0 && (
        <div className="rounded-xl border bg-white shadow-sm">
          <div className="px-6 py-4 border-b">
            <h3 className="text-base font-semibold text-gray-900">Payroll History</h3>
          </div>
          <div className="divide-y">
            {history.slice(0, 10).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-400">{formatDate(tx.date)}</p>
                </div>
                <span className="text-sm font-semibold text-red-600">-{formatCurrency(tx.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="empName">Full Name</Label>
              <Input id="empName" value={newEmployee.name} onChange={(e) => setNewEmployee((p) => ({ ...p, name: e.target.value }))} placeholder="Jane Doe" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empEmail">Email</Label>
              <Input id="empEmail" type="email" value={newEmployee.email} onChange={(e) => setNewEmployee((p) => ({ ...p, email: e.target.value }))} placeholder="jane@company.com" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="empSalary">Annual Salary ($)</Label>
              <Input id="empSalary" type="number" step="1000" min="0" value={newEmployee.salary} onChange={(e) => setNewEmployee((p) => ({ ...p, salary: e.target.value }))} placeholder="75000" required />
            </div>
            <div className="space-y-1.5">
              <Label>Pay Frequency</Label>
              <Select value={newEmployee.payFrequency} onValueChange={(v) => setNewEmployee((p) => ({ ...p, payFrequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bankAccount">Bank Account (optional)</Label>
              <Input id="bankAccount" value={newEmployee.bankAccount} onChange={(e) => setNewEmployee((p) => ({ ...p, bankAccount: e.target.value }))} placeholder="****1234" />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit">Add Employee</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Employee Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>{editingEmployee?.name}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditEmployee} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="editSalary">Annual Salary ($)</Label>
              <Input id="editSalary" type="number" step="1000" min="0" value={editForm.salary} onChange={(e) => setEditForm((p) => ({ ...p, salary: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label>Pay Frequency</Label>
              <Select value={editForm.payFrequency} onValueChange={(v) => setEditForm((p) => ({ ...p, payFrequency: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Weekly</SelectItem>
                  <SelectItem value="BIWEEKLY">Bi-weekly</SelectItem>
                  <SelectItem value="MONTHLY">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Run Payroll Modal */}
      <Dialog open={showRunModal} onOpenChange={(open) => { setShowRunModal(open); if (!open) setPayrollResult(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Run Payroll</DialogTitle>
            <DialogDescription>This will process payroll for all {activeEmployees.length} active employees.</DialogDescription>
          </DialogHeader>

          {payrollResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">Payroll Processed Successfully</p>
                  <p className="text-sm text-green-700">{payrollResult.employeesProcessed} employees paid · {formatCurrency(payrollResult.totalAmount)} total</p>
                </div>
              </div>
              <div className="space-y-2">
                {payrollResult.employees.map((emp) => (
                  <div key={emp.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{emp.name}</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(emp.payFrequency === 'WEEKLY' ? emp.salary / 52 : emp.payFrequency === 'BIWEEKLY' ? emp.salary / 26 : emp.salary / 12)}
                    </span>
                  </div>
                ))}
              </div>
              <DialogFooter>
                <Button onClick={() => { setShowRunModal(false); setPayrollResult(null); }}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-gray-50 border p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Active Employees</span>
                  <span className="font-medium">{activeEmployees.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Total Payout</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalMonthlyPayroll)}</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowRunModal(false)}>Cancel</Button>
                <Button onClick={handleRunPayroll} disabled={runLoading || activeEmployees.length === 0}>
                  {runLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Processing...</> : 'Confirm & Run Payroll'}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
