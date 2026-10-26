-- Persist dashboard-only fields and workflows behind the authenticated API.
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_online BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE coaches
    ADD COLUMN IF NOT EXISTS available_days TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS available_hours VARCHAR(100);

ALTER TABLE equipment
    ADD COLUMN IF NOT EXISTS available_days TEXT[] NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS condition_notes TEXT,
    ADD COLUMN IF NOT EXISTS last_inspected DATE;

ALTER TABLE borrowing_transactions
    ALTER COLUMN athlete_id DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES coaches(id) ON DELETE RESTRICT;

ALTER TABLE borrowing_transactions
    DROP CONSTRAINT IF EXISTS borrowing_transactions_status_check,
    ADD CONSTRAINT borrowing_transactions_status_check
    CHECK (status IN ('pending', 'approved', 'active', 'partially_returned', 'returned', 'overdue', 'cancelled'));

ALTER TABLE borrowing_transactions
    ADD CONSTRAINT borrowing_transactions_one_borrower
    CHECK ((athlete_id IS NOT NULL) <> (coach_id IS NOT NULL));

CREATE INDEX IF NOT EXISTS idx_borrowing_transactions_coach_id
    ON borrowing_transactions(coach_id);

CREATE TABLE IF NOT EXISTS coach_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES athletes(id) ON DELETE RESTRICT,
    coach_id UUID NOT NULL REFERENCES coaches(id) ON DELETE RESTRICT,
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
    ON coach_bookings(student_id, booking_date DESC);
CREATE INDEX IF NOT EXISTS idx_coach_bookings_coach_date
    ON coach_bookings(coach_id, booking_date DESC);

CREATE TABLE IF NOT EXISTS staff_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_type VARCHAR(30) NOT NULL
        CHECK (report_type IN ('damaged_equipment', 'overdue_return')),
    item_id UUID REFERENCES equipment(id) ON DELETE SET NULL,
    borrower_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    reported_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted', 'reviewed', 'resolved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_reports_status_created
    ON staff_reports(status, created_at DESC);

CREATE TABLE IF NOT EXISTS return_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL REFERENCES borrowing_transactions(id) ON DELETE CASCADE,
    recipient_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    message TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_return_alerts_recipient_sent
    ON return_alerts(recipient_user_id, sent_at DESC);

ALTER TABLE coach_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "borrowing_transactions: role-filtered read" ON borrowing_transactions;
CREATE POLICY "borrowing_transactions: role-filtered read"
    ON borrowing_transactions FOR SELECT
    USING (
        fn_get_caller_role() IN ('admin', 'staff')
        OR (
            fn_get_caller_role() = 'student'
            AND athlete_id IN (
                SELECT a.id FROM athletes a
                JOIN users u ON a.user_id = u.id
                WHERE u.user_auth_id = auth.uid()
            )
        )
        OR (
            fn_get_caller_role() = 'coach'
            AND coach_id IN (
                SELECT c.id FROM coaches c
                JOIN users u ON c.user_id = u.id
                WHERE u.user_auth_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "borrowing_items: role-filtered read" ON borrowing_items;
CREATE POLICY "borrowing_items: role-filtered read"
    ON borrowing_items FOR SELECT
    USING (
        fn_get_caller_role() IN ('admin', 'staff')
        OR (
            fn_get_caller_role() = 'student'
            AND transaction_id IN (
                SELECT bt.id
                FROM borrowing_transactions bt
                JOIN athletes a ON bt.athlete_id = a.id
                JOIN users u ON a.user_id = u.id
                WHERE u.user_auth_id = auth.uid()
            )
        )
        OR (
            fn_get_caller_role() = 'coach'
            AND transaction_id IN (
                SELECT bt.id
                FROM borrowing_transactions bt
                JOIN coaches c ON bt.coach_id = c.id
                JOIN users u ON c.user_id = u.id
                WHERE u.user_auth_id = auth.uid()
            )
        )
    );
