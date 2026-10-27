# 🦅 FalconSystem (FARE-ERP) — Complete Presentation & Defense Script

**Course:** Advanced Database Systems (IM101a)  
**Project:** Falcon Athletics Resource & Equipment ERP (FalconSystem / FARE-ERP)  
**Presenters & Roles:**
1. **Rizamae Velasco** — Lead Database Administrator (DBA) & Cloud Infrastructure Engineer
2. **Samuel Angelo Udtohan (Sam)** — Lead Database Programmer & Query Optimization Engineer
3. **Ace Arcamo** — Frontend/UI Connector & Git Workflow Administrator

**Total Target Duration:** 7 to 9 minutes (Presentation: ~5 mins | Live Demo: ~3 mins | Followed by Q&A Defense)

---

## 📋 Table of Contents
1. [Pre-Presentation Checklist & Environment Setup](#pre-presentation-checklist)
2. [Speaker 1: Rizamae Velasco — Schema Architecture, Normalization & Cloud Infrastructure](#speaker-1-rizamae-velasco)
3. [Speaker 2: Samuel Angelo Udtohan — Database Logic, ACID Stored Procedures, Triggers & Verification](#speaker-2-samuel-angelo-udtohan)
4. [Speaker 3: Ace Arcamo — Application Architecture, Workspaces & Git DevOps](#speaker-3-ace-arcamo)
5. [Live Demonstration Script (Coordinated Click-by-Click)](#live-demonstration-script)
6. [Closing Statement](#closing-statement)
7. [Panelist Defense & Technical Q&A Master Sheet](#panelist-defense--technical-qa)

---

## 🛠️ Pre-Presentation Checklist

Before starting the timer:
- [ ] Open browser tabs:
  - Tab 1: Live Web Application (Login screen ready).
  - Tab 2: Supabase Project Dashboard (`Table Editor`, `SQL Editor`, and `Authentication`).
  - Tab 3: Terminal / GitHub Pages Deployment status.
- [ ] Have SQL Query Editor pre-loaded with:
  - `SELECT * FROM vw_active_loans_summary LIMIT 5;`
  - `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5;`
  - `supabase/database_tests.sql` (to show the 16 PASS test suite).
- [ ] Ensure non-sensitive test accounts are available:
  - Admin: `admin@falcon.edu`
  - Staff: `staff@falcon.edu`
  - Coach: `coach@falcon.edu`
  - Student Athlete: `student@falcon.edu`

---

## 🎙️ Speaker 1: Rizamae Velasco
### Role: Lead DBA & Cloud Infrastructure Engineer
**Target Time:** ~2 minutes 15 seconds  
**Visual Cue:** Show the Entity-Relationship Diagram (ERD) / Database Dictionary (`docs/DATABASE_DICTIONARY.md`) and Supabase Table Editor.

---

### [0:00 - 0:30] Hook & Project Introduction
> "Good morning, respected professors, panel members, and fellow classmates.
> 
> In athletic departments, managing thousands of sports assets across multiple varsity teams, coaches, and student athletes with paper logs or spreadsheets results in duplicate reservations, ghost inventory, lost gear, and zero audit accountability.
> 
> To solve this, our group developed **FalconSystem**—the Falcon Athletics Resource and Equipment ERP. It is an enterprise-grade resource portal designed from the ground up to guarantee strict relational integrity, ACID transactional safety, and automated inventory control.
> 
> As the Lead Database Administrator, I will walk you through our relational schema design, strict 3NF normalization, and cloud database architecture."

---

### [0:30 - 1:15] Schema Architecture & Strict 3rd Normal Form (3NF)
> "Our PostgreSQL database consists of **12 strongly typed, normalized tables** categorized into four core domains:
> 1. **Identity & RBAC:** `roles` and `users`.
> 2. **Athletic Stakeholders:** `athletes` and `coaches`, implemented as 1-to-1 specialized profile extensions of `users`.
> 3. **Sports & Team Roster Domain:** `sports`, `teams`, and the composite junction `team_members`.
> 4. **Resource Management Domain:** `equipment`, `borrowing_transactions`, `borrowing_items`, `maintenance_records`, and `audit_logs`.
> 
> Our schema rigorously satisfies the three normal forms:
> - **First Normal Form (1NF):** Every attribute is strictly atomic. Multi-valued fields have been eliminated; for example, borrowing multiple pieces of equipment is decoupled into line items in `borrowing_items`, and team memberships are broken down per athlete in `team_members`.
> - **Second Normal Form (2NF):** All tables possess unambiguous primary keys (UUIDs). In composite junction tables like `team_members` and `borrowing_items`, every non-key attribute depends entirely on the full composite relation, eliminating partial functional dependencies.
> - **Third Normal Form (3NF):** We eliminated transitive dependencies. User personal details—such as email, password credentials, and active status—exist exclusively in `users`. The `athletes` and `coaches` tables store strictly role-specific domain attributes, referencing `user_id` via unique foreign keys. Sport categories and role names are stored once in their respective master tables rather than duplicated."

---

### [1:15 - 1:55] Constraints, Referential Integrity & Cloud Infrastructure
> "Data integrity is enforced at the database engine level through declarative constraints:
> - **Domain & Check Constraints:** We prevent impossible states directly in the catalog, such as `year_level BETWEEN 1 AND 6`, `jersey_number BETWEEN 0 AND 99`, positive quantities (`CHECK (total_quantity >= 0)`), and logical sanity checks ensuring returned items never exceed borrowed amounts (`CHECK (returned_quantity <= quantity)`).
> - **Referential Integrity & Delete Protection:** To protect institutional history and maintain an unbroken audit trail, all operational foreign keys implement `ON DELETE RESTRICT`. Equipment or athlete profiles with transaction history cannot be orphaned or deleted by rogue application calls.
> - **Cloud Infrastructure:** The production database is hosted on **Supabase Cloud PostgreSQL** with transaction pooling enabled. There is zero localhost dependency. The backend data layer is fully mapped through our Prisma ORM schema (`server/prisma/schema.prisma`), maintaining exact parity between database migrations and API types.
> 
> I now hand over the floor to our Lead Database Programmer, Sam Udtohan, to explain our server-side database programming, procedures, triggers, and optimization."

*(Handoff: Rizamae yields to Sam Udtohan)*

---

## 🎙️ Speaker 2: Samuel Angelo Udtohan (Sam)
### Role: Lead Database Programmer & Query Optimization Engineer
**Target Time:** ~2 minutes 45 seconds  
**Visual Cue:** Show `supabase/schema.sql` (procedures and triggers), then `supabase/database_tests.sql` output and `supabase/performance_report.sql`.

---

### [1:55 - 2:35] Server-Side Logic: 4 Triggers & Autonomous State Maintenance
> "Thank you, Riza. Good day, panel.
> 
> A robust database must not be a passive data bucket; it must actively enforce business rules, concurrency safety, and audit accountability at the storage engine level.
> 
> In FalconSystem, I implemented **4 automated PL/pgSQL triggers**:
> 1. `trg_audit_equipment_changes`: Automatically captures every INSERT, UPDATE, or DELETE on equipment, recording previous and current JSON snapshots, the acting user, and client IP into `audit_logs`.
> 2. `trg_audit_borrowing_transaction_changes`: Streams lifecycle transitions (active, returned, overdue) to the audit log.
> 3. `trg_audit_maintenance_changes`: Logs all maintenance cost adjustments and status transitions.
> 4. `trg_auto_update_stock_on_return`: The core inventory automation. When line items in `borrowing_items` are returned, this trigger automatically increments `available_quantity` in `equipment` and recalibrates status flags between `'available'`, `'low_stock'`, and `'out_of_stock'` without relying on fragile frontend math."

---

### [2:35 - 3:25] ACID Stored Procedures & Pessimistic Concurrency Locking
> "Next, we address race conditions and transactional consistency through **2 ACID-compliant stored procedures**:
> 
> 1. `checkout_equipment()`:
>    - When multiple staff members or athletes attempt to check out limited equipment concurrently, naive systems experience overselling anomalies.
>    - To eliminate race conditions, our checkout procedure executes pessimistic row-level locking: `SELECT available_quantity FROM equipment WHERE id = p_equipment_id FOR UPDATE`.
>    - This locks the exact inventory row until the transaction commits. If requested stock exceeds availability, an exception is raised immediately, triggering a complete transaction rollback.
>    - Upon successful validation, it automatically decrements stock, records the transaction, and binds the items atomically.
> 
> 2. `return_borrowed_items()`:
>    - Handles partial and complete returns, logs item condition flags (good, damaged, lost), records actual return timestamps, and updates overall loan status atomically.
> 
> Additionally, we created:
> - `fn_calculate_overdue_days()`: An `IMMUTABLE` deterministic function calculating late penalties.
> - `fn_get_caller_role()`: A `SECURITY DEFINER` function extracting JWT credentials for Row Level Security.
> - Two real-time reporting views: `vw_active_loans_summary` and `vw_equipment_inventory_status` providing instant dashboard metrics."

---

### [3:25 - 4:10] Query Optimization (EXPLAIN ANALYZE) & Database Verification Suite
> "For performance optimization, we designed and indexed 24 strategic B-tree indexes across all foreign keys, lookup codes, and compound status-date filters.
> 
> In our performance report (`supabase/performance_report.sql`), running `EXPLAIN ANALYZE` confirms:
> - Sequential table scans on high-traffic queries—such as fetching active loans and overdue equipment—are completely eliminated and replaced with **B-tree Index Scans**.
> - Execution times for dashboard feeds consistently benchmark at **under 0.5 milliseconds** with 100% shared buffer cache hits.
> 
> Finally, we believe in verifiable evidence over assumptions. We authored a repeatable **16-test SQL verification suite** (`supabase/database_tests.sql`). It validates constraint violations, triggers, rollback on insufficient stock, and overdue calculations. All 16 automated tests yield a definitive **[PASS]** status.
> 
> I now pass the presentation to Ace Arcamo to discuss the frontend client, backend API, and lead our live demonstration."

*(Handoff: Sam yields to Ace Arcamo)*

---

## 🎙️ Speaker 3: Ace Arcamo
### Role: Frontend/UI Connector & Git Workflow Administrator
**Target Time:** ~2 minutes 15 seconds  
**Visual Cue:** Show React Application UI, GitHub Actions workflow, and start the live interactive checkout demo.

---

### [4:10 - 4:45] Frontend Architecture, RBAC & Backend API
> "Thank you, Sam.
> 
> To bring this database to life for end-users, we built the application with **React 19, TypeScript, and Vite**, paired with an **Express.js and Prisma backend API** and direct Supabase client integration.
> 
> The application implements a true **Role-Based Access Control (RBAC)** architecture with 4 distinct workspaces:
> 1. **Administrator Workspace:** Full administrative oversight over users, teams, inventory, transactions, and real-time audit logs.
> 2. **Staff / Custodian Workspace:** Fast checkout desks, return inspections, inventory condition logging, and maintenance tracking.
> 3. **Coach Workspace:** Roster management, team equipment allocation, and booking schedules.
> 4. **Student Athlete Workspace:** Transparent self-service portal to view borrowed gear, expected return dates, and overdue alerts.
> 
> All UI mutations trigger authenticated calls that validate permissions before hitting the PostgreSQL engine."

---

### [4:45 - 5:15] Git Workflow, Branch Protection & CI/CD Deployment
> "From an engineering and software quality standpoint:
> - Development followed a strict Git feature-branching workflow (`feature/`, `db/`, `fix/`) documented in `CONTRIBUTING.md`.
> - Direct pushes to `main` were protected; all code merges required Pull Requests with peer review.
> - Our automated **GitHub Actions CI/CD pipeline** (`deploy.yml`) builds the TypeScript bundle, runs linting checks, and deploys the production web application directly to **GitHub Pages**.
> 
> Now, we would like to present a live end-to-end demonstration of FalconSystem."

---

## 🖥️ Live Demonstration Script (Coordinated Click-by-Click)
**Target Time:** ~2 minutes 30 seconds  
**Presenters Coordinated:** Ace (Operating UI), Sam (Explaining DB Mechanics), Riza (Highlighting Integrity)

---

### Step 1: Authentication & Role-Based UI
- **Action (Ace):** Log in as Staff (`staff@falcon.edu`).
- **Spoken (Ace):** *"Notice how logging in as Staff immediately curates the workspace: staff members have access to the Inventory Desk, Checkouts, and Returns, but system user management remains locked to Admins."*
- **Action (Ace):** Navigate to the **Equipment Inventory** tab.

### Step 2: Live Stock & Pessimistic Concurrency Checkout
- **Action (Ace):** Show an item—for example, *Mikasa V200W Volleyball* with Available Quantity: `15`. Click **"New Checkout"**.
- **Action (Ace):** Select Athlete *John Doe (Men's Volleyball)*, select *Mikasa V200W*, enter Quantity `2`, set Expected Return Date to next week, and click **Submit Checkout**.
- **Spoken (Sam):** *"Behind the scenes, the `checkout_equipment` stored procedure executed. It locked the equipment row with `FOR UPDATE`, validated that 2 <= 15, inserted the transaction record, created the line item, and decremented available stock to 13. Notice the UI updates immediately to reflect 13 available items."*

### Step 3: Return Workflow & Trigger Execution
- **Action (Ace):** Switch to the **Borrowing Records** tab. Locate the active transaction just created. Click **"Process Return"**.
- **Action (Ace):** Enter Returned Quantity `2`, condition `Good`, and click **Confirm Return**.
- **Spoken (Sam):** *"When Ace clicks confirm, the `return_borrowed_items` procedure updates the transaction status to 'returned'. Simultaneously, our PL/pgSQL trigger `trg_auto_update_stock_on_return` automatically fired on the database engine, returning the available stock back to 15 without manual recalculation."*
- **Action (Ace):** Refresh/view the Inventory list: Available Quantity is restored to `15`.

### Step 4: Immutable Audit Trail Proof
- **Action (Ace):** Log out and log in as Administrator (`admin@falcon.edu`). Navigate to **Audit Logs**.
- **Spoken (Riza):** *"Notice the audit log table. Every action we just completed—from checkout deduction to stock restoration—was captured automatically by `trg_audit_equipment_changes`. The system records the acting user ID, old and new JSON states, timestamp, and action type. Because of our `ON DELETE RESTRICT` constraints, this audit trail is permanent and immutable."*

---

## 🎯 Closing Statement
**Speaker:** Ace Arcamo (supported by Riza & Sam)  
**Target Time:** ~20 seconds

> "In summary, FalconSystem demonstrates how advanced database engineering—strict 3NF schema design, ACID stored procedures, pessimistic locking, automated triggers, B-tree query indexing, and role-based security—combines seamlessly with modern web engineering to solve real-world enterprise resource challenges.
> 
> Thank you very much for your time and attention. Our team is now ready to receive your questions and defend our project."

---

## 🛡️ Panelist Defense & Technical Q&A Master Sheet

Here are anticipated questions from database professors and defense panelists, along with the precise technical answers:

### Q1: Why did you implement checkout logic in a stored procedure instead of handling it in your Express/Node.js backend?
**Answer (Sam Udtohan):**
> *"Handling checkout in application code requires multiple round-trips: reading stock, checking quantity, inserting records, and updating stock. In high-concurrency environments, a classic Time-of-Check to Time-of-Use (TOCTOU) race condition occurs where two users see 1 item in stock and both succeed, creating negative inventory.*
> 
> *By using our PL/pgSQL stored procedure `checkout_equipment()`, all operations occur inside an atomic database transaction. Crucially, we use `SELECT ... FOR UPDATE` to lock the inventory row at the engine level. Any concurrent checkout must wait for the lock. If quantity is insufficient, it rolls back immediately. This guarantees 100% ACID compliance and zero overselling."*

### Q2: How did you ensure your schema adheres to 3rd Normal Form (3NF)? Give a concrete example.
**Answer (Rizamae Velasco):**
> *"A relation is in 3NF if it is in 2NF and has no transitive functional dependencies (where non-key attributes determine other non-key attributes).*
> 
> *In our schema, consider athletes and coaches. In an unnormalized design, an athletes table often contains student name, email, department, year level, and login status. If the student changes their email, or if a user is both an athlete and a student assistant, you get update anomalies.*
> 
> *We separated this into `users` and `athletes`. The `users` table holds primary credentials and identity (`id`, `email`, `role_id`, `status`). The `athletes` table holds strictly student-athlete attributes (`student_number`, `department`, `year_level`, `emergency_contact`) mapped via a 1:1 foreign key `user_id`. Every non-key attribute depends solely on the primary key, eliminating transitive dependencies."*

### Q3: What is the purpose of `trg_auto_update_stock_on_return`, and why not just update stock directly in the return API route?
**Answer (Sam Udtohan):**
> *"Relying on client or API code for inventory replenishment introduces single points of failure. If an admin manually marks an item returned in the database, or an API call drops midway, the inventory count drifts and becomes desynchronized.*
> 
> *By binding `trg_auto_update_stock_on_return` directly to the `borrowing_items` table as an `AFTER UPDATE` trigger, the stock recalculation is guaranteed to fire regardless of how the return was initiated—via frontend, backend API, or direct DBA query. It maintains database self-healing consistency."*

### Q4: Why did you use `ON DELETE RESTRICT` instead of `ON DELETE CASCADE` on your foreign keys?
**Answer (Rizamae Velasco):**
> *"In an ERP system managing physical and financial assets, auditing history is legally and operationally critical. If an administrator accidentally deletes an equipment item, `CASCADE` would silently delete all past borrowing records, transaction items, and maintenance histories associated with it, destroying institutional records.*
> 
> *With `ON DELETE RESTRICT`, PostgreSQL rejects any delete operation on an entity that is referenced by active or historical transactions. If an item is retired or damaged, its status flag is changed to `'retired'` or `'damaged'` rather than being deleted, preserving referential integrity and audit records forever."*

### Q5: How do your B-tree indexes improve performance? What evidence do you have?
**Answer (Sam Udtohan):**
> *"In `supabase/performance_report.sql`, we benchmarked our most frequent query paths using PostgreSQL's `EXPLAIN ANALYZE`. Without indexes, filtering active borrowings or equipment by sport requires a sequential table scan (`Seq Scan`), scanning every row in the heap.*
> 
> *We added 24 targeted B-tree indexes, such as `idx_borrowing_transactions_status` and compound indexes on dates. With these in place, PostgreSQL executes an `Index Scan` with a logarithmic lookup time of O(log N). In our tests with seeded data, query execution times dropped from several milliseconds of disk I/O down to under 0.3 to 0.5 milliseconds, running entirely in shared cache."*

### Q6: How is security handled between the frontend and Supabase? Can a student forge a request to view another student's borrowings?
**Answer (Ace Arcamo & Sam Udtohan):**
> *"No, unauthorized access is prevented at two independent layers:*
> 1. *At the API / Frontend layer, our Supabase auth service passes JWT tokens containing verified user claims.*
> 2. *At the database layer, Row Level Security (RLS) is enabled on all tables via `supabase/migrations/005_rls_policies.sql`. For instance, on `borrowing_transactions`, students have a policy: `USING (athlete_id IN (SELECT id FROM athletes WHERE user_id = auth.uid()))`. Even if a malicious user alters the frontend code or calls the REST endpoint directly, PostgreSQL's RLS engine drops rows that do not belong to their authenticated `auth.uid()`. Audit logs are strictly restricted to the `admin` role via `fn_get_caller_role() = 'admin'`."*

### Q7: If you had to scale this system to 100,000 athletes and 500,000 transactions, what would be your next optimization step?
**Answer (Sam Udtohan & Rizamae Velasco):**
> *"At that volume, we would implement two architectural enhancements:*
> 1. *Table Partitioning: We would partition `borrowing_transactions` and `audit_logs` by range on `created_at` (e.g. annual or quarterly partitions), keeping active transaction indexes small in memory.*
> 2. *Materialized Views: Our reporting views (`vw_equipment_inventory_status`) could be converted to Materialized Views with periodic `REFRESH MATERIALIZED VIEW CONCURRENTLY`, offloading complex analytical aggregation from the live transaction processing path."*

---

## ⏱️ Quick Timekeeper Summary

| Speaker | Section | Target Time | Cumulative Time |
|---|---|---|---|
| **Rizamae Velasco** | Intro, Motivation, 12 Tables, 3NF Normalization, Constraints, Cloud Setup | 2m 15s | 2m 15s |
| **Sam Udtohan** | 4 Triggers, 2 ACID Procedures, Pessimistic Locking, EXPLAIN ANALYZE, 16 Tests | 2m 45s | 5m 00s |
| **Ace Arcamo** | Architecture, 4 Workspaces, Git DevOps, CI/CD Pipeline | 1m 30s | 6m 30s |
| **All (Ace lead)** | Coordinated Live Interactive Demo (Checkout -> Return -> Audit) | 2m 00s | 8m 30s |
| **Team** | Closing statement & transition to Q&A | 0m 20s | 8m 50s |
| **Total** | **Presentation & Demo** | **~8m 50s** | *(Well within standard 10m defense slot)* |
