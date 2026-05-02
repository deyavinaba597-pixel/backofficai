import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import * as payrollService from '../services/payrollService';
import { PayFrequency } from '@prisma/client';

const router = Router();

// GET /employees - list with pagination
router.get('/employees', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { page, limit } = req.query;

    if (page || limit) {
      const result = await payrollService.getEmployees(
        userId,
        undefined,
        page ? parseInt(page as string) : 1,
        limit ? parseInt(limit as string) : 20
      );
      res.json(result);
    } else {
      const employees = await payrollService.getEmployees(userId);
      res.json(employees);
    }
  } catch (err) {
    next(err);
  }
});

// GET /export - export employees as CSV
router.get('/export', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const employees = await payrollService.getEmployees(userId);
    const data = Array.isArray(employees) ? employees : employees.data;

    const { toCSV } = await import('../utils/csv');
    const fields = ['id', 'name', 'email', 'salary', 'payFrequency', 'status', 'createdAt'];
    const csv = toCSV(data as Record<string, unknown>[], fields);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees.csv"');
    res.send(csv);
  } catch (err) {
    next(err);
  }
});

// POST /employees
router.post(
  '/employees',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail().normalizeEmail(),
    body('salary').isFloat({ min: 0 }),
    body('payFrequency').isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const employee = await payrollService.createEmployee(userId, req.body);
      res.status(201).json(employee);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /employees/:id - update employee
router.put(
  '/employees/:id',
  [
    body('salary').optional().isFloat({ min: 0 }),
    body('payFrequency').optional().isIn(['WEEKLY', 'BIWEEKLY', 'MONTHLY']),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const { salary, payFrequency } = req.body;
      const employee = await payrollService.updateEmployee(userId, req.params.id, {
        ...(salary !== undefined && { salary: parseFloat(salary) }),
        ...(payFrequency && { payFrequency: payFrequency as PayFrequency }),
      });
      res.json(employee);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /employees/:id/deactivate
router.put('/employees/:id/deactivate', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const employee = await payrollService.deactivateEmployee(userId, req.params.id);
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

// PUT /employees/:id/activate
router.put('/employees/:id/activate', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const employee = await payrollService.activateEmployee(userId, req.params.id);
    res.json(employee);
  } catch (err) {
    next(err);
  }
});

// POST /run
router.post('/run', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const frequency = req.body.frequency as PayFrequency | undefined;
    const result = await payrollService.runPayroll(userId, frequency);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// GET /history
router.get('/history', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const history = await payrollService.getPayrollHistory(userId);
    res.json(history);
  } catch (err) {
    next(err);
  }
});

export default router;
