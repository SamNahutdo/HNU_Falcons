import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  RotateCcw,
  Calendar,
  User,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Package
} from 'lucide-react';
import { BorrowingTransaction, UserRole } from '../types/database';

interface BorrowingViewProps {
  transactions: BorrowingTransaction[];
  currentRole: UserRole;
  onOpenCheckout: () => void;
  onOpenReturn: (tx: BorrowingTransaction) => void;
}

export const BorrowingView: React.FC<BorrowingViewProps> = ({
  transactions,
  currentRole,
  onOpenCheckout,
  onOpenReturn
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'active' | 'overdue' | 'returned'>('all');
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  const activeCount = transactions.filter(t => t.status === 'active').length;
  const overdueCount = transactions.filter(t => t.status === 'overdue').length;
  const returnedCount = transactions.filter(t => t.status === 'returned').length;

  const filteredTransactions = transactions.filter((tx) => {
    if (filterTab === 'active') return tx.status === 'active';
    if (filterTab === 'overdue') return tx.status === 'overdue';
    if (filterTab === 'returned') return tx.status === 'returned';
    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* 4 TOP SUMMARY STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-coral">
            <ClipboardList size={22} />
          </div>
          <div className="stat-label">Total Transactions</div>
          <div className="stat-trend">Institutional Ledger</div>
          <div className="stat-value" style={{ color: 'var(--coral)' }}>{transactions.length}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-cyan">
            <Calendar size={22} />
          </div>
          <div className="stat-label">Active Loans</div>
          <div className="stat-trend">Currently checked out</div>
          <div className="stat-value" style={{ color: '#0EA5E9' }}>{activeCount}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-amber">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-label">Overdue Loans</div>
          <div className="stat-trend">Requires custodian return</div>
          <div className="stat-value" style={{ color: '#F59E0B' }}>{overdueCount}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-green">
            <RotateCcw size={22} />
          </div>
          <div className="stat-label">Completed Returns</div>
          <div className="stat-trend">Equipment checked in</div>
          <div className="stat-value" style={{ color: '#10B981' }}>{returnedCount}</div>
        </div>
      </div>

      {/* Action Header & Filter Pills */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterTab('all')}
            className={`pill-btn ${filterTab === 'all' ? 'pill-btn-active' : ''}`}
          >
            All Loans ({transactions.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`pill-btn ${filterTab === 'active' ? 'pill-btn-active' : ''}`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterTab('overdue')}
            className={`pill-btn ${filterTab === 'overdue' ? 'pill-btn-active' : ''}`}
          >
            Overdue ({overdueCount})
          </button>
          <button
            onClick={() => setFilterTab('returned')}
            className={`pill-btn ${filterTab === 'returned' ? 'pill-btn-active' : ''}`}
          >
            Returned ({returnedCount})
          </button>
        </div>

        {currentRole !== 'student' && (
          <button
            onClick={onOpenCheckout}
            style={{
              background: 'var(--coral-gradient)',
              border: 'none',
              borderRadius: '9999px',
              padding: '0.65rem 1.45rem',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: 'var(--coral-shadow)',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <Plus size={16} /> New Checkout
          </button>
        )}
      </div>

      {/* Modern Table Card */}
      <div className="card-modern" style={{ padding: '1.75rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--sidebar-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <ClipboardList size={20} color="var(--coral)" />
            Borrowing Records
          </h3>
          <span className="pill-soft pill-coral">
            {filteredTransactions.length} records
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table-modern">
            <thead>
              <tr>
                <th style={{ width: '45px', textAlign: 'center' }}></th>
                <th>Borrower Athlete</th>
                <th>Dates & Overdue Status</th>
                <th>Approved By</th>
                <th>Items & Units</th>
                <th>Status</th>
                {currentRole !== 'student' && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={currentRole !== 'student' ? 7 : 6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                    <ClipboardList size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 600 }}>No loan transactions found in this category</div>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  const items = tx.items || [];
                  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
                  const returnedUnits = items.reduce((s, i) => s + i.returned_quantity, 0);

                  return (
                    <React.Fragment key={tx.id}>
                      <tr style={{ transition: 'background-color 0.15s ease' }}>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => toggleExpand(tx.id)}
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '8px',
                              border: '1px solid #CBD5E1',
                              background: '#F8FAFC',
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer'
                            }}
                            title="Expand gear lines"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.92rem' }}>
                            {tx.athlete?.user?.full_name || 'Athlete'}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                            {tx.athlete?.student_number} &bull; {tx.athlete?.department}
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#1E293B' }}>
                            <Calendar size={13} color="var(--coral)" />
                            <span>Expected: <strong>{tx.expected_return_date}</strong></span>
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#64748B' }}>
                            Borrowed on {new Date(tx.borrow_date).toLocaleDateString()}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
                            <User size={13} color="#94A3B8" />
                            <span>{tx.approver?.full_name || 'Staff Custodian'}</span>
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1E293B' }}>
                            {items.length} gear lines ({returnedUnits}/{totalUnits} units returned)
                          </div>
                          {tx.remarks && (
                            <div style={{ fontSize: '0.75rem', color: '#64748B', fontStyle: 'italic' }}>
                              "{tx.remarks}"
                            </div>
                          )}
                        </td>
                        <td>
                          {tx.status === 'returned' && (
                            <span className="pill-soft pill-green">
                              <CheckCircle2 size={12} /> Returned
                            </span>
                          )}
                          {tx.status === 'overdue' && (
                            <span className="pill-soft pill-coral">
                              <AlertTriangle size={12} /> Overdue
                            </span>
                          )}
                          {tx.status === 'active' && (
                            <span className="pill-soft pill-blue">
                              Active Loan
                            </span>
                          )}
                          {tx.status === 'partially_returned' && (
                            <span className="pill-soft pill-amber">
                              Partial Return
                            </span>
                          )}
                        </td>
                        {currentRole !== 'student' && (
                          <td style={{ textAlign: 'right' }}>
                            {tx.status !== 'returned' && (
                              <button
                                onClick={() => onOpenReturn(tx)}
                                style={{
                                  background: '#F0FDF4',
                                  border: '1px solid #86EFAC',
                                  color: '#15803D',
                                  borderRadius: '9999px',
                                  padding: '0.4rem 0.95rem',
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <RotateCcw size={13} color="#15803D" />
                                <span>Process Return</span>
                              </button>
                            )}
                          </td>
                        )}
                      </tr>

                      {/* Expanded Junction Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={currentRole !== 'student' ? 7 : 6} style={{ background: '#F8FAFC', padding: '1.25rem 1.75rem', borderBottom: '1.5px solid #E2E8F0' }}>
                            <div style={{
                              fontSize: '0.78rem',
                              fontWeight: 800,
                              color: 'var(--coral)',
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              marginBottom: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <Package size={14} />
                              Items ({items.length})
                            </div>

                            <div style={{
                              background: '#FFFFFF',
                              borderRadius: '12px',
                              border: '1px solid #E2E8F0',
                              overflow: 'hidden',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
                            }}>
                              <table className="table-modern" style={{ fontSize: '0.82rem' }}>
                                <thead>
                                  <tr>
                                    <th>Equipment Item</th>
                                    <th>Code</th>
                                    <th>Qty Borrowed</th>
                                    <th>Qty Returned</th>
                                    <th>Condition Before</th>
                                    <th>Condition After</th>
                                    <th>Item Status</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {items.map((item) => (
                                    <tr key={item.id}>
                                      <td style={{ fontWeight: 700, color: '#1E293B' }}>{item.equipment?.name || 'Equipment'}</td>
                                      <td style={{ fontFamily: 'var(--font-mono)', color: '#64748B' }}>{item.equipment?.equipment_code || 'N/A'}</td>
                                      <td style={{ fontWeight: 700 }}>{item.quantity}</td>
                                      <td style={{ fontWeight: 700, color: item.returned_quantity === item.quantity ? '#10B981' : '#F59E0B' }}>
                                        {item.returned_quantity}
                                      </td>
                                      <td style={{ textTransform: 'capitalize', color: '#475569' }}>{item.condition_before}</td>
                                      <td style={{ textTransform: 'capitalize', color: '#475569' }}>{item.condition_after || 'Pending Return'}</td>
                                      <td>
                                        <span className={`pill-soft ${item.return_status === 'returned' ? 'pill-green' : 'pill-amber'}`}>
                                          {item.return_status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
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
