-- ============================================================================
-- FARE-ERP PERFORMANCE REPORT
-- Purpose: EXPLAIN ANALYZE queries demonstrating index usage and query plans.
-- Run AFTER schema.sql + seed data has been applied.
-- These queries prove that B-tree indexes are utilized for high-traffic paths.
-- ============================================================================

-- ============================================================================
-- SECTION 1: BORROWING TRANSACTION QUERIES (most frequent dashboard path)
-- ============================================================================

-- PR-01: Fetch all active/overdue transactions for the dashboard summary
-- EXPECTED PLAN: Index Scan using idx_borrowing_transactions_status
EXPLAIN ANALYZE
SELECT bt.*, u.full_name AS athlete_name
FROM borrowing_transactions bt
JOIN athletes ath ON bt.athlete_id = ath.id
JOIN users u ON ath.user_id = u.id
WHERE bt.status IN ('active', 'overdue')
ORDER BY bt.borrow_date DESC;

-- PR-02: Lookup a specific athlete's transactions (student portal)
-- EXPECTED PLAN: Index Scan using idx_borrowing_transactions_athlete
EXPLAIN ANALYZE
SELECT bt.*, bi.quantity, bi.returned_quantity, e.name AS equipment_name
FROM borrowing_transactions bt
JOIN borrowing_items bi ON bt.id = bi.transaction_id
JOIN equipment e ON bi.equipment_id = e.id
WHERE bt.athlete_id = '30000000-0000-0000-0000-000000000001'
ORDER BY bt.borrow_date DESC;

-- PR-03: Overdue detection query (fn_calculate_overdue_days via view)
-- EXPECTED PLAN: Index Scan on borrowing_transactions date index
EXPLAIN ANALYZE
SELECT * FROM vw_active_loans_summary
WHERE loan_urgency = 'OVERDUE';

-- ============================================================================
-- SECTION 2: EQUIPMENT INVENTORY QUERIES
-- ============================================================================

-- PR-04: Equipment lookup by sport (common filter in equipment page)
-- EXPECTED PLAN: Index Scan using idx_equipment_sport_id
EXPLAIN ANALYZE
SELECT e.*, s.name AS sport_name
FROM equipment e
JOIN sports s ON e.sport_id = s.id
WHERE e.sport_id = '40000000-0000-0000-0000-000000000001'
ORDER BY e.name;

-- PR-05: Low-stock / out-of-stock status filter (inventory alert panel)
-- EXPECTED PLAN: Bitmap Index Scan using idx_equipment_status
EXPLAIN ANALYZE
SELECT e.equipment_code, e.name, e.available_quantity, e.total_quantity, e.status
FROM equipment e
WHERE e.status IN ('low_stock', 'out_of_stock')
ORDER BY e.available_quantity ASC;

-- PR-06: Equipment inventory view with utilization rates
-- EXPECTED PLAN: Hash Join with index scans on equipment and sports
EXPLAIN ANALYZE
SELECT * FROM vw_equipment_inventory_status
ORDER BY utilization_rate_pct DESC;

-- PR-07: Equipment code lookup (unique index, extremely fast)
-- EXPECTED PLAN: Index Scan using idx_equipment_code (unique)
EXPLAIN ANALYZE
SELECT * FROM equipment WHERE equipment_code = 'EQ-BB-001';

-- ============================================================================
-- SECTION 3: TEAM & ATHLETE QUERIES
-- ============================================================================

-- PR-08: Active team members for a specific team
-- EXPECTED PLAN: Index Scan using idx_team_members_team_id + idx_team_members_status
EXPLAIN ANALYZE
SELECT tm.*, u.full_name, ath.student_number, ath.department
FROM team_members tm
JOIN athletes ath ON tm.athlete_id = ath.id
JOIN users u ON ath.user_id = u.id
WHERE tm.team_id = '50000000-0000-0000-0000-000000000001'
  AND tm.status = 'active';

-- PR-09: Find teams by sport (coach team lookup)
-- EXPECTED PLAN: Index Scan using idx_teams_sport_id
EXPLAIN ANALYZE
SELECT t.*, s.name AS sport_name, u.full_name AS coach_name
FROM teams t
JOIN sports s ON t.sport_id = s.id
JOIN coaches c ON t.coach_id = c.id
JOIN users u ON c.user_id = u.id
WHERE t.sport_id = '40000000-0000-0000-0000-000000000001';

