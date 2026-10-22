-- =============================================================================
-- Migration 003: Database Automation — Triggers, Functions, Stored Procedures
-- Week: Week 5 (Code freeze — automation complete)
-- Author: Sam Udtohan (Lead DB Programmer)
-- Description: Adds all PL/pgSQL automation:
--   - fn_get_caller_role()         SECURITY DEFINER helper for RLS
--   - fn_calculate_overdue_days()  IMMUTABLE stored function
--   - log_equipment_audit()        + trigger on equipment
--   - log_borrowing_audit()        + trigger on borrowing_transactions
--   - log_maintenance_audit()      + trigger on maintenance_records
--   - fn_auto_update_stock_on_return() + trigger on borrowing_items
--   - checkout_equipment()         ACID stored procedure (RPC)
--   - return_borrowed_items()      ACID stored procedure (RPC)
-- Run order: THIRD — depends on Migrations 001 and 002
-- =============================================================================

-- ─── HELPER: fn_get_caller_role ──────────────────────────────────────────────
-- Returns the role name of the currently authenticated Supabase user.
-- Used in RLS policies to avoid repeating the join in every policy.
-- SECURITY DEFINER: runs as the function owner, not the calling user.
CREATE OR REPLACE FUNCTION fn_get_caller_role()
RETURNS VARCHAR AS $$
DECLARE
    v_role     VARCHAR;
    v_auth_uid UUID;
BEGIN
    v_auth_uid := auth.uid();
    IF v_auth_uid IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT r.name INTO v_role
    FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.user_auth_id = v_auth_uid
    LIMIT 1;

    RETURN v_role;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── HELPER: fn_get_caller_user_id ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_get_caller_user_id()
RETURNS UUID AS $$
DECLARE v_uid UUID;
BEGIN
    SELECT id INTO v_uid FROM users WHERE user_auth_id = auth.uid() LIMIT 1;
    RETURN v_uid;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ─── STORED FUNCTION: fn_calculate_overdue_days ──────────────────────────────
-- IMMUTABLE: given the same inputs always returns the same output.
-- Used inside vw_active_loans_summary to compute overdue days at the DB layer.
CREATE OR REPLACE FUNCTION fn_calculate_overdue_days(
    p_expected_return_date DATE,
    p_actual_return_date   TIMESTAMPTZ DEFAULT NULL
)
RETURNS INT AS $$
BEGIN
    -- If already returned, not overdue
    IF p_actual_return_date IS NOT NULL THEN
        RETURN 0;
    END IF;
    -- If expected date is in the future, not yet overdue
    IF p_expected_return_date >= CURRENT_DATE THEN
        RETURN 0;
    END IF;
    -- Days overdue
    RETURN (CURRENT_DATE - p_expected_return_date)::INT;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ─── TRIGGER 1: Audit equipment INSERT/UPDATE/DELETE ─────────────────────────
CREATE OR REPLACE FUNCTION log_equipment_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := fn_get_caller_user_id();

    INSERT INTO audit_logs (
        table_name, record_id, action_type,
        old_data, new_data,
        performed_by, performed_by_auth
    ) VALUES (
        'equipment',
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        v_user_id,
        auth.uid()
    );

    -- Also auto-update updated_at timestamp
    IF TG_OP IN ('INSERT', 'UPDATE') THEN
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_equipment_changes ON equipment;
CREATE TRIGGER trg_audit_equipment_changes
    BEFORE INSERT OR UPDATE OR DELETE ON equipment
    FOR EACH ROW EXECUTE FUNCTION log_equipment_audit();

-- ─── TRIGGER 2: Stock auto-replenishment on item return ──────────────────────
-- Fires BEFORE UPDATE on borrowing_items.returned_quantity.
-- Incrementally restores equipment.available_quantity using FOR UPDATE lock.
CREATE OR REPLACE FUNCTION fn_auto_update_stock_on_return()
RETURNS TRIGGER AS $$
DECLARE
    v_delta INT;
BEGIN
    -- Only process if returned_quantity actually changed
    IF NEW.returned_quantity = OLD.returned_quantity THEN
        RETURN NEW;
    END IF;

    v_delta := NEW.returned_quantity - OLD.returned_quantity;

    -- Lock the equipment row to prevent concurrent overselling
    UPDATE equipment
    SET
        available_quantity = LEAST(total_quantity, available_quantity + v_delta),
        status = CASE
            WHEN (available_quantity + v_delta) = 0 THEN 'out_of_stock'
            WHEN (available_quantity + v_delta) <= CEIL(total_quantity * 0.2) THEN 'low_stock'
            ELSE 'available'
        END,
        updated_at = NOW()
    WHERE id = NEW.equipment_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_update_stock_on_return ON borrowing_items;
