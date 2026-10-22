# DATABASE DEFENSE & GRADING SCRIPT
## Falcon Athletics Resource & Equipment ERP (FARE-ERP)
### Advanced Database Systems (IM101a) — Course Project Defense

---

> **Deployment**: GitHub Pages (CI/CD via `.github/workflows/deploy.yml`).
> **Database**: Supabase Cloud PostgreSQL — live 24/7 at the project URL in `.env`.
> **Backend API**: Supabase Edge Functions (`supabase/functions/api/index.ts`).

---

## 1. 2-Minute Project Elevator Pitch

> *"Good morning, Professor and panel members. We present the Falcon Athletics Resource & Equipment ERP — a mission-critical enterprise inventory and logistics system for a university athletic department.*
>
> *The system is built on four pillars of formal database engineering:*
>
> *First, a strictly normalized schema: 12 tables in 3rd Normal Form, with two junction tables carrying their own intersection attributes and composite unique constraints. Coaches now carry their own role, properly separated from admin — four distinct roles in total.*
>
> *Second, server-side automation: four PL/pgSQL triggers (two audit triggers covering equipment and borrowing transactions, one audit trigger for maintenance records, and one stock-replenishment trigger), two ACID-compliant RPC stored procedures with pessimistic row-level locking, one immutable stored function, and two reporting views.*
>
> *Third, genuine role-based access control: Row Level Security is enabled on all 12 tables, and every policy evaluates `auth.uid()` against a role lookup — not a blanket `USING (true)`. Admin, staff, coach, and student roles each see and can modify only what their role permits.*
>
> *Fourth, a backend API layer: a Supabase Edge Function (Deno/TypeScript) acts as the server-side framework, validates JWTs, enforces role checks in server-side code, and routes all mutation operations through the RPC layer.*
>
> *The entire database is hosted on Supabase Cloud PostgreSQL, connected to a React + Vite TypeScript frontend deployed on GitHub Pages. Performance is evidenced by EXPLAIN ANALYZE results and index usage statistics in `supabase/performance_report.sql`.*"

---

## 2. Table-by-Table 3NF Normalization Defense

When the panel asks: *"Walk us through how your database achieves 3NF."*

### 1st Normal Form (1NF)
- Every column in every table contains **atomic, indivisible values**
- Sport disciplines, equipment categories, and roles are never stored as comma-delimited strings inside a single column
- Every record has a **unique, non-null, surrogate Primary Key** (`UUID v4` via `gen_random_uuid()`)

### 2nd Normal Form (2NF)
- There are **zero partial dependencies** on candidate keys
- In our two Many-to-Many junction tables:
  - **`team_members`**: `position`, `jersey_number`, and `joined_at` depend **entirely** on the composite key `(team_id, athlete_id)` — not just on `team_id` or `athlete_id` alone
  - **`borrowing_items`**: `quantity`, `returned_quantity`, `condition_before`, and `condition_after` depend **entirely** on the composite key `(transaction_id, equipment_id)`

### 3rd Normal Form (3NF)
- There are **zero transitive dependencies** (A→B and B→C, where C depends on B not on A)
- **User Subtyping**: `athletes` and `coaches` do **not** repeat `full_name`, `email`, or `role_id`. Both reference `users(id)` via a 1:1 FK — preventing update anomalies
- **Sports & Categories**: `equipment.sport_id` references `sports(id)` instead of embedding `sport_name` or `category` inline — changing a sport name does not create an update anomaly in 50 equipment rows
- **Role Separation**: `users.role_id` references `roles(id)` — role descriptions are stored once

---

## 3. RBAC & Row Level Security

When the panel asks: *"How does your system enforce role-based access control?"*

### Four Application Roles
| Role | DB Role Name | Access Level |
|------|-------------|--------------|
| Director / Admin | `admin` | Full CRUD on all tables; exclusive access to audit_logs |
| Staff / Custodian | `staff` | CRUD on equipment, transactions, maintenance; read athletes/teams |
| Athletic Coach | `coach` | Read-only on their own team's athletes and transactions |
| Student Athlete | `student` | Read equipment; own transactions only |

### How RLS is Enforced
1. **`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`** is applied to **all 12 tables**
2. Every SELECT policy calls `auth.uid()` — anonymous (unauthenticated) requests receive **zero rows**
3. Role identity is resolved server-side via `fn_get_caller_role()`, which joins `users` → `roles` on `user_auth_id = auth.uid()`. This function runs as `SECURITY DEFINER` so it can read across the role table without bypassing user-level isolation
4. Mutation policies (`FOR ALL`) check `fn_get_caller_role() IN ('admin', 'staff')` before allowing writes — even a direct `psql` connection using the anon key will be blocked if the JWT role is not admin/staff
5. Students can only `SELECT` their own `borrowing_transactions` rows via:
   ```sql
   USING (athlete_id IN (
     SELECT a.id FROM athletes a JOIN users u ON a.user_id = u.id
     WHERE u.user_auth_id = auth.uid()
   ))
   ```

