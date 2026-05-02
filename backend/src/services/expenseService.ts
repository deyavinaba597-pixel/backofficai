import prisma from '../db/prisma';
import { ExpenseStatus } from '@prisma/client';
import { logAction } from './auditService';

export interface CreateExpenseData {
  category: string;
  amount: number;
  description: string;
  receipt?: string;
  submittedBy: string;
}

export interface ExpenseFilters {
  status?: ExpenseStatus;
  search?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getExpenses(userId: string, statusOrFilters?: ExpenseStatus | ExpenseFilters) {
  // Support legacy call with just status string
  if (!statusOrFilters || typeof statusOrFilters === 'string') {
    return prisma.expense.findMany({
      where: {
        userId,
        ...(statusOrFilters && { status: statusOrFilters }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  const { status, search, category, startDate, endDate, page = 1, limit = 20 } = statusOrFilters;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status && { status }),
    ...(category && { category }),
    ...(search && {
      description: { contains: search, mode: 'insensitive' as const },
    }),
    ...((startDate || endDate) && {
      createdAt: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
  };

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return {
    data: expenses,
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

export async function createExpense(userId: string, data: CreateExpenseData) {
  const expense = await prisma.expense.create({
    data: {
      userId,
      category: data.category,
      amount: data.amount,
      description: data.description,
      receipt: data.receipt,
      submittedBy: data.submittedBy,
      status: 'PENDING',
    },
  });

  await logAction(userId, 'CREATE', 'Expense', expense.id, undefined, expense).catch(() => {});

  return expense;
}

export async function approveExpense(userId: string, expenseId: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  if (expense.status !== 'PENDING') {
    throw new Error(`Expense is already ${expense.status.toLowerCase()}`);
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: { status: 'APPROVED' },
  });

  await logAction(userId, 'APPROVED', 'Expense', expenseId, expense, updated).catch(() => {});

  return updated;
}

export async function rejectExpense(userId: string, expenseId: string, reason: string) {
  const expense = await prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });

  if (!expense) {
    throw new Error('Expense not found');
  }

  if (expense.status !== 'PENDING') {
    throw new Error(`Expense is already ${expense.status.toLowerCase()}`);
  }

  const updated = await prisma.expense.update({
    where: { id: expenseId },
    data: {
      status: 'REJECTED',
      description: `${expense.description} | REJECTED: ${reason}`,
    },
  });

  await logAction(userId, 'REJECTED', 'Expense', expenseId, expense, updated).catch(() => {});

  return updated;
}

export async function getPendingExpenses(userId: string) {
  return prisma.expense.findMany({
    where: { userId, status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getExpenseById(userId: string, expenseId: string) {
  return prisma.expense.findFirst({
    where: { id: expenseId, userId },
  });
}

export async function bulkExpenseAction(
  userId: string,
  action: 'approve' | 'reject',
  ids: string[],
  reason?: string
) {
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      if (action === 'approve') return approveExpense(userId, id);
      if (action === 'reject') return rejectExpense(userId, id, reason || 'Bulk rejected');
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { succeeded, failed, total: ids.length };
}
