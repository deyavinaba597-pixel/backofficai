import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import * as expenseService from '../services/expenseService';
import { ExpenseStatus } from '@prisma/client';

const router = Router();

// GET / - list with pagination, search, filtering
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { status, search, category, startDate, endDate, page, limit } = req.query;

    if (page || limit || search || category || startDate || endDate) {
      const result = await expenseService.getExpenses(userId, {
        status: status as ExpenseStatus | undefined,
        search: search as string | undefined,
        category: category as string | undefined,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : 1,
        limit: limit ? parseInt(limit as string) : 20,
      });
      res.json(result);
    } else {
      const expenses = await expenseService.getExpenses(userId, status as ExpenseStatus | undefined);
      res.json(expenses);
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

    const result = await expenseService.getExpenses(userId, {
      status: status as ExpenseStatus | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: 1,
      limit: 10000,
    });

    const expenses = Array.isArray(result) ? result : result.data;

    const { toCSV } = await import('../utils/csv');
    const fields = ['id', 'category', 'amount', 'description', 'submittedBy', 'status', 'createdAt'];
    const csv = toCSV(expenses as Record<string, unknown>[], fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="expenses.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// POST / - create expense
router.post(
  '/',
  [
    body('category').trim().notEmpty(),
    body('amount').isFloat({ min: 0.01 }),
    body('description').trim().notEmpty(),
    body('submittedBy').trim().notEmpty(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const expense = await expenseService.createExpense(userId, req.body);
      res.status(201).json(expense);
    } catch (err) {
      next(err);
    }
  }
);

// POST /bulk - bulk approve/reject
router.post('/bulk', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { action, ids, reason } = req.body as {
      action: 'approve' | 'reject';
      ids: string[];
      reason?: string;
    };

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'action and ids are required' });
      return;
    }

    const result = await expenseService.bulkExpenseAction(userId, action, ids, reason);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// PUT /:id/approve
router.put('/:id/approve', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const expense = await expenseService.approveExpense(userId, req.params.id);
    res.json(expense);
  } catch (err) {
    next(err);
  }
});

// PUT /:id/reject
router.put(
  '/:id/reject',
  [body('reason').trim().notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const expense = await expenseService.rejectExpense(userId, req.params.id, req.body.reason);
      res.json(expense);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
