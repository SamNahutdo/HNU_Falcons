-- =============================================================================
-- Migration 003: Add ON DELETE CASCADE / SET NULL to Foreign Keys
-- Bulletproof version: checks whether each table and column exists
-- before altering constraints to prevent 42703 (column does not exist) errors.
-- =============================================================================

DO $$
BEGIN
    -- 1. Cascade delete athletes when their user account is deleted
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'athletes' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.athletes DROP CONSTRAINT IF EXISTS athletes_user_id_fkey;
        ALTER TABLE public.athletes ADD CONSTRAINT athletes_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- 2. Cascade delete coaches when their user account is deleted
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'coaches' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.coaches DROP CONSTRAINT IF EXISTS coaches_user_id_fkey;
        ALTER TABLE public.coaches ADD CONSTRAINT coaches_user_id_fkey 
            FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;

    -- 3. Cascade delete team members when an athlete is deleted
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'team_members' AND column_name = 'athlete_id'
    ) THEN
        ALTER TABLE public.team_members DROP CONSTRAINT IF EXISTS team_members_athlete_id_fkey;
        ALTER TABLE public.team_members ADD CONSTRAINT team_members_athlete_id_fkey 
            FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
    END IF;

    -- 4. Teams: allow coach deletion without breaking the team
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'coach_id'
    ) THEN
        ALTER TABLE public.teams ALTER COLUMN coach_id DROP NOT NULL;
        ALTER TABLE public.teams DROP CONSTRAINT IF EXISTS teams_coach_id_fkey;
        ALTER TABLE public.teams ADD CONSTRAINT teams_coach_id_fkey 
            FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE SET NULL;
    END IF;

    -- 5. Coach bookings (if table and columns exist)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'coach_bookings'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'coach_bookings' AND column_name = 'student_id'
        ) THEN
            ALTER TABLE public.coach_bookings DROP CONSTRAINT IF EXISTS coach_bookings_student_id_fkey;
            ALTER TABLE public.coach_bookings ADD CONSTRAINT coach_bookings_student_id_fkey 
                FOREIGN KEY (student_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'coach_bookings' AND column_name = 'coach_id'
        ) THEN
            ALTER TABLE public.coach_bookings DROP CONSTRAINT IF EXISTS coach_bookings_coach_id_fkey;
            ALTER TABLE public.coach_bookings ADD CONSTRAINT coach_bookings_coach_id_fkey 
                FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- 6. Borrowing transactions
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'borrowing_transactions'
    ) THEN
        -- athlete_id cascade
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'borrowing_transactions' AND column_name = 'athlete_id'
        ) THEN
            ALTER TABLE public.borrowing_transactions DROP CONSTRAINT IF EXISTS borrowing_transactions_athlete_id_fkey;
            ALTER TABLE public.borrowing_transactions ADD CONSTRAINT borrowing_transactions_athlete_id_fkey 
                FOREIGN KEY (athlete_id) REFERENCES public.athletes(id) ON DELETE CASCADE;
        END IF;

        -- approved_by set null
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'borrowing_transactions' AND column_name = 'approved_by'
        ) THEN
            ALTER TABLE public.borrowing_transactions DROP CONSTRAINT IF EXISTS borrowing_transactions_approved_by_fkey;
            ALTER TABLE public.borrowing_transactions ADD CONSTRAINT borrowing_transactions_approved_by_fkey 
                FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;
        END IF;

        -- coach_id (only if borrowing_transactions actually has coach_id column)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'borrowing_transactions' AND column_name = 'coach_id'
        ) THEN
            ALTER TABLE public.borrowing_transactions DROP CONSTRAINT IF EXISTS borrowing_transactions_coach_id_fkey;
            ALTER TABLE public.borrowing_transactions ADD CONSTRAINT borrowing_transactions_coach_id_fkey 
                FOREIGN KEY (coach_id) REFERENCES public.coaches(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- 7. Borrowing items: cascade delete when borrowing transaction is deleted
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'borrowing_items' AND column_name = 'transaction_id'
    ) THEN
        ALTER TABLE public.borrowing_items DROP CONSTRAINT IF EXISTS borrowing_items_transaction_id_fkey;
        ALTER TABLE public.borrowing_items ADD CONSTRAINT borrowing_items_transaction_id_fkey 
            FOREIGN KEY (transaction_id) REFERENCES public.borrowing_transactions(id) ON DELETE CASCADE;
    END IF;

    -- 8. Audit logs: performed_by references users(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'performed_by'
    ) THEN
        ALTER TABLE public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_performed_by_fkey;
        ALTER TABLE public.audit_logs ADD CONSTRAINT audit_logs_performed_by_fkey 
            FOREIGN KEY (performed_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 9. Maintenance records: reported_by references users(id)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'maintenance_records' AND column_name = 'reported_by'
    ) THEN
        ALTER TABLE public.maintenance_records ALTER COLUMN reported_by DROP NOT NULL;
        ALTER TABLE public.maintenance_records DROP CONSTRAINT IF EXISTS maintenance_records_reported_by_fkey;
        ALTER TABLE public.maintenance_records ADD CONSTRAINT maintenance_records_reported_by_fkey 
            FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    -- 10. Staff reports (if table and columns exist)
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'staff_reports'
    ) THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'staff_reports' AND column_name = 'borrower_user_id'
        ) THEN
            ALTER TABLE public.staff_reports DROP CONSTRAINT IF EXISTS staff_reports_borrower_user_id_fkey;
            ALTER TABLE public.staff_reports ADD CONSTRAINT staff_reports_borrower_user_id_fkey 
                FOREIGN KEY (borrower_user_id) REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'staff_reports' AND column_name = 'reported_by'
        ) THEN
            ALTER TABLE public.staff_reports DROP CONSTRAINT IF EXISTS staff_reports_reported_by_fkey;
            ALTER TABLE public.staff_reports ADD CONSTRAINT staff_reports_reported_by_fkey 
                FOREIGN KEY (reported_by) REFERENCES public.users(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;
