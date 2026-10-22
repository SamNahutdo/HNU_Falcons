# FARE-ERP Database Dictionary Catalog
**Course:** Advanced Database Systems (IM101a)  
**Project:** Falcon Athletics Resource & Equipment ERP  
**Database Provider:** Supabase Cloud PostgreSQL  
**Schema Version:** 1.0.0  
**Last Updated:** 2026-10-22  

---

## Overview

The FARE-ERP database consists of **12 fully normalized tables** (excluding the `roles` lookup table gives 11 core entity/junction tables, but `roles` carries behavioral meaning as an RBAC definition table and is counted). All tables conform to **Third Normal Form (3NF)**.

### Entity Relationship Summary

```
roles ──< users >──── athletes >──< team_members >──< teams >──── coaches
                  \               \                          \
                   \──── coaches   \──< borrowing_transactions \
                                      \                         \
                                       \──< borrowing_items >──── equipment >──< maintenance_records
                                                                        \
                                                                         \──── sports
                                       audit_logs ────────────────────────────────
```

### Table Count

| # | Table Name | Type | Purpose |
|---|-----------|------|---------|
| 1 | `roles` | Lookup/RBAC | Role definitions |
| 2 | `users` | Entity | Core identity anchor |
| 3 | `athletes` | Entity (Subtype) | Student athlete profiles |
| 4 | `coaches` | Entity (Subtype) | Coach profiles |
| 5 | `sports` | Entity | Sporting discipline catalog |
| 6 | `teams` | Entity | Varsity team groupings |
| 7 | `team_members` | **Junction M:N** | Teams ↔ Athletes |
| 8 | `equipment` | Entity | Equipment inventory |
| 9 | `borrowing_transactions` | Entity | Loan session header |
| 10 | `borrowing_items` | **Junction M:N** | Transactions ↔ Equipment |
| 11 | `maintenance_records` | Entity | Equipment repair log |
| 12 | `audit_logs` | System/Audit | Immutable change trail |

---

## Table 1: `roles`

**Purpose:** Defines the four RBAC user roles. Referenced by `users.role_id`.  
**Normalization:** 1NF–3NF satisfied. No transitive dependencies.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `name` | `VARCHAR(30)` | UNIQUE, NOT NULL | Role identifier: `admin`, `staff`, `coach`, `student` |
| `description` | `TEXT` | NULLABLE | Human-readable role description |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Seed values:** admin, staff, coach, student  
**Referenced by:** `users.role_id`  
**Delete behavior:** ON DELETE RESTRICT (users must be reassigned before a role can be deleted)

---

## Table 2: `users`

**Purpose:** The core identity anchor for all human actors in the system. Links to Supabase Auth via `user_auth_id`. Athletes and coaches are subtypes of this table.  
**Normalization:** 3NF — no transitive dependencies. Role description is in `roles`, not here.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `user_auth_id` | `UUID` | UNIQUE, NULLABLE | Supabase `auth.users.id` for JWT mapping |
| `school_id` | `VARCHAR(15)` | UNIQUE, NULLABLE | Institutional ID (e.g., 2023-10892) |
| `email` | `VARCHAR(255)` | UNIQUE, NOT NULL | Login email |
| `full_name` | `VARCHAR(150)` | NOT NULL | Display name |
| `role_id` | `UUID` | FK → roles(id), NOT NULL | RBAC role assignment |
| `status` | `VARCHAR(20)` | CHECK IN ('active','inactive','suspended') | Account status |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Indexes:** `idx_users_auth_id` (user_auth_id), `idx_users_role_id` (role_id), `idx_users_email` (email)  
**Referenced by:** `athletes.user_id`, `coaches.user_id`, `borrowing_transactions.approved_by`, `maintenance_records.reported_by`, `audit_logs.performed_by`

---

## Table 3: `athletes`

