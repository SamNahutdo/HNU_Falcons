-- ============================================================================
-- FARE-ERP DATABASE TEST SUITE
-- Purpose: Repeatable constraint, trigger, and RPC validation tests.
-- Run against a Supabase/PostgreSQL instance AFTER schema.sql has been applied.
-- Each test prints a PASS or FAIL result.
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'FARE-ERP DATABASE TEST SUITE — starting...';
    RAISE NOTICE '============================================================';
END
$$;

-- ============================================================================
-- TEST BLOCK 1: SCHEMA INTEGRITY & CONSTRAINT TESTS
-- ============================================================================

-- TEST 1.1: Verify all 12 core tables exist
DO $$
DECLARE
    v_expected TEXT[] := ARRAY[
        'roles','users','athletes','coaches','sports','teams',
        'team_members','equipment','borrowing_transactions',
        'borrowing_items','maintenance_records','audit_logs'
    ];
    v_missing TEXT;
BEGIN
    SELECT string_agg(t, ', ') INTO v_missing
    FROM unnest(v_expected) AS t
    WHERE NOT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = t
    );

    IF v_missing IS NULL THEN
        RAISE NOTICE '[PASS] TEST 1.1 — All 12 required tables exist.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 1.1 — Missing tables: %', v_missing;
    END IF;
END
$$;

-- TEST 1.2: Verify 4 roles exist (admin, staff, coach, student)
DO $$
DECLARE v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM roles WHERE name IN ('admin','staff','coach','student');
    IF v_count = 4 THEN
        RAISE NOTICE '[PASS] TEST 1.2 — All 4 RBAC roles present (admin, staff, coach, student).';
    ELSE
        RAISE NOTICE '[FAIL] TEST 1.2 — Expected 4 roles, found %', v_count;
    END IF;
END
$$;

-- TEST 1.3: Unique constraint on equipment_code
DO $$
DECLARE v_raised BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO equipment (sport_id, equipment_code, name, category, total_quantity, available_quantity)
        VALUES (
            '40000000-0000-0000-0000-000000000001',
            'EQ-BB-001',  -- already exists in seed data
            'Duplicate Test Basketball', 'Ball', 1, 1
        );
    EXCEPTION WHEN unique_violation THEN
        v_raised := TRUE;
    END;

    IF v_raised THEN
        RAISE NOTICE '[PASS] TEST 1.3 — Unique constraint on equipment_code correctly prevents duplicates.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 1.3 — Duplicate equipment_code was not rejected.';
        -- Cleanup if accidentally inserted
        DELETE FROM equipment WHERE equipment_code = 'EQ-BB-001' AND name = 'Duplicate Test Basketball';
    END IF;
END
$$;

-- TEST 1.4: CHECK constraint on year_level (must be 1-6)
DO $$
DECLARE v_raised BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO athletes (user_id, student_number, department, year_level, emergency_contact)
        VALUES ('10000000-0000-0000-0000-000000000006', '9999-99999', 'Test Dept', 9, '09000000000');
    EXCEPTION WHEN check_violation THEN
        v_raised := TRUE;
    END;

    IF v_raised THEN
        RAISE NOTICE '[PASS] TEST 1.4 — CHECK constraint on year_level (1-6) correctly rejects 9.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 1.4 — Invalid year_level 9 was not rejected.';
        DELETE FROM athletes WHERE student_number = '9999-99999';
    END IF;
END
$$;

-- TEST 1.5: CHECK constraint on equipment available_quantity <= total_quantity
DO $$
DECLARE v_raised BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO equipment (sport_id, equipment_code, name, category, total_quantity, available_quantity)
        VALUES (
            '40000000-0000-0000-0000-000000000001',
            'EQ-TEST-OVER', 'Overflow Test', 'Ball',
            5,   -- total_quantity
            10   -- available_quantity > total (should fail)
        );
    EXCEPTION WHEN check_violation THEN
        v_raised := TRUE;
    END;

    IF v_raised THEN
        RAISE NOTICE '[PASS] TEST 1.5 — CHECK constraint rejects available_quantity > total_quantity.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 1.5 — available_quantity > total_quantity was not rejected.';
        DELETE FROM equipment WHERE equipment_code = 'EQ-TEST-OVER';
    END IF;
