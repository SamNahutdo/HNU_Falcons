-- =============================================================================
-- Migration 001: Initial Schema — Create All Core Tables
-- Week: Week 1-2 (Core CRUD milestone)
-- Author: Rizamae Velasco (DBA)
-- Description: Creates the roles, users, athletes, coaches, sports, and teams
--              tables. These are the foundation entities before junction tables
--              and equipment are added.
-- Run order: FIRST — no dependencies
-- =============================================================================

-- Safety: only run if tables do not already exist
-- (Use schema.sql for a full drop-and-recreate instead)

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── TABLE 1: roles ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(30) UNIQUE NOT NULL,
    description TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Seed roles immediately (required for users FK)
INSERT INTO roles (name, description) VALUES
    ('admin',   'Full system access including audit logs and user management'),
    ('staff',   'Equipment management, checkout, and return operations'),
    ('coach',   'Read-only access to team roster and related equipment'),
    ('student', 'View equipment catalog and own borrowing history')
ON CONFLICT (name) DO NOTHING;

-- ─── TABLE 2: users ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_auth_id UUID UNIQUE,
    school_id    VARCHAR(15) UNIQUE,
    email        VARCHAR(255) UNIQUE NOT NULL,
    full_name    VARCHAR(150) NOT NULL,
    role_id      UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    status       VARCHAR(20) DEFAULT 'active'
                     CHECK (status IN ('active','inactive','suspended')),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(user_auth_id);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_users_email   ON users(email);

-- ─── TABLE 3: athletes ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS athletes (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    student_number    VARCHAR(30) UNIQUE NOT NULL,
    department        VARCHAR(100) NOT NULL,
    year_level        INT NOT NULL CHECK (year_level BETWEEN 1 AND 6),
    emergency_contact VARCHAR(100) NOT NULL,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_athletes_user_id        ON athletes(user_id);
CREATE INDEX IF NOT EXISTS idx_athletes_student_number ON athletes(student_number);

-- ─── TABLE 4: coaches ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coaches (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    employee_number VARCHAR(30) UNIQUE NOT NULL,
    specialization  VARCHAR(100) NOT NULL,
    license_level   VARCHAR(50) NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coaches_user_id        ON coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_employee_number ON coaches(employee_number);

-- ─── TABLE 5: sports ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sports (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) UNIQUE NOT NULL,
    category   VARCHAR(50) NOT NULL CHECK (category IN ('team_sport', 'individual_sport', 'Team', 'Individual', 'Dual', 'Martial Arts', 'Aquatics')),
    status     VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─── TABLE 6: teams ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sport_id    UUID NOT NULL REFERENCES sports(id) ON DELETE RESTRICT,
    coach_id    UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
    team_name   VARCHAR(150) NOT NULL,
    school_year VARCHAR(20) NOT NULL,
    status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'dissolved', 'inactive')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_team_sport_year UNIQUE (sport_id, team_name, school_year)
);

CREATE INDEX IF NOT EXISTS idx_teams_sport_id ON teams(sport_id);
CREATE INDEX IF NOT EXISTS idx_teams_coach_id ON teams(coach_id);

-- ─── CONFIRM ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '[Migration 001] Core entity tables created successfully.';
    RAISE NOTICE '  Tables: roles, users, athletes, coaches, sports, teams';
END $$;
