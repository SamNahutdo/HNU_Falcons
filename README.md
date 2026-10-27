<div align="center">

  <img src="public/images/Logo.png" alt="FalconSystem Logo" width="160" />

  # 🦅 FalconSystem
  ### **Athletic Equipment & Resource Management System**
  *Advanced Database Systems & Enterprise Resource Allocation Portal*

  <p align="center">
    <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React 19" />
    <img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite 6" />
    <img src="https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase PostgreSQL" />
    <img src="https://img.shields.io/badge/Deployed-GitHub%20Pages-222222?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Pages" />
  </p>

  <p align="center">
    <a href="#-interactive-workspaces">Workspaces</a> •
    <a href="#-system-architecture--how-it-works">How It Works</a> •
    <a href="#-borrowing-records">Borrowing Records</a> •
    <a href="#-quick-start-guide">Quick Start</a> •
    <a href="#-project-structure">Project Structure</a>
  </p>

</div>

----

> [!NOTE]
> **Academic Project Notice**: FalconSystem is an athletic equipment and resource management application built with React, TypeScript, Vite, and Supabase. The repository includes a PostgreSQL schema with database views, functions, and triggers.

---

## 📌 Executive Summary

<table>
<tr>
<td width="60%">

**FalconSystem** is a web application for managing athletic equipment, borrowing transactions, athletes, and teams for **Falcons Athletics**.

Staff can manage inventory and equipment checkouts and returns. Coaches and student athletes have role-specific workspaces for team resources and equipment-related activities. The live database is hosted on Supabase Cloud PostgreSQL with Supabase Auth enforcing role-based access control.

</td>
<td>

### 🚀 Highlights at a Glance
- 👥 **4-Role RBAC** (Admin, Staff, Coach, Student) with RLS
- 📦 **Equipment Inventory** and condition tracking
- 🔄 **Borrowing Records** with ACID-safe checkout RPC
- 🔒 **Supabase Auth** integration with JWT-based RLS
- ⚙️ **Protected Express + Prisma API** for dashboard workflows
- 🧾 **4 PL/pgSQL Triggers** + 2 ACID RPCs + 2 Views
- ☁️ **GitHub Pages** deployment via CI/CD

</td>
</tr>
</table>

---

## 🔄 System Architecture & How It Works

```mermaid
flowchart TD
    subgraph Users ["👥 User Roles"]
        A["👑 Administrator"]
        B["📦 Staff / Custodian"]
        C["🏅 Coach"]
        D["🎓 Student Athlete"]
    end

    subgraph App ["🌐 React Application"]
        Login["LoginView"]
        Shell["App.tsx<br/>Role-specific workspace"]
        Borrowing["BorrowingView<br/>Loan records & filters"]
        Checkout["CheckoutModal"]
        Return["ReturnModal"]
        Service["dashboardApi<br/>Supabase JWT"]
    end

    subgraph Data ["🗄️ Data Layer"]
        API["Express + Prisma API<br/>RBAC and workflow validation"]
        Supabase["Supabase PostgreSQL"]
        Schema["supabase/schema.sql"]
    end

    A --> Login
    B --> Login
    C --> Login
    D --> Login
    Login --> Shell
    Shell --> Borrowing
    Borrowing --> Checkout
    Borrowing --> Return
    Checkout --> Service
    Return --> Service
    Service --> API
    API --> Supabase
    Schema -. defines .-> Supabase
```

---

## 👥 Interactive Workspaces

FalconSystem presents a workspace based on the user's authenticated portal role:

<details open>
<summary><b>📦 Staff & Custodian Workspace</b></summary>
<br>

Staff can work with equipment inventory and condition, manage loan checkouts and returns, review bookings, and submit reports.

</details>

<details>
<summary><b>🏅 Coach Workspace</b></summary>
<br>

The coach dashboard provides access to team-related information and equipment borrowing workflows.

</details>

<details>
<summary><b>🎓 Student Athlete Workspace</b></summary>
<br>

The student workspace provides access to equipment and coach-related activities, including booking and loan information.

</details>

---

## 🔄 Borrowing Records

The borrowing records interface is implemented in [`src/pages/BorrowingView.tsx`](src/pages/BorrowingView.tsx). It displays transaction summaries and detailed loan records:

| View Feature | Description |
| :--- | :--- |
| **Summary cards** | Counts total transactions, active loans, overdue loans, and completed returns. |
| **Status filters** | Filters records by all, active, overdue, or returned. |
| **Transaction details** | Shows borrower, expected return date, approving staff member, remarks, and item return totals. |
| **Expandable item rows** | Shows equipment name and code, borrowed and returned quantities, conditions, and item return status. |
| **New Checkout** | Opens the checkout workflow for non-student roles. |
| **Process Return** | Opens the return workflow for transactions that have not been fully returned. |

Checkout and return dialogs are implemented in [`src/components/CheckoutModal.tsx`](src/components/CheckoutModal.tsx) and [`src/components/ReturnModal.tsx`](src/components/ReturnModal.tsx). The shared transaction and item models, including partial return statuses, are defined in [`src/types/database.ts`](src/types/database.ts).

---

## ⚡ Database & Data Features

<div align="center">

