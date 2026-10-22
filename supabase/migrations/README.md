# Database Migration Scripts

This directory contains the **sequential SQL migration scripts** for the FARE-ERP database.

Run them in numbered order against your Supabase SQL Editor.

---

## Migration Sequence

| File | Description | Week |
|------|-------------|------|
| `001_create_core_entities.sql` | Creates `roles`, `users`, `athletes`, `coaches`, `sports`, `teams` | Week 1–2 |
| `002_create_junction_equipment_audit.sql` | Creates `team_members` (M:N), `equipment`, `borrowing_transactions`, `borrowing_items` (M:N), `maintenance_records`, `audit_logs` | Week 2 |
| `003_create_triggers_procedures.sql` | Creates 4 triggers, `fn_calculate_overdue_days()`, `checkout_equipment()` RPC, `return_borrowed_items()` RPC | Week 5 |
| `004_create_views.sql` | Creates `vw_active_loans_summary` and `vw_equipment_inventory_status` | Week 5 |
| `005_rls_policies.sql` | Enables RLS on all 12 tables; creates role-based access policies | Week 6–7 |
| `006_performance_indexes.sql` | Adds composite and partial indexes based on EXPLAIN ANALYZE results | Week 6–7 |
| `007_seed_data.sql` | Inserts demo data for all user roles, equipment, teams, and transactions | Week 2 |

---

## How to Apply

1. Open the **Supabase Dashboard** → SQL Editor
2. Run each file in order (001 → 007)
3. After applying 007, link Supabase Auth accounts:

```sql
-- For each demo user, create a Supabase Auth account, then:
UPDATE users SET user_auth_id = '<auth_uid>' WHERE email = '<email>';
```

> **Note:** `supabase/schema.sql` is a single-file DROP-and-recreate version of all migrations combined. Use it for a fresh database. Use these migration files to demonstrate iterative, milestone-based development during the defense.

---

## Alternative: Using schema.sql

For a fresh reset:
1. Open `supabase/schema.sql`
2. Run the entire file — it drops all tables and recreates everything including seed data

For the **defense demonstration** of iterative development, use these numbered migration files and point the instructor to the file names to show week-by-week progress.
