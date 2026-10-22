# FARE-ERP — Team Roles & Responsibilities

**Course:** Advanced Database Systems (IM101a)  
**Group Name:** FARE-ERP Team  
**Section:** IM101a  
**Project:** Falcon Athletics Resource & Equipment ERP (FARE-ERP)  
**Category:** Enterprise Resource Planning (ERP) — Athletics Resource Management

---

## Team Members and Assigned Roles

### Member 1 — Lead Database Administrator (DBA) & Cloud Infrastructure Engineer

**Name:** Rizamae Velasco  
**Responsibilities:**
- Designed the complete relational schema (`supabase/schema.sql`) — 12 tables in 3NF
- Defined all primary keys, foreign keys, and referential integrity constraints
- Configured all ON DELETE RESTRICT behaviors to protect historical data
- Set up the Supabase Cloud PostgreSQL production instance (no localhost)
- Implemented Row Level Security (RLS) on all 12 tables
- Configured firewall and connection pool settings in Supabase dashboard
- Managed environment variable security (anon key only in frontend, service role in server)
- Authored the Prisma ORM schema (`server/prisma/schema.prisma`) mapping all 12 tables
- Produced the database dictionary catalog (`docs/DATABASE_DICTIONARY.md`)
- Produced sequential migration scripts (`supabase/migrations/`)

**Commit signature:** Commits authored by `rizamae-velasco`

---

### Member 2 — Lead Database Programmer & Query Optimization Engineer

**Name:** Sam Udtohan  (Nahutdo)
**Responsibilities:**
- Implemented all 4 PL/pgSQL database triggers:
  - `trg_audit_equipment_changes` (equipment audit)
  - `trg_audit_borrowing_transaction_changes` (borrowing transaction audit)
  - `trg_audit_maintenance_changes` (maintenance audit)
  - `trg_auto_update_stock_on_return` (automatic inventory replenishment)
- Implemented 2 ACID-compliant stored procedures:
  - `checkout_equipment()` with pessimistic row-level locking (`SELECT ... FOR UPDATE`)
  - `return_borrowed_items()` with atomic stock restoration
- Implemented 1 stored function: `fn_calculate_overdue_days()` (IMMUTABLE)
- Implemented `fn_get_caller_role()` (SECURITY DEFINER, used in RLS policies)
- Created 2 database reporting views: `vw_active_loans_summary`, `vw_equipment_inventory_status`
- Designed and applied 24 B-tree indexes for query performance
- Produced all EXPLAIN ANALYZE performance evidence (`supabase/performance_report.sql`)
- Produced the repeatable database test suite (`supabase/database_tests.sql`) — 16 PASS/FAIL tests
- Led optimization analysis: index usage statistics and query plan benchmarking

**Commit signature:** Commits authored by `SamNahutdo`

---

### Member 3 — Frontend/UI Connector & Git Workflow Administrator

**Name:** Ace Arcamo  
**Responsibilities:**
- Built the React + Vite + TypeScript frontend application
- Implemented Supabase Auth integration (`src/services/supabase.ts` — `authService.signIn()`)
- Built the Express.js + Prisma backend API server (`server/`) with full MVC separation
- Connected all UI forms to Express API and Supabase PostgREST endpoints
- Built RBAC-aware dashboard layouts for all 4 roles (admin, staff, coach, student)
- Implemented the checkout and return modal workflows in the UI
- Initialized the GitHub repository and set up branch protection rules
- Configured the CI/CD deployment workflow to GitHub Pages (`.github/workflows/deploy.yml`)
- Established Pull Request review requirements and enforced feature-branch workflow
- Authored `CONTRIBUTING.md` (branch strategy, PR standards, commit conventions)
- Managed all code merges and releases

**Commit signature:** Commits authored by `ace-arcamo`

---

## Role Division Summary

| Role | Member | Primary Files |
|------|--------|--------------|
| DBA & Cloud | Rizamae Velasco | `supabase/schema.sql`, `server/prisma/schema.prisma`, `docs/DATABASE_DICTIONARY.md`, `supabase/migrations/` |
| DB Programmer | Sam Udtohan | Triggers, RPCs, functions, views, indexes, `supabase/database_tests.sql`, `supabase/performance_report.sql` |
| Frontend/Git Admin | Ace Arcamo | `src/`, `server/src/`, `.github/`, `CONTRIBUTING.md`, `README.md` |

> **Note on Git compliance:** Per course requirements, all feature development was done on isolated branches (`feature/`, `db/`, `fix/`) and merged to `develop` and then `main` exclusively through reviewed Pull Requests. The `main` branch has branch protection enabled — direct pushes are rejected.
