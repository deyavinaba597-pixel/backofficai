import Bull from 'bull';
import { config } from '../config/env';
import * as invoiceService from '../services/invoiceService';
import * as payrollService from '../services/payrollService';
import * as notificationService from '../services/notificationService';
import * as emailService from '../services/emailService';
import * as bankService from '../services/bankService';
import prisma from '../db/prisma';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [new winston.transports.Console()],
});

// Create queues
const dailyQueue = new Bull('daily-jobs', config.redisUrl);
const payrollQueue = new Bull('payroll-jobs', config.redisUrl);
const expenseQueue = new Bull('expense-jobs', config.redisUrl);

// Process daily jobs
dailyQueue.process('check-overdue-invoices', async (job) => {
  const { userId } = job.data;
  try {
    const updatedCount = await invoiceService.updateOverdueStatuses(userId);
    const overdueInvoices = await invoiceService.getOverdueInvoices(userId);

    if (overdueInvoices.length > 0) {
      await notificationService.sendAlert(
        userId,
        `${overdueInvoices.length} invoice(s) are overdue totaling ${overdueInvoices.reduce((sum, i) => sum + i.amount, 0).toFixed(2)}`,
        'WARNING'
      );

      // Send overdue invoice email alert
      try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
        if (user) {
          await emailService.sendOverdueInvoiceAlert(user.email, user.name, overdueInvoices);
        }
      } catch {
        // Non-critical
      }
    }

    logger.info(`Checked overdue invoices for user ${userId}: ${updatedCount} updated`);
    return { updatedCount, overdueCount: overdueInvoices.length };
  } catch (err) {
    logger.error(`Failed to check overdue invoices for user ${userId}:`, err);
    throw err;
  }
});

dailyQueue.process('daily-briefing', async (job) => {
  const { userId } = job.data;
  try {
    const [balance, pendingInvoices, pendingExpenses, employees] = await Promise.all([
      bankService.getBalance(userId),
      prisma.invoice.findMany({ where: { userId, status: 'PENDING' } }),
      prisma.expense.findMany({ where: { userId, status: 'PENDING' } }),
      prisma.employee.findMany({ where: { userId, status: 'ACTIVE' } }),
    ]);

    const pendingInvoiceTotal = pendingInvoices.reduce((s, i) => s + i.amount, 0);
    const briefing = [
      'Daily Briefing:',
      `- Cash Balance: ${balance.toFixed(2)}`,
      `- Pending Invoices: ${pendingInvoices.length} (${pendingInvoiceTotal.toFixed(2)})`,
      `- Pending Expenses: ${pendingExpenses.length}`,
      `- Active Employees: ${employees.length}`,
    ].join('\n');

    await notificationService.createAgentLog(userId, 'Daily Briefing', briefing, 'SUCCESS');

    // Send daily briefing email
    try {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true, name: true } });
      if (user) {
        await emailService.sendDailyBriefingEmail(user.email, user.name, {
          cashBalance: balance,
          pendingInvoices: pendingInvoices.length,
          pendingExpenses: pendingExpenses.length,
          activeEmployees: employees.length,
        });
      }
    } catch {
      // Non-critical
    }

    logger.info(`Generated daily briefing for user ${userId}`);
    return { briefing };
  } catch (err) {
    logger.error(`Failed to generate daily briefing for user ${userId}:`, err);
    throw err;
  }
});

// Process payroll jobs
payrollQueue.process('run-weekly-payroll', async (job) => {
  const { userId } = job.data;
  try {
    const result = await payrollService.runPayroll(userId, 'WEEKLY');
    if (result.employeesProcessed > 0) {
      await notificationService.createAgentLog(
        userId,
        'Automated Payroll',
        `Weekly payroll processed: ${result.employeesProcessed} employees, ${result.totalAmount.toFixed(2)} total`,
        'SUCCESS'
      );
    }
    logger.info(`Weekly payroll processed for user ${userId}`);
    return result;
  } catch (err) {
    logger.error(`Failed to run weekly payroll for user ${userId}:`, err);
    throw err;
  }
});