-- PR-10: Athlete lookup by student_number (unique index)
-- EXPECTED PLAN: Index Scan using idx_athletes_student_number (unique)
EXPLAIN ANALYZE
SELECT a.*, u.full_name, u.email
FROM athletes a
JOIN users u ON a.user_id = u.id
WHERE a.student_number = '2023-10892';

-- ============================================================================
-- SECTION 4: AUDIT LOG QUERIES
-- ============================================================================

-- PR-11: Recent audit log entries (most recent 50 actions)
-- EXPECTED PLAN: Index Scan using idx_audit_logs_created_at (DESC)
EXPLAIN ANALYZE
SELECT al.*, u.full_name AS actor
FROM audit_logs al
LEFT JOIN users u ON al.performed_by = u.id
ORDER BY al.created_at DESC
LIMIT 50;

-- PR-12: Audit log for a specific equipment record
-- EXPECTED PLAN: Index Scan using idx_audit_logs_table_record (composite)
EXPLAIN ANALYZE
SELECT * FROM audit_logs
WHERE table_name = 'equipment'
  AND record_id = '70000000-0000-0000-0000-000000000001'
ORDER BY created_at DESC;

-- PR-13: Maintenance records for active jobs
-- EXPECTED PLAN: Index Scan using idx_maintenance_status
EXPLAIN ANALYZE
SELECT mr.*, e.name AS equipment_name, u.full_name AS reporter_name
FROM maintenance_records mr
JOIN equipment e ON mr.equipment_id = e.id
JOIN users u ON mr.reported_by = u.id
WHERE mr.status IN ('pending', 'in_progress')
ORDER BY mr.scheduled_date ASC;

-- ============================================================================
-- SECTION 5: USER AUTHENTICATION QUERY
-- ============================================================================

-- PR-14: User lookup by auth.uid (used in RLS policy evaluation)
-- EXPECTED PLAN: Index Scan using idx_users_auth_id
EXPLAIN ANALYZE
SELECT u.id, u.full_name, u.email, u.status, r.name AS role_name
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.user_auth_id = '00000000-0000-0000-0000-000000000000'::UUID;  -- replace with real auth UID

-- ============================================================================
-- SECTION 6: CONCURRENT CHECKOUT SIMULATION
-- ============================================================================
-- The following demonstrates the row-level lock behavior of checkout_equipment.
-- In a real concurrent test, run these two transactions simultaneously in two sessions:
--
-- Session A (runs first):
--   BEGIN;
--   SELECT checkout_equipment(
--     '30000000-0000-0000-0000-000000000001'::UUID,
--     '[{"equipment_id":"70000000-0000-0000-0000-000000000001","quantity":1}]'::JSONB,
--     CURRENT_DATE + INTERVAL '3 days'
--   );
--   -- Hold transaction open for a moment...
--   COMMIT;
--
-- Session B (runs while A holds the lock):
--   BEGIN;
--   SELECT checkout_equipment(
--     '30000000-0000-0000-0000-000000000002'::UUID,
--     '[{"equipment_id":"70000000-0000-0000-0000-000000000001","quantity":25}]'::JSONB,
--     CURRENT_DATE + INTERVAL '3 days'
--   );
--   -- Session B will BLOCK until A commits. After A commits, stock is depleted,
--   -- so B will get: ERROR: Insufficient stock for "Molten BG5000 Official FIBA Basketball"
--   ROLLBACK;
--
-- This demonstrates pessimistic locking preventing overselling.

-- ============================================================================
-- SECTION 7: INDEX USAGE STATISTICS (run after real workload)
-- ============================================================================
-- These queries show how many times each index has been used since last reset.
-- They provide empirical evidence of performance optimization.
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan     AS "Times Used",
    idx_tup_read AS "Rows Read via Index",
    idx_tup_fetch AS "Rows Fetched"
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- Table sequential vs index scan comparison
SELECT
    relname AS "Table",
    seq_scan AS "Sequential Scans",
    idx_scan AS "Index Scans",
    CASE
        WHEN seq_scan + idx_scan = 0 THEN 'No Queries'
        ELSE ROUND(idx_scan::NUMERIC / (seq_scan + idx_scan) * 100, 1)::TEXT || '%'
    END AS "Index Usage Rate"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY seq_scan DESC;
