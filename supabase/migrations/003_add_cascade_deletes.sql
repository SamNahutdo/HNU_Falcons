-- =============================================================================
-- Migration 003: Add ON DELETE CASCADE to User and Athlete Foreign Keys
-- Allows deleting users directly from Supabase Table Editor or Admin Dashboard
-- without violating foreign key constraints.
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

-- 4. Cascade delete coach bookings when student/athlete or coach is deleted
ALTER TABLE IF EXISTS coach_bookings
    DROP CONSTRAINT IF EXISTS coach_bookings_student_id_fkey,
    ADD CONSTRAINT coach_bookings_student_id_fkey
        FOREIGN KEY (student_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS coach_bookings
    DROP CONSTRAINT IF EXISTS coach_bookings_coach_id_fkey,
    ADD CONSTRAINT coach_bookings_coach_id_fkey
        FOREIGN KEY (coach_id) REFERENCES coaches(id) ON DELETE CASCADE;

-- 5. Cascade delete borrowing transactions & items
ALTER TABLE IF EXISTS borrowing_transactions
    DROP CONSTRAINT IF EXISTS borrowing_transactions_athlete_id_fkey,
    ADD CONSTRAINT borrowing_transactions_athlete_id_fkey
        FOREIGN KEY (athlete_id) REFERENCES athletes(id) ON DELETE CASCADE;

ALTER TABLE IF EXISTS borrowing_transactions
    DROP CONSTRAINT IF EXISTS borrowing_transactions_approved_by_fkey,
    ADD CONSTRAINT borrowing_transactions_approved_by_fkey
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;
