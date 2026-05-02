import { Router, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthRequest } from '../types';
import * as vendorService from '../services/vendorService';

const router = Router();

// GET / - list with optional search
router.get('/', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { search, page, limit } = req.query;

    if (page || limit) {
      const p = page ? parseInt(page as string) : 1;
      const l = limit ? parseInt(limit as string) : 20;
      const vendors = await vendorService.getVendors(userId, search as string | undefined);
      const total = vendors.length;
      const start = (p - 1) * l;
      const data = vendors.slice(start, start + l);
      res.json({
        data,
        pagination: {
          page: p,
          limit: l,
          total,
          totalPages: Math.ceil(total / l),
          hasNext: p * l < total,
          hasPrev: p > 1,
        },
      });
    } else {
      const vendors = await vendorService.getVendors(userId, search as string | undefined);
      res.json(vendors);
    }
  } catch (err) {
    next(err);
  }
});

// POST /
router.post(
  '/',
  [body('name').trim().notEmpty()],
  async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const userId = req.user!.userId;
      const vendor = await vendorService.createVendor(userId, req.body);
      res.status(201).json(vendor);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    await vendorService.deleteVendor(userId, req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
