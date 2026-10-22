-- =============================================================================
-- Migration 006: Performance Indexes and Optimization
-- Week: Week 6-7 (Optimization phase)
-- Author: Sam Udtohan (Lead DB Programmer)
-- Description: Adds additional composite and partial indexes beyond the basic
--              FK indexes created in Migrations 001-002. These are the
--              optimization indexes justified by EXPLAIN ANALYZE analysis.
-- Run order: SIXTH — can run anytime after Migration 002
-- =============================================================================

-- ─── COMPOSITE INDEXES ───────────────────────────────────────────────────────

-- Borrowing transactions: common dashboard filter (status + date together)
CREATE INDEX IF NOT EXISTS idx_bt_status_date
    ON borrowing_transactions(status, expected_return_date);

-- Borrowing transactions: athlete + status (student portal filter)
CREATE INDEX IF NOT EXISTS idx_bt_athlete_status
    ON borrowing_transactions(athlete_id, status);

-- Audit logs: table + action (e.g., "show all DELETEs on equipment")
CREATE INDEX IF NOT EXISTS idx_audit_table_action
    ON audit_logs(table_name, action_type);

-- Equipment: sport + status (common equipment list filter)
CREATE INDEX IF NOT EXISTS idx_equipment_sport_status
    ON equipment(sport_id, status);

-- Team members: team + status (active roster queries)
CREATE INDEX IF NOT EXISTS idx_tm_team_status
    ON team_members(team_id, status);

-- ─── PARTIAL INDEXES ─────────────────────────────────────────────────────────
-- Partial indexes only cover rows matching the WHERE clause — much smaller
-- and faster than full indexes for selective queries.

-- Active and overdue loans only (most common dashboard filter)
CREATE INDEX IF NOT EXISTS idx_bt_active_overdue
    ON borrowing_transactions(athlete_id, borrow_date)
    WHERE status IN ('active', 'overdue');

-- Pending maintenance only
CREATE INDEX IF NOT EXISTS idx_maintenance_pending
    ON maintenance_records(equipment_id, scheduled_date)
    WHERE status IN ('pending', 'in_progress');

-- Available equipment only (equipment search)
CREATE INDEX IF NOT EXISTS idx_equipment_available
    ON equipment(sport_id, name)
    WHERE status = 'available' AND available_quantity > 0;

-- Unreturned borrowing items (stock reconciliation)
CREATE INDEX IF NOT EXISTS idx_bi_unreturned
    ON borrowing_items(equipment_id, quantity)
    WHERE return_status IN ('borrowed', 'partial');

-- ─── INDEX VALIDATION QUERY ───────────────────────────────────────────────────
-- Run this after applying to confirm all indexes are present:
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ─── CONFIRM ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '[Migration 006] Performance indexes applied:';
    RAISE NOTICE '  Composite: idx_bt_status_date, idx_bt_athlete_status,';
    RAISE NOTICE '             idx_audit_table_action, idx_equipment_sport_status,';
    RAISE NOTICE '             idx_tm_team_status';
    RAISE NOTICE '  Partial:   idx_bt_active_overdue, idx_maintenance_pending,';
    RAISE NOTICE '             idx_equipment_available, idx_bi_unreturned';
END $$;
