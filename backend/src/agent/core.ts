import OpenAI from 'openai';
import { config } from '../config/env';
import { SYSTEM_PROMPT } from './prompts';
import { agentTools } from './tools';
import { AgentChatResponse, ConversationMessage } from '../types';
import { createAgentLog } from '../services/notificationService';
import * as invoiceService from '../services/invoiceService';
import * as expenseService from '../services/expenseService';
import * as payrollService from '../services/payrollService';
import * as vendorService from '../services/vendorService';
import * as bankService from '../services/bankService';
import * as notificationService from '../services/notificationService';
import * as auditService from '../services/auditService';
import prisma from '../db/prisma';
import { InvoiceStatus, ExpenseStatus, PayFrequency } from '@prisma/client';

function createAIClient(): OpenAI {
  if (config.aiProvider === 'groq') {
    if (!config.groqApiKey) {
      throw new Error('GROQ_API_KEY is required when AI_PROVIDER=groq.');
    }
    return new OpenAI({
      apiKey: config.groqApiKey,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }
  return new OpenAI({
    apiKey: 'ollama',
    baseURL: config.ollamaBaseUrl,
  });
}

function getModelName(): string {
  return config.aiProvider === 'groq' ? config.groqModel : config.ollamaModel;
}

const aiClient = createAIClient();

async function executeTool(
  userId: string,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<unknown> {
  switch (toolName) {
    case 'get_dashboard_stats': {
      const [balance, invoices, expenses, employees, recentTx, recentLogs] = await Promise.all([
        bankService.getBalance(userId),
        prisma.invoice.findMany({ where: { userId } }),
        prisma.expense.findMany({
          where: {
            userId,
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        }),
        prisma.employee.findMany({ where: { userId, status: 'ACTIVE' } }),
        bankService.getTransactions(userId, 5),
        notificationService.getRecentActivity(userId, 5),
      ]);

      const pendingInvoices = invoices.filter((i) => i.status === 'PENDING');
      const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
      const monthlyExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const payrollDue = employees.reduce((sum, e) => {
        if (e.payFrequency === 'MONTHLY') return sum + e.salary / 12;
        if (e.payFrequency === 'BIWEEKLY') return sum + e.salary / 26;
        return sum + e.salary / 52;
      }, 0);

      return {
        cashBalance: balance,
        pendingInvoicesAmount: pendingInvoices.reduce((sum, i) => sum + i.amount, 0),
        overdueInvoicesCount: overdueInvoices.length,
        monthlyExpenses,
        payrollDue,
        activeEmployeesCount: employees.length,
        recentTransactions: recentTx,
        recentAgentActivity: recentLogs,
      };
    }

    case 'list_invoices': {
      const status = toolArgs.status as InvoiceStatus | undefined;
      return invoiceService.getInvoices(userId, status);
    }

    case 'search_invoices': {
      return invoiceService.getInvoices(userId, {
        search: toolArgs.search as string | undefined,
        status: toolArgs.status as InvoiceStatus | undefined,
        minAmount: toolArgs.minAmount as number | undefined,
        maxAmount: toolArgs.maxAmount as number | undefined,
        startDate: toolArgs.startDate ? new Date(toolArgs.startDate as string) : undefined,
        endDate: toolArgs.endDate ? new Date(toolArgs.endDate as string) : undefined,
        page: 1,
        limit: 50,
      });
    }

    case 'create_invoice': {
      const invoice = await invoiceService.createInvoice(userId, {
        vendorName: toolArgs.vendorName as string,
        amount: toolArgs.amount as number,
        dueDate: toolArgs.dueDate as string,
        description: toolArgs.description as string | undefined,
      });
      await bankService.addTransaction(userId, {
        amount: invoice.amount,
        type: 'DEBIT',
        description: `Invoice created - ${invoice.vendorName}`,
        category: 'Invoices',
      });
      return invoice;
    }

    case 'mark_invoice_paid': {
      const invoice = await invoiceService.markInvoicePaid(userId, toolArgs.invoiceId as string);
      await bankService.addTransaction(userId, {
        amount: invoice.amount,
        type: 'CREDIT',
        description: `Invoice paid - ${invoice.vendorName}`,
        category: 'Revenue',
      });
      return invoice;
    }

    case 'list_expenses': {
      const status = toolArgs.status as ExpenseStatus | undefined;
      return expenseService.getExpenses(userId, status);
    }

    case 'get_expense_analytics': {
      const startDate = toolArgs.startDate ? new Date(toolArgs.startDate as string) : undefined;
      const endDate = toolArgs.endDate ? new Date(toolArgs.endDate as string) : undefined;
      const expenses = await prisma.expense.findMany({
        where: {
          userId,
          ...(startDate || endDate
            ? { createdAt: { ...(startDate && { gte: startDate }), ...(endDate && { lte: endDate }) } }
            : {}),
        },
      });
      const categoryMap = new Map<string, number>();
      for (const e of expenses) {
        categoryMap.set(e.category, (categoryMap.get(e.category) || 0) + e.amount);
      }
      return {
        total: expenses.reduce((s, e) => s + e.amount, 0),
        byCategory: Array.from(categoryMap.entries()).map(([category, total]) => ({ category, total })),
        count: expenses.length,
      };
    }

    case 'approve_expense': {
      return expenseService.approveExpense(userId, toolArgs.expenseId as string);
    }

    case 'reject_expense': {
      return expenseService.rejectExpense(
        userId,
        toolArgs.expenseId as string,
        toolArgs.reason as string
      );
    }

    case 'bulk_approve_expenses': {
      const ids = toolArgs.expenseIds as string[];
      return expenseService.bulkExpenseAction(userId, 'approve', ids);
    }

    case 'list_employees': {
      return payrollService.getEmployees(userId);
    }

    case 'update_employee': {
      return payrollService.updateEmployee(userId, toolArgs.employeeId as string, {
        salary: toolArgs.salary as number | undefined,
        payFrequency: toolArgs.payFrequency as PayFrequency | undefined,
      });
    }

    case 'deactivate_employee': {
      return payrollService.deactivateEmployee(userId, toolArgs.employeeId as string);
    }

    case 'run_payroll': {
      const frequency = toolArgs.frequency as PayFrequency | undefined;
      return payrollService.runPayroll(userId, frequency);
    }

    case 'list_vendors': {
      return vendorService.getVendors(userId);
    }

    case 'create_vendor': {
      return vendorService.createVendor(userId, {
        name: toolArgs.name as string,
        email: toolArgs.email as string | undefined,
        phone: toolArgs.phone as string | undefined,
        paymentTerms: toolArgs.paymentTerms as string | undefined,
      });
    }

    case 'get_bank_transactions': {
      const limit = (toolArgs.limit as number) || 20;
      return bankService.getTransactions(userId, limit);
    }

    case 'get_cash_flow': {
      const months = (toolArgs.months as number) || 6;
      const since = new Date();
      since.setMonth(since.getMonth() - months);
      const transactions = await prisma.bankTransaction.findMany({
        where: { userId, date: { gte: since } },
        orderBy: { date: 'asc' },
      });
      const monthMap = new Map<string, { income: number; expenses: number }>();
      for (const tx of transactions) {
        const key = `${tx.date.getFullYear()}-${String(tx.date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthMap.get(key) || { income: 0, expenses: 0 };
        if (tx.type === 'CREDIT') existing.income += tx.amount;
        else existing.expenses += tx.amount;
        monthMap.set(key, existing);
      }
      return Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, { income, expenses }]) => ({ month, income, expenses, net: income - expenses }));
    }

    case 'get_financial_summary': {
      const period = (toolArgs.period as string) || '30d';
      const now = new Date();
      let since: Date;
      if (period === '90d') since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      else if (period === '1y') since = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      else since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [invoices, expenses, employees, balance] = await Promise.all([
        prisma.invoice.findMany({ where: { userId } }),
        prisma.expense.findMany({ where: { userId, createdAt: { gte: since } } }),
        prisma.employee.findMany({ where: { userId, status: 'ACTIVE' } }),
        bankService.getBalance(userId),
      ]);

      const paidInvoices = invoices.filter((i) => i.status === 'PAID' && i.paidAt && i.paidAt >= since);
      const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
      const totalRevenue = paidInvoices.reduce((s, i) => s + i.amount, 0);
      const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
      const monthlyPayroll = employees.reduce((s, e) => {
        if (e.payFrequency === 'MONTHLY') return s + e.salary / 12;
        if (e.payFrequency === 'BIWEEKLY') return s + e.salary / 26;
        return s + e.salary / 52;
      }, 0);

      return {
        period,
        cashBalance: balance,
        revenue: totalRevenue,
        expenses: totalExpenses,
        netIncome: totalRevenue - totalExpenses,
        overdueInvoices: overdueInvoices.length,
        overdueAmount: overdueInvoices.reduce((s, i) => s + i.amount, 0),
        activeEmployees: employees.length,
        monthlyPayrollBurn: monthlyPayroll,
      };
    }

    case 'get_policies': {
      return prisma.policy.findMany({ where: { userId } });
    }

    case 'create_policy': {
      return prisma.policy.create({
        data: {
          userId,
          name: toolArgs.name as string,
          type: toolArgs.type as 'PAYMENT' | 'APPROVAL' | 'ALERT' | 'PAYROLL',
          rules: toolArgs.rules as object,
          isActive: true,
        },
      });
    }

    case 'send_alert': {
      return notificationService.sendAlert(
        userId,
        toolArgs.message as string,
        toolArgs.type as 'INFO' | 'WARNING' | 'URGENT'
      );
    }

    case 'get_overdue_invoices': {
      return invoiceService.getOverdueInvoices(userId);
    }

    case 'flag_invoice': {
      return invoiceService.flagInvoice(
        userId,
        toolArgs.invoiceId as string,
        toolArgs.reason as string
      );
    }

    case 'get_audit_log': {
      const limit = (toolArgs.limit as number) || 20;
      return auditService.getAuditLogs(userId, {
        resource: toolArgs.resource as string | undefined,
        limit,
      });
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function chat(
  userId: string,
  message: string,
  conversationHistory: ConversationMessage[] = []
): Promise<AgentChatResponse> {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...conversationHistory.map((m) => {
      if (m.role === 'tool') {
        return {
          role: 'tool' as const,
          content: m.content,
          tool_call_id: m.tool_call_id || '',
        };
      }
      return {
        role: m.role as 'user' | 'assistant',
        content: m.content,
      };
    }),
    { role: 'user', content: message },
  ];

  const toolCallsMade: string[] = [];
  let iterations = 0;
  const maxIterations = 10;

  while (iterations < maxIterations) {
    iterations++;

    const response = await aiClient.chat.completions.create({
      model: getModelName(),
      messages,
      tools: agentTools,
      tool_choice: 'auto',
    });

    const choice = response.choices[0];
    const assistantMessage = choice.message;

    messages.push(assistantMessage);

    if (choice.finish_reason === 'stop' || !assistantMessage.tool_calls?.length) {
      const finalText = assistantMessage.content || 'I have completed the requested actions.';

      await createAgentLog(
        userId,
        'Agent Chat',
        `User: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''} | Tools used: ${toolCallsMade.join(', ') || 'none'}`,
        'SUCCESS'
      );

      return { message: finalText, toolCallsMade };
    }

    const toolResults: OpenAI.Chat.Completions.ChatCompletionToolMessageParam[] = [];

    for (const toolCall of assistantMessage.tool_calls) {
      const toolName = toolCall.function.name;
      let toolArgs: Record<string, unknown> = {};

      try {
        toolArgs = JSON.parse(toolCall.function.arguments);
      } catch {
        toolArgs = {};
      }

      toolCallsMade.push(toolName);

      let result: unknown;
      let toolStatus: 'SUCCESS' | 'FAILED' = 'SUCCESS';

      try {
        result = await executeTool(userId, toolName, toolArgs);
        await createAgentLog(
          userId,
          `Tool: ${toolName}`,
          `Args: ${JSON.stringify(toolArgs).substring(0, 200)} | Result: success`,
          'SUCCESS'
        );
      } catch (err) {
        toolStatus = 'FAILED';
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        result = { error: errorMessage };
        await createAgentLog(
          userId,
          `Tool: ${toolName}`,
          `Args: ${JSON.stringify(toolArgs).substring(0, 200)} | Error: ${errorMessage}`,
          'FAILED'
        );
      }

      void toolStatus;

      toolResults.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: JSON.stringify(result),
      });
    }

    messages.push(...toolResults);
  }

  await createAgentLog(
    userId,
    'Agent Chat',
    `Max iterations reached for: ${message.substring(0, 100)}`,
    'FAILED'
  );

  return {
    message: 'I processed your request but reached the maximum number of steps. Please try a more specific request.',
    toolCallsMade,
  };
}
