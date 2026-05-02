import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; name: string; companyName: string }) =>
    api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get('/dashboard'),
};

// Invoices
export const invoicesApi = {
  list: (params?: { status?: string; search?: string; startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number; page?: number; limit?: number }) =>
    api.get('/invoices', { params }),
  create: (data: { vendorName: string; amount: number; dueDate: string; description?: string }) =>
    api.post('/invoices', data),
  markPaid: (id: string) => api.put(`/invoices/${id}/paid`),
  flag: (id: string, reason: string) => api.put(`/invoices/${id}/flag`, { reason }),
  getOverdue: () => api.get('/invoices/overdue'),
  bulk: (action: 'mark_paid' | 'flag' | 'delete', ids: string[], reason?: string) =>
    api.post('/invoices/bulk', { action, ids, reason }),
  export: (params?: { status?: string; startDate?: string; endDate?: string }) =>
    api.get('/invoices/export', { params, responseType: 'blob' }),
};

// Expenses
export const expensesApi = {
  list: (params?: { status?: string; search?: string; category?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get('/expenses', { params }),
  create: (data: { category: string; amount: number; description: string; submittedBy: string; receipt?: string }) =>
    api.post('/expenses', data),
  approve: (id: string) => api.put(`/expenses/${id}/approve`),
  reject: (id: string, reason: string) => api.put(`/expenses/${id}/reject`, { reason }),
  bulk: (action: 'approve' | 'reject', ids: string[], reason?: string) =>
    api.post('/expenses/bulk', { action, ids, reason }),
  export: (params?: { status?: string; startDate?: string; endDate?: string }) =>
    api.get('/expenses/export', { params, responseType: 'blob' }),
};

// Payroll
export const payrollApi = {
  listEmployees: (params?: { page?: number; limit?: number }) =>
    api.get('/payroll/employees', { params }),
  createEmployee: (data: { name: string; email: string; salary: number; payFrequency: string; bankAccount?: string }) =>
    api.post('/payroll/employees', data),
  updateEmployee: (id: string, data: { salary?: number; payFrequency?: string }) =>
    api.put(`/payroll/employees/${id}`, data),
  deactivateEmployee: (id: string) => api.put(`/payroll/employees/${id}/deactivate`),
  activateEmployee: (id: string) => api.put(`/payroll/employees/${id}/activate`),
  runPayroll: (frequency?: string) => api.post('/payroll/run', frequency ? { frequency } : {}),
  getHistory: () => api.get('/payroll/history'),
  export: () => api.get('/payroll/export', { responseType: 'blob' }),
};

// Vendors
export const vendorsApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    api.get('/vendors', { params }),
  create: (data: { name: string; email?: string; phone?: string; paymentTerms?: string }) =>
    api.post('/vendors', data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
};

// Policies
export const policiesApi = {
  list: () => api.get('/policies'),
  create: (data: { name: string; type: string; rules: Record<string, unknown> }) =>
    api.post('/policies', data),
  update: (id: string, data: Partial<{ name: string; type: string; rules: Record<string, unknown>; isActive: boolean }>) =>
    api.put(`/policies/${id}`, data),
  delete: (id: string) => api.delete(`/policies/${id}`),
};

// Agent
export const agentApi = {
  chat: (message: string, conversationHistory: Array<{ role: string; content: string }> = []) =>
    api.post('/agent/chat', { message, conversationHistory }),
  getLogs: (limit?: number) => api.get('/agent/logs', { params: limit ? { limit } : {} }),
  // Conversations
  createConversation: (title?: string) => api.post('/agent/conversations', { title }),
  listConversations: () => api.get('/agent/conversations'),
  getConversation: (id: string) => api.get(`/agent/conversations/${id}`),
  deleteConversation: (id: string) => api.delete(`/agent/conversations/${id}`),
  updateConversation: (id: string, title: string) => api.patch(`/agent/conversations/${id}`, { title }),
  chatInConversation: (id: string, message: string) =>
    api.post(`/agent/conversations/${id}/chat`, { message }),
};

// Analytics
export const analyticsApi = {
  getOverview: (period: '30d' | '90d' | '1y' = '30d') =>
    api.get('/analytics/overview', { params: { period } }),
  getCashFlow: (months = 6) =>
    api.get('/analytics/cashflow', { params: { months } }),
};

// Notifications
export const notificationsApi = {
  getAlerts: (limit?: number) => api.get('/notifications', { params: limit ? { limit } : {} }),
  markRead: (id: string) => api.put(`/notifications/${id}/read`),
};

// Audit
export const auditApi = {
  getLogs: (params?: { resource?: string; startDate?: string; endDate?: string; page?: number; limit?: number }) =>
    api.get('/audit', { params }),
};
