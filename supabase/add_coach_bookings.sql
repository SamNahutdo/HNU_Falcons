-- Adds persistent storage for student-to-coach booking requests.
-- Existing tables and data are left unchanged.
-- Row Level Security is enabled with no public policies; add policies only
-- after the app has Supabase Auth identities linked to public.users.

BEGIN;

CREATE TABLE IF NOT EXISTS public.coach_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
    coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE RESTRICT,
    sport VARCHAR(100) NOT NULL,
    booking_date DATE NOT NULL,
    time_slot VARCHAR(100) NOT NULL,
    purpose TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
    coach_notes TEXT,
    reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_bookings_student_date
    ON public.coach_bookings (student_id, booking_date);

CREATE INDEX IF NOT EXISTS idx_coach_bookings_coach_status_date
    ON public.coach_bookings (coach_id, status, booking_date);

CREATE UNIQUE INDEX IF NOT EXISTS uq_coach_bookings_active_slot
    ON public.coach_bookings (coach_id, booking_date, time_slot)
    WHERE status IN ('pending', 'approved');

ALTER TABLE public.coach_bookings ENABLE ROW LEVEL SECURITY;

COMMIT;
