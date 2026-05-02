/**
 * Database seed script — creates demo data for BackOfficeAI
 *
 * Usage:
 *   npx ts-node src/scripts/seed.ts
 *   (or via Makefile: make seed)
 *
 * Demo credentials:
 *   Email:    demo@backofficai.com
 *   Password: demo123456
 */

import { PrismaClient, InvoiceStatus, ExpenseStatus, PayFrequency, TransactionType, AgentLogStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─────────────────────────────────────────────────────────────
  // 1. Demo User
  // ─────────────────────────────────────────────────────────────
  const existingUser = await prisma.user.findUnique({
    where: { email: 'demo@backofficai.com' },
  });

  if (existingUser) {
    console.log('⚠️  Demo user already exists. Cleaning up existing data...');
    await prisma.agentLog.deleteMany({ where: { userId: existingUser.id } });
    await prisma.bankTransaction.deleteMany({ where: { userId: existingUser.id } });
    await prisma.auditLog.deleteMany({ where: { userId: existingUser.id } });
    await prisma.message.deleteMany({
      where: { conversation: { userId: existingUser.id } },
    });
    await prisma.conversation.deleteMany({ where: { userId: existingUser.id } });
    await prisma.invoice.deleteMany({ where: { userId: existingUser.id } });
    await prisma.expense.deleteMany({ where: { userId: existingUser.id } });
    await prisma.employee.deleteMany({ where: { userId: existingUser.id } });
    await prisma.vendor.deleteMany({ where: { userId: existingUser.id } });
    await prisma.policy.deleteMany({ where: { userId: existingUser.id } });
  }

  const hashedPassword = await bcrypt.hash('demo123456', 12);

  const user = existingUser
    ? await prisma.user.update({
        where: { email: 'demo@backofficai.com' },
        data: { password: hashedPassword, name: 'Alex Johnson', companyName: 'Acme Corp' },
      })
    : await prisma.user.create({
        data: {
          email: 'demo@backofficai.com',
          password: hashedPassword,
          name: 'Alex Johnson',
          companyName: 'Acme Corp',
          role: 'owner',
        },
      });

  console.log(`✅ Demo user: ${user.email} (password: demo123456)`);

  // ─────────────────────────────────────────────────────────────
  // 2. Vendors (3)
  // ─────────────────────────────────────────────────────────────
  const vendors = await Promise.all([
    prisma.vendor.create({
      data: {
        userId: user.id,
        name: 'TechSupply Co.',
        email: 'billing@techsupply.com',
        phone: '+1-555-0101',
        paymentTerms: 'Net 30',
        totalPaid: 12500,
        lastPaidAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.vendor.create({
      data: {
        userId: user.id,
        name: 'Office Essentials Ltd.',
        email: 'accounts@officeessentials.com',
        phone: '+1-555-0102',
        paymentTerms: 'Net 15',
        totalPaid: 4800,
        lastPaidAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    }),
    prisma.vendor.create({
      data: {
        userId: user.id,
        name: 'CloudHost Pro',
        email: 'invoices@cloudhostpro.com',
        phone: '+1-555-0103',
        paymentTerms: 'Net 30',
        totalPaid: 9600,
        lastPaidAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      },
    }),
  ]);

  console.log(`✅ Created ${vendors.length} vendors`);

  // ─────────────────────────────────────────────────────────────
  // 3. Invoices (5)
  // ─────────────────────────────────────────────────────────────
  const now = new Date();
  const daysAgo = (d: number) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
  const daysFromNow = (d: number) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

  const invoices = await Promise.all([
    prisma.invoice.create({
      data: {
        userId: user.id,
        vendorName: 'TechSupply Co.',
        amount: 3200,
        dueDate: daysFromNow(14),
        status: InvoiceStatus.PENDING,
        description: 'Q1 hardware procurement — 4x workstations',
      },
    }),
    prisma.invoice.create({
      data: {
        userId: user.id,
        vendorName: 'CloudHost Pro',
        amount: 800,
        dueDate: daysAgo(5),
        status: InvoiceStatus.OVERDUE,
        description: 'Monthly cloud hosting — March 2025',
      },
    }),
    prisma.invoice.create({
      data: {
        userId: user.id,
        vendorName: 'Office Essentials Ltd.',
        amount: 450,
        dueDate: daysAgo(20),
        status: InvoiceStatus.PAID,
        description: 'Office supplies — Q1 restock',
        paidAt: daysAgo(18),
      },
    }),
    prisma.invoice.create({
      data: {
        userId: user.id,
        vendorName: 'TechSupply Co.',
        amount: 1500,
        dueDate: daysAgo(10),
        status: InvoiceStatus.OVERDUE,
        description: 'Software licenses — annual renewal',
      },
    }),
    prisma.invoice.create({
      data: {
        userId: user.id,
        vendorName: 'CloudHost Pro',
        amount: 800,
        dueDate: daysAgo(45),
        status: InvoiceStatus.PAID,
        description: 'Monthly cloud hosting — February 2025',
        paidAt: daysAgo(43),
      },
    }),
  ]);

  console.log(`✅ Created ${invoices.length} invoices`);

  // ─────────────────────────────────────────────────────────────
  // 4. Expenses (5)
  // ─────────────────────────────────────────────────────────────
  const expenses = await Promise.all([
    prisma.expense.create({
      data: {
        userId: user.id,
        category: 'Travel',
        amount: 320,
        description: 'Flight to NYC for client meeting',
        submittedBy: 'Sarah Chen',
        status: ExpenseStatus.PENDING,
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        category: 'Software',
        amount: 99,
        description: 'Figma annual subscription',
        submittedBy: 'Marcus Lee',
        status: ExpenseStatus.APPROVED,
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        category: 'Meals',
        amount: 185,
        description: 'Team lunch — Q1 planning session',
        submittedBy: 'Alex Johnson',
        status: ExpenseStatus.APPROVED,
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        category: 'Equipment',
        amount: 750,
        description: 'Standing desk for home office',
        submittedBy: 'Jordan Kim',
        status: ExpenseStatus.PENDING,
      },
    }),
    prisma.expense.create({
      data: {
        userId: user.id,
        category: 'Marketing',
        amount: 500,
        description: 'LinkedIn ads — March campaign',
        submittedBy: 'Sarah Chen',
        status: ExpenseStatus.PENDING,
      },
    }),
  ]);

  console.log(`✅ Created ${expenses.length} expenses`);

  // ─────────────────────────────────────────────────────────────
  // 5. Employees (3)
  // ─────────────────────────────────────────────────────────────
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        userId: user.id,
        name: 'Sarah Chen',
        email: 'sarah.chen@acmecorp.com',
        salary: 85000,
        payFrequency: PayFrequency.MONTHLY,
        bankAccount: '****4521',
        status: 'ACTIVE',
      },
    }),
    prisma.employee.create({
      data: {
        userId: user.id,
        name: 'Marcus Lee',
        email: 'marcus.lee@acmecorp.com',
        salary: 72000,
        payFrequency: PayFrequency.BIWEEKLY,
        bankAccount: '****7832',
        status: 'ACTIVE',
      },
    }),
    prisma.employee.create({
      data: {
        userId: user.id,
        name: 'Jordan Kim',
        email: 'jordan.kim@acmecorp.com',
        salary: 65000,
        payFrequency: PayFrequency.MONTHLY,
        bankAccount: '****2290',
        status: 'ACTIVE',
      },
    }),
  ]);

  console.log(`✅ Created ${employees.length} employees`);

  // ─────────────────────────────────────────────────────────────
  // 6. Policies (2)
  // ─────────────────────────────────────────────────────────────
  const policies = await Promise.all([
    prisma.policy.create({
      data: {
        userId: user.id,
        name: 'Auto-approve small expenses',
        type: 'APPROVAL',
        isActive: true,
        rules: {
          condition: 'amount < 200',
          action: 'auto_approve',
          description: 'Automatically approve expenses under $200',
        },
      },
    }),
    prisma.policy.create({
      data: {
        userId: user.id,
        name: 'Low cash balance alert',
        type: 'ALERT',
        isActive: true,
        rules: {
          condition: 'cash_balance < 10000',
          action: 'send_alert',
          description: 'Alert when cash balance drops below $10,000',
        },
      },
    }),
  ]);

  console.log(`✅ Created ${policies.length} policies`);

  // ─────────────────────────────────────────────────────────────
  // 7. Bank Transactions (10)
  // ─────────────────────────────────────────────────────────────
  const transactions = await Promise.all([
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 15000,
        type: TransactionType.CREDIT,
        description: 'Client payment — Globex Corp invoice #1042',
        category: 'Revenue',
        date: daysAgo(2),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 800,
        type: TransactionType.DEBIT,
        description: 'CloudHost Pro — monthly hosting',
        category: 'Infrastructure',
        date: daysAgo(3),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 7083.33,
        type: TransactionType.DEBIT,
        description: 'Payroll — Sarah Chen (monthly)',
        category: 'Payroll',
        date: daysAgo(5),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 2769.23,
        type: TransactionType.DEBIT,
        description: 'Payroll — Marcus Lee (bi-weekly)',
        category: 'Payroll',
        date: daysAgo(5),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 8500,
        type: TransactionType.CREDIT,
        description: 'Client payment — Initech invoice #1038',
        category: 'Revenue',
        date: daysAgo(8),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 450,
        type: TransactionType.DEBIT,
        description: 'Office Essentials Ltd. — office supplies',
        category: 'Office',
        date: daysAgo(10),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 185,
        type: TransactionType.DEBIT,
        description: 'Team lunch — Q1 planning',
        category: 'Meals',
        date: daysAgo(12),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 12000,
        type: TransactionType.CREDIT,
        description: 'Client payment — Umbrella Corp invoice #1035',
        category: 'Revenue',
        date: daysAgo(15),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 99,
        type: TransactionType.DEBIT,
        description: 'Figma — annual subscription',
        category: 'Software',
        date: daysAgo(18),
      },
    }),
    prisma.bankTransaction.create({
      data: {
        userId: user.id,
        amount: 5416.67,
        type: TransactionType.DEBIT,
        description: 'Payroll — Jordan Kim (monthly)',
        category: 'Payroll',
        date: daysAgo(20),
      },
    }),
  ]);

  console.log(`✅ Created ${transactions.length} bank transactions`);

  // ─────────────────────────────────────────────────────────────
  // 8. Agent Logs (5)
  // ─────────────────────────────────────────────────────────────
  const agentLogs = await Promise.all([
    prisma.agentLog.create({
      data: {
        userId: user.id,
        action: 'check_overdue_invoices',
        details: 'Found 2 overdue invoices totaling $2,300. Sent alerts to owner.',
        status: AgentLogStatus.SUCCESS,
        createdAt: daysAgo(1),
      },
    }),
    prisma.agentLog.create({
      data: {
        userId: user.id,
        action: 'auto_approve_expense',
        details: 'Auto-approved expense #EXP-002 ($99 Figma subscription) — under $200 threshold.',
        status: AgentLogStatus.SUCCESS,
        createdAt: daysAgo(2),
      },
    }),
    prisma.agentLog.create({
      data: {
        userId: user.id,
        action: 'daily_briefing',
        details: 'Generated daily financial briefing: Cash balance $42,500. 2 overdue invoices. 3 pending expenses.',
        status: AgentLogStatus.SUCCESS,
        createdAt: daysAgo(3),
      },
    }),
    prisma.agentLog.create({
      data: {
        userId: user.id,
        action: 'run_payroll',
        details: 'Processed monthly payroll for 2 employees. Total disbursed: $12,500.',
        status: AgentLogStatus.SUCCESS,
        createdAt: daysAgo(5),
      },
    }),
    prisma.agentLog.create({
      data: {
        userId: user.id,
        action: 'update_overdue_statuses',
        details: 'Updated 2 invoices from PENDING to OVERDUE based on due date.',
        status: AgentLogStatus.SUCCESS,
        createdAt: daysAgo(6),
      },
    }),
  ]);

  console.log(`✅ Created ${agentLogs.length} agent logs`);

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n🎉 Seed complete!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo login credentials:');
  console.log('  Email:    demo@backofficai.com');
  console.log('  Password: demo123456');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