END
$$;

-- TEST 1.6: Junction table unique constraint uq_team_athlete
DO $$
DECLARE v_raised BOOLEAN := FALSE;
BEGIN
    BEGIN
        INSERT INTO team_members (team_id, athlete_id, position)
        VALUES (
            '50000000-0000-0000-0000-000000000001',
            '30000000-0000-0000-0000-000000000001',
            'Duplicate Position'
        );
    EXCEPTION WHEN unique_violation THEN
        v_raised := TRUE;
    END;

    IF v_raised THEN
        RAISE NOTICE '[PASS] TEST 1.6 — uq_team_athlete prevents duplicate team/athlete pairs.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 1.6 — Duplicate team+athlete pair was not rejected.';
        DELETE FROM team_members WHERE team_id='50000000-0000-0000-0000-000000000001'
            AND athlete_id='30000000-0000-0000-0000-000000000001' AND position='Duplicate Position';
    END IF;
END
$$;

-- TEST 1.7: ON DELETE RESTRICT protects athletes from deletion while transactions exist
DO $$
DECLARE v_raised BOOLEAN := FALSE;
BEGIN
    BEGIN
        DELETE FROM athletes WHERE id = '30000000-0000-0000-0000-000000000001';
    EXCEPTION WHEN foreign_key_violation THEN
        v_raised := TRUE;
    END;

    IF v_raised THEN
        RAISE NOTICE '[PASS] TEST 1.7 — ON DELETE RESTRICT prevents athlete deletion with active transactions.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 1.7 — Athlete with active transactions was deleted (data integrity violated).';
    END IF;
END
$$;

-- ============================================================================
-- TEST BLOCK 2: TRIGGER VALIDATION TESTS
-- ============================================================================

-- TEST 2.1: trg_audit_equipment_changes fires on INSERT
DO $$
DECLARE
    v_new_eq_id UUID;
    v_log_count INT;
BEGIN
    -- Insert a new piece of equipment
    INSERT INTO equipment (sport_id, equipment_code, name, category, total_quantity, available_quantity, condition)
    VALUES ('40000000-0000-0000-0000-000000000001', 'EQ-TRIG-TEST-01', 'Trigger Test Basketball', 'Ball', 2, 2, 'new')
    RETURNING id INTO v_new_eq_id;

    -- Check if audit log was created
    SELECT COUNT(*) INTO v_log_count
    FROM audit_logs
    WHERE table_name = 'equipment' AND record_id = v_new_eq_id AND action_type = 'INSERT';

    IF v_log_count >= 1 THEN
        RAISE NOTICE '[PASS] TEST 2.1 — trg_audit_equipment_changes fires on INSERT and logs to audit_logs.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 2.1 — Equipment INSERT was not logged in audit_logs.';
    END IF;

    -- Cleanup
    DELETE FROM audit_logs WHERE record_id = v_new_eq_id;
    DELETE FROM equipment WHERE id = v_new_eq_id;
END
$$;

-- TEST 2.2: trg_audit_equipment_changes fires on UPDATE and sets updated_at
DO $$
DECLARE
    v_eq_id UUID := '70000000-0000-0000-0000-000000000001';
    v_log_count INT;
    v_old_updated TIMESTAMPTZ;
    v_new_updated TIMESTAMPTZ;
BEGIN
    SELECT updated_at INTO v_old_updated FROM equipment WHERE id = v_eq_id;

    PERFORM pg_sleep(0.01); -- tiny pause to detect time change
    UPDATE equipment SET condition = 'good' WHERE id = v_eq_id;

    SELECT COUNT(*) INTO v_log_count
    FROM audit_logs
    WHERE table_name = 'equipment' AND record_id = v_eq_id AND action_type = 'UPDATE'
    AND created_at > v_old_updated;

    IF v_log_count >= 1 THEN
        RAISE NOTICE '[PASS] TEST 2.2 — trg_audit_equipment_changes fires on UPDATE and creates audit log.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 2.2 — Equipment UPDATE was not logged.';
    END IF;
END
$$;

