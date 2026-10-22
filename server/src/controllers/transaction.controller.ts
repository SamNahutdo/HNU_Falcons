// =============================================================================
// Transaction Controller — handles checkout and return workflows
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { transactionService } from '../services/transaction.service';

const CheckoutSchema = z.object({
  athlete_id: z.string().uuid(),
  items: z.array(z.object({
    equipment_id: z.string().uuid(),
    quantity: z.number().int().min(1),
    condition: z.string().optional()
  })).min(1, 'At least one item is required'),
  expected_return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  remarks: z.string().optional()
});

const ReturnSchema = z.object({
  transaction_id: z.string().uuid(),
  items: z.array(z.object({
    item_id: z.string().uuid(),
    returned_quantity: z.number().int().min(0),
    condition_after: z.string().optional()
  })).min(1)
});

export const transactionController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const user = req.user!;

      // Role-filtered: students only see their own athlete's transactions
      // (Additional filter — DB RLS also enforces this as a second layer)
      let athleteFilter: string | undefined;
      if (user.role === 'student') {
        // Look up athlete record for this user to filter by their athlete_id
        const { prisma } = await import('../lib/prisma');
        const athlete = await prisma.athletes.findUnique({ where: { user_id: user.userId } });
        athleteFilter = athlete?.id;
      }

      const result = await transactionService.findAll({
        status: req.query.status as string | undefined,
        athlete_id: athleteFilter,
        page,
        limit
      });
      res.json(result);
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const tx = await transactionService.findById(req.params.id);
      res.json(tx);
    } catch (err) { next(err); }
  },

  async checkout(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CheckoutSchema.parse(req.body);
      const result = await transactionService.checkout({
        ...dto,
        approved_by: req.user!.userId  // The logged-in staff/admin approves
      });
      res.status(201).json({
        message: result.message,
        transaction_id: result.transaction_id,
        items_processed: result.items_processed
      });
    } catch (err) { next(err); }
  },

  async processReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = ReturnSchema.parse(req.body);
      const result = await transactionService.processReturn({
        ...dto,
        received_by: req.user!.userId
      });
      res.json({ message: result.message, status: result.status, transaction_id: result.transaction_id });
    } catch (err) { next(err); }
  },

  async getOverdue(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await transactionService.getOverdueLoans();
      res.json({ data });
    } catch (err) { next(err); }
  }
};