payrollQueue.process('run-biweekly-payroll', async (job) => {
  const { userId } = job.data;
  try {
    const result = await payrollService.runPayroll(userId, 'BIWEEKLY');
    if (result.employeesProcessed > 0) {
      await notificationService.createAgentLog(
        userId,
        'Automated Payroll',
        `Bi-weekly payroll processed: ${result.employeesProcessed} employees, ${result.totalAmount.toFixed(2)} total`,
        'SUCCESS'
      );
    }
    logger.info(`Bi-weekly payroll processed for user ${userId}`);
    return result;
  } catch (err) {
    logger.error(`Failed to run bi-weekly payroll for user ${userId}:`, err);
    throw err;
  }
});

payrollQueue.process('run-monthly-payroll', async (job) => {
  const { userId } = job.data;
  try {
    const result = await payrollService.runPayroll(userId, 'MONTHLY');
    if (result.employeesProcessed > 0) {
      await notificationService.createAgentLog(
        userId,
        'Automated Payroll',
        `Monthly payroll processed: ${result.employeesProcessed} employees, ${result.totalAmount.toFixed(2)} total`,
        'SUCCESS'
      );
    }
    logger.info(`Monthly payroll processed for user ${userId}`);
    return result;
  } catch (err) {
    logger.error(`Failed to run monthly payroll for user ${userId}:`, err);
    throw err;
  }
});

// Process expense jobs
expenseQueue.process('check-stale-expenses', async (job) => {
  const { userId } = job.data;
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const staleExpenses = await prisma.expense.findMany({
      where: {
        userId,
        status: 'PENDING',
        createdAt: { lt: sevenDaysAgo },
      },
    });

    if (staleExpenses.length > 0) {
      await notificationService.sendAlert(
        userId,
        `${staleExpenses.length} expense(s) have been pending for more than 7 days and require your attention.`,
        'WARNING'
      );
    }

    logger.info(`Checked stale expenses for user ${userId}: ${staleExpenses.length} found`);
    return { staleCount: staleExpenses.length };
  } catch (err) {
    logger.error(`Failed to check stale expenses for user ${userId}:`, err);
    throw err;
  }
});

export async function scheduleJobsForUser(userId: string): Promise<void> {
  // Daily jobs - run at 8 AM
  await dailyQueue.add(
    'check-overdue-invoices',
    { userId },
    {
      repeat: { cron: '0 8 * * *' },
      jobId: `overdue-invoices-${userId}`,
    }
  );

  await dailyQueue.add(
    'daily-briefing',
    { userId },
    {
      repeat: { cron: '0 8 * * *' },
      jobId: `daily-briefing-${userId}`,
    }
  );

  // Weekly payroll - every Friday at 9 AM
  await payrollQueue.add(
    'run-weekly-payroll',
    { userId },
    {
      repeat: { cron: '0 9 * * 5' },
      jobId: `weekly-payroll-${userId}`,
    }
  );

  // Bi-weekly payroll - every other Friday at 9 AM
  await payrollQueue.add(
    'run-biweekly-payroll',
    { userId },
    {
      repeat: { cron: '0 9 1,15 * *' },
      jobId: `biweekly-payroll-${userId}`,
    }
  );

  // Monthly payroll - 1st of each month at 9 AM
  await payrollQueue.add(
    'run-monthly-payroll',
    { userId },
    {
      repeat: { cron: '0 9 1 * *' },
      jobId: `monthly-payroll-${userId}`,
    }
  );

  // Check stale expenses - every Monday at 9 AM
  await expenseQueue.add(
    'check-stale-expenses',
    { userId },
    {
      repeat: { cron: '0 9 * * 1' },
      jobId: `stale-expenses-${userId}`,
    }
  );

  logger.info(`Scheduled jobs for user ${userId}`);
}

export async function initializeScheduler(): Promise<void> {
  try {
    const users = await prisma.user.findMany({ select: { id: true } });
    for (const user of users) {
      await scheduleJobsForUser(user.id);
    }
    logger.info(`Scheduler initialized for ${users.length} users`);
  } catch (err) {
    logger.error('Failed to initialize scheduler:', err);
  }
}

export { dailyQueue, payrollQueue, expenseQueue };