CREATE TRIGGER trg_auto_update_stock_on_return
    BEFORE UPDATE OF returned_quantity ON borrowing_items
    FOR EACH ROW EXECUTE FUNCTION fn_auto_update_stock_on_return();

-- ─── TRIGGER 3: Audit borrowing_transactions ─────────────────────────────────
CREATE OR REPLACE FUNCTION log_borrowing_transaction_audit()
RETURNS TRIGGER AS $$
DECLARE v_user_id UUID;
BEGIN
    v_user_id := fn_get_caller_user_id();
    INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, performed_by_auth)
    VALUES (
        'borrowing_transactions',
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        v_user_id, auth.uid()
    );
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_borrowing_transaction_changes ON borrowing_transactions;
CREATE TRIGGER trg_audit_borrowing_transaction_changes
    AFTER INSERT OR UPDATE OR DELETE ON borrowing_transactions
    FOR EACH ROW EXECUTE FUNCTION log_borrowing_transaction_audit();

-- ─── TRIGGER 4: Audit maintenance_records ────────────────────────────────────
CREATE OR REPLACE FUNCTION log_maintenance_audit()
RETURNS TRIGGER AS $$
DECLARE v_user_id UUID;
BEGIN
    v_user_id := fn_get_caller_user_id();
    INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, performed_by_auth)
    VALUES (
        'maintenance_records',
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        v_user_id, auth.uid()
    );
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_maintenance_changes ON maintenance_records;
CREATE TRIGGER trg_audit_maintenance_changes
    AFTER INSERT OR UPDATE OR DELETE ON maintenance_records
    FOR EACH ROW EXECUTE FUNCTION log_maintenance_audit();

-- ─── STORED PROCEDURE 1: checkout_equipment ──────────────────────────────────
-- Full ACID checkout with pessimistic locking.
-- p_items format: [{"equipment_id": "uuid", "quantity": 3, "condition": "good"}]
CREATE OR REPLACE FUNCTION checkout_equipment(
    p_athlete_id    UUID,
    p_items         JSONB,
    p_expected_return DATE,
    p_approved_by   UUID DEFAULT NULL,
    p_remarks       TEXT DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, message TEXT, items_processed INT) AS $$
DECLARE
    v_tx_id         UUID;
    v_item          JSONB;
    v_eq_id         UUID;
    v_qty           INT;
    v_available     INT;
    v_eq_name       VARCHAR;
    v_items_count   INT := 0;
BEGIN
    -- Validate role: only admin or staff can checkout
    IF fn_get_caller_role() NOT IN ('admin', 'staff') THEN
        RAISE EXCEPTION 'RBAC VIOLATION: checkout_equipment requires admin or staff role. Caller role: %',
            COALESCE(fn_get_caller_role(), 'unauthenticated');
    END IF;

    -- Validate expected return date
    IF p_expected_return <= CURRENT_DATE THEN
        RAISE EXCEPTION 'INVALID DATE: Expected return date must be in the future (provided: %)', p_expected_return;
    END IF;

    -- Validate athlete exists
    IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_athlete_id) THEN
        RAISE EXCEPTION 'ATHLETE NOT FOUND: No athlete record for ID %', p_athlete_id;
    END IF;

    -- Create transaction header
    INSERT INTO borrowing_transactions (athlete_id, approved_by, expected_return_date, status, remarks)
    VALUES (p_athlete_id, p_approved_by, p_expected_return, 'active', p_remarks)
    RETURNING id INTO v_tx_id;

    -- Process each item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_eq_id := (v_item->>'equipment_id')::UUID;
        v_qty   := (v_item->>'quantity')::INT;

        -- Pessimistic lock: prevents concurrent overselling
        SELECT available_quantity, name
        INTO v_available, v_eq_name
        FROM equipment
        WHERE id = v_eq_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'EQUIPMENT NOT FOUND: No equipment record for ID %', v_eq_id;
        END IF;

        IF v_available < v_qty THEN
            RAISE EXCEPTION 'INSUFFICIENT STOCK: "%" has % available, requested %',
                v_eq_name, v_available, v_qty;
        END IF;

        -- Decrement stock
        UPDATE equipment
        SET
            available_quantity = available_quantity - v_qty,
            status = CASE
                WHEN (available_quantity - v_qty) = 0 THEN 'out_of_stock'
                WHEN (available_quantity - v_qty) <= CEIL(total_quantity * 0.2) THEN 'low_stock'
                ELSE 'available'
            END,
            updated_at = NOW()
        WHERE id = v_eq_id;

        -- Insert borrowing item
        INSERT INTO borrowing_items (transaction_id, equipment_id, quantity, condition_before)
        VALUES (v_tx_id, v_eq_id, v_qty, COALESCE(v_item->>'condition', 'good'));

        v_items_count := v_items_count + 1;
    END LOOP;

    RETURN QUERY SELECT TRUE, v_tx_id,
        format('Checkout successful. %s item(s) processed.', v_items_count),
        v_items_count;

