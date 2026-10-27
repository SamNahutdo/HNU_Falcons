import React, { useState, useEffect } from 'react';
import { SearchField } from '../components/SearchField';
import { dashboardApi } from '../services/dashboardApi';
import {
  Equipment,
  BorrowingTransaction,
  CoachBooking,
  StaffReport,
  RegisteredAccount,
  Sport
} from '../types/database';

interface StaffDashboardViewProps {
  currentRole: string;
  userDisplayName: string;
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const StaffDashboardView: React.FC<StaffDashboardViewProps> = ({ currentTab = 'equipment' }) => {
  // Navigation driven by Sidebar
  const effectiveTab =
    currentTab === 'borrowing' ? 'loans' :
    currentTab === 'bookings' ? 'bookings' :
    currentTab === 'reports' ? 'reports' : 'inventory';

  // Database states
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
  const [transactions, setTransactions] = useState<BorrowingTransaction[]>([]);
  const [bookings, setBookings] = useState<CoachBooking[]>([]);
  const [registeredBorrowers, setRegisteredBorrowers] = useState<RegisteredAccount[]>([]);
  const [reports, setReports] = useState<StaffReport[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDay, setFilterDay] = useState<string>('all');

  // Modals state
  const [isAddEqOpen, setIsAddEqOpen] = useState(false);
  const [editingEq, setEditingEq] = useState<Equipment | null>(null);
  const [inspectingEq, setInspectingEq] = useState<Equipment | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportType, setReportType] = useState<'damaged_equipment' | 'overdue_return'>('damaged_equipment');

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Form states: New Equipment
  const [newEqName, setNewEqName] = useState('');
  const [newEqCode, setNewEqCode] = useState('');
  const [newEqCategory, setNewEqCategory] = useState('Ball');
  const [newEqQuantity, setNewEqQuantity] = useState<number>(10);
  const [newEqCondition, setNewEqCondition] = useState<Equipment['condition']>('good');
  const [newEqDays, setNewEqDays] = useState<string[]>(['Monday', 'Wednesday', 'Friday']);

  // Form states: Issue Checkout
  const [loanBorrowerSchoolId, setLoanBorrowerSchoolId] = useState('');
  const [loanEquipmentId, setLoanEquipmentId] = useState('');
  const [loanQuantity, setLoanQuantity] = useState<number>(1);
  const [loanReturnDate, setLoanReturnDate] = useState('');
  const [loanRemarks, setLoanRemarks] = useState('');

  // Form states: Staff Report to Admin
  const [repBorrowerSchoolId, setRepBorrowerSchoolId] = useState('');
  const [repEquipmentId, setRepEquipmentId] = useState('');
  const [repDescription, setRepDescription] = useState('');
  const [repSeverity, setRepSeverity] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAll = async () => {
    try {
      const data = await dashboardApi.getData();
      setEquipmentList(data.equipment);
      setSports(data.sports);
      setTransactions(data.transactions);
      setBookings(data.bookings);
      setReports(data.reports);
      setRegisteredBorrowers(data.users.filter(user => user.status === 'active' && user.is_verified));
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not load staff dashboard data.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadAll();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadAll();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Alert Student or Coach regarding return deadline
  const handleSendAlert = async (tx: BorrowingTransaction) => {
    try {
      await dashboardApi.sendReturnAlert(
        tx.id,
        `Please return ${tx.items?.map(item => item.equipment?.name).filter(Boolean).join(', ') || 'borrowed sports equipment'} by ${tx.expected_return_date}.`
      );
      showToast(`Return alert sent to ${tx.borrower_name || 'Borrower'} (${tx.borrower_school_id || ''})`);
      await loadAll();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not send return alert.');
    }
  };

  // 2. Process Return
  const handleReturnItem = async (txId: string) => {
    try {
      await dashboardApi.returnLoan(txId);
      await loadAll();
      showToast('Equipment marked returned and stock replenished.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not process equipment return.');
    }
  };

  // 3. Equipment CRUD: Add
  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEqName.trim() || !newEqCode.trim()) return;

    if (!sports[0]) {
      showToast('No sport categories are available. Ask an administrator to configure sports first.');
      return;
    }
    try {
      await dashboardApi.createEquipment({
        sport_id: sports[0].id,
        equipment_code: newEqCode.trim().toUpperCase(),
        name: newEqName.trim(),
        category: newEqCategory,
        total_quantity: Number(newEqQuantity),
        condition: newEqCondition,
        available_days: newEqDays.length > 0 ? newEqDays : ALL_DAYS
      });
      setIsAddEqOpen(false);
      setNewEqName('');
      setNewEqCode('');
      await loadAll();
      showToast('New sports equipment added to inventory.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not add equipment.');
    }
  };

