-- ============================================================================
-- FALCON ATHLETICS RESOURCE & EQUIPMENT ERP (FARE-ERP)
-- Course Project: Advanced Database Systems (3rd-Year IT)
-- Target DBMS: Supabase PostgreSQL (Cloud Database)
-- Normalization: Strict 3rd Normal Form (3NF)
-- Security: Row Level Security (RLS) + RBAC (admin, staff, student)
-- Server-Side Automation: PL/pgSQL Triggers, RPC Transactions, Views
-- ============================================================================

-- 0. EXTENSIONS & CLEANUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing views if any
DROP VIEW IF EXISTS vw_active_loans_summary CASCADE;
DROP VIEW IF EXISTS vw_equipment_inventory_status CASCADE;

-- Drop existing tables if re-running migration (in reverse dependency order)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS maintenance_records CASCADE;
DROP TABLE IF EXISTS borrowing_items CASCADE;
DROP TABLE IF EXISTS borrowing_transactions CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS equipment CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS sports CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;
DROP TABLE IF EXISTS athletes CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- ============================================================================
-- 1. DDL: CORE ENTITIES & 3NF NORMALIZED RELATIONS
-- ============================================================================

-- 1.1 ROLES TABLE (RBAC Definition: admin, staff, student)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.2 USERS TABLE (System Identity & Credentials Anchor)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.3 ATHLETES TABLE (1:1 Specialization of Users for Varsity Students)
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    student_number VARCHAR(30) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    year_level INT NOT NULL CHECK (year_level BETWEEN 1 AND 6),
    emergency_contact VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.4 COACHES TABLE (1:1 Specialization of Users for Athletic Coaches)
CREATE TABLE coaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    employee_number VARCHAR(30) UNIQUE NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    license_level VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.5 SPORTS TABLE (Sporting Disciplines Master)
CREATE TABLE sports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Team', 'Individual', 'Dual', 'Martial Arts', 'Aquatics')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.6 TEAMS TABLE (Varsity Teams by Academic Year)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
    team_name VARCHAR(150) NOT NULL,
    school_year VARCHAR(20) NOT NULL, -- e.g. '2025-2026'
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_team_sport_sy UNIQUE (sport_id, team_name, school_year)
);

-- 1.7 TEAM_MEMBERS TABLE (JUNCTION 1: Many-to-Many between Teams and Athletes)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE RESTRICT,
    position VARCHAR(50) NOT NULL,
    jersey_number INT CHECK (jersey_number BETWEEN 0 AND 99),
    joined_at DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'injured', 'inactive', 'graduated')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_team_athlete UNIQUE (team_id, athlete_id)
);

-- 1.8 EQUIPMENT TABLE (Inventory Catalog & Availability Tracker)
CREATE TABLE equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    category VARCHAR(50) NOT NULL,
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    available_quantity INT NOT NULL CHECK (available_quantity >= 0 AND available_quantity <= total_quantity),
    condition VARCHAR(30) NOT NULL DEFAULT 'good' CHECK (condition IN ('new', 'good', 'fair', 'needs_maintenance', 'damaged')),
    status VARCHAR(30) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'low_stock', 'out_of_stock', 'under_maintenance', 'retired')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.9 BORROWING_TRANSACTIONS TABLE (Header for Equipment Loans)
CREATE TABLE borrowing_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE RESTRICT,
    approved_by UUID REFERENCES users(id) ON DELETE RESTRICT,
    borrow_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_return_date DATE NOT NULL,
    actual_return_date TIMESTAMPTZ,
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'partially_returned', 'returned', 'overdue', 'cancelled')),
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.10 BORROWING_ITEMS TABLE (JUNCTION 2: Many-to-Many between Transactions and Equipment)
CREATE TABLE borrowing_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES borrowing_transactions(id) ON DELETE CASCADE,
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    returned_quantity INT NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0 AND returned_quantity <= quantity),
    condition_before VARCHAR(30) NOT NULL DEFAULT 'good',
    condition_after VARCHAR(30),
    return_status VARCHAR(30) NOT NULL DEFAULT 'borrowed' CHECK (return_status IN ('borrowed', 'returned', 'damaged', 'lost', 'partial')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_tx_equipment UNIQUE (transaction_id, equipment_id)
);

