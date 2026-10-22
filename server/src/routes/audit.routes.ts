// =============================================================================
// Audit Log Routes — admin only
// =============================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const auditRouter = Router();
auditRouter.use(authenticate, requireRole('admin'));

// GET /api/audit-logs
auditRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 200);
    const tableName = req.query.table as string | undefined;

    const where = tableName ? { table_name: tableName } : {};

    const [data, total] = await prisma.$transaction([
      prisma.audit_logs.findMany({
        where,
        include: { performer: { select: { id: true, full_name: true, email: true } } },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.audit_logs.count({ where })
    ]);

    res.json({ data, total, page, limit });
  } catch (err) { next(err); }
});
