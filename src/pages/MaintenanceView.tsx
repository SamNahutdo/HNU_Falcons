import React, { useState, useEffect } from 'react';
import { MaintenanceRecord, Equipment, UserRole } from '../types/database';
import { databaseService } from '../services/supabase';

interface MaintenanceViewProps {
  equipmentList: Equipment[];
  currentRole: UserRole;
  onRefresh: () => void;
}

export const MaintenanceView: React.FC<MaintenanceViewProps> = ({
  equipmentList,
  currentRole,
  onRefresh
}) => {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedEqId, setSelectedEqId] = useState<string>(equipmentList[0]?.id || '');
  const [issueDesc, setIssueDesc] = useState<string>('');
  const [scheduledDate, setScheduledDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [repairCost, setRepairCost] = useState<number>(350);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const data = await databaseService.getMaintenanceRecords();
      setRecords(data);
    } catch (err) {
      console.error('Error fetching maintenance records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [equipmentList]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEqId || !issueDesc.trim()) return;

    try {
      await databaseService.addMaintenanceRecord(
        selectedEqId,
        '10000000-0000-0000-0000-000000000002', // staff custodian
        issueDesc,
        scheduledDate,
        repairCost
      );

      setNotification({
        type: 'success',
        message: 'Maintenance ticket successfully created and logged into database audit trail!'
      });
      setIsModalOpen(false);
      setIssueDesc('');
      fetchRecords();
      onRefresh();
    } catch (err) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to create maintenance ticket.'
      });
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesStatus = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      (r.equipment?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.equipment?.equipment_code || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.issue_description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.reporter?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  // Calculate Metrics
  const inProgressCount = records.filter(r => r.status === 'in_progress').length;
  const pendingCount = records.filter(r => r.status === 'pending').length;
  const completedCount = records.filter(r => r.status === 'completed').length;
  const totalCost = records.reduce((acc, r) => acc + (Number(r.cost) || 0), 0);

  return (
    <div className="container-fluid px-0">
      {/* NOTIFICATIONS */}
      {notification && (
        <div
          className="d-flex align-items-center justify-content-between p-3 mb-4 rounded-4 shadow-sm"
          style={{
            background: notification.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: notification.type === 'success' ? '#15803D' : '#991B1B',
            border: `1px solid ${notification.type === 'success' ? '#BBF7D0' : '#FECACA'}`
          }}
        >
          <div className="d-flex align-items-center gap-2">
            <i className={`bi ${notification.type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill'}`}></i>
            <span className="fw-semibold" style={{ fontSize: '0.88rem' }}>{notification.message}</span>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setNotification(null)}
            aria-label="Close"
          ></button>
        </div>
      )}

      {/* TOP HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h4 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Maintenance</h4>
        </div>

        {currentRole !== 'student' && (
          <button
            type="button"
            className="btn rounded-pill px-4 py-2 text-white d-inline-flex align-items-center gap-2"
            style={{ background: 'var(--coral-gradient)', fontWeight: 700, boxShadow: 'var(--coral-shadow)' }}
            onClick={() => setIsModalOpen(true)}
          >
            <i className="bi bi-tools"></i>
            <span>Log Ticket</span>
          </button>
        )}
      </div>

      {/* 4 STATS CARDS (Matching FalconSystem UI Theme) */}
      <div className="row g-3 mb-4">
        {/* Card 1: In Progress */}
        <div className="col-6 col-md-3">
          <div className="card-stat-modern h-100">
            <div className="stat-icon-circle stat-icon-coral">
              <i className="bi bi-gear-wide-connected"></i>
            </div>
            <div className="stat-label">In Progress</div>
            <div className="stat-trend" style={{ color: 'var(--coral)' }}>Under Repair</div>
            <h3 className="stat-value" style={{ color: 'var(--coral)' }}>{inProgressCount}</h3>
          </div>
        </div>

        {/* Card 2: Pending Inspection */}
        <div className="col-6 col-md-3">
          <div className="card-stat-modern h-100">
            <div className="stat-icon-circle" style={{ background: '#FEF3C7', color: '#B45309' }}>
              <i className="bi bi-hourglass-split"></i>
            </div>
            <div className="stat-label">Pending Review</div>
            <div className="stat-trend" style={{ color: '#B45309' }}>Awaiting Action</div>
            <h3 className="stat-value text-dark">{pendingCount}</h3>
          </div>
        </div>

        {/* Card 3: Completed Repairs */}
        <div className="col-6 col-md-3">
          <div className="card-stat-modern h-100">
            <div className="stat-icon-circle stat-icon-green">
              <i className="bi bi-check2-circle"></i>
            </div>
            <div className="stat-label">Restored</div>
            <div className="stat-trend" style={{ color: '#10B981' }}>Back in Stock</div>
            <h3 className="stat-value text-dark">{completedCount}</h3>
          </div>
        </div>

        {/* Card 4: Total Servicing Cost */}
        <div className="col-6 col-md-3">
          <div className="card-stat-modern h-100">
            <div className="stat-icon-circle" style={{ background: '#E0F2FE', color: '#0369A1' }}>
              <i className="bi bi-cash-stack"></i>
            </div>
            <div className="stat-label">Total Repair Costs</div>
            <div className="stat-trend" style={{ color: '#0369A1' }}>Audited Ledger</div>
            <h3 className="stat-value text-dark" style={{ fontSize: '1.45rem' }}>₱{totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="card-modern mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          {/* Status Tabs */}
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: '9999px',
              padding: '4px',
              display: 'inline-flex',
              gap: '4px',
              flexWrap: 'wrap'
            }}
          >
            {[
              { key: 'all', label: `All (${records.length})` },
              { key: 'in_progress', label: `In Progress (${inProgressCount})` },
              { key: 'pending', label: `Pending (${pendingCount})` },
              { key: 'completed', label: `Completed (${completedCount})` },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setFilterStatus(tab.key)}
                className="btn btn-sm rounded-pill px-3"
                style={{
                  background: filterStatus === tab.key ? '#FFFFFF' : 'transparent',
                  color: filterStatus === tab.key ? 'var(--coral)' : '#64748B',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  border: 'none',
                  boxShadow: filterStatus === tab.key ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="search-input-wrapper" style={{ minWidth: '240px', maxWidth: '360px' }}>
            <i className="bi bi-search search-icon"></i>
            <input
              type="text"
              className="form-control"
              placeholder="Search by equipment, code, issue..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                borderRadius: '9999px',
                border: '1px solid var(--border-soft)',
                paddingLeft: '2.4rem',
                fontSize: '0.88rem'
              }}
            />
          </div>
        </div>
      </div>

      {/* MAINTENANCE WORK ORDERS TABLE */}
      <div className="card-modern">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="fw-bold mb-0" style={{ color: '#1E293B' }}>Work Orders</h5>
          <span className="badge rounded-pill" style={{ background: '#F1F5F9', color: '#475569', fontWeight: 600 }}>
            {filteredRecords.length} records
          </span>
        </div>

        <div className="table-responsive">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Equipment Code & Name</th>
                <th>Work Order / Issue</th>
                <th>Reported By</th>
                <th>Scheduled Date</th>
                <th>Est. Cost</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2"></div>
                    Loading telemetry from Supabase...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-5 text-muted">
                    <i className="bi bi-tools display-6 d-block mb-2 text-secondary opacity-50"></i>
                    No maintenance tickets found for this filter.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => {
                  const eq = r.equipment || equipmentList.find(e => e.id === r.equipment_id);
                  const statusColors: Record<string, { bg: string; text: string; icon: string }> = {
                    in_progress: { bg: '#FFEBE7', text: 'var(--coral)', icon: 'bi-gear-wide-connected' },
                    pending: { bg: '#FEF3C7', text: '#B45309', icon: 'bi-hourglass-split' },
                    completed: { bg: '#DCFCE7', text: '#15803D', icon: 'bi-check-circle-fill' },
                    cancelled: { bg: '#F1F5F9', text: '#64748B', icon: 'bi-x-circle' },
                  };
                  const currentSt = statusColors[r.status] || statusColors.pending;

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="fw-bold text-dark">{eq?.name || 'Equipment Gear'}</div>
                        <small className="text-muted font-monospace">{eq?.equipment_code || r.equipment_id.slice(0, 8)}</small>
                      </td>
                      <td style={{ maxWidth: '320px' }}>
                        <div className="text-truncate fw-medium" title={r.issue_description}>
                          {r.issue_description}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#EEF2FF',
                              color: '#4F46E5',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.72rem'
                            }}
                          >
                            {(r.reporter?.full_name || 'Staff').charAt(0)}
                          </div>
                          <span className="small fw-semibold text-secondary">
                            {r.reporter?.full_name || 'Staff Custodian'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-1 small text-dark fw-medium">
                          <i className="bi bi-calendar-event text-muted"></i>
                          <span>{new Date(r.scheduled_date).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td>
                        <span className="fw-bold text-dark">
                          ₱{Number(r.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td>
                        <span
                          className="pill-soft"
                          style={{
                            background: currentSt.bg,
                            color: currentSt.text,
                            textTransform: 'capitalize'
                          }}
                        >
                          <i className={`bi ${currentSt.icon}`}></i>
                          <span>{r.status.replace('_', ' ')}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MAINTENANCE TICKET MODAL */}
      {isModalOpen && (
        <div
          className="modal show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 1070 }}
        >
          <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '480px' }}>
            <div className="modal-content" style={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', overflow: 'hidden' }}>
              <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                <h5 className="modal-title fw-bold" style={{ color: '#20295B' }}>
                  <i className="bi bi-tools text-primary me-2"></i>
                  Log Servicing Ticket
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setIsModalOpen(false)}
                  aria-label="Close"
                ></button>
              </div>

              <form onSubmit={handleCreateTicket}>
                <div className="modal-body px-4 pt-3 pb-3">
                  {/* Select Equipment */}
                  <div className="mb-3">
                    <label className="form-label-custom">Target Equipment:</label>
                    <select
                      className="form-control"
                      value={selectedEqId}
                      onChange={(e) => setSelectedEqId(e.target.value)}
                      required
                      style={{ borderRadius: '12px', border: '1.5px solid var(--border-color)', padding: '0.65rem 0.85rem' }}
                    >
                      {equipmentList.map((eq) => (
                        <option key={eq.id} value={eq.id}>
                          {eq.equipment_code} - {eq.name} (Stock: {eq.available_quantity}/{eq.total_quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Issue Description */}
                  <div className="mb-3">
                    <label className="form-label-custom">Issue Description & Servicing Details:</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Replace worn grip wraps, tighten hinge bolts, replace net clamps..."
                      value={issueDesc}
                      onChange={(e) => setIssueDesc(e.target.value)}
                      required
                      style={{ borderRadius: '12px', border: '1.5px solid var(--border-color)' }}
                    ></textarea>
                  </div>

                  {/* Scheduled Date */}
                  <div className="mb-3">
                    <label className="form-label-custom">Scheduled Service Date:</label>
                    <input
                      type="date"
                      className="form-control"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      required
                      style={{ borderRadius: '12px', border: '1.5px solid var(--border-color)' }}
                    />
                  </div>

                  {/* Cost */}
                  <div className="mb-3">
                    <label className="form-label-custom">Estimated Repair Cost (₱):</label>
                    <input
                      type="number"
                      step="50"
                      min="0"
                      className="form-control"
                      value={repairCost}
                      onChange={(e) => setRepairCost(Number(e.target.value))}
                      required
                      style={{ borderRadius: '12px', border: '1.5px solid var(--border-color)' }}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 px-4 pb-4 pt-0">
                  <button
                    type="button"
                    className="btn btn-secondary rounded-pill px-4"
                    onClick={() => setIsModalOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn rounded-pill px-4 text-white"
                    style={{ background: 'var(--coral-gradient)', fontWeight: 700 }}
                  >
                    Confirm & Save Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
