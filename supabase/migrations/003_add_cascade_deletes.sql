-- =============================================================================
-- Migration 003: Add ON DELETE CASCADE / SET NULL to Foreign Keys
-- Allows deleting users, athletes, coaches, and transactions smoothly
-- without foreign key restriction errors.
-- =============================================================================

-- 1. Cascade delete athletes when their user account is deleted
ALTER TABLE IF EXISTS athletes
    DROP CONSTRAINT IF EXISTS athletes_user_id_fkey,
    ADD CONSTRAINT athletes_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 2. Cascade delete coaches when their user account is deleted
ALTER TABLE IF EXISTS coaches
    DROP CONSTRAINT IF EXISTS coaches_user_id_fkey,
    ADD CONSTRAINT coaches_user_id_fkey
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 3. Cascade delete team members when an athlete is deleted
ALTER TABLE IF EXISTS team_members
    DROP CONSTRAINT IF EXISTS team_members_athlete_id_fkey,
    ADD CONSTRAINT team_members_athlete_id_fkey
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

-- 4. Teams: allow coach deletion without breaking the team
ALTER TABLE IF EXISTS teams
    ALTER COLUMN coach_id DROP NOT NULL;

ALTER TABLE IF EXISTS teams
    DROP CONSTRAINT IF EXISTS teams_coach_id_fkey,
    ADD CONSTRAINT teams_coach_id_fkey
        FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE SET NULL;

-- 5. Cascade delete coach bookings when student/athlete or coach is deleted
ALTER TABLE IF EXISTS coach_bookings
    DROP CONSTRAINT IF EXISTS coach_bookings_student_id_fkey,
    ADD CONSTRAINT coach_bookings_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS coach_bookings
    DROP CONSTRAINT IF EXISTS coach_bookings_coach_id_fkey,
    ADD CONSTRAINT coach_bookings_coach_id_fkey
        FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE;

-- 6. Borrowing transactions: cascade on athlete/coach, set null on approved_by
ALTER TABLE IF EXISTS borrowing_transactions
    DROP CONSTRAINT IF EXISTS borrowing_transactions_athlete_id_fkey,
    ADD CONSTRAINT borrowing_transactions_athlete_id_fkey
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS borrowing_transactions
    DROP CONSTRAINT IF EXISTS borrowing_transactions_coach_id_fkey,
    ADD CONSTRAINT borrowing_transactions_coach_id_fkey
        FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS borrowing_transactions
    DROP CONSTRAINT IF EXISTS borrowing_transactions_approved_by_fkey,
    ADD CONSTRAINT borrowing_transactions_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- 7. Borrowing items: cascade delete when borrowing transaction is deleted
ALTER TABLE IF EXISTS borrowing_items
    DROP CONSTRAINT IF EXISTS borrowing_items_transaction_id_fkey,
    ADD CONSTRAINT borrowing_items_transaction_id_fkey
        FOREIGN KEY (transaction_id) REFERENCES borrowing_transactions(id) ON DELETE CASCADE;

-- 8. Audit logs: performed_by references users(id)
ALTER TABLE IF EXISTS audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_performed_by_fkey,
    ADD CONSTRAINT audit_logs_performed_by_fkey
        FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL;

-- 9. Maintenance records: reported_by references users(id)
ALTER TABLE IF EXISTS maintenance_records
    ALTER COLUMN reported_by DROP NOT NULL;

ALTER TABLE IF EXISTS maintenance_records
    DROP CONSTRAINT IF EXISTS maintenance_records_reported_by_fkey,
    ADD CONSTRAINT maintenance_records_reported_by_fkey
        FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL;

-- 10. Staff reports (if exists): borrower_user_id and reported_by
ALTER TABLE IF EXISTS staff_reports
    DROP CONSTRAINT IF EXISTS staff_reports_borrower_user_id_fkey,
    ADD CONSTRAINT staff_reports_borrower_user_id_fkey
        FOREIGN KEY (borrower_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS staff_reports
    DROP CONSTRAINT IF EXISTS staff_reports_reported_by_fkey,
    ADD CONSTRAINT staff_reports_reported_by_fkey
        FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE CASCADE;