**Purpose:** 1:1 specialization of `users` for varsity student athletes. Contains only athlete-specific attributes — personal data like full_name and email stays in `users` (3NF: no transitive dependencies).  
**Normalization:** 3NF — all non-key attributes depend solely on the PK `id`.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `user_id` | `UUID` | UNIQUE, FK → users(id), NOT NULL | 1:1 link to users |
| `student_number` | `VARCHAR(30)` | UNIQUE, NOT NULL | Official student number |
| `department` | `VARCHAR(100)` | NOT NULL | College/department |
| `year_level` | `INT` | CHECK (1–6), NOT NULL | Academic year (1–6) |
| `emergency_contact` | `VARCHAR(100)` | NOT NULL | Emergency contact number |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Indexes:** `idx_athletes_user_id`, `idx_athletes_student_number`  
**Foreign key behaviors:** `user_id` ON DELETE RESTRICT  
**Referenced by:** `team_members.athlete_id`, `borrowing_transactions.athlete_id`

---

## Table 4: `coaches`

**Purpose:** 1:1 specialization of `users` for athletic coaches. Carries professional certification attributes. The `coach` role in `roles` is distinct from `admin` and `staff`.  
**Normalization:** 3NF — no partial or transitive dependencies.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `user_id` | `UUID` | UNIQUE, FK → users(id), NOT NULL | 1:1 link to users |
| `employee_number` | `VARCHAR(30)` | UNIQUE, NOT NULL | HR employee identifier |
| `specialization` | `VARCHAR(100)` | NOT NULL | Sport specialization |
| `license_level` | `VARCHAR(50)` | NOT NULL | Coaching certification level |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Indexes:** `idx_coaches_user_id`, `idx_coaches_employee_number`  
**Referenced by:** `teams.coach_id`

---

## Table 5: `sports`

**Purpose:** Master catalog of sporting disciplines. Equipment and teams both reference sports, avoiding sport-name duplication (3NF: sport_name stored once, referenced by FK).

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `name` | `VARCHAR(100)` | UNIQUE, NOT NULL | Sport name (e.g., Basketball) |
| `category` | `VARCHAR(50)` | NOT NULL | `team_sport` or `individual_sport` |
| `status` | `VARCHAR(20)` | DEFAULT 'active' | `active` or `inactive` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Referenced by:** `teams.sport_id`, `equipment.sport_id`

---

## Table 6: `teams`

**Purpose:** Represents a varsity team for a specific sport, coached by a specific coach, in a given school year. The unique constraint on (sport_id, team_name, school_year) prevents duplicate rosters.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `sport_id` | `UUID` | FK → sports(id), NOT NULL | Sport this team plays |
| `coach_id` | `UUID` | FK → coaches(id), NOT NULL | Assigned head coach |
| `team_name` | `VARCHAR(150)` | NOT NULL | Official team name |
| `school_year` | `VARCHAR(20)` | NOT NULL | e.g., 2024-2025 |
| `status` | `VARCHAR(20)` | DEFAULT 'active' | `active`, `dissolved`, `inactive` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Unique constraint:** `uq_team_sport_year` on (sport_id, team_name, school_year)  
**Indexes:** `idx_teams_sport_id`, `idx_teams_coach_id`  
**Referenced by:** `team_members.team_id`

---

## Table 7: `team_members` ⭐ Junction Table 1 (M:N)

**Purpose:** Resolves the M:N relationship between `teams` and `athletes`. One athlete can be on multiple teams across school years; one team has many athletes.  
**Junction attributes:** `position`, `jersey_number`, `joined_at`, `status` — these attributes depend on BOTH `team_id` AND `athlete_id` (2NF satisfied).

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `team_id` | `UUID` | FK → teams(id), NOT NULL | Participating team |
| `athlete_id` | `UUID` | FK → athletes(id), NOT NULL | Participating athlete |
| `position` | `VARCHAR(50)` | NOT NULL | **Intersection attribute:** playing position |
| `jersey_number` | `INT` | NULLABLE | **Intersection attribute:** jersey number |
| `joined_at` | `DATE` | DEFAULT CURRENT_DATE | **Intersection attribute:** roster join date |
| `status` | `VARCHAR(20)` | DEFAULT 'active' | **Intersection attribute:** `active`, `benched`, `transferred` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Unique constraint:** `uq_team_athlete` on (team_id, athlete_id) — prevents duplicate roster entries  
**Indexes:** `idx_team_members_team_id`, `idx_team_members_athlete_id`, `idx_team_members_status`  
**Foreign key behaviors:** Both FKs use ON DELETE RESTRICT

---

## Table 8: `equipment`

