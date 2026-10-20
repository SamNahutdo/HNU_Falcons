import React, { useState } from 'react';
import {
  ClipboardList,
  Plus,
  RotateCcw,
  Calendar,
  User,
  ChevronDown,
  ChevronRight
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
    <div className="content-container">
      {/* Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.4rem', background: 'rgba(0, 0, 0, 0.25)', padding: '0.35rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
          <button
            onClick={() => setFilterTab('all')}
            className={`btn btn-sm ${filterTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          >
            All Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setFilterTab('active')}
            className={`btn btn-sm ${filterTab === 'active' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Active Loans ({transactions.filter(t => t.status === 'active').length})
          </button>
          <button
            onClick={() => setFilterTab('overdue')}
            className={`btn btn-sm ${filterTab === 'overdue' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Overdue ({transactions.filter(t => t.status === 'overdue').length})
          </button>
          <button
            onClick={() => setFilterTab('returned')}
            className={`btn btn-sm ${filterTab === 'returned' ? 'btn-primary' : 'btn-secondary'}`}
          >
            Returned ({transactions.filter(t => t.status === 'returned').length})
          </button>
        </div>

        {currentRole !== 'student' && (
          <button onClick={onOpenCheckout} className="btn btn-primary">
            <Plus size={16} /> Process New Checkout
          </button>
        )}
      </div>

      {/* Transactions List */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <ClipboardList size={18} color="#3b82f6" />
              Borrowing Master & Junction Table (borrowing_items)
            </h3>
            <p className="card-subtitle">
              Parent Table: <code style={{ color: '#93c5fd' }}>borrowing_transactions</code> | Junction: <code style={{ color: '#93c5fd' }}>borrowing_items</code>
            </p>
          </div>
          <span className="badge badge-neutral">
            {filteredTransactions.length} Records
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}></th>
                <th>Borrower Athlete</th>
                <th>Dates & Overdue Status</th>
                <th>Approved By</th>
                <th>Items & Units</th>
                <th>Status</th>
                {currentRole !== 'student' && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx) => {
                const isExpanded = expandedTxId === tx.id;
                const items = tx.items || [];
                const totalUnits = items.reduce((s, i) => s + i.quantity, 0);
                const returnedUnits = items.reduce((s, i) => s + i.returned_quantity, 0);

                return (
                  <React.Fragment key={tx.id}>
                    <tr>
                      <td>
                        <button
                          onClick={() => toggleExpand(tx.id)}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '26px', height: '26px', border: 'none', background: 'transparent' }}
                        >
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </td>
                      <td>
                        <div style={{ fontWeight: 700 }}>
                          {tx.athlete?.user?.full_name || 'Athlete'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {tx.athlete?.student_number} &bull; {tx.athlete?.department}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem' }}>
                          <Calendar size={13} color="var(--text-muted)" />
                          <span>Expected: <strong>{tx.expected_return_date}</strong></span>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Borrowed on {new Date(tx.borrow_date).toLocaleDateString()}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <User size={13} color="var(--text-muted)" />
                          <span>{tx.approver?.full_name || 'Staff Custodian'}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                          {items.length} gear lines ({returnedUnits}/{totalUnits} units returned)
                        </div>
                        {tx.remarks && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            "{tx.remarks}"
                          </div>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${
                          tx.status === 'returned'
                            ? 'badge-success'
                            : tx.status === 'overdue'
                            ? 'badge-danger'
                            : tx.status === 'partially_returned'
                            ? 'badge-warning'
                            : 'badge-info'
                        }`}>
                          {tx.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      {currentRole !== 'student' && (
                        <td style={{ textAlign: 'right' }}>
                          {tx.status !== 'returned' && (
                            <button
                              onClick={() => onOpenReturn(tx)}
                              className="btn btn-secondary btn-sm"
                              style={{ borderColor: 'rgba(16, 185, 129, 0.4)' }}
                            >
                              <RotateCcw size={13} color="#10b981" />
                              <span>Process Return</span>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>

                    {/* Expanded Junction Row */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={currentRole !== 'student' ? 7 : 6} style={{ background: '#0a1020', padding: '1rem 1.5rem' }}>
                          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#93c5fd', textTransform: 'uppercase', marginBottom: '0.6rem' }}>
                            Junction Table Details (borrowing_items where transaction_id = {tx.id.slice(0, 8)}...)
                          </div>
                          <div className="table-responsive" style={{ background: '#070c18' }}>
                            <table className="data-table" style={{ fontSize: '0.8rem' }}>
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
                                    <td style={{ fontWeight: 600 }}>{item.equipment?.name || 'Equipment'}</td>
                                    <td style={{ fontFamily: 'var(--font-mono)' }}>{item.equipment?.equipment_code || 'N/A'}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.returned_quantity}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{item.condition_before}</td>
                                    <td style={{ textTransform: 'capitalize' }}>{item.condition_after || 'Pending Return'}</td>
                                    <td>
                                      <span className={`badge ${item.return_status === 'returned' ? 'badge-success' : 'badge-neutral'}`}>
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
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
