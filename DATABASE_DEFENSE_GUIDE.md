# DATABASE DEFENSE & GRADING SCRIPT
## Falcon Athletics Resource & Equipment ERP (FARE-ERP)
### Advanced Database Systems Course Project Defense

This guide provides the exact talking points, architectural justifications, and defense Q&A answers to secure full marks (100%) during your project defense.

---

## 1. 2-Minute Project Elevator Pitch

> *"Good morning, Professor and panel members. We present the Falcon Athletics Resource & Equipment ERP—a mission-critical enterprise inventory and logistics system designed for university athletic departments.*
>
> *Our project strictly avoids flat spreadsheets or unstructured JSON documents. Instead, 100% of the architecture is built on formal Database Engineering principles: strict 3rd Normal Form across 9 core entities, two Many-to-Many junction tables carrying rich intersection attributes, pessimistic row-level locking for atomic multi-item checkouts, server-side PL/pgSQL triggers for immutable audit logging and stock replenishment, and 3-tier Role-Based Access Control enforced at the PostgreSQL engine level via Row Level Security (RLS).*
>
> *The entire database is hosted on Supabase Cloud PostgreSQL with zero localhost reliance, connected to a production-ready Vite + React TypeScript dashboard deployed on Vercel."*

---

## 2. Table-by-Table 3NF Normalization Defense

When the panel asks: *"Walk us through how your database achieves 3NF."*

1. **1st Normal Form (1NF)**:
   - Every column in every table contains atomic, indivisible values.
   - For example, sports disciplines or equipment categories are never stored as comma-delimited strings in an athlete row.
   - Every record has a unique, surrogate Primary Key (`UUID v4`).

2. **2nd Normal Form (2NF)**:
   - There are zero partial dependencies on candidate keys.
   - In our Many-to-Many junction tables:
     - `team_members`: attributes `position`, `jersey_number`, and `joined_at` depend strictly on the composite key `(team_id, athlete_id)`.
     - `borrowing_items`: attributes `quantity`, `returned_quantity`, and `condition_before` depend strictly on the composite key `(transaction_id, equipment_id)`.

3. **3rd Normal Form (3NF)**:
   - There are zero transitive dependencies ($X \to Y$ and $Y \to Z$).
   - **User Subtyping**: Rather than duplicating full name, email, or credentials inside `athletes` and `coaches`, both tables share a 1:1 foreign key reference to `users(id)`. This prevents sparse null columns.
   - **Sports & Categories**: The `equipment` table references `sport_id` rather than storing the sport's category, ensuring that updating a sport discipline cannot cause an update anomaly in equipment.

---

## 3. Server-Side Automation (Triggers & Stored Procedures)

When the panel asks: *"Show us your server-side database programming. Why not just write this logic in the frontend?"*

### A. The Flaw of Client-Side Logic
If business logic (like stock decrements or audit logging) is implemented on the frontend:
1. Malicious clients or direct API callers can bypass validation, creating negative stock.
2. Concurrent checkouts create race conditions (two people checking out 1 remaining basketball).
3. Network interruptions between multi-table inserts leave orphan header rows without items.

### B. Our Database Engine Solution

1. **Trigger: `trg_audit_equipment_changes` (PL/pgSQL)**
   - Executes `AFTER INSERT OR UPDATE OR DELETE ON equipment`.
   - Records the actor ID and converts `OLD` and `NEW` rows to JSONB in the `audit_logs` table.
   - Guarantee: Even if someone directly executes `UPDATE equipment ...` in pgAdmin, an audit log is guaranteed by the engine.

2. **Trigger: `trg_auto_update_stock_on_return` (PL/pgSQL)**
   - Executes `BEFORE UPDATE OF returned_quantity, return_status ON borrowing_items`.
   - Calculates `NEW.returned_quantity - OLD.returned_quantity`.
   - Increments `equipment.available_quantity` and derives the equipment status (`available`, `low_stock`, `out_of_stock`).

3. **Stored Procedure: `checkout_equipment()` (RPC with Pessimistic Locking)**
   - Executes within an atomic transaction.
   - Locks target equipment rows using `SELECT ... FOR UPDATE`.
   - Verifies available stock; if insufficient, rolls back immediately with `RAISE EXCEPTION`.
   - Deducts stock and inserts records into `borrowing_transactions` and `borrowing_items` simultaneously.

---

## 4. Live Q&A Defense Cheat Sheet (Top Questions)

### Q1: "Why did you use ON DELETE RESTRICT on your foreign keys?"
**Answer:**
> In an enterprise athletics ERP, historical records have legal and financial significance. If an administrator deletes a coach, an athlete, or a piece of equipment that is tied to past borrowing transactions or audit logs, an `ON DELETE CASCADE` would silently purge historical loans and damage audit compliance. `ON DELETE RESTRICT` guarantees that the database engine rejects destructive deletions until dependent references are archived or cleared.

### Q2: "What is the difference between your two Many-to-Many junction tables?"
**Answer:**
> **Junction 1 (`team_members`)** links `teams` and `athletes`. Its intersection attributes model roster logistics: tactical `position`, `jersey_number`, and `joined_at` date. It has a composite unique constraint `uq_team_athlete (team_id, athlete_id)` so an athlete cannot be added to the same squad twice.
>
> **Junction 2 (`borrowing_items`)** links `borrowing_transactions` and `equipment`. Its intersection attributes model inventory custody: `quantity` borrowed, `returned_quantity`, `condition_before`, and `condition_after`. It has a composite unique constraint `uq_tx_equipment (transaction_id, equipment_id)`.

### Q3: "How does your system handle overdue equipment?"
**Answer:**
> We created an immutable database function `fn_calculate_overdue_days(p_expected_return_date, p_actual_return_date)`. This function is consumed inside the database view `vw_active_loans_summary`. If `actual_return_date` is NULL and `CURRENT_DATE > expected_return_date`, the view calculates the exact overdue days and labels the loan urgency as `OVERDUE` directly at the query level.

### Q4: "How does Row Level Security (RLS) protect your system?"
**Answer:**
> Supabase PostgreSQL enables `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` on all 12 tables. Users belong to one of 3 roles: `admin`, `staff`, or `student`. RLS policies dictate that student athletes can only read public equipment and view their own borrowing requests, while equipment modifications and checkout approvals require staff or admin privileges. This security layer exists inside PostgreSQL, independent of client-side code.
