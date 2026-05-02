import prisma from '../db/prisma';
import { InvoiceStatus } from '@prisma/client';
import { logAction } from './auditService';

export interface CreateInvoiceData {
  vendorName: string;
  amount: number;
  dueDate: string | Date;
  description?: string;
}

export interface InvoiceFilters {
  status?: InvoiceStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  limit?: number;
}

export async function getInvoices(userId: string, statusOrFilters?: InvoiceStatus | InvoiceFilters) {
  // Support legacy call with just status string
  if (!statusOrFilters || typeof statusOrFilters === 'string') {
    return prisma.invoice.findMany({
      where: {
        userId,
        ...(statusOrFilters && { status: statusOrFilters }),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  const { status, search, startDate, endDate, minAmount, maxAmount, page = 1, limit = 20 } = statusOrFilters;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(status && { status }),
    ...(search && {
      vendorName: { contains: search, mode: 'insensitive' as const },
    }),
    ...((startDate || endDate) && {
      dueDate: {
        ...(startDate && { gte: startDate }),
        ...(endDate && { lte: endDate }),
      },
    }),
    ...((minAmount !== undefined || maxAmount !== undefined) && {
      amount: {
        ...(minAmount !== undefined && { gte: minAmount }),
        ...(maxAmount !== undefined && { lte: maxAmount }),
      },
    }),
  };

  const [invoices, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.invoice.count({ where }),
  ]);

  return {
    data: invoices,
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

export async function createInvoice(userId: string, data: CreateInvoiceData) {
  const invoice = await prisma.invoice.create({
    data: {
      userId,
      vendorName: data.vendorName,
      amount: data.amount,
      dueDate: new Date(data.dueDate),
      description: data.description,
      status: 'PENDING',
    },
  });

  await logAction(userId, 'CREATE', 'Invoice', invoice.id, undefined, invoice).catch(() => {});

  return invoice;
}

export async function markInvoicePaid(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'PAID',
      paidAt: new Date(),
    },
  });

  await logAction(userId, 'PAID', 'Invoice', invoiceId, invoice, updated).catch(() => {});

  return updated;
}

export async function getOverdueInvoices(userId: string) {
  return prisma.invoice.findMany({
    where: {
      userId,
      status: { in: ['PENDING', 'OVERDUE'] },
      dueDate: { lt: new Date() },
    },
    orderBy: { dueDate: 'asc' },
  });
}

export async function flagInvoice(userId: string, invoiceId: string, reason: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  const updated = await prisma.invoice.update({
    where: { id: invoiceId },
    data: {
      status: 'FLAGGED',
      description: invoice.description
        ? `${invoice.description} | FLAGGED: ${reason}`
        : `FLAGGED: ${reason}`,
    },
  });

  await logAction(userId, 'FLAGGED', 'Invoice', invoiceId, invoice, updated).catch(() => {});

  return updated;
}

export async function updateOverdueStatuses(userId: string) {
  const now = new Date();
  const result = await prisma.invoice.updateMany({
    where: {
      userId,
      status: 'PENDING',
      dueDate: { lt: now },
    },
    data: { status: 'OVERDUE' },
  });

  return result.count;
}

export async function getInvoiceById(userId: string, invoiceId: string) {
  return prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });
}

export async function deleteInvoice(userId: string, invoiceId: string) {
  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, userId },
  });

  if (!invoice) {
    throw new Error('Invoice not found');
  }

  await logAction(userId, 'DELETE', 'Invoice', invoiceId, invoice).catch(() => {});

  return prisma.invoice.delete({ where: { id: invoiceId } });
}

export async function bulkInvoiceAction(
  userId: string,
  action: 'mark_paid' | 'flag' | 'delete',
  ids: string[],
  reason?: string
) {
  const results = await Promise.allSettled(
    ids.map(async (id) => {
      if (action === 'mark_paid') return markInvoicePaid(userId, id);
      if (action === 'flag') return flagInvoice(userId, id, reason || 'Bulk flagged');
      if (action === 'delete') return deleteInvoice(userId, id);
    })
  );

  const succeeded = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  return { succeeded, failed, total: ids.length };
}
