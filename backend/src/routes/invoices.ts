import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import * as invoiceService from '../services/invoiceService';
import { InvoiceStatus } from '@prisma/client';

const router = Router();

// GET / - list with pagination, search, filtering
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { status, search, startDate, endDate, minAmount, maxAmount, page, limit } = req.query;

    // If any advanced params are present, use paginated mode
    if (page || limit || search || startDate || endDate || minAmount || maxAmount) {
      const result = await invoiceService.getInvoices(userId, {
        status: status as InvoiceStatus | undefined,
        search: search as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        minAmount: minAmount ? parseFloat(minAmount as string) : undefined,
        maxAmount: maxAmount ? parseFloat(maxAmount as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json(result);
    } else {
      // Legacy: return plain array for backward compat
      const invoices = await invoiceService.getInvoices(userId, status as InvoiceStatus | undefined);
      res.json(invoices);
    }
  } catch (err) {
    next(err);
  }
});

// GET /export - export as CSV
router.get('/export', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { status, startDate, endDate } = req.query;

    const result = await invoiceService.getInvoices(userId, {
      status: status as InvoiceStatus | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: 1,
      limit: 10000,
    });

    const invoices = Array.isArray(result) ? result : result.data;

    const { toCSV } = await import('../utils/csv');
    const fields = ['id', 'vendorName', 'amount', 'dueDate', 'status', 'description', 'paidAt', 'createdAt'];
    const csv = toCSV(invoices as Record<string, unknown>[], fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="invoices.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// GET /overdue
router.get('/overdue', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const invoices = await invoiceService.getOverdueInvoices(userId);
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

// POST / - create invoice
router.post(
  '/',
  [
    body('vendorName').trim().notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('dueDate').isISO8601(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const invoice = await invoiceService.createInvoice(userId, req.body);
      res.status(201).json(invoice);
    } catch (err) {
      next(err);
    }
  }
);

// POST /bulk - bulk operations
router.post('/bulk', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { action, ids, reason } = req.body as {
      action: 'mark_paid' | 'flag' | 'delete';
      ids: string[];
      reason?: string;
    };

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'action and ids are required' });
      return;
    }

    const result = await invoiceService.bulkInvoiceAction(userId, action, ids, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /:id/paid
router.put('/:id/paid', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const invoice = await invoiceService.markInvoicePaid(userId, req.params.id);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

// PUT /:id/flag
router.put(
  '/:id/flag',
  [body('reason').trim().notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const invoice = await invoiceService.flagInvoice(userId, req.params.id, req.body.reason);
      res.json(invoice);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
