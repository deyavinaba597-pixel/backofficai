import OpenAI from 'openai';

export const agentTools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_dashboard_stats',
      description: 'Get the current financial overview including cash balance, pending invoices, overdue invoices, monthly expenses, payroll due, and active employee count.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_invoices',
      description: 'List invoices with an optional status filter.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'OVERDUE', 'FLAGGED'],
            description: 'Filter invoices by status.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_invoices',
      description: 'Search invoices by vendor name, amount range, or date range.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Vendor name to search for.' },
          minAmount: { type: 'number', description: 'Minimum invoice amount.' },
          maxAmount: { type: 'number', description: 'Maximum invoice amount.' },
          startDate: { type: 'string', description: 'Start date (ISO 8601).' },
          endDate: { type: 'string', description: 'End date (ISO 8601).' },
          status: { type: 'string', enum: ['PENDING', 'PAID', 'OVERDUE', 'FLAGGED'] },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_invoice',
      description: 'Create a new invoice for a vendor.',
      parameters: {
        type: 'object',
        properties: {
          vendorName: { type: 'string', description: 'Name of the vendor.' },
          amount: { type: 'number', description: 'Invoice amount in dollars.' },
          dueDate: { type: 'string', description: 'Due date in ISO 8601 format.' },
          description: { type: 'string', description: 'Description of the invoice.' },
        },
        required: ['vendorName', 'amount', 'dueDate'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'mark_invoice_paid',
      description: 'Mark an invoice as paid.',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'The unique ID of the invoice.' },
        },
        required: ['invoiceId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_expenses',
      description: 'List expense submissions with an optional status filter.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['PENDING', 'APPROVED', 'REJECTED'],
            description: 'Filter expenses by status.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_expense_analytics',
      description: 'Get expense breakdown by category for a given period.',
      parameters: {
        type: 'object',
        properties: {
          startDate: { type: 'string', description: 'Start date (ISO 8601).' },
          endDate: { type: 'string', description: 'End date (ISO 8601).' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'approve_expense',
      description: 'Approve a pending expense submission.',
      parameters: {
        type: 'object',
        properties: {
          expenseId: { type: 'string', description: 'The unique ID of the expense.' },
        },
        required: ['expenseId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'reject_expense',
      description: 'Reject a pending expense submission with a reason.',
      parameters: {
        type: 'object',
        properties: {
          expenseId: { type: 'string', description: 'The unique ID of the expense.' },
          reason: { type: 'string', description: 'The reason for rejecting.' },
        },
        required: ['expenseId', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'bulk_approve_expenses',
      description: 'Approve multiple expenses at once.',
      parameters: {
        type: 'object',
        properties: {
          expenseIds: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of expense IDs to approve.',
          },
        },
        required: ['expenseIds'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_employees',
      description: 'List all employees with their salary, pay frequency, and status.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['ACTIVE', 'INACTIVE'],
            description: 'Filter employees by status.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_employee',
      description: 'Update an employee salary or pay frequency.',
      parameters: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', description: 'The unique ID of the employee.' },
          salary: { type: 'number', description: 'New annual salary.' },
          payFrequency: {
            type: 'string',
            enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
            description: 'New pay frequency.',
          },
        },
        required: ['employeeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'deactivate_employee',
      description: 'Deactivate an employee so they are excluded from payroll.',
      parameters: {
        type: 'object',
        properties: {
          employeeId: { type: 'string', description: 'The unique ID of the employee.' },
        },
        required: ['employeeId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'run_payroll',
      description: 'Process payroll for all active employees or filter by pay frequency.',
      parameters: {
        type: 'object',
        properties: {
          frequency: {
            type: 'string',
            enum: ['WEEKLY', 'BIWEEKLY', 'MONTHLY'],
            description: 'Run payroll only for employees with this pay frequency.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_vendors',
      description: 'List all vendors with their contact info and payment history.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_vendor',
      description: 'Create a new vendor record.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Vendor name.' },
          email: { type: 'string', description: 'Vendor email.' },
          phone: { type: 'string', description: 'Vendor phone.' },
          paymentTerms: { type: 'string', description: 'Payment terms (e.g., Net 30).' },
        },
        required: ['name'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_bank_transactions',
      description: 'Get recent bank transactions to review cash flow.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Number of transactions to retrieve.' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_cash_flow',
      description: 'Get monthly cash flow data for a given number of months.',
      parameters: {
        type: 'object',
        properties: {
          months: { type: 'number', description: 'Number of months to look back (default 6).' },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_financial_summary',
      description: 'Get a comprehensive financial summary for a period including revenue, expenses, invoices, and cash flow.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['30d', '90d', '1y'],
            description: 'Time period for the summary.',
          },
        },
        required: [],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_policies',
      description: 'Get all business policies.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_policy',
      description: 'Create a new business policy.',
      parameters: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Name of the policy.' },
          type: {
            type: 'string',
            enum: ['PAYMENT', 'APPROVAL', 'ALERT', 'PAYROLL'],
            description: 'Type of policy.',
          },
          rules: { type: 'object', description: 'Policy rules as a JSON object.' },
        },
        required: ['name', 'type', 'rules'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'send_alert',
      description: 'Send an alert or notification to the business owner.',
      parameters: {
        type: 'object',
        properties: {
          message: { type: 'string', description: 'The alert message.' },
          type: {
            type: 'string',
            enum: ['INFO', 'WARNING', 'URGENT'],
            description: 'Severity level.',
          },
        },
        required: ['message', 'type'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_overdue_invoices',
      description: 'Get all invoices that are past their due date.',
      parameters: { type: 'object', properties: {}, required: [] },
    },
  },
  {
    type: 'function',
    function: {
      name: 'flag_invoice',
      description: 'Flag an invoice for review.',
      parameters: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string', description: 'The unique ID of the invoice.' },
          reason: { type: 'string', description: 'The reason for flagging.' },
        },
        required: ['invoiceId', 'reason'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_audit_log',
      description: 'Get recent audit trail showing who did what and when.',
      parameters: {
        type: 'object',
        properties: {
          resource: {
            type: 'string',
            description: 'Filter by resource type (Invoice, Expense, Employee, Vendor).',
          },
          limit: { type: 'number', description: 'Number of records to return (default 20).' },
        },
        required: [],
      },
    },
  },
];
