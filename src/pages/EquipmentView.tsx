import React, { useState } from 'react';
import {
  Package,
  Plus,
  Search,
  Wrench,
  Trash2,
  AlertCircle,
  CheckCircle,
  Layers,
  AlertTriangle,
  Trophy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  SlidersHorizontal,
  X
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
  const [selectedCondition, setSelectedCondition] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'equipment_code' | 'category' | 'available_quantity' | 'condition' | 'status'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

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

  // Stat calculations
  const totalUnits = equipmentList.reduce((sum, eq) => sum + eq.total_quantity, 0);
  const availableUnits = equipmentList.reduce((sum, eq) => sum + eq.available_quantity, 0);
  const lowStockCount = equipmentList.filter(eq => eq.status === 'low_stock' || eq.status === 'out_of_stock').length;

  const hasActiveFilters =
    searchTerm !== '' ||
    selectedSport !== 'all' ||
    selectedStatus !== 'all' ||
    selectedCondition !== 'all' ||
    sortBy !== 'name' ||
    sortOrder !== 'asc';

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSport('all');
    setSelectedStatus('all');
    setSelectedCondition('all');
    setSortBy('name');
    setSortOrder('asc');
  };

  const handleSort = (field: 'name' | 'equipment_code' | 'category' | 'available_quantity' | 'condition' | 'status') => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredEquipment = [...equipmentList]
    .filter((eq) => {
      const matchesSearch =
        eq.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.equipment_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eq.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSport = selectedSport === 'all' || eq.sport_id === selectedSport;
      const matchesStatus = selectedStatus === 'all' || eq.status === selectedStatus;
      const matchesCondition = selectedCondition === 'all' || eq.condition === selectedCondition;
      return matchesSearch && matchesSport && matchesStatus && matchesCondition;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'equipment_code') {
        comparison = a.equipment_code.localeCompare(b.equipment_code);
      } else if (sortBy === 'category') {
        comparison = a.category.localeCompare(b.category);
      } else if (sortBy === 'available_quantity') {
        comparison = a.available_quantity - b.available_quantity;
      } else if (sortBy === 'condition') {
        comparison = a.condition.localeCompare(b.condition);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
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
      setNotification({ type: 'success', message: `Equipment "${newName}" added and logged into database!` });
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
      setNotification({ type: 'success', message: `Equipment ${eq.equipment_code} removed successfully.` });
      onRefresh();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: `ON DELETE RESTRICT Enforced: ${err instanceof Error ? err.message : 'Referenced by active records.'}`
      });
    }
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
            <Package size={22} />
          </div>
          <div className="stat-label">Equipment SKUs</div>
          <div className="stat-trend">Catalogued Types</div>
          <div className="stat-value" style={{ color: 'var(--coral)' }}>{equipmentList.length}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-cyan">
            <Layers size={22} />
          </div>
          <div className="stat-label">Available Units</div>
          <div className="stat-trend">{availableUnits} of {totalUnits} total in stock</div>
          <div className="stat-value" style={{ color: '#0EA5E9' }}>{availableUnits}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-amber">
            <AlertTriangle size={22} />
          </div>
          <div className="stat-label">Low Stock Alerts</div>
          <div className="stat-trend">Requires restocking</div>
          <div className="stat-value" style={{ color: '#F59E0B' }}>{lowStockCount}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-indigo">
            <Trophy size={22} />
          </div>
          <div className="stat-label">Sports Programs</div>
          <div className="stat-trend">Allocated disciplines</div>
          <div className="stat-value" style={{ color: '#287B9C' }}>{sports.length}</div>
        </div>
      </div>

      {/* Notifications */}
      {notification && (
        <div style={{
          padding: '0.9rem 1.25rem',
          borderRadius: '14px',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1.5px solid ${notification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {notification.type === 'success' ? <CheckCircle size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'inherit' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Action Header & Filters */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, maxWidth: '800px' }}>
          <div style={{
            position: 'relative',
            flex: '1 1 240px',
            background: '#FFFFFF',
            borderRadius: '9999px',
            border: '1.5px solid #E2E8F0',
            padding: '0.5rem 1rem 0.5rem 2.4rem',
            display: 'flex',
            alignItems: 'center'
          }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', color: '#94A3B8' }} />
            <input
              type="text"
              placeholder="Search equipment..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                background: 'transparent',
                fontSize: '0.88rem',
                color: '#1E293B',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <select
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '9999px',
              border: '1.5px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
            value={selectedSport}
            onChange={(e) => setSelectedSport(e.target.value)}
          >
            <option value="all">All Sports</option>
            {sports.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select
            style={{
              padding: '0.55rem 1.15rem',
              borderRadius: '9999px',
              border: '1.5px solid #E2E8F0',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: '0.85rem',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="available">Available</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="under_maintenance">Under Maintenance</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn-refresh-modern"
            onClick={onRefresh}
            title="Refresh equipment catalog"
            aria-label="Refresh equipment"
          >
            <i className="bi bi-arrow-clockwise"></i>
            <span>Refresh</span>
          </button>

          {currentRole !== 'student' && (
            <button
              onClick={() => setIsAddOpen(true)}
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
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={16} /> Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Equipment Table Card */}
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
            <Package size={20} color="var(--coral)" />
            Equipment Inventory
          </h3>
          <span className="pill-soft pill-coral">
            {filteredEquipment.length} items
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table-modern">
            <thead>
              <tr>
                <th>Code & Name</th>
                <th>Discipline</th>
                <th>Category</th>
                <th>Availability Ratio</th>
                <th>Condition</th>
                <th>Status</th>
                {currentRole !== 'student' && <th style={{ textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEquipment.length === 0 ? (
                <tr>
                  <td colSpan={currentRole !== 'student' ? 7 : 6} style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94A3B8' }}>
                    <Package size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                    <div style={{ fontWeight: 600 }}>No equipment matched your filters</div>
                  </td>
                </tr>
              ) : (
                filteredEquipment.map((eq) => {
                  const sport = sports.find(s => s.id === eq.sport_id);
                  const availabilityPct = Math.round((eq.available_quantity / Math.max(1, eq.total_quantity)) * 100);

                  return (
                    <tr key={eq.id}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.92rem' }}>{eq.name}</div>
                        <div style={{ fontSize: '0.76rem', fontFamily: 'var(--font-mono)', color: 'var(--coral)', fontWeight: 600 }}>
                          {eq.equipment_code}
                        </div>
                      </td>
                      <td>
                        <span className="pill-soft pill-blue">{sport?.name || 'General Athletics'}</span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.84rem', color: '#475569', fontWeight: 600 }}>{eq.category}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#1E293B' }}>
                            {eq.available_quantity} <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/ {eq.total_quantity}</span>
                          </span>
                        </div>
                        <div style={{
                          width: '90px',
                          height: '5px',
                          background: '#E2E8F0',
                          borderRadius: '9999px',
                          marginTop: '4px',
                          overflow: 'hidden'
                        }}>
                          <div style={{
                            width: `${availabilityPct}%`,
                            height: '100%',
                            background: eq.available_quantity === 0 ? '#EF4444' : eq.available_quantity <= 2 ? '#F59E0B' : '#10B981'
                          }} />
                        </div>
                      </td>
                      <td>
                        <span className="pill-soft" style={{
                          background: eq.condition === 'new' ? '#ECFDF5' : eq.condition === 'good' ? '#EFF6FF' : '#FEF3C7',
                          color: eq.condition === 'new' ? '#047857' : eq.condition === 'good' ? '#1D4ED8' : '#B45309',
                          textTransform: 'capitalize'
                        }}>
                          {eq.condition.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <span className={`pill-soft ${
                          eq.status === 'available'
                            ? 'pill-green'
                            : eq.status === 'low_stock'
                            ? 'pill-amber'
                            : eq.status === 'out_of_stock'
                            ? 'pill-coral'
                            : 'pill-blue'
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
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                background: '#FFFFFF',
                                color: '#475569',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                              title="Schedule Maintenance"
                            >
                              <Wrench size={14} color="#287B9C" />
                            </button>
                            {currentRole === 'admin' && (
                              <button
                                onClick={() => handleDelete(eq)}
                                style={{
                                  width: '32px',
                                  height: '32px',
                                  borderRadius: '8px',
                                  border: '1px solid #FECACA',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer'
                                }}
                                title="Delete Item"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD EQUIPMENT MODAL */}
      {isAddOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setIsAddOpen(false)}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '540px',
            width: '100%',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAddSubmit}>
              <div style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFBFD'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--sidebar-bg)' }}>
                  Add New Athletic Equipment
                </h3>
                <button type="button" onClick={() => setIsAddOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}>
                  &times;
                </button>
              </div>

              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label-custom">Sport Discipline</label>
                  <select
                    className="form-control"
                    value={newSportId}
                    onChange={(e) => setNewSportId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                  >
                    {sports.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label-custom">Equipment Code (Unique SKU)</label>
                  <input
                    type="text"
                    placeholder="e.g., EQ-VB-003"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label className="form-label-custom">Item Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Molten Pro Touch Volleyball"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label-custom">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                    >
                      <option value="Ball">Ball</option>
                      <option value="Training Aid">Training Aid</option>
                      <option value="Hardware">Hardware</option>
                      <option value="Timing Tech">Timing Tech</option>
                      <option value="Medical">Medical</option>
                      <option value="Protective Gear">Protective Gear</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label-custom">Total Quantity</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      value={newTotalQty}
                      onChange={(e) => setNewTotalQty(parseInt(e.target.value) || 1)}
                      required
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label-custom">Initial Condition</label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as Equipment['condition'])}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                  >
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                  </select>
                </div>
              </div>

              <div style={{
                padding: '1.15rem 1.75rem',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: '#FAFBFD'
              }}>
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '9999px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.45rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: 'var(--coral-gradient)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Save Equipment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LOG MAINTENANCE MODAL */}
      {isMaintOpen && selectedEqForMaint && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setIsMaintOpen(false)}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '520px',
            width: '100%',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleMaintSubmit}>
              <div style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFBFD'
              }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--sidebar-bg)' }}>
                  Schedule Equipment Servicing
                </h3>
                <button type="button" onClick={() => setIsMaintOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}>
                  &times;
                </button>
              </div>

              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{
                  background: '#F8FAFC',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0'
                }}>
                  <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Selected Equipment</div>
                  <div style={{ fontWeight: 800, color: '#1E293B', marginTop: '2px' }}>
                    {selectedEqForMaint.name} ({selectedEqForMaint.equipment_code})
                  </div>
                </div>

                <div>
                  <label className="form-label-custom">Issue Description & Servicing Action</label>
                  <textarea
                    rows={3}
                    placeholder="e.g., Replace inflation valve and check seam integrity"
                    value={maintIssue}
                    onChange={(e) => setMaintIssue(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label className="form-label-custom">Scheduled Date</label>
                    <input
                      type="date"
                      value={maintDate}
                      onChange={(e) => setMaintDate(e.target.value)}
                      required
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                    />
                  </div>

                  <div>
                    <label className="form-label-custom">Estimated Cost (PHP)</label>
                    <input
                      type="number"
                      min={0}
                      step={50}
                      value={maintCost}
                      onChange={(e) => setMaintCost(parseFloat(e.target.value) || 0)}
                      required
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{
                padding: '1.15rem 1.75rem',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: '#FAFBFD'
              }}>
                <button
                  type="button"
                  onClick={() => setIsMaintOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '9999px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.45rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: 'var(--coral-gradient)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
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
