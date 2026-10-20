import React, { useState } from 'react';
import { X, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { BorrowingTransaction } from '../types/database';
import { databaseService } from '../services/supabase';

interface ReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: BorrowingTransaction | null;
  onSuccess: () => void;
}

interface ItemReturnState {
  itemId: string;
  equipmentName: string;
  totalQuantity: number;
  returnedSoFar: number;
  newReturnedQty: number;
  conditionAfter: string;
}

export const ReturnModal: React.FC<ReturnModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSuccess
}) => {
  if (!isOpen || !transaction) return null;

  const [returnItems, setReturnItems] = useState<ItemReturnState[]>(() => {
    return (transaction.items || []).map(item => ({
      itemId: item.id,
      equipmentName: item.equipment?.name || 'Equipment',
      totalQuantity: item.quantity,
      returnedSoFar: item.returned_quantity,
      newReturnedQty: item.quantity, // default to returning all
      conditionAfter: 'good'
    }));
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleQtyChange = (idx: number, val: number) => {
    const updated = [...returnItems];
    const item = updated[idx];
    const clamped = Math.max(item.returnedSoFar, Math.min(item.totalQuantity, val));
    updated[idx] = { ...item, newReturnedQty: clamped };
    setReturnItems(updated);
  };

  const handleConditionChange = (idx: number, cond: string) => {
    const updated = [...returnItems];
    updated[idx] = { ...updated[idx], conditionAfter: cond };
    setReturnItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const payload = returnItems.map(item => ({
        item_id: item.itemId,
        returned_quantity: item.newReturnedQty,
        condition_after: item.conditionAfter
      }));

      await databaseService.returnBorrowedItems(transaction.id, payload);
      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Return operation failed.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw size={18} color="#10b981" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>Process Equipment Return</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Triggers <code style={{ color: '#34d399' }}>trg_auto_update_stock_on_return</code> to auto-restock inventory
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
              <X size={16} />
            </button>
          </div>

          <div className="modal-body">
            {errorMsg && (
              <div style={{
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '1rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div style={{
              background: 'rgba(255, 255, 255, 0.03)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              border: '1px solid var(--border-light)',
              marginBottom: '1.25rem'
            }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Borrower Athlete:</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                {transaction.athlete?.user?.full_name} ({transaction.athlete?.student_number})
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                Borrowed: {new Date(transaction.borrow_date).toLocaleDateString()} | Expected: {transaction.expected_return_date}
              </div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Return Reconciliation (by Line Item)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {returnItems.map((item, idx) => (
                  <div
                    key={item.itemId}
                    style={{
                      background: 'rgba(0, 0, 0, 0.25)',
                      padding: '0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-light)',
                      display: 'grid',
                      gridTemplateColumns: '2fr 1fr 1fr',
                      gap: '0.75rem',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{item.equipmentName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Borrowed: {item.totalQuantity} | Previously Returned: {item.returnedSoFar}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                        Total Returned
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min={item.returnedSoFar}
                        max={item.totalQuantity}
                        value={item.newReturnedQty}
                        onChange={(e) => handleQtyChange(idx, parseInt(e.target.value) || item.returnedSoFar)}
                        style={{ fontSize: '0.82rem' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.2rem' }}>
                        Condition
                      </label>
                      <select
                        className="form-control"
                        value={item.conditionAfter}
                        onChange={(e) => handleConditionChange(idx, e.target.value)}
                        style={{ fontSize: '0.82rem' }}
                      >
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="needs_maintenance">Needs Maintenance</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading}>
              <CheckCircle2 size={16} />
              {loading ? 'Updating Stock...' : 'Confirm Return & Auto-Restock'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
