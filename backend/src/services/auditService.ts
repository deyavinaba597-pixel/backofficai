import prisma from '../db/prisma';

export async function logAction(
  userId: string,
  action: string,
  resource: string,
  resourceId: string,
  oldData?: unknown,
  newData?: unknown,
  ipAddress?: string,
  userAgent?: string
) {
  return prisma.auditLog.create({
    data: {
      userId,
      action,
      resource,
      resourceId,
      oldData: oldData !== undefined ? (oldData as object) : undefined,
      newData: newData !== undefined ? (newData as object) : undefined,
      ipAddress,
      userAgent,
    },
  });
}

export interface GetAuditLogsOptions {
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export async function getAuditLogs(userId: string, options: GetAuditLogsOptions = {}) {
  const { resource, startDate, endDate, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(resource && { resource }),
    ...(startDate || endDate
      ? {
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    data: logs,
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
