import prisma from '../db/prisma';
import { PayFrequency, EmployeeStatus } from '@prisma/client';
import { logAction } from './auditService';

export interface CreateEmployeeData {
  name: string;
  email: string;
  salary: number;
  payFrequency: PayFrequency;
  bankAccount?: string;
}

export interface PayrollResult {
  employeesProcessed: number;
  totalAmount: number;
  employees: Array<{
    id: string;
    name: string;
    salary: number;
    payFrequency: string;
  }>;
}

export async function getEmployees(userId: string, status?: EmployeeStatus, page?: number, limit?: number) {
  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const where = { userId, ...(status && { status }) };
    const [employees, total] = await Promise.all([
      prisma.employee.findMany({ where, orderBy: { name: 'asc' }, skip, take: limit }),
      prisma.employee.count({ where }),
    ]);
    return {
      data: employees,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  return prisma.employee.findMany({
    where: {
      userId,
      ...(status && { status }),
    },
    orderBy: { name: 'asc' },
  });
}

export async function createEmployee(userId: string, data: CreateEmployeeData) {
  const employee = await prisma.employee.create({
    data: {
      userId,
      name: data.name,
      email: data.email,
      salary: data.salary,
      payFrequency: data.payFrequency,
      bankAccount: data.bankAccount,
      status: 'ACTIVE',
    },
  });

  await logAction(userId, 'EMPLOYEE_CREATED', 'Employee', employee.id, undefined, employee).catch(() => {});

  return employee;
}

export async function updateEmployee(
  userId: string,
  employeeId: string,
  data: { salary?: number; payFrequency?: PayFrequency }
) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data,
  });

  await logAction(userId, 'UPDATE', 'Employee', employeeId, employee, updated).catch(() => {});

  return updated;
}

export async function deactivateEmployee(userId: string, employeeId: string) {
  return updateEmployeeStatus(userId, employeeId, 'INACTIVE');
}

export async function activateEmployee(userId: string, employeeId: string) {
  return updateEmployeeStatus(userId, employeeId, 'ACTIVE');
}

export async function runPayroll(userId: string, frequency?: PayFrequency): Promise<PayrollResult> {
  const employees = await prisma.employee.findMany({
    where: {
      userId,
      status: 'ACTIVE',
      ...(frequency && { payFrequency: frequency }),
    },
  });

  if (employees.length === 0) {
    return { employeesProcessed: 0, totalAmount: 0, employees: [] };
  }

  const totalAmount = employees.reduce((sum, emp) => {
    let payAmount = emp.salary;
    if (emp.payFrequency === 'WEEKLY') {
      payAmount = emp.salary / 52;
    } else if (emp.payFrequency === 'BIWEEKLY') {
      payAmount = emp.salary / 26;
    } else {
      payAmount = emp.salary / 12;
    }
    return sum + payAmount;
  }, 0);

  // Record payroll as bank transactions
  await prisma.$transaction(
    employees.map((emp) => {
      let payAmount = emp.salary;
      if (emp.payFrequency === 'WEEKLY') {
        payAmount = emp.salary / 52;
      } else if (emp.payFrequency === 'BIWEEKLY') {
        payAmount = emp.salary / 26;
      } else {
        payAmount = emp.salary / 12;
      }

      return prisma.bankTransaction.create({
        data: {
          userId,
          amount: payAmount,
          type: 'DEBIT',
          description: `Payroll - ${emp.name}`,
          category: 'Payroll',
          date: new Date(),
        },
      });
    })
  );

  await logAction(userId, 'PAYROLL_RUN', 'Payroll', userId, undefined, {
    employeesProcessed: employees.length,
    totalAmount,
    frequency: frequency || 'ALL',
  }).catch(() => {});

  return {
    employeesProcessed: employees.length,
    totalAmount,
    employees: employees.map((emp) => ({
      id: emp.id,
      name: emp.name,
      salary: emp.salary,
      payFrequency: emp.payFrequency,
    })),
  };
}

export async function getPayrollHistory(userId: string) {
  return prisma.bankTransaction.findMany({
    where: {
      userId,
      category: 'Payroll',
    },
    orderBy: { date: 'desc' },
    take: 50,
  });
}

export async function updateEmployeeStatus(userId: string, employeeId: string, status: EmployeeStatus) {
  const employee = await prisma.employee.findFirst({
    where: { id: employeeId, userId },
  });

  if (!employee) {
    throw new Error('Employee not found');
  }

  const updated = await prisma.employee.update({
    where: { id: employeeId },
    data: { status },
  });

  await logAction(userId, status === 'INACTIVE' ? 'DEACTIVATED' : 'ACTIVATED', 'Employee', employeeId, employee, updated).catch(() => {});

  return updated;
}
