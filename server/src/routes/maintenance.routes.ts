// =============================================================================
// Maintenance Routes
// =============================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const maintenanceRouter = Router();
maintenanceRouter.use(authenticate);

const CreateSchema = z.object({
  equipment_id: z.string().uuid(),
  issue_description: z.string().min(5),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  cost: z.number().min(0).optional().default(0)
});

const UpdateSchema = z.object({
  status: z.enum(['pending', 'in_progress', 'completed', 'cancelled']).optional(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cost: z.number().min(0).optional()
});

// GET /api/maintenance — admin and staff see all; coaches read-only
maintenanceRouter.get('/', requireRole('admin', 'staff', 'coach'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const [data, total] = await prisma.$transaction([
      prisma.maintenance_records.findMany({
        include: { equipment: true, reporter: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.maintenance_records.count()
    ]);
    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
});

// POST /api/maintenance — admin/staff only
maintenanceRouter.post('/', requireRole('admin', 'staff'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = CreateSchema.parse(req.body);
    const record = await prisma.maintenance_records.create({
      data: { ...dto, reported_by: req.user!.userId },
      include: { equipment: true, reporter: true }
    });
    res.status(201).json({ message: 'Maintenance record created.', data: record });
  } catch (err) { next(err); }
});

// PUT /api/maintenance/:id — admin/staff only
maintenanceRouter.put('/:id', requireRole('admin', 'staff'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dto = UpdateSchema.parse(req.body);
    const record = await prisma.maintenance_records.update({
      where: { id: req.params.id },
      data: dto,
      include: { equipment: true }
    });
    res.json({ message: 'Maintenance record updated.', data: record });
  } catch (err) { next(err); }
});