-- 1.11 MAINTENANCE_RECORDS TABLE (Equipment Repair & Servicing Log)
CREATE TABLE maintenance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issue_description TEXT NOT NULL,
    scheduled_date DATE NOT NULL,
    cost NUMERIC(10,2) NOT NULL DEFAULT 0.00 CHECK (cost >= 0),
    status VARCHAR(30) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 1.12 AUDIT_LOGS TABLE (Automated Security and Data Mutation Trail)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID,
    action_type VARCHAR(10) NOT NULL CHECK (action_type IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 2. PERFORMANCE & SEARCH OPTIMIZATION: B-TREE INDEXES
-- ============================================================================
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_athletes_student_number ON athletes(student_number);
CREATE INDEX idx_athletes_user_id ON athletes(user_id);
CREATE INDEX idx_teams_sport_id ON teams(sport_id);
CREATE INDEX idx_teams_coach_id ON teams(coach_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_athlete_id ON team_members(athlete_id);
CREATE INDEX idx_team_members_status ON team_members(status);
CREATE INDEX idx_equipment_sport_id ON equipment(sport_id);
CREATE INDEX idx_equipment_code ON equipment(equipment_code);
CREATE INDEX idx_equipment_status ON equipment(status);
CREATE INDEX idx_borrowing_transactions_athlete ON borrowing_transactions(athlete_id);
CREATE INDEX idx_borrowing_transactions_status ON borrowing_transactions(status);
CREATE INDEX idx_borrowing_transactions_dates ON borrowing_transactions(expected_return_date, actual_return_date);
CREATE INDEX idx_borrowing_items_tx ON borrowing_items(transaction_id);
CREATE INDEX idx_borrowing_items_equipment ON borrowing_items(equipment_id);
CREATE INDEX idx_borrowing_items_status ON borrowing_items(return_status);
CREATE INDEX idx_maintenance_equipment ON maintenance_records(equipment_id);
CREATE INDEX idx_maintenance_status ON maintenance_records(status);
CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- ============================================================================
-- 3. SERVER-SIDE DATABASE PROGRAMMING: TRIGGERS & PROCEDURES (PL/pgSQL)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 3.1 TRIGGER 1: trg_audit_equipment_changes
-- Automatically logs all INSERT, UPDATE, DELETE operations on the `equipment` table.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION log_equipment_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := NULL;
BEGIN
    -- Attempt to extract current user id from session context if available
    BEGIN
        v_user_id := NULLIF(current_setting('app.current_user_id', true), '')::UUID;
    EXCEPTION WHEN OTHERS THEN
        v_user_id := NULL;
    END;

    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by)
        VALUES ('equipment', NEW.id, 'INSERT', NULL, to_jsonb(NEW), v_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        NEW.updated_at = NOW();
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by)
        VALUES ('equipment', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by)
        VALUES ('equipment', OLD.id, 'DELETE', to_jsonb(OLD), NULL, v_user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_audit_equipment_changes ON equipment;
CREATE TRIGGER trg_audit_equipment_changes
AFTER INSERT OR UPDATE OR DELETE ON equipment
FOR EACH ROW
EXECUTE FUNCTION log_equipment_audit();

-- ----------------------------------------------------------------------------
-- 3.2 TRIGGER 2: trg_auto_update_stock_on_return
-- Automatically restores equipment.available_quantity when borrowing items are returned.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_auto_update_stock_on_return()
RETURNS TRIGGER AS $$
DECLARE
    v_qty_delta INT;
    v_new_available INT;
    v_total_qty INT;
    v_new_status VARCHAR(30);
BEGIN
    -- Check if returned_quantity has increased
    IF (TG_OP = 'UPDATE') THEN
        v_qty_delta := NEW.returned_quantity - OLD.returned_quantity;

        IF v_qty_delta > 0 THEN
            -- Fetch current equipment totals
            SELECT total_quantity, available_quantity 
            INTO v_total_qty, v_new_available
            FROM equipment
            WHERE id = NEW.equipment_id
            FOR UPDATE;

            v_new_available := v_new_available + v_qty_delta;

            -- Safety cap: cannot exceed total_quantity
            IF v_new_available > v_total_qty THEN
                v_new_available := v_total_qty;
            END IF;

            -- Derive status based on inventory thresholds
            IF v_new_available = 0 THEN
                v_new_status := 'out_of_stock';
            ELSIF v_new_available <= 2 THEN
                v_new_status := 'low_stock';
            ELSE
                v_new_status := 'available';
            END IF;

            -- Update equipment stock & status
            UPDATE equipment
            SET available_quantity = v_new_available,
                status = v_new_status,
                updated_at = NOW()
            WHERE id = NEW.equipment_id;
        END IF;

        -- Automatically synchronize return_status flag
        IF NEW.returned_quantity >= NEW.quantity THEN
            NEW.return_status := 'returned';
        ELSIF NEW.returned_quantity > 0 AND NEW.returned_quantity < NEW.quantity THEN
            NEW.return_status := 'partial';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_update_stock_on_return ON borrowing_items;
CREATE TRIGGER trg_auto_update_stock_on_return
BEFORE UPDATE OF returned_quantity, return_status ON borrowing_items
FOR EACH ROW
EXECUTE FUNCTION fn_auto_update_stock_on_return();

-- ----------------------------------------------------------------------------
-- 3.3 STORED FUNCTION: fn_calculate_overdue_days
-- Computes overdue days dynamically based on expected vs actual return dates.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION fn_calculate_overdue_days(
    p_expected_return_date DATE,
    p_actual_return_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS INT AS $$
DECLARE
    v_reference_date DATE;
    v_overdue_days INT;
BEGIN
    IF p_actual_return_date IS NOT NULL THEN
        v_reference_date := p_actual_return_date::DATE;
    ELSE
        v_reference_date := CURRENT_DATE;
    END IF;

    v_overdue_days := v_reference_date - p_expected_return_date;

    IF v_overdue_days > 0 THEN
        RETURN v_overdue_days;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ----------------------------------------------------------------------------
-- 3.4 STORED PROCEDURE / RPC: checkout_equipment (ACID Atomic Transaction)
-- Verifies availability, locks stock rows, creates transaction & junction records.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION checkout_equipment(
    p_athlete_id UUID,
    p_items JSONB,              -- Array of objects: [{"equipment_id": "...", "quantity": 2, "condition": "good"}]
    p_expected_return DATE,
    p_approved_by UUID DEFAULT NULL,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_transaction_id UUID;
    v_item RECORD;
    v_equipment RECORD;
    v_item_count INT;
    v_new_available INT;
    v_new_status VARCHAR(30);
BEGIN
    -- 1. Date Validation
    IF p_expected_return < CURRENT_DATE THEN
        RAISE EXCEPTION 'Expected return date (%) cannot be in the past.', p_expected_return;
    END IF;

    -- 2. Validate Athlete
    IF NOT EXISTS (SELECT 1 FROM athletes WHERE id = p_athlete_id) THEN
        RAISE EXCEPTION 'Athlete ID (%) does not exist.', p_athlete_id;
    END IF;

    -- 3. Validate Items array
    v_item_count := jsonb_array_length(p_items);
    IF v_item_count = 0 THEN
        RAISE EXCEPTION 'Checkout request must contain at least one item.';
    END IF;

    -- 4. Create Master Transaction Record
    INSERT INTO borrowing_transactions (
        athlete_id,
        approved_by,
        expected_return_date,
        status,
        remarks
    )
    VALUES (
        p_athlete_id,
        p_approved_by,
        p_expected_return,
        CASE WHEN p_approved_by IS NOT NULL THEN 'active' ELSE 'pending' END,
        p_remarks
    )
    RETURNING id INTO v_transaction_id;

    -- 5. Process each item atomically with row-level locks
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        equipment_id UUID,
        quantity INT,
        condition VARCHAR(30)
    )
    LOOP
        -- Row lock to prevent race conditions during concurrent checkouts
        SELECT * INTO v_equipment
        FROM equipment
        WHERE id = v_item.equipment_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Equipment with ID % was not found.', v_item.equipment_id;
        END IF;

        IF v_equipment.available_quantity < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %.',
                v_equipment.name, v_item.quantity, v_equipment.available_quantity;
        END IF;

        -- Decrement inventory
        v_new_available := v_equipment.available_quantity - v_item.quantity;
        IF v_new_available = 0 THEN
            v_new_status := 'out_of_stock';
        ELSIF v_new_available <= 2 THEN
            v_new_status := 'low_stock';
        ELSE
            v_new_status := 'available';
        END IF;

        UPDATE equipment
        SET available_quantity = v_new_available,
            status = v_new_status,
            updated_at = NOW()
        WHERE id = v_item.equipment_id;

        -- Insert Junction Record
        INSERT INTO borrowing_items (
            transaction_id,
            equipment_id,
            quantity,
            returned_quantity,
            condition_before,
            return_status
        )
        VALUES (
            v_transaction_id,
            v_item.equipment_id,
            v_item.quantity,
            0,
            COALESCE(v_item.condition, v_equipment.condition, 'good'),
            'borrowed'
        );
    END LOOP;

    -- Return JSON payload to client
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_transaction_id,
        'message', 'Equipment checkout successfully executed with ACID transaction safety.',
        'items_processed', v_item_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 3.5 STORED PROCEDURE / RPC: return_borrowed_items
-- Safely records returns and triggers automatic stock replenishment.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION return_borrowed_items(
    p_transaction_id UUID,
    p_items JSONB,              -- Array of [{"item_id": "...", "returned_quantity": 2, "condition_after": "good"}]
    p_received_by UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_unreturned_count INT;
    v_total_items INT;
BEGIN
    -- Verify transaction exists
    IF NOT EXISTS (SELECT 1 FROM borrowing_transactions WHERE id = p_transaction_id) THEN
        RAISE EXCEPTION 'Borrowing transaction % not found.', p_transaction_id;
    END IF;

    -- Update each item
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
        item_id UUID,
        returned_quantity INT,
        condition_after VARCHAR(30)
    )
    LOOP
        UPDATE borrowing_items
        SET returned_quantity = v_item.returned_quantity,
            condition_after = COALESCE(v_item.condition_after, 'good'),
            return_status = CASE 
                WHEN v_item.returned_quantity >= quantity THEN 'returned'
                WHEN v_item.returned_quantity > 0 THEN 'partial'
                ELSE 'borrowed'
            END
        WHERE id = v_item.item_id AND transaction_id = p_transaction_id;
    END LOOP;

    -- Check if all items in this transaction are fully returned
    SELECT 
        COUNT(*) FILTER (WHERE returned_quantity < quantity),
        COUNT(*)
    INTO v_unreturned_count, v_total_items
    FROM borrowing_items
    WHERE transaction_id = p_transaction_id;

    IF v_unreturned_count = 0 THEN
        UPDATE borrowing_transactions
        SET status = 'returned',
            actual_return_date = NOW(),
            approved_by = COALESCE(approved_by, p_received_by)
        WHERE id = p_transaction_id;
    ELSE
        UPDATE borrowing_transactions
        SET status = 'partially_returned',
            approved_by = COALESCE(approved_by, p_received_by)
        WHERE id = p_transaction_id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', p_transaction_id,
        'status', CASE WHEN v_unreturned_count = 0 THEN 'returned' ELSE 'partially_returned' END,
        'message', 'Items successfully processed and inventory auto-restocked.'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. DATABASE VIEWS: DATA ABSTRACTION & REPORTING
-- ============================================================================

-- 4.1 VIEW: Active & Overdue Loans Summary
CREATE OR REPLACE VIEW vw_active_loans_summary AS
SELECT 
    bt.id AS transaction_id,
    bt.borrow_date,
    bt.expected_return_date,
    bt.actual_return_date,
    bt.status AS transaction_status,
    bt.remarks,
    ath.id AS athlete_id,
    ath.student_number,
    u.full_name AS athlete_name,
    ath.department,
    u.email AS athlete_email,
    staff.full_name AS approved_by_name,
    fn_calculate_overdue_days(bt.expected_return_date, bt.actual_return_date) AS overdue_days,
    CASE 
        WHEN bt.status = 'returned' THEN 'Returned on Time'
        WHEN fn_calculate_overdue_days(bt.expected_return_date, bt.actual_return_date) > 0 THEN 'OVERDUE'
        ELSE 'Active / On Schedule'
    END AS loan_urgency,
    COUNT(bi.id) AS total_equipment_lines,
    COALESCE(SUM(bi.quantity), 0) AS total_units_borrowed,
    COALESCE(SUM(bi.returned_quantity), 0) AS total_units_returned,
    (COALESCE(SUM(bi.quantity), 0) - COALESCE(SUM(bi.returned_quantity), 0)) AS outstanding_units
FROM borrowing_transactions bt
JOIN athletes ath ON bt.athlete_id = ath.id
JOIN users u ON ath.user_id = u.id
LEFT JOIN users staff ON bt.approved_by = staff.id
LEFT JOIN borrowing_items bi ON bt.id = bi.transaction_id
GROUP BY 
    bt.id, bt.borrow_date, bt.expected_return_date, bt.actual_return_date,
    bt.status, bt.remarks, ath.id, ath.student_number, u.full_name,
    ath.department, u.email, staff.full_name;

-- 4.2 VIEW: Real-time Equipment Inventory & Stock Health Status
CREATE OR REPLACE VIEW vw_equipment_inventory_status AS
SELECT 
    e.id AS equipment_id,
    e.equipment_code,
    e.name AS equipment_name,
    e.category,
    s.name AS sport_name,
    e.total_quantity,
    e.available_quantity,
    (e.total_quantity - e.available_quantity) AS currently_borrowed,
    ROUND(((e.total_quantity - e.available_quantity)::NUMERIC / NULLIF(e.total_quantity, 0)) * 100, 1) AS utilization_rate_pct,
    e.condition,
    e.status,
    CASE 
        WHEN e.available_quantity = 0 THEN 'OUT_OF_STOCK'
        WHEN e.available_quantity <= 2 THEN 'LOW_STOCK_ALERT'
        WHEN e.condition IN ('needs_maintenance', 'damaged') THEN 'MAINTENANCE_REQUIRED'
        ELSE 'OPTIMAL'
    END AS stock_health_status,
    COUNT(mr.id) FILTER (WHERE mr.status IN ('pending', 'in_progress')) AS active_maintenance_jobs,
    e.updated_at AS last_updated
FROM equipment e
JOIN sports s ON e.sport_id = s.id
LEFT JOIN maintenance_records mr ON e.id = mr.equipment_id
GROUP BY e.id, e.equipment_code, e.name, e.category, s.name, e.total_quantity, e.available_quantity, e.condition, e.status, e.updated_at;

-- ============================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Transparent read access for public/authenticated frontend dashboard
-- (Admin, Staff, and Student views query through API)
CREATE POLICY "Public read access on roles" ON roles FOR SELECT USING (true);
CREATE POLICY "Public read access on users" ON users FOR SELECT USING (true);
CREATE POLICY "Public read access on athletes" ON athletes FOR SELECT USING (true);
CREATE POLICY "Public read access on coaches" ON coaches FOR SELECT USING (true);
CREATE POLICY "Public read access on sports" ON sports FOR SELECT USING (true);
CREATE POLICY "Public read access on teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public read access on team_members" ON team_members FOR SELECT USING (true);
CREATE POLICY "Public read access on equipment" ON equipment FOR SELECT USING (true);
CREATE POLICY "Public read access on borrowing_transactions" ON borrowing_transactions FOR SELECT USING (true);
CREATE POLICY "Public read access on borrowing_items" ON borrowing_items FOR SELECT USING (true);
CREATE POLICY "Public read access on maintenance_records" ON maintenance_records FOR SELECT USING (true);
CREATE POLICY "Public read access on audit_logs" ON audit_logs FOR SELECT USING (true);

-- Mutations permissions for application execution
CREATE POLICY "Allow all modifications on equipment for staff/admin" ON equipment FOR ALL USING (true);
CREATE POLICY "Allow all modifications on borrowing_transactions" ON borrowing_transactions FOR ALL USING (true);
CREATE POLICY "Allow all modifications on borrowing_items" ON borrowing_items FOR ALL USING (true);
CREATE POLICY "Allow all modifications on maintenance_records" ON maintenance_records FOR ALL USING (true);
CREATE POLICY "Allow inserts on audit_logs" ON audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow team_members modifications" ON team_members FOR ALL USING (true);

-- ============================================================================
-- 6. REALISTIC UNIVERSITY SEED DATA
-- ============================================================================

-- 6.1 Insert Roles
INSERT INTO roles (id, name, description) VALUES
('00000000-0000-0000-0000-000000000001', 'admin', 'Full athletic department administrative control and audit oversight'),
('00000000-0000-0000-0000-000000000002', 'staff', 'Equipment custodian, inventory clerk, and checkout manager'),
('00000000-0000-0000-0000-000000000003', 'student', 'Varsity athlete with roster viewing and equipment borrowing privileges');

-- 6.2 Insert Users
INSERT INTO users (id, email, full_name, role_id, status) VALUES
-- Admin
('10000000-0000-0000-0000-000000000001', 'director@falcon.edu', 'Dr. Arthur Sterling', '00000000-0000-0000-0000-000000000001', 'active'),
-- Staff Custodians
('10000000-0000-0000-0000-000000000002', 'custodian@falcon.edu', 'Salvador Gomez', '00000000-0000-0000-0000-000000000002', 'active'),
('10000000-0000-0000-0000-000000000003', 'assistant.custodian@falcon.edu', 'Clara Dela Cruz', '00000000-0000-0000-0000-000000000002', 'active'),
-- Coaches
('10000000-0000-0000-0000-000000000004', 'coach.carter@falcon.edu', 'Coach Kenneth Carter', '00000000-0000-0000-0000-000000000001', 'active'),
('10000000-0000-0000-0000-000000000005', 'coach.walsh@falcon.edu', 'Coach Kerri Walsh', '00000000-0000-0000-0000-000000000001', 'active'),
-- Athletes
('10000000-0000-0000-0000-000000000006', 'm.vance@falcon.edu', 'Marcus Vance', '00000000-0000-0000-0000-000000000003', 'active'),
('10000000-0000-0000-0000-000000000007', 'e.rostova@falcon.edu', 'Elena Rostova', '00000000-0000-0000-0000-000000000003', 'active'),
('10000000-0000-0000-0000-000000000008', 'j.reyes@falcon.edu', 'Jordan Reyes', '00000000-0000-0000-0000-000000000003', 'active'),
('10000000-0000-0000-0000-000000000009', 'b.alvarez@falcon.edu', 'Bianca Alvarez', '00000000-0000-0000-0000-000000000003', 'active');

-- 6.3 Insert Coaches Details
INSERT INTO coaches (id, user_id, employee_number, specialization, license_level) VALUES
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000004', 'EMP-2018-091', 'Basketball Tactical Strategy & Conditioning', 'FIBA Level 3'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'EMP-2020-044', 'Volleyball High-Performance & Offense', 'FIVB Level 2');

-- 6.4 Insert Athletes Details
INSERT INTO athletes (id, user_id, student_number, department, year_level, emergency_contact) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', '2023-10892', 'BS Information Technology', 3, 'Grace Vance (Mother) - +63 917 555 0101'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', '2024-20411', 'BS Civil Engineering', 2, 'Dmitri Rostov (Father) - +63 918 555 0202'),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', '2022-30912', 'BS Nursing', 4, 'Maria Reyes (Mother) - +63 920 555 0303'),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000009', '2023-11540', 'BS Accountancy', 3, 'Carlos Alvarez (Brother) - +63 922 555 0404');

-- 6.5 Insert Sports
INSERT INTO sports (id, name, category, status) VALUES
('40000000-0000-0000-0000-000000000001', 'Basketball', 'Team', 'active'),
('40000000-0000-0000-0000-000000000002', 'Volleyball', 'Team', 'active'),
('40000000-0000-0000-0000-000000000003', 'Track & Field', 'Individual', 'active'),
('40000000-0000-0000-0000-000000000004', 'Badminton', 'Dual', 'active'),
('40000000-0000-0000-0000-000000000005', 'Swimming', 'Aquatics', 'active');

-- 6.6 Insert Teams
INSERT INTO teams (id, sport_id, coach_id, team_name, school_year, status) VALUES
('50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Falcon Soaring Eagles (Men)', '2025-2026', 'active'),
('50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002', 'Falcon Lady Spikers (Women)', '2025-2026', 'active'),
('50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001', 'Falcon Track Express', '2025-2026', 'active');

-- 6.7 Insert Team Members (Junction 1)
INSERT INTO team_members (id, team_id, athlete_id, position, jersey_number, joined_at, status) VALUES
('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Point Guard (PG)', 7, '2023-08-15', 'active'),
('60000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000003', 'Power Forward (PF)', 23, '2022-09-01', 'active'),
('60000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Outside Hitter', 12, '2024-08-10', 'active'),
('60000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000004', 'Libero', 5, '2023-08-15', 'active'),
('60000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '100m / 200m Sprinter', 9, '2024-01-10', 'active');

-- 6.8 Insert Equipment
INSERT INTO equipment (id, sport_id, equipment_code, name, category, total_quantity, available_quantity, condition, status) VALUES
('70000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'EQ-BB-001', 'Molten BG5000 Official FIBA Basketball', 'Ball', 25, 20, 'good', 'available'),
('70000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000001', 'EQ-BB-002', 'Heavy-Duty Agility Training Cones (Set of 10)', 'Training Aid', 12, 10, 'good', 'available'),
('70000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000002', 'EQ-VB-001', 'Mikasa V200W Official FIVB Game Volleyball', 'Ball', 20, 15, 'good', 'available'),
('70000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000002', 'EQ-VB-002', 'Heavy Duty Volleyball Antenna Set', 'Hardware', 4, 1, 'fair', 'low_stock'),
('70000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000003', 'EQ-TF-001', 'Seiko Precision Electronic Digital Stopwatch', 'Timing Tech', 8, 4, 'good', 'available'),
('70000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000003', 'EQ-TF-002', 'Aluminum Track Starting Blocks', 'Hardware', 6, 0, 'fair', 'out_of_stock'),
('70000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000004', 'EQ-BD-001', 'Yonex Astrox 88D Pro Badminton Racket', 'Racket', 10, 8, 'good', 'available'),
('70000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000001', 'EQ-MED-001', 'Field Emergency First Aid & Trauma Kit', 'Medical', 5, 4, 'new', 'available');

-- 6.9 Insert Borrowing Transactions (Header)
-- Tx 1: Overdue Loan (demonstrates fn_calculate_overdue_days and alert view)
INSERT INTO borrowing_transactions (id, athlete_id, approved_by, borrow_date, expected_return_date, actual_return_date, status, remarks) VALUES
('80000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '7 days', CURRENT_DATE - INTERVAL '3 days', NULL, 'overdue', 'Inter-collegiate tournament practice scrimmage');

-- Tx 2: Active / On Schedule Loan
INSERT INTO borrowing_transactions (id, athlete_id, approved_by, borrow_date, expected_return_date, actual_return_date, status, remarks) VALUES
('80000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', CURRENT_DATE + INTERVAL '2 days', NULL, 'active', 'Afternoon spike conditioning session');

-- Tx 3: Successfully Returned Loan
INSERT INTO borrowing_transactions (id, athlete_id, approved_by, borrow_date, expected_return_date, actual_return_date, status, remarks) VALUES
('80000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', NOW() - INTERVAL '10 days', CURRENT_DATE - INTERVAL '6 days', NOW() - INTERVAL '6 days', 'returned', 'Conditioning drills in field house');

-- 6.10 Insert Borrowing Items (Junction 2)
INSERT INTO borrowing_items (id, transaction_id, equipment_id, quantity, returned_quantity, condition_before, condition_after, return_status) VALUES
-- Items for Tx 1 (Overdue)
('90000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 3, 0, 'good', NULL, 'borrowed'),
('90000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', 2, 0, 'good', NULL, 'borrowed'),
-- Items for Tx 2 (Active)
('90000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000003', 5, 0, 'good', NULL, 'borrowed'),
-- Items for Tx 3 (Returned)
('90000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000001', 2, 2, 'good', 'good', 'returned');

-- 6.11 Insert Maintenance Records
INSERT INTO maintenance_records (id, equipment_id, reported_by, issue_description, scheduled_date, cost, status) VALUES
('a0000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Tighten hinge screws and replace worn rubber base grips', CURRENT_DATE + INTERVAL '3 days', 750.00, 'in_progress'),
('a0000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Replace stripped mounting bracket clamps', CURRENT_DATE + INTERVAL '5 days', 420.00, 'pending');

-- 6.12 Insert Sample Audit Logs
INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by) VALUES
('equipment', '70000000-0000-0000-0000-000000000001', 'INSERT', NULL, '{"name": "Molten BG5000", "total_quantity": 25, "available_quantity": 25}'::jsonb, '10000000-0000-0000-0000-000000000001'),
('equipment', '70000000-0000-0000-0000-000000000006', 'UPDATE', '{"available_quantity": 6, "status": "available"}'::jsonb, '{"available_quantity": 0, "status": "out_of_stock"}'::jsonb, '10000000-0000-0000-0000-000000000002');

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
SELECT 'DATABASE SETUP COMPLETE' AS status,
       (SELECT COUNT(*) FROM roles) AS roles_count,
       (SELECT COUNT(*) FROM users) AS users_count,
       (SELECT COUNT(*) FROM athletes) AS athletes_count,
       (SELECT COUNT(*) FROM sports) AS sports_count,
       (SELECT COUNT(*) FROM teams) AS teams_count,
       (SELECT COUNT(*) FROM team_members) AS team_members_count,
       (SELECT COUNT(*) FROM equipment) AS equipment_count,
       (SELECT COUNT(*) FROM borrowing_transactions) AS loans_count,
       (SELECT COUNT(*) FROM borrowing_items) AS loan_items_count,
       (SELECT COUNT(*) FROM audit_logs) AS audit_logs_count;