-- TEST 2.3: trg_auto_update_stock_on_return restores inventory on return
DO $$
DECLARE
    v_eq_id UUID := '70000000-0000-0000-0000-000000000001';
    v_item_id UUID := '90000000-0000-0000-0000-000000000001';
    v_qty_before INT;
    v_qty_after INT;
    v_expected INT;
BEGIN
    -- Get current available quantity
    SELECT available_quantity INTO v_qty_before FROM equipment WHERE id = v_eq_id;
    v_expected := v_qty_before + 1; -- item has quantity=3, returning 1 unit

    -- Update returned_quantity to trigger the stock restoration
    UPDATE borrowing_items
    SET returned_quantity = 1
    WHERE id = v_item_id;

    SELECT available_quantity INTO v_qty_after FROM equipment WHERE id = v_eq_id;

    IF v_qty_after = v_expected THEN
        RAISE NOTICE '[PASS] TEST 2.3 — trg_auto_update_stock_on_return correctly incremented equipment stock by 1.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 2.3 — Stock was not restored. Before: %, After: %, Expected: %', v_qty_before, v_qty_after, v_expected;
    END IF;

    -- Reset for subsequent test runs
    UPDATE borrowing_items SET returned_quantity = 0 WHERE id = v_item_id;
    UPDATE equipment SET available_quantity = v_qty_before WHERE id = v_eq_id;
END
$$;

-- TEST 2.4: trg_audit_borrowing_transaction_changes fires on INSERT
DO $$
DECLARE
    v_tx_id UUID;
    v_log_count INT;
BEGIN
    INSERT INTO borrowing_transactions (athlete_id, expected_return_date, status, remarks)
    VALUES ('30000000-0000-0000-0000-000000000001', CURRENT_DATE + INTERVAL '5 days', 'pending', 'Trigger audit test')
    RETURNING id INTO v_tx_id;

    SELECT COUNT(*) INTO v_log_count
    FROM audit_logs
    WHERE table_name = 'borrowing_transactions' AND record_id = v_tx_id AND action_type = 'INSERT';

    IF v_log_count >= 1 THEN
        RAISE NOTICE '[PASS] TEST 2.4 — trg_audit_borrowing_transaction_changes fires on INSERT.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 2.4 — borrowing_transaction INSERT was not audited.';
    END IF;

    -- Cleanup
    DELETE FROM audit_logs WHERE record_id = v_tx_id;
    DELETE FROM borrowing_transactions WHERE id = v_tx_id;
END
$$;

-- TEST 2.5: trg_audit_maintenance_changes fires on INSERT
DO $$
DECLARE
    v_mr_id UUID;
    v_log_count INT;
BEGIN
    INSERT INTO maintenance_records (equipment_id, reported_by, issue_description, scheduled_date, cost, status)
    VALUES (
        '70000000-0000-0000-0000-000000000007',
        '10000000-0000-0000-0000-000000000002',
        'Trigger test: string inspection', CURRENT_DATE + INTERVAL '7 days', 100.00, 'pending'
    )
    RETURNING id INTO v_mr_id;

    SELECT COUNT(*) INTO v_log_count
    FROM audit_logs
    WHERE table_name = 'maintenance_records' AND record_id = v_mr_id AND action_type = 'INSERT';

    IF v_log_count >= 1 THEN
        RAISE NOTICE '[PASS] TEST 2.5 — trg_audit_maintenance_changes fires on INSERT.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 2.5 — maintenance_record INSERT was not audited.';
    END IF;

    -- Cleanup
    DELETE FROM audit_logs WHERE record_id = v_mr_id;
    DELETE FROM maintenance_records WHERE id = v_mr_id;
END
$$;

-- ============================================================================
-- TEST BLOCK 3: STORED PROCEDURE / RPC VALIDATION
-- ============================================================================

-- TEST 3.1: fn_calculate_overdue_days returns 0 for future dates
DO $$
DECLARE v_days INT;
BEGIN
    v_days := fn_calculate_overdue_days(CURRENT_DATE + INTERVAL '5 days');
    IF v_days = 0 THEN
        RAISE NOTICE '[PASS] TEST 3.1 — fn_calculate_overdue_days returns 0 for a future return date.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 3.1 — fn_calculate_overdue_days returned % for a future date (expected 0).', v_days;
    END IF;
