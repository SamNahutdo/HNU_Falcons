// =============================================================================
// Equipment Controller — request/response handling only
// No SQL or business logic here. Delegates to equipmentService.
// =============================================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { equipmentService } from '../services/equipment.service';

// ─── Zod validation schemas ───────────────────────────────────────────────────
const CreateSchema = z.object({
  sport_id: z.string().uuid('sport_id must be a valid UUID'),
  equipment_code: z.string().min(1).max(50),
  name: z.string().min(1).max(150),
  category: z.string().min(1).max(50),
  total_quantity: z.number().int().min(0),
  available_quantity: z.number().int().min(0),
  condition: z.enum(['new', 'good', 'fair', 'needs_maintenance', 'damaged']).optional(),
  status: z.enum(['available', 'low_stock', 'out_of_stock', 'under_maintenance', 'retired']).optional()
});

const UpdateSchema = CreateSchema.partial().omit({ sport_id: true, equipment_code: true });

// ─── Controller methods ───────────────────────────────────────────────────────
export const equipmentController = {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(parseInt(req.query.page as string) || 1, 1);
      const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
      const result = await equipmentService.findAll({
        sport_id: req.query.sport_id as string | undefined,
        status: req.query.status as string | undefined,
        page,
        limit
      });
      res.json(result);
    } catch (err) { next(err); }
  },

  async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await equipmentService.findById(req.params.id);
      res.json(item);
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = CreateSchema.parse(req.body);
      const item = await equipmentService.create(dto);
      res.status(201).json({ message: 'Equipment created successfully.', data: item });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = UpdateSchema.parse(req.body);
      const item = await equipmentService.update(req.params.id, dto);
      res.json({ message: 'Equipment updated successfully.', data: item });
    } catch (err) { next(err); }
  },

  async remove(req: Request, res: Response, next: NextFunction) {
    try {
      await equipmentService.delete(req.params.id);
      res.json({ message: 'Equipment deleted successfully.' });
    } catch (err) { next(err); }
  },

  async getInventoryView(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await equipmentService.getInventoryView();
      res.json({ data });
    } catch (err) { next(err); }
  }
};