| Feature Type | Object / File | Description |
| :--- | :--- | :--- |
| **Schema** | `supabase/schema.sql` | 15 tables, 4 roles, 4 triggers, 2 RPCs, 2 views, full RLS |
| **Backend API** | `server/src/index.ts` | Express + Prisma — Supabase JWT auth, RBAC, and protected dashboard workflows |
| **Database tests** | `supabase/database_tests.sql` | 16 PASS/FAIL tests: constraints, triggers, RPCs, normalization |
| **Performance evidence** | `supabase/performance_report.sql` | 14 EXPLAIN ANALYZE queries + index usage statistics |
| **View: loans** | `vw_active_loans_summary` | Loan summary with overdue days and loan urgency labels |
| **View: inventory** | `vw_equipment_inventory_status` | Equipment utilization rates and stock health labels |
| **Dashboard API client** | `src/services/dashboardApi.ts` | Direct live Supabase data operations |
| **Supabase client** | `src/services/supabase.ts` | Supabase Auth and verified profile/session handling |

</div>

---

## 📁 Project Structure

```text
📂 IM101_js/
├── 📂 .github/workflows/
│   └── 📄 deploy.yml           # CI/CD → GitHub Pages
├── 📂 public/
│   └── 📂 images/              # Application branding
├── 📂 src/
│   ├── 📂 components/          # Navigation, modals, shared UI
│   │   ├── 📄 CheckoutModal.tsx
│   │   └── 📄 ReturnModal.tsx
│   ├── 📂 pages/               # Role dashboards and views
│   │   └── 📄 BorrowingView.tsx
│   ├── 📂 services/
│   │   ├── 📄 dashboardApi.ts  # Live Supabase data client
│   │   └── 📄 supabase.ts      # Supabase Auth & live database service
│   ├── 📂 types/
│   │   └── 📄 database.ts      # TypeScript data models
│   └── 📄 App.tsx
├── 📂 supabase/
│   ├── 📄 schema.sql           # Full schema, RLS, triggers, RPCs, seed
│   ├── 📄 database_tests.sql   # 16 PASS/FAIL constraint & trigger tests
│   ├── 📄 performance_report.sql  # EXPLAIN ANALYZE + index stats
├── 📂 server/
│   ├── 📂 src/
│   │   ├── 📄 index.ts         # Express API server
│   │   └── 📂 controllers/     # Protected workflow controllers
│   └── 📂 prisma/
│       └── 📄 schema.prisma    # Prisma data model
├── 📄 CONTRIBUTING.md          # Branch protection & PR workflow
├── 📄 DATABASE_DEFENSE_GUIDE.md
├── 📄 .env.example
└── 📄 package.json
```

---

## 🚀 Quick Start Guide

### 1. Requirements
* **Node.js** and **npm**
* A **Supabase project** with the schema and role-based policies applied
* Supabase Auth configured for the approved user accounts

### 2. Installation Steps

```bash
# 1. Install dependencies
npm ci

# 2. Configure Supabase (required for live mode)
# Copy .env.example to .env and fill in your project URL and anon key.

# 3. For a new database, run supabase/schema.sql in the Supabase SQL Editor.
#    For an existing database, apply pending files in supabase/migrations
#    in numeric order, through migration 010.

# 4. Create Supabase Auth accounts for users
# In the Supabase Dashboard → Authentication → Users → Invite user
# Then link each auth UID:
#   UPDATE users SET user_auth_id = '<auth_uid>' WHERE email = '<email>';

# 5. Configure the server (copy server/.env.example to server/.env).
# 6. Install dependencies
npm --prefix server ci

# 7. Run the API and frontend in separate terminals
npm --prefix server run dev
npm run dev
```

In `.env`:

```dotenv
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_API_BASE_URL=http://localhost:4000
```

The server's `DATABASE_URL`, `SUPABASE_URL`, and `SUPABASE_ANON_KEY` belong in `server/.env`. Keep database credentials and any Supabase service-role key on the server only.

> [!IMPORTANT]
> Sign-in is Supabase-only. Local mock accounts are sample dashboard data and cannot authenticate. Configure Supabase before testing login, require email confirmation, and set the Supabase Auth password policy to at least 12 characters. New self-registrations are created as inactive student profiles for administrator approval. Do not put a Supabase `service_role` key in the frontend; only the public anon key belongs in `VITE_SUPABASE_ANON_KEY`.

> [!WARNING]
> Never expose a Supabase `service_role` key in frontend code. RLS policies restrict table access; registration only allows a pending student profile, and views execute using the caller's permissions.

Dashboard records and actions require the Express API and migrations `001`–`010`. The API derives borrower and actor identity from the verified Supabase session; it does not trust browser-supplied roles or names.

### 3. Available Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the Vite development server. |
| `npm run build` | Runs TypeScript checks and creates the production build in `dist/`. |
| `npm run preview` | Previews the production build locally. |

----

## 👨‍💻 Development Team

<div align="center">

| Member | Assigned Specialty | Core Contributions |
| :---: | :---: | :--- |
| **Sam Udtohan** | **Backend & Database** | Database design, Supabase integration, and application data workflows. |
| **Rizamae Velasco** | **Database Management** | Database schema design and database automation. |
| **Ace Arcamo** | **Frontend** | UI/UX engineering, React components and dashboards. |

</div>

<br>

<div align="center">
  <sub>FalconSystem • Advanced Database Systems (IM101a) • Academic Project</sub>
</div>
