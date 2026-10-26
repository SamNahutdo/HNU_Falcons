# FalconSystem Presentation Script

**Target time:** about 7 minutes, including a short demo  
**Presenters:** Riza Velasco, Samuel Angelo Udtohan, Ace Aracamo

## Before presenting — accuracy check

The RLS policies in `supabase/migrations/005_rls_policies.sql` are role-based, but the current combined `supabase/schema.sql` still contains permissive `USING (true)` policies. Before claiming that role restrictions are active in the live database, apply/verify the role-based policies in Supabase and confirm them in the dashboard. If that has not been verified, describe RLS as an implemented migration, not as a confirmed live safeguard.

Use demo accounts and non-sensitive sample data. Have the application, database test results, and performance report ready before starting the timer.

---

## 1. Riza Velasco — Purpose and database design
**Target: 1 minute 45 seconds**

> Good morning. We are presenting **FalconSystem**, the Falcon Athletics Resource and Equipment Management System. It helps an athletics department organize equipment, borrowing and returns, athletes, teams, and maintenance.
>
> The database has 12 related tables. They cover roles and users; athlete and coach profiles; sports, teams, and team memberships; equipment; borrowing transactions and their items; maintenance records; and audit logs.
>
> The design follows the three normalization goals. First, columns hold individual values rather than lists. Second, relationship details in `team_members` and `borrowing_items` belong to the athlete-team or transaction-equipment pair. Third, user details are kept in `users` instead of being repeated in athlete and coach profiles; sports and roles are also stored separately and referenced by keys.
>
> Primary and foreign keys connect the records. Unique and check constraints prevent invalid values, such as duplicate equipment codes, invalid year levels, negative quantities, or returned quantities greater than borrowed quantities. Delete restrictions help preserve records that are referenced by transactions.
>
> This relational structure supports the project’s normalization goal and helps keep updates consistent.

**Demo cue:** Show the database diagram or table list, then point out `team_members` and `borrowing_items`.

---

## 2. Samuel Angelo Udtohan — Database behavior, security, and evidence
**Target: 2 minutes 20 seconds**

> The database does more than store records. It also automates important inventory and audit work.
>
> Four triggers are defined: three record changes to equipment, borrowing transactions, and maintenance in the audit log; the fourth restores available stock when borrowed items are returned.
>
> Two stored procedures handle the main borrowing operations. `checkout_equipment` checks the caller’s role, validates the date and athlete, locks equipment rows while checking stock, and creates the transaction and item records. If a check fails, the database operation rolls back rather than keeping a partial checkout. `return_borrowed_items` records returned quantities and conditions, and updates the transaction’s return status.
>
> The database also includes a function for calculating overdue days and two reporting views: one summarizes active loans and the other summarizes equipment inventory status.
>
> The project defines four roles: admin, staff, coach, and student. Migration 005 enables row-level security across the 12 tables. Its policies limit actions by role; for example, students are restricted to their own borrowing transactions, and audit logs are admin-only. We will show the live policy configuration only after confirming it matches that migration.
>
> For verification, the repository includes a repeatable SQL test suite for constraints, triggers, functions, and other database behavior. It also includes a performance report with `EXPLAIN ANALYZE` queries and index checks. These are evidence tools; we will show the actual results rather than claim results we have not run.

**Demo cue:** Show a checkout/return flow, then the relevant procedure or trigger and the test/performance output.

---

## 3. Ace Aracamo — Application, API, and deployment
**Target: 2 minutes 15 seconds**

> FalconSystem’s interface is built with React, TypeScript, and Vite. After sign-in, users work in a role-specific workspace.
>
> Staff can manage equipment and handle checkouts and returns. Coaches and student athletes have workspaces for team and equipment-related information. The administrator workspace includes management areas such as athletes, teams, equipment, borrowing, maintenance, and audit logs.
>
> A typical borrowing workflow is: staff select an athlete and available equipment, enter quantities and a due date, and submit a checkout. On return, staff record how many items came back and their condition. The database logic updates stock and the transaction status.
>
> The repository includes a Supabase Edge Function API with routes for user profile, equipment, checkout, return, maintenance, transactions, and audit logs. The API checks authentication and role permissions on protected operations. The frontend also has a Supabase client for authentication and data access.
>
> The frontend is built and deployed through GitHub Actions to GitHub Pages. Supabase provides the hosted PostgreSQL database, authentication, and Edge Function platform. Our deployment workflow checks whether Pages is enabled before attempting deployment, so it skips that step with a warning if the repository is not configured.
>
> In summary, FalconSystem combines an operational athletics interface with a structured database, borrowing workflows, role-aware access design, and database verification materials. Thank you. We are ready for your questions.

**Demo cue:** Show sign-in, one role workspace, equipment, checkout/return, and the deployment or API overview. Keep the demo brief.

---

## Timing guide

| Segment | Presenter | Target |
|---|---|---:|
| Purpose and database design | Riza Velasco | 1:45 |
| Database behavior, security, and evidence | Samuel Angelo Udtohan | 2:20 |
| Application, API, deployment, and closing | Ace Aracamo | 2:15 |
| Demo transitions and handoffs | All | 0:30 |
| **Total** |  | **About 6:50** |

If time is short, show only one checkout-and-return flow and point to the test and performance evidence instead of reading SQL.