### What was fixed (vs. the original schema)
The original policies used `USING (true)` — equivalent to no access control. These have been fully replaced with `auth.uid()`-based policies as described above.

---

## 4. Server-Side Automation (Triggers & Stored Procedures)

When the panel asks: *"Show us your server-side database programming."*

### A. Why Not Client-Side Logic?
If checkout logic runs on the frontend:
1. A malicious client bypasses stock validation → **negative inventory**
2. Two simultaneous checkouts for 1 remaining item → **oversold equipment**
3. A network drop between INSERT header and INSERT items → **orphan transaction records**

### B. Our Four Triggers

| # | Trigger Name | Table | Fires On | Effect |
|---|-------------|-------|----------|--------|
| 1 | `trg_audit_equipment_changes` | `equipment` | AFTER INSERT/UPDATE/DELETE | Writes old+new row as JSONB to `audit_logs`, records `auth.uid()` |
| 2 | `trg_auto_update_stock_on_return` | `borrowing_items` | BEFORE UPDATE of `returned_quantity` | Increments `equipment.available_quantity`, derives status, uses `FOR UPDATE` lock |
| 3 | `trg_audit_borrowing_transaction_changes` | `borrowing_transactions` | AFTER INSERT/UPDATE/DELETE | Full audit trail for every loan mutation |
| 4 | `trg_audit_maintenance_changes` | `maintenance_records` | AFTER INSERT/UPDATE/DELETE | Audit trail for every maintenance record mutation |

### C. Two ACID Stored Procedures (RPC)

**`checkout_equipment()`**
- Role check: raises exception if caller is not admin/staff
- Date validation: past return dates are rejected
- Athlete existence check
- Pessimistic locking: `SELECT ... FOR UPDATE` on each equipment row
- Stock sufficiency check with explicit error message
- Atomic: failure on any item rolls back the entire transaction

**`return_borrowed_items()`**
- Role check: raises exception if caller is not admin/staff
- Updates `returned_quantity` and `condition_after` per item
- The `trg_auto_update_stock_on_return` trigger fires automatically, restoring inventory
- Sets transaction status to `returned` or `partially_returned`

### D. Stored Function & Views

- **`fn_calculate_overdue_days()`**: `IMMUTABLE` function computing date delta, used inside `vw_active_loans_summary`
- **`vw_active_loans_summary`**: Aggregated view with loan urgency labels (`OVERDUE`, `Active / On Schedule`, `Returned on Time`)
- **`vw_equipment_inventory_status`**: Aggregated view with utilization rates and stock health labels

---

## 5. Backend Framework (Edge Function API)

When the panel asks: *"Where is your backend framework?"*

The project uses **Supabase Edge Functions** (Deno/TypeScript runtime) as the server-side backend layer (`supabase/functions/api/index.ts`).

**Why Edge Functions satisfy the backend-framework requirement:**
- They run **server-side** in an isolated Deno runtime — not in the browser
- All database mutations route through the Edge Function, which validates JWTs and enforces role checks **before** any SQL executes
- The function returns structured JSON responses with proper HTTP status codes
- It is deployed and managed separately from the frontend (different process, different URL)

**Available API Routes:**
| Method | Route | Role Required |
|--------|-------|---------------|
| GET | `/api/me` | Any authenticated |
| GET | `/api/equipment` | Any authenticated |
| POST | `/api/checkout` | admin, staff |
| POST | `/api/return` | admin, staff |
| POST | `/api/maintenance` | admin, staff |
| GET | `/api/transactions` | Any authenticated (RLS filters by role) |
| GET | `/api/audit-logs` | admin only |

---

## 6. Live Q&A Defense Cheat Sheet

### Q1: "Why did you use ON DELETE RESTRICT on foreign keys?"
> In an enterprise athletics ERP, historical records have legal and financial significance. If an administrator deletes a coach, athlete, or piece of equipment that has past borrowing transactions, `ON DELETE CASCADE` would silently purge those records and destroy audit compliance. `ON DELETE RESTRICT` forces the administrator to archive or resolve dependent records before deletion — preserving historical integrity.

### Q2: "What is the difference between your two Many-to-Many junction tables?"
> **Junction 1 (`team_members`)** links `teams` and `athletes`. Its intersection attributes model roster logistics: tactical `position`, `jersey_number`, and `joined_at` date. The composite unique constraint `uq_team_athlete` prevents an athlete from appearing in the same squad twice.
>
> **Junction 2 (`borrowing_items`)** links `borrowing_transactions` and `equipment`. Its intersection attributes model inventory custody: `quantity` borrowed, `returned_quantity`, `condition_before`, and `condition_after`. The composite unique constraint `uq_tx_equipment` prevents the same equipment from appearing twice in a single transaction.

