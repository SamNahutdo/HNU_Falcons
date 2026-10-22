-- =============================================================================
-- Migration 007: Seed Data
-- Week: Week 2 (CRUD demo milestone)
-- Author: Rizamae Velasco (DBA)
-- Description: Inserts demo data for all 12 tables. Safe to re-run —
--              uses ON CONFLICT DO NOTHING throughout.
--              This is the same seed data as in schema.sql, extracted as
--              its own migration for sequential deployment.
-- Run order: SEVENTH — after all schema and automation migrations
-- =============================================================================

-- ─── Sports ───────────────────────────────────────────────────────────────────
INSERT INTO sports (id, name, category) VALUES
    ('40000000-0000-0000-0000-000000000001', 'Basketball',  'team_sport'),
    ('40000000-0000-0000-0000-000000000002', 'Volleyball',  'team_sport'),
    ('40000000-0000-0000-0000-000000000003', 'Badminton',   'individual_sport'),
    ('40000000-0000-0000-0000-000000000004', 'Swimming',    'individual_sport'),
    ('40000000-0000-0000-0000-000000000005', 'Football',    'team_sport'),
    ('40000000-0000-0000-0000-000000000006', 'Table Tennis','individual_sport')
ON CONFLICT (name) DO NOTHING;

-- ─── Users (admin, staff, coaches, students) ──────────────────────────────────
-- NOTE: user_auth_id must be updated after creating Supabase Auth accounts:
--   UPDATE users SET user_auth_id = '<auth_uid>' WHERE email = '<email>';

INSERT INTO users (id, email, full_name, role_id, school_id, status) VALUES
    -- Admin (no student school ID — NULL bypasses the numeric format check)
    ('10000000-0000-0000-0000-000000000001',
     'admin@falcon.edu', 'Admin Director',
     (SELECT id FROM roles WHERE name = 'admin'), NULL, 'active'),
    -- Staff (NULL — not students)
    ('10000000-0000-0000-0000-000000000002',
     'staff@falcon.edu', 'Maria Santos',
     (SELECT id FROM roles WHERE name = 'staff'), NULL, 'active'),
    ('10000000-0000-0000-0000-000000000003',
     'staff2@falcon.edu', 'Juan Cruz',
     (SELECT id FROM roles WHERE name = 'staff'), NULL, 'active'),
    -- Coaches (NULL — not students)
    ('10000000-0000-0000-0000-000000000004',
     'coach.bball@falcon.edu', 'Coach Ramon Rivera',
     (SELECT id FROM roles WHERE name = 'coach'), NULL, 'active'),
    ('10000000-0000-0000-0000-000000000005',
     'coach.vball@falcon.edu', 'Coach Liza Torres',
     (SELECT id FROM roles WHERE name = 'coach'), NULL, 'active'),
    -- Students (numeric school IDs — pass the format check)
    ('10000000-0000-0000-0000-000000000006',
     '2023-10892@falcon.edu', 'Miguel Reyes',
     (SELECT id FROM roles WHERE name = 'student'), '2023-10892', 'active'),
    ('10000000-0000-0000-0000-000000000007',
     '2023-10893@falcon.edu', 'Ana Dela Cruz',
     (SELECT id FROM roles WHERE name = 'student'), '2023-10893', 'active'),
    ('10000000-0000-0000-0000-000000000008',
     '2023-10894@falcon.edu', 'Carlo Santos',
     (SELECT id FROM roles WHERE name = 'student'), '2023-10894', 'active')
ON CONFLICT (email) DO NOTHING;


-- ─── Coaches ──────────────────────────────────────────────────────────────────
INSERT INTO coaches (id, user_id, employee_number, specialization, license_level) VALUES
    ('20000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000004',
     'EMP-2018-001', 'Basketball', 'National Level A'),
    ('20000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000005',
     'EMP-2019-002', 'Volleyball', 'National Level B')
ON CONFLICT (employee_number) DO NOTHING;

-- ─── Athletes ─────────────────────────────────────────────────────────────────
INSERT INTO athletes (id, user_id, student_number, department, year_level, emergency_contact) VALUES
    ('30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000006',
     '2023-10892', 'College of Engineering', 2, '09171234567'),
    ('30000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000007',
     '2023-10893', 'College of Business', 1, '09182345678'),
    ('30000000-0000-0000-0000-000000000003',
     '10000000-0000-0000-0000-000000000008',
     '2023-10894', 'College of Arts', 3, '09193456789')
ON CONFLICT (student_number) DO NOTHING;

-- ─── Teams ────────────────────────────────────────────────────────────────────
INSERT INTO teams (id, sport_id, coach_id, team_name, school_year) VALUES
    ('50000000-0000-0000-0000-000000000001',
     '40000000-0000-0000-0000-000000000001',
     '20000000-0000-0000-0000-000000000001',
     'Falcons Men Basketball', '2024-2025'),
    ('50000000-0000-0000-0000-000000000002',
     '40000000-0000-0000-0000-000000000002',
     '20000000-0000-0000-0000-000000000002',
     'Falcons Women Volleyball', '2024-2025')
ON CONFLICT ON CONSTRAINT uq_team_sport_year DO NOTHING;

