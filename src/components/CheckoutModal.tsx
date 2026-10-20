import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldCheck, AlertCircle, ShoppingCart } from 'lucide-react';
import { Athlete, Equipment } from '../types/database';
import { databaseService } from '../services/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  athletes: Athlete[];
  equipmentList: Equipment[];
  onSuccess: () => void;
}

interface ItemRow {
  equipmentId: string;
  quantity: number;
  condition: string;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  athletes,
  equipmentList,
  onSuccess
}) => {
  const [athleteId, setAthleteId] = useState(athletes[0]?.id || '');
  const [expectedDate, setExpectedDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [remarks, setRemarks] = useState('');
  const [items, setItems] = useState<ItemRow[]>([
    { equipmentId: equipmentList[0]?.id || '', quantity: 1, condition: 'good' }
  ]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddItemRow = () => {
    const availableEq = equipmentList.find(e => !items.some(i => i.equipmentId === e.id) && e.available_quantity > 0);
    const idToAdd = availableEq ? availableEq.id : equipmentList[0]?.id || '';
    setItems([...items, { equipmentId: idToAdd, quantity: 1, condition: 'good' }]);
  };

  const handleRemoveRow = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleItemChange = (index: number, field: keyof ItemRow, val: unknown) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: val };
    setItems(newItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!athleteId) {
      setErrorMsg('Please select a student athlete.');
      return;
    }

    if (!expectedDate) {
      setErrorMsg('Please specify an expected return date.');
      return;
    }

    // Client-side quick check
    for (const item of items) {
      const eq = equipmentList.find(e => e.id === item.equipmentId);
      if (!eq) {
        setErrorMsg('Please select valid equipment.');
        return;
      }
      if (item.quantity <= 0) {
        setErrorMsg(`Quantity for "${eq.name}" must be greater than 0.`);
        return;
      }
      if (item.quantity > eq.available_quantity) {
        setErrorMsg(`Insufficient stock for "${eq.name}": requested ${item.quantity}, available ${eq.available_quantity}.`);
        return;
      }
    }

    setLoading(true);
    try {
      const formattedItems = items.map(i => ({
        equipment_id: i.equipmentId,
        quantity: Number(i.quantity),
        condition: i.condition
      }));

      await databaseService.checkoutEquipment(
        athleteId,
        formattedItems,
        expectedDate,
        undefined,
        remarks
      );

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setLoading(false);
      setErrorMsg(err instanceof Error ? err.message : 'Checkout transaction failed.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={18} color="#3b82f6" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800 }}>New Equipment Checkout Transaction</h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Executes atomic RPC <code style={{ color: '#60a5fa' }}>checkout_equipment()</code> with row-level locks</p>
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
                marginBottom: '1.25rem'
              }}>
                <AlertCircle size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Athlete Selector */}
            <div className="form-group">
              <label className="form-label">Varsity Athlete (Borrower)</label>
              <select
                className="form-control"
                value={athleteId}
                onChange={(e) => setAthleteId(e.target.value)}
                required
              >
                {athletes.map((ath) => (
                  <option key={ath.id} value={ath.id}>
                    {ath.user?.full_name} ({ath.student_number} - {ath.department})
                  </option>
                ))}
              </select>
            </div>

            {/* Expected Return Date */}
            <div className="form-group">
              <label className="form-label">Expected Return Date</label>
              <input
                type="date"
                className="form-control"
                value={expectedDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setExpectedDate(e.target.value)}
                required
              />
            </div>

            {/* Equipment Items Table */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <label className="form-label" style={{ margin: 0 }}>Borrowing Items (Junction 2: borrowing_items)</label>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                >
                  <Plus size={13} /> Add Another Item
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {items.map((row, idx) => {
                  const selectedEq = equipmentList.find(e => e.id === row.equipmentId);
                  const maxAvailable = selectedEq?.available_quantity || 0;
                  return (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 1fr auto',
                        gap: '0.5rem',
                        alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.02)',
                        padding: '0.65rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div>
                        <select
                          className="form-control"
                          value={row.equipmentId}
                          onChange={(e) => handleItemChange(idx, 'equipmentId', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          {equipmentList.map(eq => (
                            <option key={eq.id} value={eq.id} disabled={eq.available_quantity === 0}>
                              {eq.name} ({eq.equipment_code}) — {eq.available_quantity} Avail
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <input
                          type="number"
                          className="form-control"
                          min={1}
                          max={maxAvailable || 1}
                          value={row.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                          style={{ fontSize: '0.82rem' }}
                        />
                      </div>

                      <div>
                        <select
                          className="form-control"
                          value={row.condition}
                          onChange={(e) => handleItemChange(idx, 'condition', e.target.value)}
                          style={{ fontSize: '0.82rem' }}
                        >
                          <option value="new">New</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                        </select>
                      </div>

                      <div>
                        <button
                          type="button"
                          onClick={() => handleRemoveRow(idx)}
                          disabled={items.length === 1}
                          className="btn btn-secondary btn-icon"
                          style={{ width: '32px', height: '32px', opacity: items.length === 1 ? 0.3 : 1 }}
                        >
                          <Trash2 size={14} color="#f87171" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Remarks */}
            <div className="form-group">
              <label className="form-label">Purpose / Scrimmage Remarks (Optional)</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g., UAAP Tournament weekend drills"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <ShieldCheck size={16} />
              {loading ? 'Processing Transaction...' : 'Confirm Atomic Checkout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
