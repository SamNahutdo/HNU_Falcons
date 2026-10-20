import React, { useState } from 'react';
import {
  GraduationCap,
  ShieldCheck,
  CheckCircle2,
  Code2,
  Database,
  Layers,
  Copy,
  Check,
  HelpCircle,
  Cpu
} from 'lucide-react';

export const DefenseHubView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'3nf' | 'triggers' | 'qa' | 'schema'>('3nf');
  const [copied, setCopied] = useState(false);

  const handleCopySchema = () => {
    // Copy reference notice or trigger copy
    setCopied(true);
    navigator.clipboard.writeText('-- Run supabase/schema.sql in your Supabase SQL Editor');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="content-container">
      {/* Top Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.2), rgba(16, 185, 129, 0.1))',
        border: '1px solid rgba(37, 99, 235, 0.35)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem 1.5rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #2563eb, #10b981)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(37, 99, 235, 0.4)'
          }}>
            <GraduationCap size={26} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Database Engineering & 3NF Defense Hub</h2>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Course Project: Advanced Database Systems &bull; Strict 3rd Normal Form &bull; ACID Transactions &bull; PL/pgSQL
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <span className="badge badge-success" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            <CheckCircle2 size={14} /> 3NF Verified
          </span>
          <span className="badge badge-info" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
            <Cpu size={14} /> 2 Triggers + 2 RPCs
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveTab('3nf')}
          className={`btn btn-sm ${activeTab === '3nf' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Layers size={14} /> 1. 3NF Normalization Proof
        </button>
        <button
          onClick={() => setActiveTab('triggers')}
          className={`btn btn-sm ${activeTab === 'triggers' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Code2 size={14} /> 2. Server-Side Triggers & RPC
        </button>
        <button
          onClick={() => setActiveTab('qa')}
          className={`btn btn-sm ${activeTab === 'qa' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <HelpCircle size={14} /> 3. Defense Q&A Cheat Sheet
        </button>
        <button
          onClick={() => setActiveTab('schema')}
          className={`btn btn-sm ${activeTab === 'schema' ? 'btn-primary' : 'btn-secondary'}`}
        >
          <Database size={14} /> 4. Schema Architecture
        </button>
      </div>

      {/* TAB 1: 3NF NORMALIZATION PROOF */}
      {activeTab === '3nf' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '0.75rem' }}>
              <Layers size={18} color="#3b82f6" />
              Mathematical Verification of 3rd Normal Form (3NF)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              The Falcon Athletics ERP adheres strictly to relational algebra normal forms. There are zero multi-valued attributes (1NF), zero partial dependencies on candidate keys (2NF), and zero transitive dependencies (3NF).
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem' }}>
              {/* 1NF */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#60a5fa', marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={16} /> 1st Normal Form (1NF)
                </div>
                <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Every column holds exclusively <strong>atomic, indivisible values</strong>.</li>
                  <li>No repeating groups or comma-separated arrays for sports or equipment.</li>
                  <li>Each table has a designated, unique primary key (UUID v4).</li>
                </ul>
              </div>

              {/* 2NF */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#34d399', marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={16} /> 2nd Normal Form (2NF)
                </div>
                <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Satisfies 1NF in every entity.</li>
                  <li>Every non-key attribute is <strong>fully functionally dependent</strong> on the entire primary key.</li>
                  <li>In junction tables (<code style={{ color: '#38bdf8' }}>team_members</code> and <code style={{ color: '#38bdf8' }}>borrowing_items</code>), attributes like <code style={{ color: '#38bdf8' }}>quantity</code> depend strictly on the composite pair.</li>
                </ul>
              </div>

              {/* 3NF */}
              <div style={{ background: 'rgba(0, 0, 0, 0.25)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.4rem' }}>
                  <CheckCircle2 size={16} /> 3rd Normal Form (3NF)
                </div>
                <ul style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', paddingLeft: '1.2rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>Satisfies 2NF across all entities.</li>
                  <li><strong>Zero transitive dependencies</strong> ($X \to Y$ and $Y \to Z$).</li>
                  <li>User names and roles are normalized into <code style={{ color: '#38bdf8' }}>users</code> and <code style={{ color: '#38bdf8' }}>roles</code> rather than duplicated in athlete or coach tables.</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Table-by-Table Normalization Breakdown */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1rem' }}>
              Table-by-Table Functional Dependency Audit
            </h3>
            <div className="table-responsive">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Table Name</th>
                    <th>Primary Key</th>
                    <th>Foreign Keys</th>
                    <th>Functional Dependencies (FD)</th>
                    <th>3NF Compliance Proof</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>roles</code></td>
                    <td>id</td>
                    <td>None</td>
                    <td>id &rarr; name, description</td>
                    <td>No transitive or partial dependencies. Single candidate key.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>users</code></td>
                    <td>id</td>
                    <td>role_id &rarr; roles(id)</td>
                    <td>id &rarr; email, full_name, role_id, status</td>
                    <td>All attributes depend directly on user id. Role is factored into roles table.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>athletes</code></td>
                    <td>id</td>
                    <td>user_id &rarr; users(id)</td>
                    <td>id &rarr; user_id, student_number, department, year_level</td>
                    <td>1:1 subtype specialization of users. Eliminates null fields for non-athletes.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>coaches</code></td>
                    <td>id</td>
                    <td>user_id &rarr; users(id)</td>
                    <td>id &rarr; user_id, employee_number, specialization, license</td>
                    <td>1:1 subtype specialization of users. Clean separation of coaching license attributes.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>sports</code></td>
                    <td>id</td>
                    <td>None</td>
                    <td>id &rarr; name, category, status</td>
                    <td>Categorical master. Prevents string redundancy across teams and equipment.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>teams</code></td>
                    <td>id</td>
                    <td>sport_id, coach_id</td>
                    <td>id &rarr; sport_id, coach_id, team_name, school_year</td>
                    <td>Composite uniqueness constraint <code style={{ color: '#fbbf24' }}>uq_team_sport_sy</code> prevents duplicates.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>team_members</code></td>
                    <td>id</td>
                    <td>team_id, athlete_id</td>
                    <td>(team_id, athlete_id) &rarr; position, jersey, status</td>
                    <td><strong>Junction 1:</strong> N:M relationship with intersection attributes.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>equipment</code></td>
                    <td>id</td>
                    <td>sport_id &rarr; sports(id)</td>
                    <td>id &rarr; sport_id, equipment_code, name, quantities</td>
                    <td>Stock levels tracked with check constraints. Sport name is normalized out.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>borrowing_transactions</code></td>
                    <td>id</td>
                    <td>athlete_id, approved_by</td>
                    <td>id &rarr; athlete_id, approved_by, dates, status</td>
                    <td>Header table for loans. Decoupled from individual equipment items.</td>
                  </tr>
                  <tr>
                    <td><code style={{ color: '#93c5fd' }}>borrowing_items</code></td>
                    <td>id</td>
                    <td>transaction_id, equipment_id</td>
                    <td>(transaction_id, equipment_id) &rarr; quantity, returned_qty</td>
                    <td><strong>Junction 2:</strong> N:M relationship handling multi-equipment loans.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRIGGERS & RPC CODE */}
      {activeTab === 'triggers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Trigger 1 */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Cpu size={18} color="#34d399" />
                  Trigger 1: trg_audit_equipment_changes (AFTER INSERT/UPDATE/DELETE)
                </h3>
                <p className="card-subtitle">
                  Captures all DML mutations on equipment and logs old/new JSON payloads into audit_logs
                </p>
              </div>
              <span className="badge badge-success">PL/pgSQL Trigger</span>
            </div>
            <pre className="code-box">
{`CREATE OR REPLACE FUNCTION log_equipment_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID := NULL;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by)
        VALUES ('equipment', NEW.id, 'INSERT', NULL, to_jsonb(NEW), v_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
        NEW.updated_at = NOW();
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by)
        VALUES ('equipment', NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), v_user_id);
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by)
        VALUES ('equipment', OLD.id, 'DELETE', to_jsonb(OLD), NULL, v_user_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_audit_equipment_changes
AFTER INSERT OR UPDATE OR DELETE ON equipment
FOR EACH ROW
EXECUTE FUNCTION log_equipment_audit();`}
            </pre>
          </div>

          {/* Trigger 2 */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Cpu size={18} color="#f59e0b" />
                  Trigger 2: trg_auto_update_stock_on_return (BEFORE UPDATE on borrowing_items)
                </h3>
                <p className="card-subtitle">
                  Restores equipment.available_quantity when returned_quantity changes and updates stock status
                </p>
              </div>
              <span className="badge badge-warning">PL/pgSQL Trigger</span>
            </div>
            <pre className="code-box">
{`CREATE OR REPLACE FUNCTION fn_auto_update_stock_on_return()
RETURNS TRIGGER AS $$
DECLARE
    v_qty_delta INT;
    v_new_available INT;
    v_total_qty INT;
    v_new_status VARCHAR(30);
BEGIN
    IF (TG_OP = 'UPDATE') THEN
        v_qty_delta := NEW.returned_quantity - OLD.returned_quantity;

        IF v_qty_delta > 0 THEN
            SELECT total_quantity, available_quantity 
            INTO v_total_qty, v_new_available
            FROM equipment
            WHERE id = NEW.equipment_id
            FOR UPDATE;

            v_new_available := LEAST(v_total_qty, v_new_available + v_qty_delta);

            IF v_new_available = 0 THEN v_new_status := 'out_of_stock';
            ELSIF v_new_available <= 2 THEN v_new_status := 'low_stock';
            ELSE v_new_status := 'available';
            END IF;

            UPDATE equipment
            SET available_quantity = v_new_available,
                status = v_new_status,
                updated_at = NOW()
            WHERE id = NEW.equipment_id;
        END IF;

        IF NEW.returned_quantity >= NEW.quantity THEN
            NEW.return_status := 'returned';
        ELSIF NEW.returned_quantity > 0 THEN
            NEW.return_status := 'partial';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
            </pre>
          </div>

          {/* Stored Function RPC: checkout_equipment */}
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <ShieldCheck size={18} color="#3b82f6" />
                  RPC Stored Function: checkout_equipment() (ACID Atomic Transaction)
                </h3>
                <p className="card-subtitle">
                  Enforces pessimistic locking (SELECT ... FOR UPDATE) and atomic multi-item stock decrement
                </p>
              </div>
              <span className="badge badge-info">Supabase RPC</span>
            </div>
            <pre className="code-box">
{`CREATE OR REPLACE FUNCTION checkout_equipment(
    p_athlete_id UUID,
    p_items JSONB,              -- Array of [{"equipment_id": "...", "quantity": 2, "condition": "good"}]
    p_expected_return DATE,
    p_approved_by UUID DEFAULT NULL,
    p_remarks TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_transaction_id UUID;
    v_item RECORD;
    v_equipment RECORD;
    v_new_available INT;
    v_new_status VARCHAR(30);
BEGIN
    IF p_expected_return < CURRENT_DATE THEN
        RAISE EXCEPTION 'Expected return date cannot be in the past.';
    END IF;

    -- Create master transaction
    INSERT INTO borrowing_transactions (athlete_id, approved_by, expected_return_date, status, remarks)
    VALUES (p_athlete_id, p_approved_by, p_expected_return, 'active', p_remarks)
    RETURNING id INTO v_transaction_id;

    -- Iterate and lock rows atomically
    FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(equipment_id UUID, quantity INT, condition VARCHAR(30))
    LOOP
        SELECT * INTO v_equipment FROM equipment WHERE id = v_item.equipment_id FOR UPDATE;

        IF v_equipment.available_quantity < v_item.quantity THEN
            RAISE EXCEPTION 'Insufficient stock for "%": requested %, available %.',
                v_equipment.name, v_item.quantity, v_equipment.available_quantity;
        END IF;

        v_new_available := v_equipment.available_quantity - v_item.quantity;
        v_new_status := CASE WHEN v_new_available = 0 THEN 'out_of_stock' WHEN v_new_available <= 2 THEN 'low_stock' ELSE 'available' END;

        UPDATE equipment SET available_quantity = v_new_available, status = v_new_status WHERE id = v_item.equipment_id;

        INSERT INTO borrowing_items (transaction_id, equipment_id, quantity, returned_quantity, condition_before, return_status)
        VALUES (v_transaction_id, v_item.equipment_id, v_item.quantity, 0, COALESCE(v_item.condition, 'good'), 'borrowed');
    END LOOP;

    RETURN jsonb_build_object('success', true, 'transaction_id', v_transaction_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: DEFENSE Q&A CHEAT SHEET */}
      {activeTab === 'qa' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            {
              q: '1. Why did you enforce ON DELETE RESTRICT on foreign keys instead of ON DELETE CASCADE?',
              a: 'In an Enterprise ERP, financial and audit integrity is paramount. If an administrator deletes a sport or equipment item that has historical borrowing or audit records, cascading the delete would destroy legal inventory history and create unexplainable loss of audit trails. RESTRICT ensures deletion is rejected until dependent transaction references are explicitly addressed.'
            },
            {
              q: '2. How does your system prevent race conditions during concurrent checkouts of the same equipment?',
              a: 'Our checkout_equipment() RPC function uses pessimistic row-level locking via "SELECT * FROM equipment WHERE id = ... FOR UPDATE". When two custodians or athletes attempt to check out the last remaining basketball at the exact same millisecond, the database engine locks that row for transaction 1, decrements available_quantity, and causes transaction 2 to evaluate the newly updated available count, raising a clean SQL EXCEPTION rather than allowing negative inventory.'
            },
            {
              q: '3. Why are athletes and coaches separated into their own tables instead of adding columns to the users table?',
              a: 'This represents 3NF subtype/specialization modeling. If we stored student_number, department, emergency_contact, employee_number, and license_level directly inside users, every student would have NULL coach columns, and every coach would have NULL student columns. Subtyping eliminates sparse, NULL-heavy rows and preserves domain integrity.'
            },
            {
              q: '4. Explain the cardinalities of your two Many-to-Many (N:M) junction tables.',
              a: 'Junction 1 is team_members between teams and athletes. One team has many athletes, and an athlete can participate in multiple sports (e.g., Track & Field and Basketball). The junction stores intersection attributes: position, jersey_number, and joined_at with a composite unique constraint.\n\nJunction 2 is borrowing_items between borrowing_transactions and equipment. One transaction can borrow multiple distinct equipment lines, and one piece of equipment is borrowed across multiple transactions over its lifetime. The junction tracks quantity_borrowed, quantity_returned, condition_before, and condition_after.'
            },
            {
              q: '5. Why store available_quantity in the equipment table when it could be computed dynamically?',
              a: 'While it is computable, storing available_quantity enables instantaneous $O(1)$ indexed stock lookups, immediate CHECK (available_quantity >= 0) constraints at the storage engine level, and fast inventory health views without performing an expensive aggregation across millions of historical borrowing_items rows. PL/pgSQL triggers guarantee that available_quantity is always in sync.'
            },
            {
              q: '6. How does your schema support Row Level Security (RLS)?',
              a: 'Every table has ALTER TABLE ... ENABLE ROW LEVEL SECURITY. We defined 3 RBAC roles: admin, staff, and student. Students are restricted from modifying equipment or approving checkouts; staff can manage checkouts and returns; admin has full audit and master table authority. Database-level RLS ensures that even if an attacker bypasses the frontend API, Supabase rejects unauthorized SQL queries.'
            }
          ].map((item, idx) => (
            <div key={idx} className="card">
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#93c5fd', marginBottom: '0.5rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <HelpCircle size={18} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{item.q}</span>
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, paddingLeft: '1.6rem', whiteSpace: 'pre-line' }}>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* TAB 4: SCHEMA ARCHITECTURE & MIGRATION */}
      {activeTab === 'schema' && (
        <div className="card">
          <div className="card-header">
            <div>
              <h3 className="card-title">
                <Database size={18} color="#3b82f6" />
                Complete Cloud PostgreSQL Migration Script
              </h3>
              <p className="card-subtitle">
                File: <code style={{ color: '#93c5fd' }}>supabase/schema.sql</code> &bull; 100% copy-pasteable for Supabase SQL Editor
              </p>
            </div>
            <button onClick={handleCopySchema} className="btn btn-secondary btn-sm">
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Copied Notice' : 'Copy File Path'}</span>
            </button>
          </div>

          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            marginBottom: '1rem',
            fontSize: '0.82rem',
            color: 'var(--text-secondary)'
          }}>
            <p>
              To deploy this database to Cloud Supabase:
            </p>
            <ol style={{ paddingLeft: '1.25rem', marginTop: '0.4rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
              <li>Open your project at <strong>https://supabase.com/dashboard</strong></li>
              <li>Navigate to the <strong>SQL Editor</strong> tab on the left sidebar.</li>
              <li>Click <strong>New Query</strong>, paste the contents of <code style={{ color: '#38bdf8' }}>supabase/schema.sql</code>, and click <strong>Run</strong>.</li>
              <li>The script will create all 9 core tables, B-tree indexes, triggers, stored procedures, views, and seed data.</li>
            </ol>
          </div>

          <pre className="code-box" style={{ maxHeight: '400px' }}>
{`-- FALCON ATHLETICS RESOURCE & EQUIPMENT ERP (FARE-ERP)
-- Course Project: Advanced Database Systems (3rd-Year IT)
-- Target DBMS: Supabase PostgreSQL
-- Tables: roles, users, athletes, coaches, sports, teams, team_members, equipment, borrowing_transactions, borrowing_items, maintenance_records, audit_logs
-- Views: vw_active_loans_summary, vw_equipment_inventory_status
-- Triggers: trg_audit_equipment_changes, trg_auto_update_stock_on_return
-- RPCs: checkout_equipment, return_borrowed_items, fn_calculate_overdue_days

-- Refer to full source code in supabase/schema.sql`}
          </pre>
        </div>
      )}
    </div>
  );
};