-- ─── Team Members (Junction Table 1) ─────────────────────────────────────────
INSERT INTO team_members (team_id, athlete_id, position, jersey_number) VALUES
    ('50000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001', 'Point Guard', 7),
    ('50000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000002', 'Shooting Guard', 12),
    ('50000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000003', 'Setter', 5)
ON CONFLICT ON CONSTRAINT uq_team_athlete DO NOTHING;

-- ─── Equipment ────────────────────────────────────────────────────────────────
INSERT INTO equipment (id, sport_id, equipment_code, name, category, total_quantity, available_quantity, condition) VALUES
    ('70000000-0000-0000-0000-000000000001',
     '40000000-0000-0000-0000-000000000001',
     'EQ-BB-001', 'Molten BG5000 Official FIBA Basketball', 'Ball', 10, 7, 'good'),
    ('70000000-0000-0000-0000-000000000002',
     '40000000-0000-0000-0000-000000000001',
     'EQ-BB-002', 'Spalding NBA Indoor Basketball', 'Ball', 5, 5, 'new'),
    ('70000000-0000-0000-0000-000000000003',
     '40000000-0000-0000-0000-000000000002',
     'EQ-VB-001', 'Mikasa V200W Volleyball', 'Ball', 8, 8, 'good'),
    ('70000000-0000-0000-0000-000000000004',
     '40000000-0000-0000-0000-000000000003',
     'EQ-BD-001', 'Yonex Voltric Badminton Racket', 'Racket', 20, 18, 'fair'),
    ('70000000-0000-0000-0000-000000000005',
     '40000000-0000-0000-0000-000000000003',
     'EQ-BD-002', 'Yonex Mavis 350 Shuttlecock (tube)', 'Shuttlecock', 50, 45, 'good'),
    ('70000000-0000-0000-0000-000000000006',
     '40000000-0000-0000-0000-000000000005',
     'EQ-FB-001', 'Adidas Finale Football', 'Ball', 6, 6, 'good'),
    ('70000000-0000-0000-0000-000000000007',
     '40000000-0000-0000-0000-000000000006',
     'EQ-TT-001', 'DHS Tournament Table Tennis Paddle', 'Paddle', 12, 10, 'good'),
    ('70000000-0000-0000-0000-000000000008',
     '40000000-0000-0000-0000-000000000001',
     'EQ-BB-003', 'Basketball Net Set (pair)', 'Accessory', 4, 3, 'fair')
ON CONFLICT (equipment_code) DO NOTHING;

-- ─── Borrowing Transactions + Items (Junction Table 2) ────────────────────────
-- Note: In production, use checkout_equipment() RPC. Direct inserts here for seed.
INSERT INTO borrowing_transactions (id, athlete_id, approved_by, expected_return_date, status, borrow_date) VALUES
    ('80000000-0000-0000-0000-000000000001',
     '30000000-0000-0000-0000-000000000001',
     '10000000-0000-0000-0000-000000000002',
     CURRENT_DATE + INTERVAL '7 days', 'active', NOW() - INTERVAL '1 day'),
    ('80000000-0000-0000-0000-000000000002',
     '30000000-0000-0000-0000-000000000002',
     '10000000-0000-0000-0000-000000000002',
     CURRENT_DATE - INTERVAL '3 days', 'overdue', NOW() - INTERVAL '10 days')
ON CONFLICT DO NOTHING;

INSERT INTO borrowing_items (id, transaction_id, equipment_id, quantity, returned_quantity, condition_before, return_status) VALUES
    ('90000000-0000-0000-0000-000000000001',
     '80000000-0000-0000-0000-000000000001',
     '70000000-0000-0000-0000-000000000001',
     3, 0, 'good', 'borrowed'),
    ('90000000-0000-0000-0000-000000000002',
     '80000000-0000-0000-0000-000000000002',
     '70000000-0000-0000-0000-000000000004',
     2, 0, 'fair', 'borrowed')
ON CONFLICT ON CONSTRAINT uq_tx_equipment DO NOTHING;

-- ─── Maintenance Record ───────────────────────────────────────────────────────
INSERT INTO maintenance_records (equipment_id, reported_by, issue_description, scheduled_date, cost, status) VALUES
    ('70000000-0000-0000-0000-000000000007',
     '10000000-0000-0000-0000-000000000002',
     'Rubber grip worn; handle needs replacement', CURRENT_DATE + INTERVAL '7 days', 250.00, 'pending')
ON CONFLICT DO NOTHING;

-- ─── CONFIRM ──────────────────────────────────────────────────────────────────
DO $$ BEGIN
    RAISE NOTICE '[Migration 007] Seed data inserted.';
    RAISE NOTICE '  6 sports, 8 users (1 admin + 2 staff + 2 coaches + 3 students)';
    RAISE NOTICE '  2 coaches, 3 athletes, 2 teams, 3 team_members';
    RAISE NOTICE '  8 equipment items, 2 transactions, 2 borrowing_items, 1 maintenance';
    RAISE NOTICE '';
    RAISE NOTICE '  IMPORTANT: Link Supabase Auth UIDs:';
    RAISE NOTICE '  UPDATE users SET user_auth_id = ''<auth_uid>'' WHERE email = ''<email>'';';
END $$;
