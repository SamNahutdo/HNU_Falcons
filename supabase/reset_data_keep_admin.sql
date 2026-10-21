-- DESTRUCTIVE: removes all rows from the application tables and seeds one admin.
-- Keeps the existing schema, views, functions, triggers, and policies.
-- Run this manually in the Supabase SQL Editor after taking a backup.
--
-- This creates a row in public.users only. It does not create a Supabase Auth
-- user or connect this account to the app's current browser-local login flow.

BEGIN;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS school_id VARCHAR(15);

TRUNCATE TABLE
    audit_logs,
    maintenance_records,
    borrowing_items,
    borrowing_transactions,
    team_members,
    equipment,
    teams,
    sports,
    coaches,
    athletes,
    users,
    roles
RESTART IDENTITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_school_id_format_check'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_school_id_format_check
            CHECK (school_id IS NULL OR school_id ~ '^[0-9]{7,15}$');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'users_school_id_unique'
          AND conrelid = 'public.users'::regclass
    ) THEN
        ALTER TABLE public.users
            ADD CONSTRAINT users_school_id_unique UNIQUE (school_id);
    END IF;
END
$$;

INSERT INTO roles (id, name, description)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'admin',
    'Athletic department administrator'
);

INSERT INTO users (id, school_id, email, full_name, role_id, status)
VALUES (
    '10000000-0000-0000-0000-000000000001',
    '06000000',
    'arbe@gmail.com',
    'Prof. Arbe',
    '00000000-0000-0000-0000-000000000001',
    'active'
);

COMMIT;

-- Verify that the admin remains and all other application tables are empty.
SELECT u.id, u.school_id, u.email, u.full_name, r.name AS role, u.status
FROM users AS u
JOIN roles AS r ON r.id = u.role_id;

SELECT
    (SELECT count(*) FROM athletes) AS athletes,
    (SELECT count(*) FROM audit_logs) AS audit_logs,
    (SELECT count(*) FROM borrowing_items) AS borrowing_items,
    (SELECT count(*) FROM borrowing_transactions) AS borrowing_transactions,
    (SELECT count(*) FROM coaches) AS coaches,
    (SELECT count(*) FROM equipment) AS equipment,
    (SELECT count(*) FROM maintenance_records) AS maintenance_records,
    (SELECT count(*) FROM sports) AS sports,
    (SELECT count(*) FROM team_members) AS team_members,
    (SELECT count(*) FROM teams) AS teams,
    (SELECT count(*) FROM roles WHERE name <> 'admin') AS non_admin_roles,
    (SELECT count(*) FROM users WHERE id <> '10000000-0000-0000-0000-000000000001') AS non_admin_users;



