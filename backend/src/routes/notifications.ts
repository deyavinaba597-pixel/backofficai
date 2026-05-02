import { Router, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import prisma from '../db/prisma';

const router = Router();

// GET / - get all alerts/notifications
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;

    const alerts = await prisma.agentLog.findMany({
      where: {
        userId,
        action: { startsWith: 'ALERT' },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    res.json(alerts);
  } catch (err) {
    next(err);
  }
});

// PUT /:id/read - mark as read (we use a convention: mark as PENDING status to indicate "read")
router.put('/:id/read', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const log = await prisma.agentLog.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!log) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }

    // Use PENDING status to mark as "read" (repurposing the field)
    const updated = await prisma.agentLog.update({
      where: { id: req.params.id },
      data: { status: 'PENDING' },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
