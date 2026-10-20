import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockData';
import { CoachBooking, Equipment, BorrowingTransaction } from '../types/database';

interface CoachDashboardViewProps {
  userDisplayName: string;
  username: string;
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

export const CoachDashboardView: React.FC<CoachDashboardViewProps> = ({ userDisplayName, currentTab = 'dashboard', onNavigate }) => {
  const effectiveTab =
    currentTab === 'bookings' ? 'bookings' :
    currentTab === 'borrowing' ? 'borrow' : 'dashboard';

  const [bookings, setBookings] = useState<CoachBooking[]>([]);
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [myLoans, setMyLoans] = useState<BorrowingTransaction[]>([]);

  // Borrow modal
  const [selectedEq, setSelectedEq] = useState<Equipment | null>(null);
  const [borrowQuantity, setBorrowQuantity] = useState<number>(1);
  const [borrowReturnDate, setBorrowReturnDate] = useState<string>('');
  const [borrowRemarks, setBorrowRemarks] = useState<string>('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setBookings([...mockDb.coachBookings]);
    setEquipmentList([...mockDb.equipment]);
    setMyLoans(
      mockDb.borrowingTransactions.filter(
        t => t.borrower_name?.toLowerCase().includes(userDisplayName.toLowerCase()) ||
             t.borrower_role === 'coach'
      )
    );
  };

  useEffect(() => {
    loadData();
    const unsub = mockDb.subscribe(loadData);
    return unsub;
  }, [userDisplayName]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleApproveBooking = (bookingId: string) => {
    mockDb.updateCoachBookingStatus(bookingId, 'approved', 'Approved by Coach. Please report to the training court 10 mins early.');
    showToast('Student booking approved and scheduled.');
  };

  const handleDeclineBooking = (bookingId: string) => {
    mockDb.updateCoachBookingStatus(bookingId, 'rejected', 'Slot conflict with varsity scrimmage.');
    showToast('Booking request declined.');
  };

  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEq || !borrowReturnDate) {
      showToast('Please specify a return date.');
      return;
    }

    try {
      mockDb.borrowEquipmentDirect(
        userDisplayName || 'Head Coach',
        'coach',
        'CCH-2021-088',
        selectedEq.id,
        Number(borrowQuantity),
        borrowReturnDate,
        borrowRemarks.trim() || 'Varsity Squad Training Drill'
      );
      setSelectedEq(null);
      setBorrowRemarks('');
      showToast(`Successfully checked out ${borrowQuantity}x ${selectedEq.name}.`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Borrow request failed.');
    }
  };

  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const approvedBookings = bookings.filter(b => b.status === 'approved');

  return (
    <div className="container-fluid px-0">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Coach Coaching & Training Hub</h4>
          <span className="text-muted small">Manage student training bookings, schedule, and team gear borrowings</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('bookings')}
            className="btn btn-sm btn-dark"
            style={{ borderRadius: '10px', fontWeight: 700 }}
          >
            <i className="bi bi-calendar2-check me-1"></i> Student Requests ({pendingBookings.length})
          </button>
          <button
            type="button"
            onClick={() => onNavigate && onNavigate('borrowing')}
            className="btn btn-sm text-white"
            style={{ background: 'var(--coral)', borderRadius: '10px', fontWeight: 700 }}
          >
            <i className="bi bi-box-arrow-in-down me-1"></i> Borrow Equipment
          </button>
        </div>
      </div>

      {toastMessage && (
        <div className="alert alert-primary py-2 px-3 mb-4 rounded-3 d-flex justify-content-between align-items-center shadow-sm">
          <span><i className="bi bi-check-circle-fill me-2"></i>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="btn-close btn-close-sm"></button>
        </div>
      )}

      {/* =========================================================================
          TAB 1: COACH DASHBOARD
          ========================================================================= */}
      {effectiveTab === 'dashboard' && (
        <>
          {/* STATS ROW */}
          <div className="row g-3 mb-4">
            <div className="col-12 col-sm-6 col-xl-4">
              <div className="card-stat-modern h-100" onClick={() => onNavigate && onNavigate('bookings')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon-circle stat-icon-amber">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="stat-label">Pending Student Bookings</div>
                <div className="stat-trend" style={{ color: '#F59E0B' }}>Awaiting Your Approval</div>
                <h3 className="stat-value text-dark">{pendingBookings.length}</h3>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <div className="card-stat-modern h-100" onClick={() => onNavigate && onNavigate('bookings')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon-circle stat-icon-green">
                  <i className="bi bi-check2-circle"></i>
                </div>
                <div className="stat-label">Confirmed Sessions</div>
                <div className="stat-trend" style={{ color: '#10B981' }}>Scheduled Training</div>
                <h3 className="stat-value text-dark">{approvedBookings.length}</h3>
              </div>
            </div>

            <div className="col-12 col-sm-6 col-xl-4">
              <div className="card-stat-modern h-100" onClick={() => onNavigate && onNavigate('borrowing')} style={{ cursor: 'pointer' }}>
                <div className="stat-icon-circle stat-icon-coral">
                  <i className="bi bi-arrow-left-right"></i>
                </div>
                <div className="stat-label">Gear Borrowed by Coach</div>
                <div className="stat-trend" style={{ color: 'var(--coral)' }}>On Active Loan</div>
                <h3 className="stat-value" style={{ color: 'var(--coral)' }}>{myLoans.length}</h3>
              </div>
            </div>
          </div>

          {/* TWO COLUMNS: UPCOMING SESSIONS & COACH'S BORROWED GEAR */}
          <div className="row g-4">
            <div className="col-lg-7">
              <div className="card-modern h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 text-dark">Upcoming Training Sessions</h5>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('bookings')}
                    className="btn btn-sm btn-link text-decoration-none p-0"
                    style={{ color: 'var(--coral)', fontWeight: 600 }}
                  >
                    View All &rarr;
                  </button>
                </div>

                {approvedBookings.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No scheduled training sessions.</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {approvedBookings.map(b => (
                      <div
                        key={b.id}
                        className="p-3 rounded-3 d-flex justify-content-between align-items-center"
                        style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                      >
                        <div>
                          <div className="fw-bold text-dark">{b.student_name} ({b.student_school_id})</div>
                          <div className="text-muted small"><strong>Focus:</strong> {b.purpose}</div>
                          {b.coach_notes && (
                            <div className="text-primary small mt-1">
                              <i className="bi bi-chat-left-dots me-1"></i>{b.coach_notes}
                            </div>
                          )}
                        </div>

                        <div className="text-end">
                          <span className="badge bg-primary rounded-pill px-3 py-1 mb-1">{b.booking_date}</span>
                          <div className="text-muted small">{b.time_slot}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card-modern h-100">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="fw-bold mb-0 text-dark">Active Team Loans</h5>
                  <button
                    type="button"
                    onClick={() => onNavigate && onNavigate('borrowing')}
                    className="btn btn-sm text-white"
                    style={{ background: 'var(--coral)', borderRadius: '8px', fontSize: '0.78rem' }}
                  >
                    Borrow More
                  </button>
                </div>

                {myLoans.length === 0 ? (
                  <div className="text-center py-4 text-muted small">No equipment currently on loan to you.</div>
                ) : (
                  <div className="d-flex flex-column gap-2">
                    {myLoans.map(tx => (
                      <div
                        key={tx.id}
                        className="p-3 rounded-3"
                        style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <div className="fw-bold text-dark">{tx.items?.[0]?.equipment?.name || tx.remarks}</div>
                          <span className="badge bg-warning text-dark">{tx.status.toUpperCase()}</span>
                        </div>
                        <div className="text-muted small mt-1">
                          Quantity: {tx.items?.[0]?.quantity || 1} • Due Date: {tx.expected_return_date}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* =========================================================================
          TAB 2: STUDENT BOOKINGS PAGE (WAITING FOR COACH APPROVAL)
          ========================================================================= */}
      {effectiveTab === 'bookings' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Student Training Booking Requests</h5>
              <small className="text-muted">Review, approve, or decline student coaching appointments</small>
            </div>
            <span className="badge bg-dark rounded-pill px-3 py-1">
              {bookings.length} Total Bookings
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <tr>
                  <th className="py-3 px-3">Student Athlete</th>
                  <th className="py-3">Sport</th>
                  <th className="py-3">Requested Schedule</th>
                  <th className="py-3">Training Goal / Topic</th>
                  <th className="py-3">Status</th>
                  <th className="py-3 text-end px-3">Coach Actions</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem' }}>
                {bookings.map(b => (
                  <tr key={b.id}>
                    <td className="px-3">
                      <div className="fw-semibold text-dark">{b.student_name}</div>
                      <small className="text-muted">{b.student_school_id}</small>
                    </td>
                    <td>
                      <span className="badge bg-light text-dark" style={{ border: '1px solid #E2E8F0' }}>
                        {b.sport}
                      </span>
                    </td>
                    <td>
                      <div className="fw-bold text-dark">{b.booking_date}</div>
                      <small className="text-muted">{b.time_slot}</small>
                    </td>
                    <td style={{ maxWidth: '280px' }}>
                      <span className="text-dark small">{b.purpose}</span>
                      {b.coach_notes && (
                        <div className="text-muted small mt-1">
                          <em>Note: {b.coach_notes}</em>
                        </div>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge rounded-pill px-2 py-1 ${
                          b.status === 'approved' ? 'bg-success' :
                          b.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'
                        }`}
                      >
                        {b.status === 'pending' ? 'Awaiting Approval' : b.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-end px-3">
                      {b.status === 'pending' ? (
                        <div className="btn-group btn-group-sm">
                          <button
                            type="button"
                            onClick={() => handleApproveBooking(b.id)}
                            className="btn btn-success"
                            style={{ fontWeight: 600 }}
                          >
                            <i className="bi bi-check-lg me-1"></i> Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeclineBooking(b.id)}
                            className="btn btn-outline-danger"
                          >
                            Decline
                          </button>
                        </div>
                      ) : (
                        <span className="text-muted small">Processed</span>
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
          TAB 3: COACH CAN ALSO BORROW ITEMS
          ========================================================================= */}
      {effectiveTab === 'borrow' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Available Sports Equipment</h5>
              <small className="text-muted">Select gear to borrow for varsity practice sessions</small>
            </div>
            <span className="badge bg-secondary rounded-pill px-3 py-1">
              {equipmentList.filter(e => e.available_quantity > 0).length} Items Available
            </span>
          </div>

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                <tr>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3">Equipment</th>
                  <th className="py-3">Available Quantity</th>
                  <th className="py-3">Available Days</th>
                  <th className="py-3">Condition</th>
                  <th className="py-3 text-end px-3">Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem' }}>
                {equipmentList.map(eq => (
                  <tr key={eq.id}>
                    <td className="px-3 fw-bold text-dark">
                      <span className="badge bg-light text-secondary" style={{ border: '1px solid #E2E8F0' }}>
                        {eq.equipment_code}
                      </span>
                    </td>
                    <td>
                      <div className="fw-semibold text-dark">{eq.name}</div>
                      <small className="text-muted">{eq.category}</small>
                    </td>
                    <td>
                      <span className="fw-bold text-dark">{eq.available_quantity}</span> / {eq.total_quantity}
                    </td>
                    <td>
                      <div className="d-flex flex-wrap gap-1">
                        {eq.available_days?.map(d => (
                          <span key={d} className="badge bg-light text-secondary" style={{ fontSize: '0.68rem', border: '1px solid #E2E8F0' }}>
                            {d.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="badge bg-success rounded-pill px-2 py-1 text-capitalize">
                        {eq.condition}
                      </span>
                    </td>
                    <td className="text-end px-3">
                      <button
                        type="button"
                        disabled={eq.available_quantity <= 0}
                        onClick={() => setSelectedEq(eq)}
                        className="btn btn-sm text-white"
                        style={{ background: eq.available_quantity > 0 ? 'var(--coral)' : '#CBD5E1', borderRadius: '8px', fontWeight: 600 }}
                      >
                        Borrow Item
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BORROW MODAL */}
      {selectedEq && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Borrow Equipment for Squad</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEq(null)}></button>
              </div>
              <form onSubmit={handleBorrowSubmit}>
                <div className="modal-body">
                  <p className="fw-semibold text-dark mb-3">{selectedEq.name}</p>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label-custom">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max={selectedEq.available_quantity}
                        value={borrowQuantity}
                        onChange={(e) => setBorrowQuantity(Number(e.target.value))}
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label-custom">Expected Return Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={borrowReturnDate}
                        onChange={(e) => setBorrowReturnDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Training Drill / Squad Remarks</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Infield fielding repetition drills"
                      value={borrowRemarks}
                      onChange={(e) => setBorrowRemarks(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setSelectedEq(null)}>Cancel</button>
                  <button type="submit" className="btn text-white" style={{ background: 'var(--coral)', fontWeight: 700 }}>
                    Confirm Loan
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
