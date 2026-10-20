# Falcon Athletics Resource & Equipment ERP (FARE-ERP)
### 3rd-Year IT "Advanced Database Systems" Capstone Web Application

![ERP Status](https://img.shields.io/badge/Status-Production%20Ready-success)
![Database](https://img.shields.io/badge/Database-Supabase%20Cloud%20PostgreSQL-3ecf8e)
![Normalization](https://img.shields.io/badge/Architecture-Strict%203NF-blue)
![Frontend](https://img.shields.io/badge/Frontend-Vite%20%2B%20React%2019%20%2B%20TypeScript-61dafb)
![Deployment](https://img.shields.io/badge/Deployment-Vercel%20SPA-black)

---

## 🦅 System Domain Overview
The **Falcon Athletics Resource & Equipment ERP** is a university athletic department inventory, team roster, and equipment borrowing logistics engine. It replaces paper logbooks and fragmented spreadsheets with a 3NF normalized relational database engine, server-side PL/pgSQL triggers, atomic checkout transactions, and 3-tier Role-Based Access Control (RBAC).

---

## 🏆 Key Database Engineering Highlights (Grading Rubric)

### 1. Strict 3rd Normal Form (3NF) Relational Architecture
- **1NF**: Indivisible atomic values, no repeating groups or comma-separated lists, unique primary keys (UUID v4).
- **2NF**: Zero partial dependencies on composite keys. Every non-key attribute depends on the full candidate key.
- **3NF**: Zero transitive dependencies ($X \to Y$ and $Y \to Z$). Role and identity attributes are decoupled into dedicated lookup entities.
- **Relational Subtyping**: Users are specialized into `athletes` and `coaches` (1:1) to prevent sparse tables and NULL-heavy records.
- **Integrity Constraints**: `ON DELETE RESTRICT` protects parent tables (`sports`, `equipment`, `athletes`) from accidental deletions during manual tests.

### 2. Complex Cardinalities: Two Many-to-Many (N:M) Junctions
1. **`team_members`** (`teams` $\leftrightarrow$ `athletes`):
   - Intersection attributes: `position`, `jersey_number`, `joined_at`, `status`.
   - Composite unique constraint: `uq_team_athlete (team_id, athlete_id)`.
2. **`borrowing_items`** (`borrowing_transactions` $\leftrightarrow$ `equipment`):
   - Intersection attributes: `quantity`, `returned_quantity`, `condition_before`, `condition_after`, `return_status`.
   - Composite unique constraint: `uq_tx_equipment (transaction_id, equipment_id)`.

### 3. Server-Side Automation (PL/pgSQL in Supabase PostgreSQL)
- **Database Trigger 1**: `trg_audit_equipment_changes`
  - Runs `AFTER INSERT OR UPDATE OR DELETE ON equipment`.
  - Automatically writes actor ID and JSON snapshots of `OLD` and `NEW` records to the `audit_logs` table.
- **Database Trigger 2**: `trg_auto_update_stock_on_return`
  - Runs `BEFORE UPDATE OF returned_quantity, return_status ON borrowing_items`.
  - Computes the delta of returned gear and increments `equipment.available_quantity`, recalculating `status` (`available`, `low_stock`, `out_of_stock`).
- **ACID Stored Procedure (RPC)**: `checkout_equipment()`
  - Uses pessimistic locking (`SELECT ... FOR UPDATE`) to prevent race conditions during concurrent checkouts.
  - Decrements inventory atomically and inserts master transaction + junction records.
- **Stored Function**: `fn_calculate_overdue_days()`
  - Engine-level computation of overdue days based on expected return dates.
- **Database Views**:
  - `vw_active_loans_summary`: Real-time loan urgency, overdue days, and outstanding units.
  - `vw_equipment_inventory_status`: Stock health status, utilization %, and active maintenance jobs.

### 4. 3-Tier Role-Based Access Control (RBAC) & Row Level Security (RLS)
- **Admin**: Full oversight over sports, teams, equipment master, users, and audit logs.
- **Staff**: Equipment custodian managing checkouts, returns, stock replenishment, and maintenance records.
- **Student**: Varsity athlete view of assigned team rosters, borrowed equipment, and available items.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Node.js 18+ (tested on Node v22)
- Free Supabase account (at [https://supabase.com](https://supabase.com))

### 2. Install & Run Locally
```bash
# Clone or navigate to the repository
cd IM101_js

# Install dependencies
npm install

# Start Vite dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser.

---

## ☁️ Cloud Deployment Instructions

### Part A: Deploy Database to Supabase (Zero Localhost)
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. In the left sidebar, click **SQL Editor** &rarr; **New Query**.
3. Copy the entire content of [`supabase/schema.sql`](./supabase/schema.sql) and paste it into the SQL editor.
4. Click **Run**. All tables, constraints, indexes, triggers, procedures, views, and seed data will be created instantly.
5. In your Supabase dashboard, go to **Project Settings &rarr; API** and copy:
   - `Project URL`
   - `anon public key`

### Part B: Deploy Frontend to Vercel (1-Click Ready)
1. Push this repository to GitHub.
2. In [Vercel](https://vercel.com), click **Add New Project** and import your repository.
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon public key
4. Click **Deploy**. Vercel will build the Vite React TypeScript application.
5. Single-Page Application (SPA) routing rewrites are configured in [`vercel.json`](./vercel.json).

---

## 📂 Project Architecture

```
IM101_js/
├── supabase/
│   └── schema.sql              # Complete 3NF DDL, triggers, RPCs, views & seed data
├── src/
│   ├── types/
│   │   └── database.ts         # TypeScript schema definitions and views
│   ├── services/
│   │   ├── supabase.ts         # Supabase client with live/mock fallback
│   │   └── mockData.ts         # In-memory reactive DB engine for offline defense
│   ├── components/
│   │   ├── Sidebar.tsx         # Navigation & RBAC role switcher
│   │   ├── Topbar.tsx          # Cloud status pill & quick actions
│   │   ├── SupabaseModal.tsx   # Live connection config & testing modal
│   │   ├── CheckoutModal.tsx   # Atomic checkout transaction wizard
│   │   └── ReturnModal.tsx     # Return reconciliation modal
│   ├── pages/
│   │   ├── DashboardView.tsx   # Real-time telemetry & SQL views
│   │   ├── TeamsView.tsx       # Sports catalog & Junction 1 (team_members)
│   │   ├── EquipmentView.tsx   # Inventory master & maintenance records
│   │   ├── BorrowingView.tsx   # Transaction log & Junction 2 (borrowing_items)
│   │   ├── AthletesView.tsx    # Varsity student profiles
│   │   ├── AuditLogsView.tsx   # Live audit trail from trigger 1
│   │   └── DefenseHubView.tsx  # 3NF proof, trigger code & defense Q&A
│   ├── App.tsx                 # Main application router & coordinator
│   ├── main.tsx                # React DOM root
│   └── index.css               # Modern responsive design system
├── vercel.json                 # Vercel SPA rewrite rule
├── package.json
└── tsconfig.json
```
