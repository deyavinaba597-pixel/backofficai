import { config } from '../config/env';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.simple()),
  transports: [new winston.transports.Console()],
});

// Lazy-load Resend to avoid crashing if not installed
async function getResend() {
  if (!config.resendApiKey) return null;
  try {
    const { Resend } = await import('resend');
    return new Resend(config.resendApiKey);
  } catch {
    return null;
  }
}

const brandColor = '#6366f1';

function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>BackOfficeAI</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <span style="display:inline-block;background:rgba(255,255,255,0.2);border-radius:8px;padding:8px 12px;font-size:18px;font-weight:700;color:#ffffff;">⚡ BackOfficeAI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e2e8f0;">
              <p style="margin:0;font-size:12px;color:#94a3b8;text-align:center;">
                BackOfficeAI · Your AI Back-Office Team<br/>
                <a href="#" style="color:${brandColor};text-decoration:none;">Unsubscribe</a> · 
                <a href="#" style="color:${brandColor};text-decoration:none;">Privacy Policy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string,
  companyName: string
): Promise<boolean> {
  const resend = await getResend();
  if (!resend) {
    logger.info(`[Email] Welcome email would be sent to ${userEmail} for ${companyName}`);
    return true;
  }

  const content = `
    <h1 style="margin:0 0 8px;font-size:28px;font-weight:700;color:#1e293b;">Welcome, ${userName}! 🎉</h1>
    <p style="margin:0 0 24px;font-size:16px;color:#64748b;">Your BackOfficeAI account for <strong>${companyName}</strong> is ready.</p>
    
    <div style="background:#f0f4ff;border-radius:8px;padding:24px;margin-bottom:24px;">
      <h3 style="margin:0 0 16px;font-size:16px;font-weight:600;color:#1e293b;">What you can do:</h3>
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['📄', 'Manage Invoices', 'Track, create, and mark invoices as paid'],
          ['🧾', 'Track Expenses', 'Submit and approve business expenses'],
          ['👥', 'Run Payroll', 'Process payroll for your entire team'],
          ['🤖', 'AI Agent', 'Ask your AI assistant anything about your finances'],
        ]
          .map(
            ([icon, title, desc]) => `
          <tr>
            <td style="padding:8px 0;">
              <span style="font-size:20px;">${icon}</span>
            </td>
            <td style="padding:8px 12px;">
              <strong style="color:#1e293b;">${title}</strong><br/>
              <span style="font-size:13px;color:#64748b;">${desc}</span>
            </td>
          </tr>`
          )
          .join('')}
      </table>
    </div>
    
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
       style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;font-size:15px;">
      Go to Dashboard →
    </a>
  `;

  try {
    await resend.emails.send({
      from: config.resendFromEmail,
      to: userEmail,
      subject: `Welcome to BackOfficeAI, ${userName}!`,
      html: baseTemplate(content),
    });
    return true;
  } catch (err) {
    logger.error('[Email] Failed to send welcome email:', err);
    return false;
  }
}

