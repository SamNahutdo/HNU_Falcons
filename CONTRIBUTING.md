# Contributing to FARE-ERP

## Branch Protection & PR Workflow

This document describes the required Git workflow for all team contributions.

---

## Branch Strategy

| Branch | Purpose | Direct Pushes |
|--------|---------|---------------|
| `main` | Production-ready code only | ❌ Protected — PRs only |
| `develop` | Integration branch for completed features | ❌ Protected — PRs only |
| `feature/<name>` | Individual feature development | ✅ Developers push here |
| `fix/<name>` | Bug fixes | ✅ Developers push here |
| `db/<name>` | Database migrations and schema changes | ✅ Developers push here |

---

## GitHub Branch Protection Rules (Configure in Repo Settings)

For `main` branch:
- ✅ **Require pull request reviews before merging** (minimum 1 reviewer)
- ✅ **Require status checks to pass before merging** (CI build must pass)
- ✅ **Require branches to be up to date before merging**
- ✅ **Do not allow bypassing the above settings** (applies to admins too)
- ✅ **Restrict who can push to matching branches** (only team leads)

---

## Pull Request Workflow

### Step 1: Create a Feature Branch
```bash
git checkout develop
git pull origin develop
git checkout -b feature/equipment-checkout-modal
```

### Step 2: Develop and Commit with Meaningful Messages
```bash
git add src/components/CheckoutModal.tsx
git commit -m "feat(checkout): add multi-item selection with stock validation"

git add supabase/schema.sql
git commit -m "db(rls): fix borrowing_transactions policy to use auth.uid()"
```

Commit message format: `type(scope): short description`

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `db` | Database schema or migration change |
| `docs` | Documentation |
| `refactor` | Code restructuring without behavior change |
| `test` | Adding or updating tests |

### Step 3: Push and Open a Pull Request
```bash
git push origin feature/equipment-checkout-modal
```
Then open a PR on GitHub from `feature/...` → `develop`.

### Step 4: PR Review Requirements
- PR title must describe the change clearly
- PR description must include:
  - **What changed** (feature, fix, or schema change)
  - **How to test** (manual steps or test SQL to run)
  - **Screenshots** (for UI changes)
  - **Database tests run** (paste output of `database_tests.sql` if schema changed)
- At least **1 team member** must review and approve before merging

### Step 5: Merge to Develop → Main
```bash
# After develop is tested and stable, merge to main via PR
# DO NOT squash or force-push to main
```

---

## Team Role Assignments

| Member | Primary Responsibility | Can Approve PRs For |
|--------|----------------------|---------------------|
| Sam Udtohan | Backend & Database | Schema changes, RPC functions, RLS policies |
| Rizamae Velasco | Database Management | Schema design, triggers, normalization |
| Ace Arcamo | Frontend | React components, UI/UX, CSS |

All PRs should have at least one approver who is not the PR author.

---

## Database Migration Sequence

When changing the schema, always:
1. Make changes in `supabase/schema.sql`
2. Run `supabase/database_tests.sql` to verify correctness
3. Note which version introduced the change in your commit message
4. Test the Edge Function against the new schema
5. Include migration in the PR description

> ⚠️ **`schema.sql` drops and recreates all tables.** Run it only against a fresh or disposable database unless you intend to replace all data.
