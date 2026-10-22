// =============================================================================
// Reports Routes — dashboard aggregates and performance evidence
// =============================================================================
import { Router, Request, Response, NextFunction } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { prisma } from '../lib/prisma';

export const reportsRouter = Router();
reportsRouter.use(authenticate);

// GET /api/reports/inventory — equipment inventory with utilization rates
// Source: vw_equipment_inventory_status (database view)
reportsRouter.get('/inventory', requireRole('admin', 'staff', 'coach'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT * FROM vw_equipment_inventory_status
      ORDER BY utilization_rate_pct DESC NULLS LAST
    `;
    res.json({ data });
  } catch (err) { next(err); }
});

// GET /api/reports/overdue — active loans with overdue detection
// Source: vw_active_loans_summary (database view using fn_calculate_overdue_days)
reportsRouter.get('/overdue', requireRole('admin', 'staff'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await prisma.$queryRaw`
      SELECT * FROM vw_active_loans_summary
      WHERE loan_urgency = 'OVERDUE'
      ORDER BY overdue_days DESC
    `;
    res.json({ data });
  } catch (err) { next(err); }
});

// GET /api/reports/dashboard — summary counts for admin dashboard
reportsRouter.get('/dashboard', requireRole('admin', 'staff'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [
      equipmentCount,
      activeLoans,
      overdueLoans,
      pendingMaintenance,
      totalAthletes
    ] = await prisma.$transaction([
      prisma.equipment.count(),
      prisma.borrowing_transactions.count({ where: { status: { in: ['active', 'partially_returned'] } } }),
      prisma.borrowing_transactions.count({ where: { status: 'overdue' } }),
      prisma.maintenance_records.count({ where: { status: { in: ['pending', 'in_progress'] } } }),
      prisma.athletes.count()
    ]);

    res.json({
      equipment_total: equipmentCount,
      active_loans: activeLoans,
      overdue_loans: overdueLoans,
      pending_maintenance: pendingMaintenance,
      total_athletes: totalAthletes
    });
  } catch (err) { next(err); }
});

// GET /api/reports/performance — EXPLAIN ANALYZE evidence (admin only)
reportsRouter.get('/performance', requireRole('admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Run EXPLAIN (FORMAT JSON) on the most expensive dashboard query
    const plan = await prisma.$queryRaw`
      EXPLAIN (FORMAT JSON, ANALYZE, BUFFERS)
      SELECT bt.*, u.full_name AS athlete_name
      FROM borrowing_transactions bt
      JOIN athletes ath ON bt.athlete_id = ath.id
      JOIN users u ON ath.user_id = u.id
      WHERE bt.status IN ('active', 'overdue')
      ORDER BY bt.borrow_date DESC
    `;

    const indexStats = await prisma.$queryRaw`
      SELECT
        tablename,
        indexname,
        idx_scan     AS times_used,
        idx_tup_read AS rows_read_via_index
      FROM pg_stat_user_indexes
      WHERE schemaname = 'public'
      ORDER BY idx_scan DESC
      LIMIT 20
    `;

    res.json({ query_plan: plan, index_usage: indexStats });
  } catch (err) { next(err); }
});
