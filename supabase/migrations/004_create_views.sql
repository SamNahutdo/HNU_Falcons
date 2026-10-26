-- =============================================================================
-- Migration 004: Reporting Views
-- Week: Week 5 (Code freeze)
-- Author: Sam Udtohan (Lead DB Programmer)
-- Description: Creates the two analytical reporting views.
--   - vw_active_loans_summary: Uses fn_calculate_overdue_days() to compute
--     overdue days at the database layer (not in the application).
--   - vw_equipment_inventory_status: Aggregates inventory utilization rates.
-- Run order: FOURTH — depends on Migration 003 (fn_calculate_overdue_days)
-- =============================================================================

-- ─── VIEW 1: vw_active_loans_summary ─────────────────────────────────────────
-- Used by: admin dashboard, overdue alert panel, /api/reports/overdue endpoint
-- Provides: active loan details, overdue day count, urgency label
CREATE OR REPLACE VIEW vw_active_loans_summary WITH (security_invoker = true) AS
SELECT
    bt.id                                           AS transaction_id,
    bt.borrow_date,
    bt.expected_return_date,
    bt.actual_return_date,
    bt.status,
    bt.remarks,

    -- Athlete information
    u.full_name                                     AS athlete_name,
    u.school_id                                     AS athlete_school_id,
    a.student_number,
    a.department,

    -- Approver
    approver.full_name                              AS approved_by_name,

    -- Item summary
    COUNT(bi.id)                                    AS total_item_types,
    SUM(bi.quantity)                                AS total_units_borrowed,
    SUM(bi.returned_quantity)                       AS total_units_returned,
    SUM(bi.quantity) - SUM(bi.returned_quantity)    AS total_units_outstanding,

    -- Overdue calculation using IMMUTABLE stored function
    fn_calculate_overdue_days(
        bt.expected_return_date,
        bt.actual_return_date
    )                                               AS overdue_days,

    -- Urgency classification (computed at DB layer)
    CASE
        WHEN bt.actual_return_date IS NOT NULL THEN 'Returned on Time'
        WHEN fn_calculate_overdue_days(bt.expected_return_date, bt.actual_return_date) > 0
            THEN 'OVERDUE'
        ELSE 'Active / On Schedule'
    END                                             AS loan_urgency

FROM borrowing_transactions bt
JOIN athletes a ON bt.athlete_id = a.id
JOIN users u    ON a.user_id = u.id
LEFT JOIN users approver ON bt.approved_by = approver.id
LEFT JOIN borrowing_items bi ON bt.id = bi.transaction_id
WHERE bt.status IN ('active', 'overdue', 'partially_returned', 'returned')
GROUP BY
    bt.id, bt.borrow_date, bt.expected_return_date, bt.actual_return_date,
    bt.status, bt.remarks,
    u.full_name, u.school_id, a.student_number, a.department,
    approver.full_name;

-- ─── VIEW 2: vw_equipment_inventory_status ───────────────────────────────────
-- Used by: equipment dashboard, inventory alerts, /api/reports/inventory endpoint
-- Provides: utilization rates, active loan count, maintenance count, health label
CREATE OR REPLACE VIEW vw_equipment_inventory_status WITH (security_invoker = true) AS
SELECT
    e.id                                            AS equipment_id,
    e.equipment_code,
    e.name                                          AS equipment_name,
    e.category,
    e.condition,
    e.status,
    e.total_quantity,
    e.available_quantity,
    (e.total_quantity - e.available_quantity)       AS units_on_loan,

    -- Utilization rate: percentage of stock currently loaned out
    CASE
        WHEN e.total_quantity = 0 THEN 0
        ELSE ROUND(
            ((e.total_quantity - e.available_quantity)::NUMERIC / e.total_quantity) * 100,
            1
        )
    END                                             AS utilization_rate_pct,

    -- Sport association
    s.name                                          AS sport_name,
    s.category                                      AS sport_category,

    -- Active loan count
    COUNT(DISTINCT bi.transaction_id)               AS active_loan_count,

    -- Pending maintenance count
    COUNT(DISTINCT mr.id) FILTER (
        WHERE mr.status IN ('pending', 'in_progress')
    )                                               AS pending_maintenance_count,

    -- Stock health label
    CASE
        WHEN e.status = 'retired'             THEN 'Retired'
        WHEN e.status = 'under_maintenance'   THEN 'Under Maintenance'
        WHEN e.available_quantity = 0         THEN 'Out of Stock'
        WHEN e.available_quantity <= CEIL(e.total_quantity * 0.2) THEN 'Low Stock'
        ELSE 'Healthy'
    END                                             AS stock_health

FROM equipment e
JOIN sports s ON e.sport_id = s.id
LEFT JOIN borrowing_items bi ON e.id = bi.equipment_id
    AND bi.return_status IN ('borrowed', 'partial')
LEFT JOIN maintenance_records mr ON e.id = mr.equipment_id
GROUP BY
    e.id, e.equipment_code, e.name, e.category, e.condition, e.status,
    e.total_quantity, e.available_quantity, s.name, s.category;

-- ─── CONFIRM ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '[Migration 004] Reporting views created:';
    RAISE NOTICE '  vw_active_loans_summary — uses fn_calculate_overdue_days()';
    RAISE NOTICE '  vw_equipment_inventory_status — utilization rates and stock health';
END $$;
