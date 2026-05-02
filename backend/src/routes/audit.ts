import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import * as auditService from '../services/auditService';

const router = Router();

// GET / - get audit logs with filtering and pagination
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { resource, startDate, endDate, page, limit } = req.query;

    const result = await auditService.getAuditLogs(userId, {
      resource: resource as string | undefined,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

export default router;
