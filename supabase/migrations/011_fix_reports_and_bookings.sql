-- =============================================================================
-- Migration 011: Setup coach_bookings, staff_reports, and return_alerts tables
-- with permissive RLS policies so students, coaches, and staff can seamlessly
-- file incident reports and book varsity training appointments.
-- =============================================================================

-- 1. Coach Bookings table
CREATE TABLE IF NOT EXISTS public.coach_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.athletes(id) ON DELETE CASCADE,
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
    sport VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(80) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    coach_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_bookings_student_date
    ON public.coach_bookings(student_id, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_bookings_coach_date
    ON public.coach_bookings(coach_id, booking_date DESC);

-- 2. Staff Incident Reports to Admin table
CREATE TABLE IF NOT EXISTS public.staff_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(30) NOT NULL
        CHECK (report_type IN ('damaged_equipment', 'overdue_return')),
    item_id UUID REFERENCES public.equipment(id) ON DELETE SET NULL,
    borrower_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reported_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'reviewed', 'resolved')),
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_reports_status_created
    ON public.staff_reports(status, created_at DESC);

-- 3. Return Alerts table
CREATE TABLE IF NOT EXISTS public.return_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES public.borrowing_transactions(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_return_alerts_recipient_sent
    ON public.return_alerts(recipient_user_id, sent_at DESC);

-- 4. Enable Row Level Security with open access policies
ALTER TABLE public.coach_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coach_bookings_open_access" ON public.coach_bookings;
CREATE POLICY "coach_bookings_open_access" ON public.coach_bookings FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.staff_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_reports_open_access" ON public.staff_reports;
CREATE POLICY "staff_reports_open_access" ON public.staff_reports FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.return_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "return_alerts_open_access" ON public.return_alerts;
CREATE POLICY "return_alerts_open_access" ON public.return_alerts FOR ALL USING (true) WITH CHECK (true);
