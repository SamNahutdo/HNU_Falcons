-- =============================================================================
-- Migration 002: Junction Tables and Equipment
-- Week: Week 2 (CRUD milestone completion)
-- Author: Rizamae Velasco (DBA)
-- Description: Adds the two M:N junction tables (team_members, borrowing_items),
--              the equipment inventory table, borrowing_transactions header,
--              and the maintenance_records table.
-- Run order: SECOND — depends on Migration 001
-- Prerequisite: 001_create_core_entities.sql must be applied first
-- =============================================================================

-- ─── TABLE 7: team_members (Junction M:N — teams ↔ athletes) ─────────────────
-- Intersection attributes: position, jersey_number, joined_at, status
-- These attributes depend on the COMPOSITE key (team_id, athlete_id) — 2NF satisfied
CREATE TABLE IF NOT EXISTS team_members (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id        UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
    athlete_id     UUID NOT NULL REFERENCES athletes(id) ON DELETE RESTRICT,
    position       VARCHAR(50) NOT NULL,
    jersey_number  INT,
    joined_at      DATE DEFAULT CURRENT_DATE,
    status         VARCHAR(20) DEFAULT 'active'
                       CHECK (status IN ('active', 'benched', 'transferred', 'inactive')),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_team_athlete UNIQUE (team_id, athlete_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id    ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_athlete_id ON team_members(athlete_id);
CREATE INDEX IF NOT EXISTS idx_team_members_status     ON team_members(status);

-- ─── TABLE 8: equipment ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS equipment (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id           UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    equipment_code     VARCHAR(50) UNIQUE NOT NULL,
    name               VARCHAR(150) NOT NULL,
    category           VARCHAR(50) NOT NULL,
    total_quantity     INT NOT NULL CHECK (total_quantity >= 0),
    available_quantity INT NOT NULL CHECK (available_quantity >= 0),
    condition          VARCHAR(30) DEFAULT 'good'
                           CHECK (condition IN ('new','good','fair','needs_maintenance','damaged')),
    status             VARCHAR(30) DEFAULT 'available'
                           CHECK (status IN ('available','low_stock','out_of_stock','under_maintenance','retired')),
    created_at         TIMESTAMPTZ DEFAULT NOW(),
    updated_at         TIMESTAMPTZ DEFAULT NOW(),
    -- Enforce: available can never exceed total (inventory integrity)
    CONSTRAINT chk_available_lte_total CHECK (available_quantity <= total_quantity)
);

CREATE INDEX IF NOT EXISTS idx_equipment_sport_id ON equipment(sport_id);
CREATE INDEX IF NOT EXISTS idx_equipment_status   ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_equipment_code     ON equipment(equipment_code);

-- ─── TABLE 9: borrowing_transactions ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS borrowing_transactions (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    athlete_id           UUID NOT NULL REFERENCES athletes(id) ON DELETE RESTRICT,
    approved_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    borrow_date          TIMESTAMPTZ DEFAULT NOW(),
    expected_return_date DATE NOT NULL,
    actual_return_date   TIMESTAMPTZ,
    status               VARCHAR(30) DEFAULT 'pending'
                             CHECK (status IN ('pending','active','overdue','returned','partially_returned','cancelled')),
    remarks              TEXT,
    created_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_borrowing_transactions_athlete ON borrowing_transactions(athlete_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_transactions_status  ON borrowing_transactions(status);
CREATE INDEX IF NOT EXISTS idx_borrowing_transactions_date    ON borrowing_transactions(expected_return_date);

-- ─── TABLE 10: borrowing_items (Junction M:N — transactions ↔ equipment) ──────
-- Intersection attributes: quantity, returned_quantity, condition_before/after, return_status
-- All depend on composite key (transaction_id, equipment_id) — 2NF satisfied
CREATE TABLE IF NOT EXISTS borrowing_items (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id    UUID NOT NULL REFERENCES borrowing_transactions(id) ON DELETE RESTRICT,
    equipment_id      UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    quantity          INT NOT NULL CHECK (quantity >= 1),
    returned_quantity INT NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
    condition_before  VARCHAR(30) DEFAULT 'good',
    condition_after   VARCHAR(30),
    return_status     VARCHAR(30) DEFAULT 'borrowed'
                          CHECK (return_status IN ('borrowed','returned','partial','lost')),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tx_equipment UNIQUE (transaction_id, equipment_id),
    CONSTRAINT chk_returned_lte_borrowed CHECK (returned_quantity <= quantity)
);

CREATE INDEX IF NOT EXISTS idx_borrowing_items_transaction ON borrowing_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_items_equipment   ON borrowing_items(equipment_id);

-- ─── TABLE 11: maintenance_records ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maintenance_records (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    equipment_id      UUID NOT NULL REFERENCES equipment(id) ON DELETE RESTRICT,
    reported_by       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issue_description TEXT NOT NULL,
    scheduled_date    DATE NOT NULL,
    cost              DECIMAL(10,2) DEFAULT 0.00 CHECK (cost >= 0),
    status            VARCHAR(30) DEFAULT 'pending'
                          CHECK (status IN ('pending','in_progress','completed','cancelled')),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_maintenance_equipment ON maintenance_records(equipment_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_status    ON maintenance_records(status);
CREATE INDEX IF NOT EXISTS idx_maintenance_date      ON maintenance_records(scheduled_date);

-- ─── TABLE 12: audit_logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_logs (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name        VARCHAR(50) NOT NULL,
    record_id         UUID,
    action_type       VARCHAR(10) NOT NULL CHECK (action_type IN ('INSERT','UPDATE','DELETE')),
    old_data          JSONB,
    new_data          JSONB,
    performed_by      UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_by_auth UUID,
    ip_address        VARCHAR(45),
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record  ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at    ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_performed_by  ON audit_logs(performed_by);

-- ─── CONFIRM ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '[Migration 002] Junction tables, equipment, and audit tables created.';
    RAISE NOTICE '  Tables: team_members, equipment, borrowing_transactions,';
    RAISE NOTICE '          borrowing_items, maintenance_records, audit_logs';
    RAISE NOTICE '  M:N Junction 1: team_members (teams ↔ athletes)';
    RAISE NOTICE '  M:N Junction 2: borrowing_items (transactions ↔ equipment)';
END $$;
