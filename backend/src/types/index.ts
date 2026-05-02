import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export interface AgentToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface PolicyRule {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
  value: string | number | boolean;
  action?: string;
}

export interface DashboardStats {
  cashBalance: number;
  pendingInvoicesAmount: number;
  overdueInvoicesCount: number;
  monthlyExpenses: number;
  payrollDue: number;
  activeEmployeesCount: number;
  recentTransactions: RecentTransaction[];
  recentAgentActivity: RecentAgentActivity[];
}

export interface RecentTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'CREDIT' | 'DEBIT';
  date: Date;
  category?: string | null;
}

export interface RecentAgentActivity {
  id: string;
  action: string;
  details: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  createdAt: Date;
}

export interface ConversationMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  tool_call_id?: string;
  name?: string;
}

export interface AgentChatResponse {
  message: string;
  toolCallsMade: string[];
}