  // 4. Equipment CRUD: Update
  const handleSaveEditEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEq) return;

    try {
      await dashboardApi.updateEquipment(editingEq.id, {
        name: editingEq.name,
        equipment_code: editingEq.equipment_code,
        category: editingEq.category,
        total_quantity: Number(editingEq.total_quantity),
        condition: editingEq.condition,
        available_days: editingEq.available_days
      });
      setEditingEq(null);
      await loadAll();
      showToast('Equipment updated successfully.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not update equipment.');
    }
  };

  // 5. Equipment CRUD: Delete
  const handleDeleteEquipment = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory?`)) {
      try {
        await dashboardApi.retireEquipment(id);
        await loadAll();
        showToast('Equipment item deleted.');
      } catch (error: unknown) {
        showToast(error instanceof Error ? error.message : 'Cannot remove item.');
      }
    }
  };

  // 6. Check Condition / Log Issue
  const handleSaveConditionInspection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingEq) return;

    try {
      await dashboardApi.updateEquipment(inspectingEq.id, {
        condition: inspectingEq.condition,
        condition_notes: inspectingEq.condition_notes
      });
      setInspectingEq(null);
      await loadAll();
      showToast('Equipment condition inspection logged.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not save equipment inspection.');
    }
  };

  // 7. Issue Direct Checkout
  const handleExecuteCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    const borrower = registeredBorrowers.find(b => b.school_id === loanBorrowerSchoolId || b.id === loanBorrowerSchoolId);
    if (!borrower || !loanEquipmentId || !loanReturnDate) {
      showToast('Please fill all required checkout fields.');
      return;
    }

    try {
      await dashboardApi.createLoan({
        borrower_school_id: borrower.school_id || borrower.id,
        equipment_id: loanEquipmentId,
        quantity: Number(loanQuantity),
        expected_return_date: loanReturnDate,
        remarks: loanRemarks.trim() || 'Staff Desk Direct Issue'
      });
      setIsCheckoutOpen(false);
      setLoanBorrowerSchoolId('');
      setLoanEquipmentId('');
      setLoanRemarks('');
      await loadAll();
      showToast('Equipment issued successfully.');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Checkout failed.');
    }
  };

  // 8. Submit Report to Admin (Damaged equipment or Overdue return)
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    const borrower = registeredBorrowers.find(b => b.school_id === repBorrowerSchoolId);
    const eq = equipmentList.find(item => item.id === repEquipmentId);

    if (!borrower || !repDescription.trim()) {
      showToast('Borrower and description are required.');
      return;
    }

    try {
      await dashboardApi.createReport({
        report_type: reportType,
        borrower_school_id: borrower.school_id,
        item_id: eq?.id,
        description: repDescription.trim(),
        severity: repSeverity
      });
      setIsReportOpen(false);
      setRepDescription('');
      await loadAll();
      showToast('Report submitted directly to Admin.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not submit report.');
    }
  };

  const handleTogglePresence = async (userId: string) => {
    try {
      await dashboardApi.updateUser(userId, 'toggle_presence');
      await loadAll();
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not update account presence.');
    }
  };

  const handleApproveBooking = async (bookingId: string) => {
    try {
      await dashboardApi.updateBookingStatus(bookingId, 'approved', 'Approved by Staff Operations Desk');
      await loadAll();
      showToast('Booking approved.');
    } catch (error: unknown) {
      showToast(error instanceof Error ? error.message : 'Could not approve booking.');
    }
  };

  // Filtered equipment by search and available day
  const filteredEquipment = equipmentList.filter(eq => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query ||
      eq.name.toLowerCase().includes(query) ||
      eq.equipment_code.toLowerCase().includes(query) ||
      eq.category.toLowerCase().includes(query);
    const matchesDay = filterDay === 'all' || (eq.available_days && eq.available_days.includes(filterDay));
    return matchesSearch && matchesDay;
  });
  const filteredTransactions = transactions.filter(tx => {
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      (tx.borrower_name || '').toLowerCase().includes(query) ||
      (tx.borrower_school_id || '').toLowerCase().includes(query) ||
      (tx.items?.[0]?.equipment?.name || tx.remarks || '').toLowerCase().includes(query) ||
      tx.status.includes(query);
  });
  const filteredBorrowers = registeredBorrowers.filter(b => {
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      b.full_name.toLowerCase().includes(query) ||
      b.school_id.toLowerCase().includes(query) ||
      b.role.includes(query);
  });
  const filteredBookings = bookings.filter(b => {
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      b.student_name.toLowerCase().includes(query) ||
      b.student_school_id.toLowerCase().includes(query) ||
      b.coach_name.toLowerCase().includes(query) ||
      b.sport.toLowerCase().includes(query) ||
      b.purpose.toLowerCase().includes(query) ||
      b.status.includes(query);
  });
  const filteredReports = reports.filter(report => {
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      report.borrower_name.toLowerCase().includes(query) ||
      report.borrower_school_id.toLowerCase().includes(query) ||
      (report.item_name || '').toLowerCase().includes(query) ||
      report.description.toLowerCase().includes(query) ||
      report.status.includes(query);
  });

  return (
    <div className="container-fluid px-0">
      {/* HEADER & TOAST */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-3">
          <h4 className="fw-bold mb-0 text-dark">Staff Operations Desk</h4>
          <button
            type="button"
            className="btn-refresh-modern"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh staff operations data"
            aria-label="Refresh staff data"
          >
            <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i>
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
          </button>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCheckoutOpen(true)}
            className="btn btn-sm text-white"
            style={{ background: 'var(--coral)', fontWeight: 700, borderRadius: '10px', padding: '0.45rem 1rem' }}
          >
            <i className="bi bi-cart-plus me-1"></i> Issue Loan
          </button>
          <button
            type="button"
            onClick={() => { setReportType('damaged_equipment'); setIsReportOpen(true); }}
            className="btn btn-sm btn-outline-danger"
            style={{ fontWeight: 700, borderRadius: '10px', padding: '0.45rem 1rem' }}
          >
            <i className="bi bi-exclamation-octagon me-1"></i> Report to Admin
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="alert alert-primary py-2 px-3 mb-4 rounded-3 d-flex justify-content-between align-items-center shadow-sm">
          <span><i className="bi bi-info-circle-fill me-2"></i>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="btn-close btn-close-sm"></button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: EQUIPMENT INVENTORY & AVAILABLE DAYS & CRUD
          ========================================================================= */}
      {effectiveTab === 'inventory' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Equipment Inventory Management</h5>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* FILTER BY DAY */}
              <select
                className="form-select form-select-sm"
                value={filterDay}
                onChange={(e) => setFilterDay(e.target.value)}
                style={{ width: '160px', borderRadius: '10px', fontSize: '0.82rem' }}
              >
                <option value="all">All Available Days</option>
                {ALL_DAYS.map(day => (
                  <option key={day} value={day}>Available on {day}</option>
                ))}
              </select>

              <button
                type="button"
                className="btn-refresh-modern"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh equipment inventory"
              >
                <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i>
                <span>Refresh</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddEqOpen(true)}
                className="btn btn-sm btn-dark"
                style={{ borderRadius: '10px', fontWeight: 700 }}
              >
                <i className="bi bi-plus-lg me-1"></i> Add Equipment
              </button>
            </div>
          </div>

          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search item or code..." />

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <tr>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3">Item Name</th>
                  <th className="py-3">Stock (Avail/Total)</th>
                  <th className="py-3">Available Days</th>
                  <th className="py-3">Condition</th>
                  <th className="py-3 text-end px-3">Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem' }}>
                {filteredEquipment.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-muted">
                      No equipment found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredEquipment.map(eq => (
                    <tr key={eq.id}>
                      <td className="px-3 fw-bold text-dark">
                        <span className="badge rounded-pill px-2 py-1" style={{ background: '#F1F5F9', color: '#475569', border: '1px solid #E2E8F0' }}>
                          {eq.equipment_code}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{eq.name}</div>
                        <small className="text-muted">{eq.category}</small>
                      </td>
                      <td>
                        <span className="fw-bold text-dark">{eq.available_quantity}</span>
                        <span className="text-muted"> / {eq.total_quantity}</span>
                        {eq.available_quantity === 0 && (
                          <span className="badge bg-danger ms-2" style={{ fontSize: '0.68rem' }}>Out of Stock</span>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-wrap gap-1" style={{ maxWidth: '220px' }}>
                          {eq.available_days?.map(d => (
                            <span key={d} className="badge bg-light text-secondary" style={{ fontSize: '0.68rem', border: '1px solid #E2E8F0' }}>
                              {d.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setInspectingEq(eq)}
                          className={`badge border-0 rounded-pill px-2 py-1 text-capitalize ${
                            eq.condition === 'good' || eq.condition === 'new' ? 'bg-success' :
                            eq.condition === 'fair' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}
                          style={{ cursor: 'pointer' }}
                          title="Click to check or update condition"
                        >
                          <i className="bi bi-tools me-1"></i>{eq.condition}
                        </button>
                      </td>
                      <td className="text-end px-3">
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            onClick={() => setEditingEq(eq)}
                            className="btn btn-outline-secondary"
                            title="Edit Equipment Details"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEquipment(eq.id, eq.name)}
                            className="btn btn-outline-danger"
                            title="Delete Item"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BORROWERS & LOANS + ONLINE/OFFLINE + ALERTS
          ========================================================================= */}
      {effectiveTab === 'loans' && (
        <div className="row g-4">
          {/* ACTIVE LOANS & RETURN DEADLINES */}
          <div className="col-lg-8">
            <div className="card-modern h-100">
              <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <h5 className="fw-bold mb-0 text-dark">Active Loans & Deadline Alerts</h5>
                  <button
                    type="button"
                    className="btn-refresh-modern"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="Refresh loans"
                  >
                    <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i>
                    <span>Refresh</span>
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutOpen(true)}
                  className="btn btn-sm btn-dark"
                  style={{ borderRadius: '10px' }}
                >
                  <i className="bi bi-plus-lg me-1"></i> Issue Loan
                </button>
              </div>

              <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search borrower, school ID, or equipment..." />

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                    <tr>
                      <th className="py-3 px-3">Borrower</th>
                      <th className="py-3">Equipment</th>
                      <th className="py-3">Deadline</th>
                      <th className="py-3">Status</th>
                      <th className="py-3 text-end px-3">Staff Actions</th>
                    </tr>
                  </thead>
                  <tbody style={{ fontSize: '0.84rem' }}>
                    {filteredTransactions.map(tx => {
                      const itemName = tx.items?.[0]?.equipment?.name || tx.remarks || 'Sports Gear';
                      return (
                        <tr key={tx.id}>
                          <td className="px-3">
                            <div className="fw-semibold text-dark">{tx.borrower_name}</div>
                            <small className="text-muted">{tx.borrower_school_id} ({tx.borrower_role})</small>
                          </td>
                          <td>
                            <div className="text-dark fw-medium">{itemName}</div>
                            <small className="text-muted">{tx.items?.[0]?.quantity || 1} unit(s)</small>
                          </td>
                          <td>
                            <div className="fw-semibold text-dark">{tx.expected_return_date}</div>
                            {tx.alert_sent && (
                              <span className="badge bg-danger rounded-pill px-2 py-0" style={{ fontSize: '0.68rem' }}>
                                Alert Dispatched
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge rounded-pill px-2 py-1 ${
                                tx.status === 'returned' ? 'bg-success' :
                                tx.status === 'overdue' ? 'bg-danger' : 'bg-warning text-dark'
                              }`}
                            >
                              {tx.status}
                            </span>
                          </td>
                          <td className="text-end px-3">
                            {tx.status !== 'returned' ? (
                              <div className="btn-group btn-group-sm">
                                <button
                                  type="button"
                                  onClick={() => handleSendAlert(tx)}
                                  className="btn btn-warning text-dark fw-semibold"
                                  title="Send return deadline alert"
                                >
                                  <i className="bi bi-bell-fill me-1"></i> Alert
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleReturnItem(tx.id)}
                                  className="btn btn-outline-success"
                                  title="Process Return"
                                >
                                  <i className="bi bi-check2"></i> Return
                                </button>
                              </div>
                            ) : (
                              <span className="text-success small fw-semibold">
                                <i className="bi bi-check-circle me-1"></i> Returned
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* REGISTERED BORROWERS & ONLINE STATUS */}
          <div className="col-lg-4">
            <div className="card-modern h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <h5 className="fw-bold mb-0 text-dark">Borrowers Directory</h5>
                </div>
                <span className="badge bg-secondary rounded-pill px-2 py-1">
                  {filteredBorrowers.length} Members
                </span>
              </div>

              <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search borrowers by name or school ID..." />

              <div className="d-flex flex-column gap-2">
                {filteredBorrowers.map(b => (
                  <div
                    key={b.id}
                    className="p-2 rounded-3 d-flex justify-content-between align-items-center"
                    style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                  >
                    <div>
                      <div className="fw-bold text-dark" style={{ fontSize: '0.84rem' }}>{b.full_name}</div>
                      <small className="text-muted">{b.school_id} • {b.role.toUpperCase()}</small>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <span className="d-inline-flex align-items-center gap-1">
                        <span
                          style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: b.is_online ? '#10B981' : '#94A3B8'
                          }}
                        />
                        <small className={b.is_online ? 'text-success fw-bold' : 'text-muted'} style={{ fontSize: '0.74rem' }}>
                          {b.is_online ? 'Online' : 'Offline'}
                        </small>
                      </span>

                      <button
                        type="button"
                        onClick={() => void handleTogglePresence(b.id)}
                        className="btn btn-sm btn-link text-muted p-0 ms-1"
                        title="Toggle presence simulation"
                      >
                        <i className="bi bi-arrow-repeat"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MANAGE STUDENT-COACH BOOKINGS
          ========================================================================= */}
      {effectiveTab === 'bookings' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold mb-0 text-dark">Student-to-Coach Bookings</h5>
              <button
                type="button"
                className="btn-refresh-modern"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh bookings"
              >
                <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i>
                <span>Refresh</span>
              </button>
            </div>
            <span className="badge bg-info text-dark rounded-pill px-3 py-1">
              {filteredBookings.length} Bookings
            </span>
          </div>

          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search students, coaches, or bookings..." />

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <tr>
                  <th className="py-3 px-3">Student</th>
                  <th className="py-3">Coach & Sport</th>
                  <th className="py-3">Date & Time Slot</th>
                  <th className="py-3">Purpose</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-end px-3">Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem' }}>
                {filteredBookings.map(b => (
                  <tr key={b.id}>
                    <td className="px-3">
                      <div className="fw-semibold text-dark">{b.student_name}</div>
                      <small className="text-muted">{b.student_school_id}</small>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{b.coach_name}</div>
                      <small className="text-muted">{b.sport}</small>
                    </td>
                    <td>
                      <div className="text-dark fw-medium">{b.booking_date}</div>
                      <small className="text-muted">{b.time_slot}</small>
                    </td>
                    <td style={{ maxWidth: '250px' }}>
                      <span className="text-secondary small">{b.purpose}</span>
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill px-2 py-1 ${
                          b.status === 'approved' ? 'bg-success' :
                          b.status === 'pending' ? 'bg-warning text-dark' : 'bg-secondary'
                        }`}
                      >
                        {b.status === 'pending' ? 'Pending Review' : b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end px-3">
                      {b.status === 'pending' && (
                        <button
                          type="button"
                          onClick={() => void handleApproveBooking(b.id)}
                          className="btn btn-sm btn-success"
                          style={{ borderRadius: '8px', fontSize: '0.78rem' }}
                        >
                          Approve
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: REPORTS TO ADMIN (DAMAGED GEAR / OVERDUE RETURNS)
          ========================================================================= */}
      {effectiveTab === 'reports' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div className="d-flex align-items-center gap-2">
              <h5 className="fw-bold mb-0 text-dark">Staff Incident Reports to Admin</h5>
              <button
                type="button"
                className="btn-refresh-modern"
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Refresh incident reports"
              >
                <i className={`bi bi-arrow-clockwise ${isRefreshing ? 'spin-animation' : ''}`}></i>
                <span>Refresh</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setIsReportOpen(true)}
              className="btn btn-sm btn-danger"
              style={{ borderRadius: '10px', fontWeight: 700 }}
            >
              <i className="bi bi-plus-lg me-1"></i> File New Incident Report
            </button>
          </div>

          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search borrower, equipment, or report..." />

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <tr>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3">Borrower Responsible</th>
                  <th className="py-3">Equipment Item</th>
                  <th className="py-3">Description</th>
                  <th className="py-3">Severity</th>
                  <th className="py-3">Admin Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem' }}>
                {filteredReports.map(rep => (
                  <tr key={rep.id}>
                    <td className="px-3">
                      <span className={`badge ${rep.report_type === 'damaged_equipment' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {rep.report_type === 'damaged_equipment' ? 'Damaged Equipment' : 'Overdue Return'}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{rep.borrower_name}</div>
                      <small className="text-muted">{rep.borrower_school_id} ({rep.borrower_role})</small>
                    </td>
                    <td className="fw-medium text-dark">{rep.item_name || 'Assigned Gear'}</td>
                    <td style={{ maxWidth: '300px' }}>
                      <span className="text-secondary small">{rep.description}</span>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark text-capitalize" style={{ border: '1px solid #CBD5E1' }}>
                        {rep.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge rounded-pill px-2 py-1 ${rep.status === 'resolved' ? 'bg-success' : 'bg-secondary'}`}>
                        {rep.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ADD NEW EQUIPMENT
          ========================================================================= */}
      {isAddEqOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Add Equipment to Inventory</h5>
                <button type="button" className="btn-close" onClick={() => setIsAddEqOpen(false)}></button>
              </div>
              <form onSubmit={handleCreateEquipment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label-custom">Equipment Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Wilson NCAA Evolution Basketball"
                      value={newEqName}
                      onChange={(e) => setNewEqName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label-custom">Code *</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="EQ-BB-002"
                        value={newEqCode}
                        onChange={(e) => setNewEqCode(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label-custom">Category</label>
                      <select
                        className="form-select"
                        value={newEqCategory}
                        onChange={(e) => setNewEqCategory(e.target.value)}
                      >
                        <option value="Ball">Ball</option>
                        <option value="Bat">Bat</option>
                        <option value="Glove">Glove</option>
                        <option value="Racket">Racket</option>
                        <option value="Protective Gear">Protective Gear</option>
                      </select>
                    </div>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label-custom">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={newEqQuantity}
                        onChange={(e) => setNewEqQuantity(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label-custom">Initial Condition</label>
                      <select
                        className="form-select"
                        value={newEqCondition}
                        onChange={(e) => setNewEqCondition(e.target.value as Equipment['condition'])}
                      >
                        <option value="new">New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                      </select>
                    </div>
                  </div>

                  {/* AVAILABLE DAYS SELECTOR */}
                  <div className="mb-3">
                    <label className="form-label-custom">Available Days for Borrowing</label>
                    <div className="d-flex flex-wrap gap-2">
                      {ALL_DAYS.map(day => {
                        const checked = newEqDays.includes(day);
                        return (
                          <label
                            key={day}
                            className={`badge px-3 py-2 ${checked ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                            style={{ cursor: 'pointer', border: '1px solid #CBD5E1', fontWeight: 600 }}
                          >
                            <input
                              type="checkbox"
                              className="d-none"
                              checked={checked}
                              onChange={() => {
                                if (checked) setNewEqDays(newEqDays.filter(d => d !== day));
                                else setNewEqDays([...newEqDays, day]);
                              }}
                            />
                            {day}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setIsAddEqOpen(false)}>Cancel</button>
                  <button type="submit" className="btn text-white" style={{ background: 'var(--coral)', fontWeight: 700 }}>
                    Save Equipment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: EDIT EQUIPMENT
          ========================================================================= */}
      {editingEq && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Edit Equipment</h5>
                <button type="button" className="btn-close" onClick={() => setEditingEq(null)}></button>
              </div>
              <form onSubmit={handleSaveEditEquipment}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label-custom">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingEq.name}
                      onChange={(e) => setEditingEq({ ...editingEq, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label-custom">Total Stock</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        value={editingEq.total_quantity}
                        onChange={(e) => setEditingEq({ ...editingEq, total_quantity: Number(e.target.value) })}
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label-custom">Condition</label>
                      <select
                        className="form-select"
                        value={editingEq.condition}
                        onChange={(e) => setEditingEq({ ...editingEq, condition: e.target.value as Equipment['condition'] })}
                      >
                        <option value="new">New</option>
                        <option value="good">Good</option>
                        <option value="fair">Fair</option>
                        <option value="needs_maintenance">Needs Maintenance</option>
                        <option value="damaged">Damaged</option>
                      </select>
                    </div>
                  </div>

                  {/* AVAILABLE DAYS */}
                  <div className="mb-3">
                    <label className="form-label-custom">Available Days</label>
                    <div className="d-flex flex-wrap gap-2">
                      {ALL_DAYS.map(day => {
                        const checked = editingEq.available_days?.includes(day);
                        return (
                          <label
                            key={day}
                            className={`badge px-3 py-2 ${checked ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                            style={{ cursor: 'pointer', border: '1px solid #CBD5E1', fontWeight: 600 }}
                          >
                            <input
                              type="checkbox"
                              className="d-none"
                              checked={checked}
                              onChange={() => {
                                const cur = editingEq.available_days || [];
                                const updated = checked ? cur.filter(d => d !== day) : [...cur, day];
                                setEditingEq({ ...editingEq, available_days: updated });
                              }}
                            />
                            {day}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setEditingEq(null)}>Cancel</button>
                  <button type="submit" className="btn btn-dark" style={{ fontWeight: 700 }}>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: INSPECT CONDITION / REPORT ITEM ISSUE
          ========================================================================= */}
      {inspectingEq && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Inspect Item Condition</h5>
                <button type="button" className="btn-close" onClick={() => setInspectingEq(null)}></button>
              </div>
              <form onSubmit={handleSaveConditionInspection}>
                <div className="modal-body">
                  <p className="fw-semibold text-dark mb-3">{inspectingEq.name}</p>

                  <div className="mb-3">
                    <label className="form-label-custom">Condition Status</label>
                    <select
                      className="form-select"
                      value={inspectingEq.condition}
                      onChange={(e) => setInspectingEq({ ...inspectingEq, condition: e.target.value as Equipment['condition'] })}
                    >
                      <option value="good">Good Condition</option>
                      <option value="fair">Fair (Usable with minor wear)</option>
                      <option value="needs_maintenance">Needs Maintenance</option>
                      <option value="damaged">Damaged (Broken/Unusable)</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Inspection Notes / Issue Details</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Ripped grip tape, scuffed surface, loose laces..."
                      value={inspectingEq.condition_notes || ''}
                      onChange={(e) => setInspectingEq({ ...inspectingEq, condition_notes: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setInspectingEq(null)}>Cancel</button>
                  <button type="submit" className="btn btn-dark" style={{ fontWeight: 700 }}>
                    Log Inspection
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ISSUE DIRECT CHECKOUT
          ========================================================================= */}
      {isCheckoutOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Issue Equipment Loan</h5>
                <button type="button" className="btn-close" onClick={() => setIsCheckoutOpen(false)}></button>
              </div>
              <form onSubmit={handleExecuteCheckout}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label-custom">Select Registered Borrower *</label>
                    <select
                      className="form-select"
                      value={loanBorrowerSchoolId}
                      onChange={(e) => setLoanBorrowerSchoolId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Student or Coach --</option>
                      {registeredBorrowers.map(b => (
                        <option key={b.id} value={b.school_id || b.id}>
                          {b.full_name} ({b.school_id || 'ID Pending'} • {b.role.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Select Equipment *</label>
                    <select
                      className="form-select"
                      value={loanEquipmentId}
                      onChange={(e) => setLoanEquipmentId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Gear --</option>
                      {equipmentList.filter(e => e.available_quantity > 0).map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name} (Stock: {e.available_quantity})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label-custom">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="10"
                        value={loanQuantity}
                        onChange={(e) => setLoanQuantity(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label-custom">Expected Return Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={loanReturnDate}
                        onChange={(e) => setLoanReturnDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Remarks / Activity</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Scrimmage preparation, batting cage"
                      value={loanRemarks}
                      onChange={(e) => setLoanRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setIsCheckoutOpen(false)}>Cancel</button>
                  <button type="submit" className="btn text-white" style={{ background: 'var(--coral)', fontWeight: 700 }}>
                    Issue Equipment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: REPORT TO ADMIN (BROKEN GEAR OR OVERDUE)
          ========================================================================= */}
      {isReportOpen && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">File Incident Report to Admin</h5>
                <button type="button" className="btn-close" onClick={() => setIsReportOpen(false)}></button>
              </div>
              <form onSubmit={handleSubmitReport}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label-custom">Report Type</label>
                    <div className="btn-group w-100" role="group">
                      <button
                        type="button"
                        onClick={() => setReportType('damaged_equipment')}
                        className={`btn btn-sm ${reportType === 'damaged_equipment' ? 'btn-danger' : 'btn-outline-danger'}`}
                        style={{ fontWeight: 700 }}
                      >
                        Item Broken by Borrower
                      </button>
                      <button
                        type="button"
                        onClick={() => setReportType('overdue_return')}
                        className={`btn btn-sm ${reportType === 'overdue_return' ? 'btn-warning text-dark' : 'btn-outline-warning text-dark'}`}
                        style={{ fontWeight: 700 }}
                      >
                        Item Not Returned on Time
                      </button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Borrower Involved *</label>
                    <select
                      className="form-select"
                      value={repBorrowerSchoolId}
                      onChange={(e) => setRepBorrowerSchoolId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose Student or Coach --</option>
                      {registeredBorrowers.map(b => (
                        <option key={b.id} value={b.school_id}>
                          {b.full_name} ({b.school_id} • {b.role.toUpperCase()})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Equipment Item</label>
                    <select
                      className="form-select"
                      value={repEquipmentId}
                      onChange={(e) => setRepEquipmentId(e.target.value)}
                    >
                      <option value="">-- Select Gear --</option>
                      {equipmentList.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.equipment_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Severity</label>
                    <select
                      className="form-select"
                      value={repSeverity}
                      onChange={(e) => setRepSeverity(e.target.value as StaffReport['severity'])}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Incident Details *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder={
                        reportType === 'damaged_equipment'
                          ? 'Describe how the item was broken and damages observed...'
                          : 'Describe unreturned status, days overdue, and attempts to contact...'
                      }
                      value={repDescription}
                      onChange={(e) => setRepDescription(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setIsReportOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger" style={{ fontWeight: 700 }}>
                    Submit Report to Admin
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
