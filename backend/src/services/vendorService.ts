import prisma from '../db/prisma';
import { logAction } from './auditService';

export interface CreateVendorData {
  name: string;
  email?: string;
  phone?: string;
  paymentTerms?: string;
}

export async function getVendors(userId: string, search?: string) {
  return prisma.vendor.findMany({
    where: {
      userId,
      ...(search && {
        name: { contains: search, mode: 'insensitive' as const },
      }),
    },
    orderBy: { name: 'asc' },
  });
}

export async function createVendor(userId: string, data: CreateVendorData) {
  const vendor = await prisma.vendor.create({
    data: {
      userId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      paymentTerms: data.paymentTerms,
      totalPaid: 0,
    },
  });

  await logAction(userId, 'CREATE', 'Vendor', vendor.id, undefined, vendor).catch(() => {});

  return vendor;
}

export async function updateVendorPayment(userId: string, vendorId: string, amount: number) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, userId },
  });

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  return prisma.vendor.update({
    where: { id: vendorId },
    data: {
      totalPaid: vendor.totalPaid + amount,
      lastPaidAt: new Date(),
    },
  });
}

export async function getVendorById(userId: string, vendorId: string) {
  return prisma.vendor.findFirst({
    where: { id: vendorId, userId },
  });
}

export async function deleteVendor(userId: string, vendorId: string) {
  const vendor = await prisma.vendor.findFirst({
    where: { id: vendorId, userId },
  });

  if (!vendor) {
    throw new Error('Vendor not found');
  }

  await logAction(userId, 'DELETE', 'Vendor', vendorId, vendor).catch(() => {});

  return prisma.vendor.delete({ where: { id: vendorId } });
}
