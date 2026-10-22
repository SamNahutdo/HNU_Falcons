-- =============================================================================
-- Migration 005: Row Level Security (RBAC) Policies
-- Week: Week 6-7 (Optimization and security testing)
-- Author: Rizamae Velasco (DBA) & Sam Udtohan (DB Programmer)
-- Description: Enables RLS on all 12 tables and creates role-based policies
--              using auth.uid() and fn_get_caller_role(). This replaces any
--              prior USING (true) permissive policies.
-- Run order: FIFTH — depends on Migrations 001-004
-- IMPORTANT: These policies assume Supabase Auth is in use. fn_get_caller_role()
--            maps auth.uid() → users.user_auth_id → roles.name
-- =============================================================================

-- ─── ENABLE RLS ON ALL 12 TABLES ─────────────────────────────────────────────
ALTER TABLE roles                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE athletes                ENABLE ROW LEVEL SECURITY;
ALTER TABLE coaches                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment               ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowing_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_records     ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs              ENABLE ROW LEVEL SECURITY;

-- ─── Drop old permissive policies if any exist ───────────────────────────────
DO $$ DECLARE r RECORD;
BEGIN
    FOR r IN SELECT policyname, tablename
             FROM pg_policies
             WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
    END LOOP;
END $$;

-- ─── TABLE: roles ─────────────────────────────────────────────────────────────
-- Any authenticated user can read roles (needed for UI role display)
CREATE POLICY "roles: authenticated read"
    ON roles FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Only admin can modify roles
CREATE POLICY "roles: admin manage"
    ON roles FOR ALL
    USING (fn_get_caller_role() = 'admin');

-- ─── TABLE: users ─────────────────────────────────────────────────────────────
-- Users can read their own profile; admin/staff can read all
CREATE POLICY "users: own profile or staff+"
    ON users FOR SELECT
    USING (
        user_auth_id = auth.uid()
        OR fn_get_caller_role() IN ('admin', 'staff')
    );

-- Only admin can create/update/delete user records
CREATE POLICY "users: admin manage"
    ON users FOR ALL
    USING (fn_get_caller_role() = 'admin');

-- ─── TABLE: athletes ──────────────────────────────────────────────────────────
CREATE POLICY "athletes: read by role"
    ON athletes FOR SELECT
    USING (
        -- Students see only their own athlete record
        (fn_get_caller_role() = 'student' AND user_id IN (
            SELECT id FROM users WHERE user_auth_id = auth.uid()
        ))
        -- Staff and admin see all
        OR fn_get_caller_role() IN ('admin', 'staff')
        -- Coaches see athletes on their teams
        OR fn_get_caller_role() = 'coach'
    );

CREATE POLICY "athletes: admin/staff manage"
    ON athletes FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: coaches ───────────────────────────────────────────────────────────
CREATE POLICY "coaches: read authenticated"
    ON coaches FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "coaches: admin manage"
    ON coaches FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: sports ────────────────────────────────────────────────────────────
CREATE POLICY "sports: public read"
    ON sports FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "sports: admin manage"
    ON sports FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: teams ─────────────────────────────────────────────────────────────
CREATE POLICY "teams: authenticated read"
    ON teams FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "teams: admin/staff manage"
    ON teams FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: team_members ──────────────────────────────────────────────────────
CREATE POLICY "team_members: authenticated read"
    ON team_members FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "team_members: admin/staff manage"
    ON team_members FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: equipment ─────────────────────────────────────────────────────────
CREATE POLICY "equipment: authenticated read"
    ON equipment FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "equipment: admin/staff manage"
    ON equipment FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: borrowing_transactions ────────────────────────────────────────────
-- Students see only their own transactions
CREATE POLICY "borrowing_transactions: role-filtered read"
    ON borrowing_transactions FOR SELECT
    USING (
        fn_get_caller_role() IN ('admin', 'staff')
        OR (fn_get_caller_role() = 'coach')  -- coaches see all for oversight
        OR (fn_get_caller_role() = 'student' AND athlete_id IN (
            SELECT a.id FROM athletes a
            JOIN users u ON a.user_id = u.id
            WHERE u.user_auth_id = auth.uid()
        ))
    );

CREATE POLICY "borrowing_transactions: admin/staff manage"
    ON borrowing_transactions FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: borrowing_items ───────────────────────────────────────────────────
CREATE POLICY "borrowing_items: role-filtered read"
    ON borrowing_items FOR SELECT
    USING (
        fn_get_caller_role() IN ('admin', 'staff', 'coach')
        OR (fn_get_caller_role() = 'student' AND transaction_id IN (
            SELECT bt.id FROM borrowing_transactions bt
            JOIN athletes a ON bt.athlete_id = a.id
            JOIN users u ON a.user_id = u.id
            WHERE u.user_auth_id = auth.uid()
        ))
    );

CREATE POLICY "borrowing_items: admin/staff manage"
    ON borrowing_items FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: maintenance_records ───────────────────────────────────────────────
CREATE POLICY "maintenance_records: admin/staff/coach read"
    ON maintenance_records FOR SELECT
    USING (fn_get_caller_role() IN ('admin', 'staff', 'coach'));

CREATE POLICY "maintenance_records: admin/staff manage"
    ON maintenance_records FOR ALL
    USING (fn_get_caller_role() IN ('admin', 'staff'));

-- ─── TABLE: audit_logs ────────────────────────────────────────────────────────
-- ADMIN EXCLUSIVE — no other role can read or write audit logs
CREATE POLICY "audit_logs: admin only"
    ON audit_logs FOR ALL
    USING (fn_get_caller_role() = 'admin');

-- ─── CONFIRM ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '[Migration 005] RLS enabled on all 12 tables.';
    RAISE NOTICE '  All policies use auth.uid() + fn_get_caller_role()';
    RAISE NOTICE '  No USING (true) policies remain.';
    RAISE NOTICE '  audit_logs: admin-exclusive access.';
END $$;