**Purpose:** Equipment inventory catalog. Tracks total and available quantities, condition, and operational status. Availability is managed by the `trg_auto_update_stock_on_return` trigger automatically.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `sport_id` | `UUID` | FK → sports(id), NOT NULL | Sport this equipment belongs to |
| `equipment_code` | `VARCHAR(50)` | UNIQUE, NOT NULL | Human-readable code (e.g., EQ-BB-001) |
| `name` | `VARCHAR(150)` | NOT NULL | Equipment display name |
| `category` | `VARCHAR(50)` | NOT NULL | e.g., Ball, Uniform, Net |
| `total_quantity` | `INT` | CHECK (≥ 0), NOT NULL | Total items owned |
| `available_quantity` | `INT` | CHECK (≥ 0, ≤ total_quantity), NOT NULL | Currently available for loan |
| `condition` | `VARCHAR(30)` | DEFAULT 'good' | `new`, `good`, `fair`, `needs_maintenance`, `damaged` |
| `status` | `VARCHAR(30)` | DEFAULT 'available' | `available`, `low_stock`, `out_of_stock`, `under_maintenance`, `retired` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Last modification timestamp (auto-updated by trigger) |

**Indexes:** `idx_equipment_sport_id`, `idx_equipment_status`, `idx_equipment_code` (unique)  
**Triggers:** `trg_audit_equipment_changes` (INSERT/UPDATE/DELETE → audit_logs)  
**Referenced by:** `borrowing_items.equipment_id`, `maintenance_records.equipment_id`

---

## Table 9: `borrowing_transactions`

**Purpose:** Header record for an equipment loan session. One transaction can cover multiple equipment items (resolved through `borrowing_items`). Tracks the complete loan lifecycle from pending → active → returned.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `athlete_id` | `UUID` | FK → athletes(id), NOT NULL | The borrowing athlete |
| `approved_by` | `UUID` | FK → users(id), NULLABLE | Staff/admin who approved |
| `borrow_date` | `TIMESTAMPTZ` | DEFAULT NOW() | Timestamp of checkout |
| `expected_return_date` | `DATE` | NOT NULL | Due date |
| `actual_return_date` | `TIMESTAMPTZ` | NULLABLE | Set on full return |
| `status` | `VARCHAR(30)` | DEFAULT 'pending' | `pending`, `active`, `overdue`, `returned`, `partially_returned` |
| `remarks` | `TEXT` | NULLABLE | Staff notes |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Indexes:** `idx_borrowing_transactions_athlete`, `idx_borrowing_transactions_status`, `idx_borrowing_transactions_date`  
**Foreign key behaviors:** `athlete_id` ON DELETE RESTRICT, `approved_by` ON DELETE SET NULL  
**Triggers:** `trg_audit_borrowing_transaction_changes` (INSERT/UPDATE/DELETE → audit_logs)  
**Referenced by:** `borrowing_items.transaction_id`

---

## Table 10: `borrowing_items` ⭐ Junction Table 2 (M:N)

**Purpose:** Resolves the M:N relationship between `borrowing_transactions` and `equipment`. One transaction covers multiple equipment items; one piece of equipment appears in many transactions.  
**Junction attributes:** `quantity`, `returned_quantity`, `condition_before`, `condition_after`, `return_status` — all depend on the composite key (transaction_id, equipment_id).

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `transaction_id` | `UUID` | FK → borrowing_transactions(id), NOT NULL | Parent loan session |
| `equipment_id` | `UUID` | FK → equipment(id), NOT NULL | Equipment item loaned |
| `quantity` | `INT` | CHECK (≥ 1), NOT NULL | **Intersection attribute:** units borrowed |
| `returned_quantity` | `INT` | CHECK (≥ 0), DEFAULT 0 | **Intersection attribute:** units returned so far |
| `condition_before` | `VARCHAR(30)` | DEFAULT 'good' | **Intersection attribute:** condition at checkout |
| `condition_after` | `VARCHAR(30)` | NULLABLE | **Intersection attribute:** condition at return |
| `return_status` | `VARCHAR(30)` | DEFAULT 'borrowed' | **Intersection attribute:** `borrowed`, `returned`, `partial`, `lost` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Unique constraint:** `uq_tx_equipment` on (transaction_id, equipment_id) — same equipment cannot appear twice in one transaction  
**Indexes:** `idx_borrowing_items_transaction`, `idx_borrowing_items_equipment`  
**Triggers:** `trg_auto_update_stock_on_return` — BEFORE UPDATE on `returned_quantity` → auto-increments `equipment.available_quantity`