export async function sendOverdueInvoiceAlert(
  userEmail: string,
  userName: string,
  invoices: Array<{ vendorName: string; amount: number; dueDate: Date }>
): Promise<boolean> {
  const resend = await getResend();
  const total = invoices.reduce((s, i) => s + i.amount, 0);

  if (!resend) {
    logger.info(`[Email] Overdue invoice alert would be sent to ${userEmail}: ${invoices.length} invoices, ${formatCurrency(total)}`);
    return true;
  }

  const rows = invoices
    .map(
      (inv) => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:12px 0;color:#1e293b;">${inv.vendorName}</td>
      <td style="padding:12px 0;color:#ef4444;font-weight:600;">${formatCurrency(inv.amount)}</td>
      <td style="padding:12px 0;color:#64748b;">${new Date(inv.dueDate).toLocaleDateString()}</td>
    </tr>`
    )
    .join('');

  const content = `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#dc2626;font-weight:600;">⚠️ Action Required: ${invoices.length} Overdue Invoice${invoices.length > 1 ? 's' : ''}</p>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">Hi ${userName},</h2>
    <p style="margin:0 0 24px;color:#64748b;">You have overdue invoices totaling <strong style="color:#ef4444;">${formatCurrency(total)}</strong> that require your attention.</p>
    
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
      <tr>
        <th style="padding:8px 0;text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;">Vendor</th>
        <th style="padding:8px 0;text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;">Amount</th>
        <th style="padding:8px 0;text-align:left;font-size:12px;color:#94a3b8;text-transform:uppercase;">Due Date</th>
      </tr>
      ${rows}
    </table>
    
    <div style="margin-top:24px;">
      <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/invoices" 
         style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
        Review Invoices →
      </a>
    </div>
  `;

  try {
    await resend.emails.send({
      from: config.resendFromEmail,
      to: userEmail,
      subject: `⚠️ ${invoices.length} Overdue Invoice${invoices.length > 1 ? 's' : ''} - Action Required`,
      html: baseTemplate(content),
    });
    return true;
  } catch (err) {
    logger.error('[Email] Failed to send overdue invoice alert:', err);
    return false;
  }
}

export async function sendPayrollProcessedEmail(
  userEmail: string,
  userName: string,
  employeeCount: number,
  totalAmount: number
): Promise<boolean> {
  const resend = await getResend();

  if (!resend) {
    logger.info(`[Email] Payroll processed email would be sent to ${userEmail}: ${employeeCount} employees, ${formatCurrency(totalAmount)}`);
    return true;
  }

  const content = `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:#16a34a;font-weight:600;">✅ Payroll Processed Successfully</p>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">Hi ${userName},</h2>
    <p style="margin:0 0 24px;color:#64748b;">Your payroll has been processed successfully.</p>
    
    <div style="background:#f8fafc;border-radius:8px;padding:24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding:8px 0;">
            <span style="color:#64748b;">Employees Paid</span>
          </td>
          <td style="padding:8px 0;text-align:right;">
            <strong style="color:#1e293b;">${employeeCount}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0;border-top:1px solid #e2e8f0;">
            <span style="color:#64748b;">Total Amount</span>
          </td>
          <td style="padding:8px 0;text-align:right;border-top:1px solid #e2e8f0;">
            <strong style="color:#1e293b;font-size:18px;">${formatCurrency(totalAmount)}</strong>
          </td>
        </tr>
      </table>
    </div>
    
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/payroll" 
       style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
      View Payroll Details →
    </a>
  `;

  try {
    await resend.emails.send({
      from: config.resendFromEmail,
      to: userEmail,
      subject: `✅ Payroll Processed - ${formatCurrency(totalAmount)} for ${employeeCount} employees`,
      html: baseTemplate(content),
    });
    return true;
  } catch (err) {
    logger.error('[Email] Failed to send payroll processed email:', err);
    return false;
  }
}

export async function sendExpenseApprovalEmail(
  userEmail: string,
  userName: string,
  expense: { category: string; amount: number; description: string; submittedBy: string; status: string }
): Promise<boolean> {
  const resend = await getResend();
  const isApproved = expense.status === 'APPROVED';

  if (!resend) {
    logger.info(`[Email] Expense ${expense.status} email would be sent to ${userEmail}`);
    return true;
  }

  const content = `
    <div style="background:${isApproved ? '#f0fdf4' : '#fef2f2'};border:1px solid ${isApproved ? '#bbf7d0' : '#fecaca'};border-radius:8px;padding:16px;margin-bottom:24px;">
      <p style="margin:0;font-size:14px;color:${isApproved ? '#16a34a' : '#dc2626'};font-weight:600;">
        ${isApproved ? '✅ Expense Approved' : '❌ Expense Rejected'}
      </p>
    </div>
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1e293b;">Hi ${userName},</h2>
    <p style="margin:0 0 24px;color:#64748b;">An expense submitted by <strong>${expense.submittedBy}</strong> has been ${expense.status.toLowerCase()}.</p>
    
    <div style="background:#f8fafc;border-radius:8px;padding:24px;margin-bottom:24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        ${[
          ['Category', expense.category],
          ['Amount', formatCurrency(expense.amount)],
          ['Description', expense.description],
          ['Submitted By', expense.submittedBy],
        ]
          .map(
            ([label, value]) => `
          <tr>
            <td style="padding:8px 0;color:#64748b;">${label}</td>
            <td style="padding:8px 0;text-align:right;color:#1e293b;font-weight:500;">${value}</td>
          </tr>`
          )
          .join('')}
      </table>
    </div>
    
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/expenses" 
       style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
      View Expenses →
    </a>
  `;

  try {
    await resend.emails.send({
      from: config.resendFromEmail,
      to: userEmail,
      subject: `${isApproved ? '✅' : '❌'} Expense ${expense.status} - ${formatCurrency(expense.amount)}`,
      html: baseTemplate(content),
    });
    return true;
  } catch (err) {
    logger.error('[Email] Failed to send expense approval email:', err);
    return false;
  }
}

export async function sendDailyBriefingEmail(
  userEmail: string,
  userName: string,
  stats: {
    cashBalance: number;
    pendingInvoices: number;
    pendingExpenses: number;
    activeEmployees: number;
  }
): Promise<boolean> {
  const resend = await getResend();

  if (!resend) {
    logger.info(`[Email] Daily briefing email would be sent to ${userEmail}`);
    return true;
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const content = `
    <h2 style="margin:0 0 4px;font-size:22px;font-weight:700;color:#1e293b;">Good morning, ${userName}!</h2>
    <p style="margin:0 0 24px;color:#94a3b8;font-size:14px;">${today}</p>
    
    <p style="margin:0 0 16px;color:#64748b;">Here's your daily financial briefing:</p>
    
    <div style="display:grid;gap:12px;margin-bottom:24px;">
      ${[
        { label: 'Cash Balance', value: formatCurrency(stats.cashBalance), color: '#16a34a', icon: '💰' },
        { label: 'Pending Invoices', value: stats.pendingInvoices.toString(), color: '#d97706', icon: '📄' },
        { label: 'Pending Expenses', value: stats.pendingExpenses.toString(), color: '#7c3aed', icon: '🧾' },
        { label: 'Active Employees', value: stats.activeEmployees.toString(), color: '#2563eb', icon: '👥' },
      ]
        .map(
          (item) => `
        <div style="background:#f8fafc;border-radius:8px;padding:16px;display:flex;align-items:center;justify-content:space-between;">
          <span style="color:#64748b;">${item.icon} ${item.label}</span>
          <strong style="color:${item.color};font-size:18px;">${item.value}</strong>
        </div>`
        )
        .join('')}
    </div>
    
    <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
       style="display:inline-block;background:${brandColor};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">
      Open Dashboard →
    </a>
  `;

  try {
    await resend.emails.send({
      from: config.resendFromEmail,
      to: userEmail,
      subject: `📊 Daily Briefing - ${today}`,
      html: baseTemplate(content),
    });
    return true;
  } catch (err) {
    logger.error('[Email] Failed to send daily briefing email:', err);
    return false;
  }
}