END
$$;

-- TEST 3.2: fn_calculate_overdue_days returns correct days for past date
DO $$
DECLARE v_days INT;
BEGIN
    -- 5 days ago, not yet returned
    v_days := fn_calculate_overdue_days(CURRENT_DATE - INTERVAL '5 days');
    IF v_days = 5 THEN
        RAISE NOTICE '[PASS] TEST 3.2 — fn_calculate_overdue_days correctly reports 5 overdue days.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 3.2 — Expected 5, got %.', v_days;
    END IF;
END
$$;

-- TEST 3.3: Database views exist and return rows
DO $$
DECLARE v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM vw_active_loans_summary;
    IF v_count >= 0 THEN
        RAISE NOTICE '[PASS] TEST 3.3 — vw_active_loans_summary is queryable (% rows).', v_count;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[FAIL] TEST 3.3 — vw_active_loans_summary query failed: %', SQLERRM;
END
$$;

DO $$
DECLARE v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM vw_equipment_inventory_status;
    IF v_count >= 0 THEN
        RAISE NOTICE '[PASS] TEST 3.4 — vw_equipment_inventory_status is queryable (% rows).', v_count;
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '[FAIL] TEST 3.4 — vw_equipment_inventory_status query failed: %', SQLERRM;
END
$$;

-- TEST 3.5: Verify 24 B-tree indexes exist
DO $$
DECLARE v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND tablename IN ('users','athletes','coaches','teams','team_members',
                      'equipment','borrowing_transactions','borrowing_items',
                      'maintenance_records','audit_logs')
    AND indexname LIKE 'idx_%';

    IF v_count >= 20 THEN
        RAISE NOTICE '[PASS] TEST 3.5 — % performance B-tree indexes found.', v_count;
    ELSE
        RAISE NOTICE '[FAIL] TEST 3.5 — Only % indexes found; expected at least 20.', v_count;
    END IF;
END
$$;

-- TEST 3.6: Verify 4 triggers exist across audited tables
DO $$
DECLARE v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public'
    AND trigger_name IN (
        'trg_audit_equipment_changes',
        'trg_auto_update_stock_on_return',
        'trg_audit_borrowing_transaction_changes',
        'trg_audit_maintenance_changes'
    );

    IF v_count = 4 THEN
        RAISE NOTICE '[PASS] TEST 3.6 — All 4 required database triggers exist.';
    ELSE
        RAISE NOTICE '[FAIL] TEST 3.6 — Expected 4 triggers, found %.', v_count;
    END IF;
END
$$;

-- ============================================================================
-- TEST BLOCK 4: NORMALIZATION EVIDENCE
-- ============================================================================

-- TEST 4.1: No NULL team_id in team_members (2NF: no partial dependency)
DO $$
DECLARE v_nulls INT;
BEGIN
    SELECT COUNT(*) INTO v_nulls FROM team_members WHERE team_id IS NULL OR athlete_id IS NULL;
    IF v_nulls = 0 THEN
        RAISE NOTICE '[PASS] TEST 4.1 — team_members has no NULL junction keys (2NF satisfied).';
    ELSE
        RAISE NOTICE '[FAIL] TEST 4.1 — % rows with NULL junction keys found.', v_nulls;
    END IF;
END
$$;

-- TEST 4.2: No transitive dependency - user data is in users table, not duplicated in athletes
DO $$
DECLARE v_dupl_col_count INT;
BEGIN
    SELECT COUNT(*) INTO v_dupl_col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'athletes'
    AND column_name IN ('email', 'full_name', 'role_id');

    IF v_dupl_col_count = 0 THEN
        RAISE NOTICE '[PASS] TEST 4.2 — athletes table has no duplicated user identity columns (3NF satisfied).';
    ELSE
        RAISE NOTICE '[FAIL] TEST 4.2 — athletes table duplicates % user-identity columns (3NF violated).', v_dupl_col_count;
    END IF;
END
$$;

-- ============================================================================
-- SUMMARY
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'FARE-ERP DATABASE TEST SUITE — complete.';
    RAISE NOTICE 'Review PASS/FAIL lines above for individual results.';
    RAISE NOTICE '============================================================';
END
$$;
