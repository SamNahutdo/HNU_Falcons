import React, { useState, useEffect } from 'react';
import { SearchField } from '../components/SearchField';
import { mockDb } from '../services/mockData';
import { Equipment, CoachBooking, Coach, ReturnAlert, BorrowingTransaction } from '../types/database';

interface StudentDashboardViewProps {
  userDisplayName: string;
  username: string;
  currentTab?: string;
  onNavigate?: (tab: string) => void;
}

export const StudentDashboardView: React.FC<StudentDashboardViewProps> = ({ userDisplayName, username, currentTab = 'equipment', onNavigate }) => {
  const effectiveTab =
    currentTab === 'bookings' ? 'book_coach' :
    currentTab === 'activity' ? 'my_activity' : 'available_items';

  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [myBookings, setMyBookings] = useState<CoachBooking[]>([]);
  const [myLoans, setMyLoans] = useState<BorrowingTransaction[]>([]);
  const [myAlerts, setMyAlerts] = useState<ReturnAlert[]>([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Borrow Modal
  const [borrowModalEq, setBorrowModalEq] = useState<Equipment | null>(null);
  const [borrowQty, setBorrowQty] = useState(1);
  const [borrowReturnDate, setBorrowReturnDate] = useState('');
  const [borrowPurpose, setBorrowPurpose] = useState('');

  // Coach Booking Modal
  const [bookingModalCoach, setBookingModalCoach] = useState<Coach | null>(null);
  const [bookDate, setBookDate] = useState('');
  const [bookTimeSlot, setBookTimeSlot] = useState('09:00 AM - 10:30 AM');
  const [bookPurpose, setBookPurpose] = useState('');

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = () => {
    setEquipmentList([...mockDb.equipment]);
    setCoaches([...mockDb.coaches]);

    // Student's bookings
    setMyBookings(
      mockDb.coachBookings.filter(
        b => b.student_name.toLowerCase().includes(userDisplayName.toLowerCase()) ||
             b.student_school_id === '202400101' ||
             b.student_id === username
      )
    );

    // Student's loans
    setMyLoans(
      mockDb.borrowingTransactions.filter(
        t => t.borrower_name?.toLowerCase().includes(userDisplayName.toLowerCase()) ||
             t.borrower_school_id === '202400101'
      )
    );

    // Student's alerts from staff
    setMyAlerts(
      mockDb.returnAlerts.filter(
        a => a.recipient_name.toLowerCase().includes(userDisplayName.toLowerCase()) ||
             a.recipient_school_id === '202400101'
      )
    );
  };

  useEffect(() => {
    loadData();
    const unsub = mockDb.subscribe(loadData);
    return unsub;
  }, [userDisplayName, username]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Student borrowing item
  const handleBorrowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!borrowModalEq || !borrowReturnDate) {
      showToast('Please select a return date.');
      return;
    }

    try {
      mockDb.borrowEquipmentDirect(
        userDisplayName || 'Student Athlete',
        'student',
        '202400101',
        borrowModalEq.id,
        Number(borrowQty),
        borrowReturnDate,
        borrowPurpose.trim() || 'Student athletic practice'
      );
      setBorrowModalEq(null);
      setBorrowPurpose('');
      showToast(`Borrow request completed for ${borrowQty}x ${borrowModalEq.name}.`);
      if (onNavigate) onNavigate('activity');
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : 'Borrow request failed.');
    }
  };

  // Student booking a coach
  const handleCoachBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingModalCoach || !bookDate) {
      showToast('Please select a date.');
      return;
    }

    const coachUser = mockDb.users.find(u => u.id === bookingModalCoach.user_id);
    const coachName = coachUser?.full_name || 'Varsity Coach';

    mockDb.createCoachBooking({
      student_id: username || 'student-user',
      student_name: userDisplayName || 'Riza Velasco',
      student_school_id: '202400101',
      coach_id: bookingModalCoach.id,
      coach_name: coachName,
      coach_school_id: bookingModalCoach.employee_number,
      sport: bookingModalCoach.specialization.split('&')[0].trim(),
      booking_date: bookDate,
      time_slot: bookTimeSlot,
      purpose: bookPurpose.trim() || 'Varsity skills training and mechanics review'
    });

    setBookingModalCoach(null);
    setBookPurpose('');
    showToast(`Booking submitted to ${coachName}. Awaiting coach approval.`);
    if (onNavigate) onNavigate('activity');
  };

  const filteredEquipment = equipmentList.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || eq.category === selectedCategory;
    return matchesSearch && matchesCat && eq.available_quantity > 0;
  });
  const filteredCoaches = coaches.filter(coach => {
    const coachName = mockDb.users.find(user => user.id === coach.user_id)?.full_name || '';
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      coachName.toLowerCase().includes(query) ||
      coach.employee_number.toLowerCase().includes(query) ||
      coach.specialization.toLowerCase().includes(query);
  });
  const filteredBookings = myBookings.filter(booking => {
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      booking.coach_name.toLowerCase().includes(query) ||
      booking.sport.toLowerCase().includes(query) ||
      booking.purpose.toLowerCase().includes(query) ||
      booking.status.includes(query);
  });
  const filteredLoans = myLoans.filter(transaction => {
    const query = searchQuery.trim().toLowerCase();
    return !query ||
      (transaction.items?.[0]?.equipment?.name || transaction.remarks || '').toLowerCase().includes(query) ||
      transaction.status.includes(query) ||
      transaction.expected_return_date.toLowerCase().includes(query);
  });

  return (
    <div className="container-fluid px-0">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Student Athlete Portal</h4>
        </div>

      </div>

      {toastMessage && (
        <div className="alert alert-primary py-2 px-3 mb-4 rounded-3 d-flex justify-content-between align-items-center shadow-sm">
          <span><i className="bi bi-info-circle-fill me-2"></i>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage(null)} className="btn-close btn-close-sm"></button>
        </div>
      )}

      {/* DEADLINE ALERTS FROM STAFF (IF ANY) */}
      {myAlerts.length > 0 && (
        <div className="alert alert-warning py-3 px-3 mb-4 rounded-3 shadow-sm border-warning">
          <div className="d-flex align-items-center gap-2 mb-1">
            <i className="bi bi-bell-fill text-danger fs-5"></i>
            <span className="fw-bold text-dark">Return Deadline Notification from Staff Desk</span>
          </div>
          {myAlerts.map(alt => (
            <div key={alt.id} className="small text-dark mt-1">
              <strong>{alt.equipment_name}</strong>: {alt.message}
            </div>
          ))}
        </div>
      )}

      {/* =========================================================================
          TAB 1: DISPLAY ALL AVAILABLE ITEMS & BORROW
          ========================================================================= */}
      {effectiveTab === 'available_items' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Available Sports Equipment</h5>
            </div>

            <div className="d-flex align-items-center gap-2 flex-wrap">
              {/* CATEGORY FILTER */}
              <select
                className="form-select form-select-sm"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{ width: '150px', borderRadius: '10px', fontSize: '0.82rem' }}
              >
                <option value="all">All Categories</option>
                <option value="Ball">Ball</option>
                <option value="Bat">Bat</option>
                <option value="Glove">Glove</option>
                <option value="Racket">Racket</option>
                <option value="Protective Gear">Protective Gear</option>
              </select>

            </div>
          </div>

          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search gear..." />

          <div className="row g-3">
            {filteredEquipment.length === 0 ? (
              <div className="col-12 text-center py-5 text-muted">
                No equipment available matching criteria.
              </div>
            ) : (
              filteredEquipment.map(eq => (
                <div key={eq.id} className="col-12 col-md-6 col-lg-4">
                  <div
                    className="p-3 rounded-4 h-100 d-flex flex-column justify-content-between"
                    style={{ background: '#FFFFFF', border: '1px solid #E2E8F0' }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-light text-secondary" style={{ border: '1px solid #E2E8F0' }}>
                          {eq.equipment_code}
                        </span>
                        <span className="badge bg-success rounded-pill text-capitalize">
                          {eq.condition}
                        </span>
                      </div>

                      <h6 className="fw-bold text-dark mb-1">{eq.name}</h6>
                      <div className="text-muted small mb-2">{eq.category}</div>

                      <div className="mb-2">
                        <span className="fw-bold text-dark">{eq.available_quantity}</span>
                        <span className="text-muted small"> units in stock</span>
                      </div>

                      <div className="mb-3">
                        <small className="text-muted d-block mb-1">Available Days:</small>
                        <div className="d-flex flex-wrap gap-1">
                          {eq.available_days?.map(d => (
                            <span key={d} className="badge bg-light text-dark" style={{ fontSize: '0.66rem', border: '1px solid #E2E8F0' }}>
                              {d.slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBorrowModalEq(eq)}
                      className="btn w-100 text-white"
                      style={{ background: 'var(--coral)', borderRadius: '12px', fontWeight: 700, fontSize: '0.85rem' }}
                    >
                      <i className="bi bi-hand-index-thumb me-1"></i> Borrow Item
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: BOOK A COACH & CHECK AVAILABILITY
          ========================================================================= */}
      {effectiveTab === 'book_coach' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Book a Varsity Coach</h5>
            </div>
            <span className="badge bg-primary rounded-pill px-3 py-1">
              {filteredCoaches.length} Varsity Coaches
            </span>
          </div>

          <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search coaches by name or specialization..." />

          <div className="row g-4">
            {filteredCoaches.map(c => {
              const coachUser = mockDb.users.find(u => u.id === c.user_id);
              return (
                <div key={c.id} className="col-12 col-md-6">
                  <div
                    className="p-4 rounded-4 h-100 d-flex flex-column justify-content-between"
                    style={{ background: '#FFFFFF', border: '1.5px solid #E2E8F0' }}
                  >
                    <div>
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <span className="badge bg-primary text-white rounded-pill px-3 py-1">
                          {c.specialization}
                        </span>
                        <span className="badge bg-light text-secondary" style={{ border: '1px solid #E2E8F0' }}>
                          {c.employee_number}
                        </span>
                      </div>

                      <h5 className="fw-bold text-dark mb-1">{coachUser?.full_name || 'Varsity Coach'}</h5>
                      <div className="text-secondary small mb-3">{c.license_level}</div>

                      {/* AVAILABILITY SCHEDULE */}
                      <div className="p-3 rounded-3 mb-3" style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                        <div className="fw-bold text-dark small mb-1">
                          <i className="bi bi-clock me-1 text-primary"></i>Available Days:
                        </div>
                        <div className="d-flex flex-wrap gap-1 mb-2">
                          {c.available_days?.map(d => (
                            <span key={d} className="badge bg-white text-dark shadow-sm" style={{ border: '1px solid #CBD5E1' }}>
                              {d}
                            </span>
                          ))}
                        </div>

                        <div className="fw-bold text-dark small mb-1">
                          <i className="bi bi-sun me-1 text-warning"></i>Available Hours:
                        </div>
                        <div className="text-muted small">
                          {c.available_hours || '08:00 AM - 05:00 PM'}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setBookingModalCoach(c)}
                      className="btn w-100 btn-dark"
                      style={{ borderRadius: '12px', fontWeight: 700 }}
                    >
                      <i className="bi bi-calendar-plus me-1"></i> Book Coaching Session
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: MY ACTIVITY (LOANS & COACH BOOKINGS AWAITING APPROVAL)
          ========================================================================= */}
      {effectiveTab === 'my_activity' && (
        <div className="row g-4">
          {/* MY COACH BOOKINGS (WAITING FOR COACH TO APPROVE) */}
          <div className="col-lg-6">
            <div className="card-modern h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 text-dark">My Coach Appointments</h5>
                <span className="badge bg-dark rounded-pill px-2 py-1">{filteredBookings.length}</span>
              </div>

              <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search appointments..." />

              {filteredBookings.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  No matching coach appointments found.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredBookings.map(b => (
                    <div
                      key={b.id}
                      className="p-3 rounded-3"
                      style={{
                        background: b.status === 'approved' ? '#ECFDF5' : '#FFFBEB',
                        border: b.status === 'approved' ? '1px solid #A7F3D0' : '1px solid #FDE68A'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <div className="fw-bold text-dark">{b.coach_name}</div>
                          <small className="text-muted">{b.sport} Division</small>
                        </div>
                        <span
                          className={`badge rounded-pill px-3 py-1 ${
                            b.status === 'approved' ? 'bg-success' :
                            b.status === 'pending' ? 'bg-warning text-dark' : 'bg-danger'
                          }`}
                        >
                          {b.status === 'pending' ? 'Pending Coach Approval' : b.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-dark small mb-1">
                        <i className="bi bi-calendar-event me-1"></i><strong>Date:</strong> {b.booking_date} ({b.time_slot})
                      </div>

                      <div className="text-secondary small mb-2">
                        <strong>Goal:</strong> {b.purpose}
                      </div>

                      {b.status === 'pending' && (
                        <div className="text-warning-emphasis small fw-medium mt-1">
                          <i className="bi bi-hourglass-split me-1"></i>
                          Wait until coach approved the book.
                        </div>
                      )}

                      {b.status === 'approved' && (
                        <div className="text-success small fw-medium mt-1">
                          <i className="bi bi-check2-circle me-1"></i>
                          Confirmed by Coach! {b.coach_notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* MY ACTIVE GEAR LOANS */}
          <div className="col-lg-6">
            <div className="card-modern h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold mb-0 text-dark">My Active Gear Loans</h5>
                <span className="badge bg-secondary rounded-pill px-2 py-1">{filteredLoans.length}</span>
              </div>

              <SearchField value={searchQuery} onChange={setSearchQuery} placeholder="Search loans by gear or status..." />

              {filteredLoans.length === 0 ? (
                <div className="text-center py-5 text-muted small">
                  No matching gear loans found.
                </div>
              ) : (
                <div className="d-flex flex-column gap-3">
                  {filteredLoans.map(tx => (
                    <div
                      key={tx.id}
                      className="p-3 rounded-3"
                      style={{ background: '#F8FAFC', border: '1px solid #E2E8F0' }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <div className="fw-bold text-dark">
                          {tx.items?.[0]?.equipment?.name || tx.remarks || 'Sports Gear'}
                        </div>
                        <span
                          className={`badge rounded-pill px-2 py-1 ${
                            tx.status === 'returned' ? 'bg-success' :
                            tx.status === 'overdue' ? 'bg-danger' : 'bg-warning text-dark'
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="text-muted small">
                        Quantity: {tx.items?.[0]?.quantity || 1} • Expected Return: <strong>{tx.expected_return_date}</strong>
                      </div>

                      {tx.alert_sent && (
                        <div className="text-danger small fw-bold mt-2">
                          <i className="bi bi-exclamation-triangle-fill me-1"></i>
                          Staff has issued a return notice. Please return to the Equipment Desk.
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BORROW EQUIPMENT */}
      {borrowModalEq && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Borrow Equipment</h5>
                <button type="button" className="btn-close" onClick={() => setBorrowModalEq(null)}></button>
              </div>
              <form onSubmit={handleBorrowSubmit}>
                <div className="modal-body">
                  <p className="fw-semibold text-dark mb-3">{borrowModalEq.name}</p>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label-custom">Quantity</label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max={Math.min(borrowModalEq.available_quantity, 4)}
                        value={borrowQty}
                        onChange={(e) => setBorrowQty(Number(e.target.value))}
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
                    <label className="form-label-custom">Practice Purpose</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Scrimmage training, physical education drill"
                      value={borrowPurpose}
                      onChange={(e) => setBorrowPurpose(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setBorrowModalEq(null)}>Cancel</button>
                  <button type="submit" className="btn text-white" style={{ background: 'var(--coral)', fontWeight: 700 }}>
                    Confirm Loan Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BOOK A COACH */}
      {bookingModalCoach && (
        <div className="modal show d-block" tabIndex={-1} style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content" style={{ borderRadius: '20px' }}>
              <div className="modal-header border-0 pb-0">
                <h5 className="modal-title fw-bold">Request Coach Training Session</h5>
                <button type="button" className="btn-close" onClick={() => setBookingModalCoach(null)}></button>
              </div>
              <form onSubmit={handleCoachBookingSubmit}>
                <div className="modal-body">
                  <p className="fw-semibold text-dark mb-1">
                    {mockDb.users.find(u => u.id === bookingModalCoach.user_id)?.full_name || 'Coach'}
                  </p>
                  <small className="text-muted d-block mb-3">{bookingModalCoach.specialization}</small>

                  <div className="row g-2 mb-3">
                    <div className="col">
                      <label className="form-label-custom">Select Date *</label>
                      <input
                        type="date"
                        className="form-control"
                        value={bookDate}
                        onChange={(e) => setBookDate(e.target.value)}
                        required
                      />
                    </div>
                    <div className="col">
                      <label className="form-label-custom">Preferred Time Slot *</label>
                      <select
                        className="form-select"
                        value={bookTimeSlot}
                        onChange={(e) => setBookTimeSlot(e.target.value)}
                      >
                        <option value="08:30 AM - 10:00 AM">08:30 AM - 10:00 AM</option>
                        <option value="10:00 AM - 11:30 AM">10:00 AM - 11:30 AM</option>
                        <option value="02:00 PM - 03:30 PM">02:00 PM - 03:30 PM</option>
                        <option value="03:30 PM - 05:00 PM">03:30 PM - 05:00 PM</option>
                      </select>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label-custom">Training Goal / Topic *</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      placeholder="e.g. Batting stance, pitch velocity review, defensive footwork..."
                      value={bookPurpose}
                      onChange={(e) => setBookPurpose(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="modal-footer border-0 pt-0">
                  <button type="button" className="btn btn-light" onClick={() => setBookingModalCoach(null)}>Cancel</button>
                  <button type="submit" className="btn btn-dark" style={{ fontWeight: 700 }}>
                    Submit Booking (Wait for Approval)
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