---

## Table 11: `maintenance_records`

**Purpose:** Tracks all equipment maintenance, repair, and servicing events. Audited by the `trg_audit_maintenance_changes` trigger.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `equipment_id` | `UUID` | FK → equipment(id), NOT NULL | Equipment being serviced |
| `reported_by` | `UUID` | FK → users(id), NOT NULL | Staff who reported the issue |
| `issue_description` | `TEXT` | NOT NULL | Description of the problem |
| `scheduled_date` | `DATE` | NOT NULL | Date of scheduled service |
| `cost` | `DECIMAL(10,2)` | DEFAULT 0.00 | Repair/service cost in PHP |
| `status` | `VARCHAR(30)` | DEFAULT 'pending' | `pending`, `in_progress`, `completed`, `cancelled` |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | Record creation timestamp |

**Indexes:** `idx_maintenance_equipment`, `idx_maintenance_status`, `idx_maintenance_date`  
**Foreign key behaviors:** Both FKs use ON DELETE RESTRICT  
**Triggers:** `trg_audit_maintenance_changes` (INSERT/UPDATE/DELETE → audit_logs)

---

## Table 12: `audit_logs`

**Purpose:** Immutable, trigger-populated table. Records every INSERT, UPDATE, and DELETE on `equipment`, `borrowing_transactions`, and `maintenance_records`. This table is **never written to by application code** — only by PL/pgSQL trigger functions.

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | `UUID` | PK, DEFAULT gen_random_uuid() | Surrogate primary key |
| `table_name` | `VARCHAR(50)` | NOT NULL | Which table was mutated |
| `record_id` | `UUID` | NULLABLE | PK of the affected row |
| `action_type` | `VARCHAR(10)` | CHECK IN ('INSERT','UPDATE','DELETE') | DML operation type |
| `old_data` | `JSONB` | NULLABLE | Previous row state (NULL for INSERT) |
| `new_data` | `JSONB` | NULLABLE | New row state (NULL for DELETE) |
| `performed_by` | `UUID` | FK → users(id), NULLABLE | App user who triggered the change |
| `performed_by_auth` | `UUID` | NULLABLE | Supabase auth.uid() at time of change |
| `ip_address` | `VARCHAR(45)` | NULLABLE | Client IP (populated if passed) |
| `created_at` | `TIMESTAMPTZ` | DEFAULT NOW() | When the change occurred |

**Indexes:** `idx_audit_logs_table_record` (table_name, record_id), `idx_audit_logs_created_at DESC`, `idx_audit_logs_performed_by`  
**Write source:** PL/pgSQL trigger functions only — never direct application INSERT

---

## Database Automation Objects

### Triggers

| # | Trigger Name | Table | Event | Timing | Effect |
|---|-------------|-------|-------|--------|--------|
| 1 | `trg_audit_equipment_changes` | `equipment` | INSERT, UPDATE, DELETE | AFTER | Writes old/new JSONB to `audit_logs` |
| 2 | `trg_audit_borrowing_transaction_changes` | `borrowing_transactions` | INSERT, UPDATE, DELETE | AFTER | Writes old/new JSONB to `audit_logs` |
| 3 | `trg_audit_maintenance_changes` | `maintenance_records` | INSERT, UPDATE, DELETE | AFTER | Writes old/new JSONB to `audit_logs` |
| 4 | `trg_auto_update_stock_on_return` | `borrowing_items` | UPDATE of `returned_quantity` | BEFORE | Increments `equipment.available_quantity`; updates `equipment.status` |

### Stored Procedures (RPC)

| # | Function Name | Language | Description |
|---|--------------|----------|-------------|
| 1 | `checkout_equipment(p_athlete_id, p_items, p_expected_return, p_approved_by, p_remarks)` | PL/pgSQL | ACID checkout — role check, date validation, `SELECT FOR UPDATE` locking, stock decrement, atomic INSERT of transaction + items |
| 2 | `return_borrowed_items(p_transaction_id, p_items, p_received_by)` | PL/pgSQL | ACID return — role check, updates returned_quantity, triggers stock restoration, updates transaction status |

