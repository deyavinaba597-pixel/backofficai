import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import prisma from '../db/prisma';
import { PolicyType } from '@prisma/client';

const router = Router();

// GET /
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const policies = await prisma.policy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(policies);
  } catch (err) {
    next(err);
  }
});

// POST /
router.post(
  '/',
  [
    body('name').trim().notEmpty(),
    body('type').isIn(['PAYMENT', 'APPROVAL', 'ALERT', 'PAYROLL']),
    body('rules').isObject(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const policy = await prisma.policy.create({
        data: {
          userId,
          name: req.body.name,
          type: req.body.type as PolicyType,
          rules: req.body.rules,
          isActive: true,
        },
      });
      res.status(201).json(policy);
    } catch (err) {
      next(err);
    }
  }
);

// PUT /:id
router.put('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const existing = await prisma.policy.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    const policy = await prisma.policy.update({
      where: { id: req.params.id },
      data: {
        ...(req.body.name && { name: req.body.name }),
        ...(req.body.type && { type: req.body.type as PolicyType }),
        ...(req.body.rules && { rules: req.body.rules }),
        ...(typeof req.body.isActive === 'boolean' && { isActive: req.body.isActive }),
      },
    });
    res.json(policy);
  } catch (err) {
    next(err);
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;

    const existing = await prisma.policy.findFirst({
      where: { id: req.params.id, userId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Policy not found' });
      return;
    }

    await prisma.policy.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
