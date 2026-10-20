import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  Database,
  ChevronDown,
  ChevronRight,
  User,
  Clock,
  Code2
} from 'lucide-react';
import { AuditLog } from '../types/database';

interface AuditLogsViewProps {
  logs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchesSearch =
      log.table_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.record_id && log.record_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesAction = actionFilter === 'all' || log.action_type === actionFilter;
    return matchesSearch && matchesAction;
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="content-container">
      {/* Informational Banner */}
      <div style={{
        background: 'rgba(239, 68, 68, 0.08)',
        border: '1px solid rgba(239, 68, 68, 0.25)',
        borderRadius: 'var(--radius-lg)',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.85rem'
      }}>
        <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldAlert size={20} color="#f87171" />
        </div>
        <div>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fca5a5' }}>
            Automated Server-Side Mutation Logging (<code style={{ color: '#ffffff' }}>trg_audit_equipment_changes</code>)
          </h4>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
            Every row insertion, update, or deletion on master inventory tables triggers a PL/pgSQL function writing immutable before-and-after JSON snapshots into the <code style={{ color: '#ffffff' }}>audit_logs</code> table.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search audit trail by table name or record UUID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '140px' }}
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
          >
            <option value="all">All DML Actions</option>
            <option value="INSERT">INSERT Only</option>
            <option value="UPDATE">UPDATE Only</option>
            <option value="DELETE">DELETE Only</option>
          </select>
        </div>
      </div>

      {/* Audit Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Database size={18} color="#3b82f6" />
              Audit Trail Ledger ({filteredLogs.length} events logged)
            </h3>
            <p className="card-subtitle">
              Strictly append-only table recording actor credentials and JSON delta payloads
            </p>
          </div>
          <span className="badge badge-neutral">Table: audit_logs</span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Timestamp</th>
                <th>Action Type</th>
                <th>Target Table</th>
                <th>Record ID</th>
                <th>Performed By</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No audit records match the current filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  return (
                    <React.Fragment key={log.id}>
                      <tr>
                        <td>
                          <button
                            onClick={() => toggleExpand(log.id)}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '26px', height: '26px', border: 'none', background: 'transparent' }}
                          >
                            {isExpanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Clock size={13} color="var(--text-muted)" />
                            <span>{new Date(log.created_at).toLocaleString()}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            log.action_type === 'INSERT'
                              ? 'badge-success'
                              : log.action_type === 'UPDATE'
                              ? 'badge-warning'
                              : 'badge-danger'
                          }`}>
                            {log.action_type}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#93c5fd' }}>
                            {log.table_name}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                            {log.record_id ? `${log.record_id.slice(0, 13)}...` : 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <User size={13} color="var(--text-muted)" />
                            <span>{log.performer?.full_name || 'System / Custodian'}</span>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable JSON Snapshot */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} style={{ background: '#070c18', padding: '1rem 1.5rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f87171', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Code2 size={13} /> OLD DATA (Before Mutation)
                                </div>
                                <pre className="code-box" style={{ maxHeight: '180px' }}>
                                  {log.old_data ? JSON.stringify(log.old_data, null, 2) : '// NULL (No prior record for INSERT)'}
                                </pre>
                              </div>

                              <div>
                                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <Code2 size={13} /> NEW DATA (After Mutation)
                                </div>
                                <pre className="code-box" style={{ maxHeight: '180px' }}>
                                  {log.new_data ? JSON.stringify(log.new_data, null, 2) : '// NULL (Record deleted)'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
