import prisma from '../db/prisma';
import { AgentLogStatus } from '@prisma/client';
import * as emailService from './emailService';

export async function createAgentLog(
  userId: string,
  action: string,
  details: string,
  status: AgentLogStatus = 'SUCCESS'
) {
  return prisma.agentLog.create({
    data: {
      userId,
      action,
      details,
      status,
    },
  });
}

export async function getAgentLogs(userId: string, limit = 50) {
  return prisma.agentLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}

export async function sendAlert(userId: string, message: string, type: 'INFO' | 'WARNING' | 'URGENT') {
  const action = `ALERT [${type}]`;
  const log = await createAgentLog(userId, action, message, 'SUCCESS');

  // Send email for WARNING and URGENT alerts
  if (type === 'WARNING' || type === 'URGENT') {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, name: true },
      });
      if (user) {
        // Use overdue invoice alert as a generic urgent alert email
        await emailService.sendOverdueInvoiceAlert(user.email, user.name, []).catch(() => {});
      }
    } catch {
      // Non-critical
    }
  }

  return log;
}

export async function getRecentActivity(userId: string, limit = 10) {
  return prisma.agentLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      action: true,
      details: true,
      status: true,
      createdAt: true,
    },
  });
}

export async function getAlerts(userId: string, limit = 50) {
  return prisma.agentLog.findMany({
    where: {
      userId,
      action: { startsWith: 'ALERT' },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
}