EXCEPTION WHEN OTHERS THEN
    -- Transaction rolls back automatically
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── STORED PROCEDURE 2: return_borrowed_items ───────────────────────────────
-- p_items format: [{"item_id": "uuid", "returned_quantity": 2, "condition_after": "fair"}]
CREATE OR REPLACE FUNCTION return_borrowed_items(
    p_transaction_id UUID,
    p_items          JSONB,
    p_received_by    UUID DEFAULT NULL
)
RETURNS TABLE(success BOOLEAN, transaction_id UUID, status TEXT, message TEXT) AS $$
DECLARE
    v_item          JSONB;
    v_item_id       UUID;
    v_qty_returned  INT;
    v_total_qty     INT;
    v_total_returned INT;
    v_tx_status     VARCHAR(30);
BEGIN
    -- Role check
    IF fn_get_caller_role() NOT IN ('admin', 'staff') THEN
        RAISE EXCEPTION 'RBAC VIOLATION: return_borrowed_items requires admin or staff role.';
    END IF;

    -- Validate transaction exists and is returnable
    IF NOT EXISTS (
        SELECT 1 FROM borrowing_transactions
        WHERE id = p_transaction_id AND status IN ('active', 'overdue', 'partially_returned')
    ) THEN
        RAISE EXCEPTION 'INVALID TRANSACTION: Transaction % is not in a returnable state.', p_transaction_id;
    END IF;

    -- Process each item return
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id      := (v_item->>'item_id')::UUID;
        v_qty_returned := (v_item->>'returned_quantity')::INT;

        -- Update returned_quantity — the trg_auto_update_stock_on_return trigger
        -- fires automatically here and restores equipment.available_quantity
        UPDATE borrowing_items
        SET
            returned_quantity = v_qty_returned,
            condition_after   = COALESCE(v_item->>'condition_after', condition_after),
            return_status     = CASE
                WHEN v_qty_returned >= quantity THEN 'returned'
                WHEN v_qty_returned > 0         THEN 'partial'
                ELSE return_status
            END
        WHERE id = v_item_id AND transaction_id = p_transaction_id;
    END LOOP;

    -- Determine overall transaction return status
    SELECT
        SUM(quantity), SUM(returned_quantity)
    INTO v_total_qty, v_total_returned
    FROM borrowing_items
    WHERE transaction_id = p_transaction_id;

    v_tx_status := CASE
        WHEN v_total_returned >= v_total_qty THEN 'returned'
        WHEN v_total_returned > 0            THEN 'partially_returned'
        ELSE 'active'
    END;

    UPDATE borrowing_transactions
    SET
        status             = v_tx_status,
        actual_return_date = CASE WHEN v_tx_status = 'returned' THEN NOW() ELSE NULL END
    WHERE id = p_transaction_id;

    RETURN QUERY SELECT TRUE, p_transaction_id, v_tx_status::TEXT,
        format('Return processed. Transaction status: %s', v_tx_status);

EXCEPTION WHEN OTHERS THEN
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── CONFIRM ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '[Migration 003] Database automation objects created:';
    RAISE NOTICE '  Functions: fn_get_caller_role, fn_get_caller_user_id, fn_calculate_overdue_days';
    RAISE NOTICE '  Triggers (4): equipment audit, borrowing_transactions audit,';
    RAISE NOTICE '                maintenance audit, auto stock replenishment';
    RAISE NOTICE '  Stored Procedures (2): checkout_equipment, return_borrowed_items';
END $$;