### Stored Functions

| # | Function Name | Returns | Description |
|---|--------------|---------|-------------|
| 1 | `fn_calculate_overdue_days(expected, actual)` | `INT` | IMMUTABLE — computes days overdue; 0 if not overdue or already returned |
| 2 | `fn_get_caller_role()` | `VARCHAR` | STABLE SECURITY DEFINER — resolves caller's role from auth.uid() for RLS policies |

### Views

| # | View Name | Source Tables | Description |
|---|-----------|--------------|-------------|
| 1 | `vw_active_loans_summary` | borrowing_transactions, borrowing_items, athletes, users, equipment | Aggregated active/overdue loans with `fn_calculate_overdue_days()` and urgency labels |
| 2 | `vw_equipment_inventory_status` | equipment, sports, maintenance_records, borrowing_items | Utilization rates, maintenance counts, loan counts, and stock health labels |

---

## Indexes Reference

| # | Index Name | Table | Columns | Type |
|---|-----------|-------|---------|------|
| 1 | `idx_users_auth_id` | users | user_auth_id | B-tree |
| 2 | `idx_users_role_id` | users | role_id | B-tree |
| 3 | `idx_users_email` | users | email | B-tree |
| 4 | `idx_athletes_user_id` | athletes | user_id | B-tree |
| 5 | `idx_athletes_student_number` | athletes | student_number | B-tree |
| 6 | `idx_coaches_user_id` | coaches | user_id | B-tree |
| 7 | `idx_coaches_employee_number` | coaches | employee_number | B-tree |
| 8 | `idx_teams_sport_id` | teams | sport_id | B-tree |
| 9 | `idx_teams_coach_id` | teams | coach_id | B-tree |
| 10 | `idx_team_members_team_id` | team_members | team_id | B-tree |
| 11 | `idx_team_members_athlete_id` | team_members | athlete_id | B-tree |
| 12 | `idx_team_members_status` | team_members | status | B-tree |
| 13 | `idx_equipment_sport_id` | equipment | sport_id | B-tree |
| 14 | `idx_equipment_status` | equipment | status | B-tree |
| 15 | `idx_equipment_code` | equipment | equipment_code | B-tree (unique) |
| 16 | `idx_borrowing_transactions_athlete` | borrowing_transactions | athlete_id | B-tree |
| 17 | `idx_borrowing_transactions_status` | borrowing_transactions | status | B-tree |
| 18 | `idx_borrowing_transactions_date` | borrowing_transactions | expected_return_date | B-tree |
| 19 | `idx_borrowing_items_transaction` | borrowing_items | transaction_id | B-tree |
| 20 | `idx_borrowing_items_equipment` | borrowing_items | equipment_id | B-tree |
| 21 | `idx_maintenance_equipment` | maintenance_records | equipment_id | B-tree |
| 22 | `idx_maintenance_status` | maintenance_records | status | B-tree |
| 23 | `idx_maintenance_date` | maintenance_records | scheduled_date | B-tree |
| 24 | `idx_audit_logs_table_record` | audit_logs | (table_name, record_id) | B-tree composite |
| 25 | `idx_audit_logs_created_at` | audit_logs | created_at DESC | B-tree |
| 26 | `idx_audit_logs_performed_by` | audit_logs | performed_by | B-tree |

---

## RBAC Roles and Permissions

| Role | Tables Readable | Tables Writable | Special Access |
|------|----------------|----------------|----------------|
| `admin` | All 12 | All 12 | audit_logs (exclusive), DELETE equipment |
| `staff` | All except audit_logs | equipment, borrowing_transactions, borrowing_items, maintenance_records | Can approve checkouts and process returns |
| `coach` | teams, team_members, athletes (own teams only), equipment (read), maintenance (read) | None | Can view their assigned team's data |
| `student` | equipment (read), borrowing_transactions (own only), borrowing_items (own only) | None | RLS: own transactions only via athlete_id → user_auth_id check |

> All permissions are enforced at **two independent layers**: (1) Express.js `requireRole()` middleware in `server/src/middleware/auth.middleware.ts` and (2) Supabase RLS policies on every table using `fn_get_caller_role()`.
