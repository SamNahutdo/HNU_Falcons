import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Wrench,
  Trash2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { Equipment, Sport, UserRole } from '../types/database';
import { databaseService } from '../services/supabase';

interface EquipmentViewProps {
  equipmentList: Equipment[];
  sports: Sport[];
  currentRole: UserRole;
  onRefresh: () => void;
}

export const EquipmentView: React.FC<EquipmentViewProps> = ({
  equipmentList,
  sports,
  currentRole,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isMaintOpen, setIsMaintOpen] = useState(false);
  const [selectedEqForMaint, setSelectedEqForMaint] = useState<Equipment | null>(null);

  // Form states for Add Equipment
  const [newSportId, setNewSportId] = useState(sports[0]?.id || '');
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Ball');
  const [newTotalQty, setNewTotalQty] = useState(10);
  const [newCondition, setNewCondition] = useState<Equipment['condition']>('good');

  // Form states for Maintenance
  const [maintIssue, setMaintIssue] = useState('');
  const [maintDate, setMaintDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [maintCost, setMaintCost] = useState(250);

  // Alert message
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const filteredEquipment = equipmentList.filter((eq) => {
    const matchesSearch =
      eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === 'all' || eq.sport_id === selectedSport;
    const matchesStatus = selectedStatus === 'all' || eq.status === selectedStatus;
    return matchesSearch && matchesSport && matchesStatus;
  });

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await databaseService.addEquipment({
        sport_id: newSportId || sports[0]?.id,
        equipment_code: newCode.toUpperCase().trim(),
        name: newName.trim(),
        category: newCategory,
        total_quantity: Number(newTotalQty),
        available_quantity: Number(newTotalQty),
        condition: newCondition,
        status: newTotalQty > 2 ? 'available' : 'low_stock'
      });
      setIsAddOpen(false);
      setNewCode('');
      setNewName('');
      setNotification({ type: 'success', message: `Equipment "${newName}" added and logged into audit_logs table!` });
      onRefresh();
    } catch (err: unknown) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to add equipment' });
    }
  };

  const handleMaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqForMaint) return;
    try {
      await databaseService.addMaintenanceRecord(
        selectedEqForMaint.id,
        '10000000-0000-0000-0000-000000000002',
        maintIssue,
        maintDate,
        Number(maintCost)
      );
      setIsMaintOpen(false);
      setMaintIssue('');
      setNotification({ type: 'success', message: `Scheduled maintenance record logged for "${selectedEqForMaint.name}"!` });
      onRefresh();
    } catch (err: unknown) {
      setNotification({ type: 'error', message: err instanceof Error ? err.message : 'Failed to log maintenance' });
    }
  };

  const handleDelete = async (eq: Equipment) => {
    if (!confirm(`Are you sure you want to delete ${eq.name} (${eq.equipment_code})?\n\nNote: If this equipment has existing loans, the database ON DELETE RESTRICT constraint will abort the deletion.`)) {
      return;
    }
    try {
      await databaseService.deleteEquipment(eq.id);
      setNotification({ type: 'success', message: `Equipment ${eq.equipment_code} successfully removed!` });
      onRefresh();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: `ON DELETE RESTRICT Enforced: ${err instanceof Error ? err.message : 'Referenced by active records.'}`
      });
    }
  };

  return (
    <div className="content-container">
      {/* Notifications */}
      {notification && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: notification.type === 'success' ? '#34d399' : '#f87171',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {notification.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="btn btn-secondary btn-icon" style={{ width: '28px', height: '28px' }}>
            &times;
          </button>
        </div>
      )}

      {/* Action Header & Filters */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search equipment by code, name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '150px' }}
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            <option value="all">All Sports Codes</option>
            {sports.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: 'auto', minWidth: '140px' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="under_maintenance">Under Maintenance</option>
          </select>

          {currentRole !== 'student' && (
            <button
              onClick={() => setIsAddOpen(true)}
              className="btn btn-primary"
            >
              <Plus size={16} /> Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Equipment Table */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Package size={18} color="#3b82f6" />
              Equipment Inventory Master (3NF Normalized)
            </h3>
            <p className="card-subtitle">
              Table: <code style={{ color: '#93c5fd' }}>equipment</code> | FK to <code style={{ color: '#93c5fd' }}>sports(id) ON DELETE RESTRICT</code>
            </p>
          </div>
          <span className="badge badge-neutral">
            Showing {filteredEquipment.length} of {equipmentList.length} items
          </span>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code & Name</th>
                <th>Sport Discipline</th>
                <th>Category</th>
                <th>Availability</th>
                <th>Condition</th>
                <th>Status</th>
                {currentRole !== 'student' && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.map((eq) => {
                const sport = sports.find(s => s.id === eq.sport_id);
                return (
                  <tr key={eq.id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{eq.name}</div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                        {eq.equipment_code}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral">{sport?.name || 'General Athletics'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem' }}>{eq.category}</span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                        {eq.available_quantity} <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>/ {eq.total_quantity}</span>
                      </div>
                      <div style={{
                        width: '80px',
                        height: '4px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '2px',
                        marginTop: '4px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(eq.available_quantity / Math.max(1, eq.total_quantity)) * 100}%`,
                          height: '100%',
                          background: eq.available_quantity === 0 ? '#ef4444' : eq.available_quantity <= 2 ? '#f59e0b' : '#10b981'
                        }} />
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-neutral" style={{ textTransform: 'capitalize' }}>
                        {eq.condition.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${
                        eq.status === 'available'
                          ? 'badge-success'
                          : eq.status === 'low_stock'
                          ? 'badge-warning'
                          : eq.status === 'out_of_stock'
                          ? 'badge-danger'
                          : 'badge-neutral'
                      }`}>
                        {eq.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    {currentRole !== 'student' && (
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => {
                              setSelectedEqForMaint(eq);
                              setIsMaintOpen(true);
                            }}
                            className="btn btn-secondary btn-icon"
                            style={{ width: '30px', height: '30px' }}
                            title="Schedule Maintenance"
                          >
                            <Wrench size={13} />
                          </button>
                          {currentRole === 'admin' && (
                            <button
                              onClick={() => handleDelete(eq)}
                              className="btn btn-danger btn-icon"
                              style={{ width: '30px', height: '30px' }}
                              title="Delete Item (Tests ON DELETE RESTRICT)"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EQUIPMENT MODAL */}
      {isAddOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Add New Athletic Equipment</h3>
                <button type="button" onClick={() => setIsAddOpen(false)} className="btn btn-secondary btn-icon" style={{ width: '30px', height: '30px' }}>
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Sport Discipline</label>
                  <select
                    className="form-control"
                    value={newSportId}
                    onChange={(e) => setNewSportId(e.target.value)}
                    required
                  >
                    {sports.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Equipment Code (Unique Key)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., EQ-VB-003"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Item Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Molten Pro Touch Volleyball"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-control"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                    >
                      <option value="Ball">Ball</option>
                      <option value="Training Aid">Training Aid</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Timing Tech">Timing Tech</option>
                      <option value="Medical">Medical</option>
                      <option value="Protective Gear">Protective Gear</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Total Quantity</label>
                    <input
                      type="number"
                      className="form-control"
                      min={1}
                      max={500}
                      value={newTotalQty}
                      onChange={(e) => setNewTotalQty(parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Initial Condition</label>
                  <select
                    className="form-control"
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as Equipment['condition'])}
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG MAINTENANCE MODAL */}
      {isMaintOpen && selectedEqForMaint && (
        <div className="modal-backdrop" onClick={() => setIsMaintOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <form onSubmit={handleMaintSubmit}>
              <div className="modal-header">
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Schedule Equipment Maintenance</h3>
                <button type="button" onClick={() => setIsMaintOpen(false)} className="btn btn-secondary btn-icon" style={{ width: '30px', height: '30px' }}>
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '1rem',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Target Gear:</div>
                  <div style={{ fontWeight: 700 }}>{selectedEqForMaint.name} ({selectedEqForMaint.equipment_code})</div>
                </div>

                <div className="form-group">
                  <label className="form-label">Issue Description & Servicing Action</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="e.g., Replace inflation valve and check seam integrity"
                    value={maintIssue}
                    onChange={(e) => setMaintIssue(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="form-group">
                    <label className="form-label">Scheduled Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={maintDate}
                      onChange={(e) => setMaintDate(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estimated Cost (PHP)</label>
                    <input
                      type="number"
                      className="form-control"
                      min={0}
                      step={50}
                      value={maintCost}
                      onChange={(e) => setMaintCost(parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsMaintOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Log Maintenance Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