### Q3: "How does your system handle overdue equipment?"
> The `IMMUTABLE` function `fn_calculate_overdue_days(p_expected_return_date, p_actual_return_date)` computes `CURRENT_DATE - expected_return_date` when `actual_return_date IS NULL`. This is consumed inside `vw_active_loans_summary`, which labels loans as `OVERDUE` directly at the SQL level — not in the frontend. The admin dashboard also polls the view and sends alerts for every loan where `overdue_days > 0`.

### Q4: "How does Row Level Security protect your system?"
> RLS is enabled on all 12 tables. Every policy uses `auth.uid()` — not `USING (true)`. The `fn_get_caller_role()` helper resolves the caller's role by joining `users` on `user_auth_id = auth.uid()`. Students can only read their own transactions. Coaches can only see athletes from their teams. Audit logs are admin-exclusive. The `checkout_equipment` and `return_borrowed_items` RPCs include an explicit role check that raises an exception if the caller is not admin or staff — even if someone calls the RPC directly via the REST API with a student JWT.

### Q5: "How does your backend prevent concurrent overselling of equipment?"
> The `checkout_equipment` RPC uses **pessimistic locking**: it executes `SELECT ... FOR UPDATE` on each target equipment row inside an explicit transaction. If two simultaneous checkout requests race for the same item, the second request blocks at the lock until the first commits. After the first commits and reduces the stock, the second request reads the new quantity. If the remaining quantity is insufficient, the function raises an exception and rolls back, returning a clear error to the client.

### Q6: "Walk me through your performance indexes."
> We created 24 B-tree indexes on all foreign key columns and high-cardinality filter columns. The three most critical are:
> - `idx_borrowing_transactions_status` — used by every dashboard filter query
> - `idx_equipment_status` — used by the low-stock/out-of-stock alert queries  
> - `idx_audit_logs_created_at DESC` — used by the audit log panel which always reads the most recent records first
>
> `supabase/performance_report.sql` contains 14 `EXPLAIN ANALYZE` queries with annotated expected plans and the `pg_stat_user_indexes` query to show empirical index usage counts.

### Q7: "What is the migration sequence to deploy from scratch?"
> 1. Create a new Supabase project
> 2. Run `supabase/schema.sql` in the SQL Editor (drops & recreates all objects)
> 3. In Supabase Auth, create user accounts for each demo identity and note the `auth.uid()` values
> 4. Run: `UPDATE users SET user_auth_id = '<auth_uid>' WHERE email = '<email>'` for each user
> 5. Deploy the Edge Function: `supabase functions deploy api`
> 6. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env` and push to trigger the GitHub Pages deploy workflow
> 7. Run `supabase/database_tests.sql` to verify all constraints and triggers pass
> 8. Run `supabase/performance_report.sql` to capture EXPLAIN ANALYZE evidence

---

## 7. Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│                 Browser (React + Vite)                  │
│  LoginView → Supabase Auth → JWT token                  │
│  databaseService → Supabase PostgREST (RLS enforced)   │
│  UI Mutation forms → Edge Function API (role check)     │
└────────────────────┬────────────────────────────────────┘
                     │ HTTPS
┌────────────────────▼────────────────────────────────────┐
│             Supabase Cloud (Backend)                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Edge Function (Deno)  /api/*                   │   │
│  │  JWT validation → role check → RPC call         │   │
│  └──────────────────────┬──────────────────────────┘   │
│                         │                               │
│  ┌──────────────────────▼──────────────────────────┐   │
│  │  PostgreSQL + RLS                               │   │
│  │  12 tables  |  4 triggers  |  2 RPC functions  │   │
│  │  2 views    |  24 indexes  |  4 RBAC roles     │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Common Grader Concerns — Pre-Answered

| Concern | Evidence |
|---------|----------|
| RLS uses `USING (true)` | ❌ Fixed: all policies use `auth.uid()` + `fn_get_caller_role()` |
| No backend framework | ✅ `supabase/functions/api/index.ts` — Deno Edge Function with JWT auth |
| Auth uses mock data only | ✅ `authService.signIn()` calls `supabase.auth.signInWithPassword()` |
| Silent mock fallback hides live DB errors | ✅ `liveError()` throws immediately in live mode |
| No performance evidence | ✅ `supabase/performance_report.sql` — 14 EXPLAIN ANALYZE queries |
| No repeatable DB tests | ✅ `supabase/database_tests.sql` — 16 PASS/FAIL test blocks |
| Coach role missing from DB | ✅ Added as 4th role; coaches get `role_id` of coach, not admin |
| Defense guide claims Vercel | ✅ Corrected: deployed to GitHub Pages via `deploy.yml` |
| No data dictionary | See Section 2 (normalization) — all column purposes described |
| Git workflow (no PRs) | See `CONTRIBUTING.md` for branch protection and PR requirements |
