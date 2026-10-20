import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockData';
import { RegisteredAccount, BorrowingTransaction, CoachBooking, StaffReport } from '../types/database';

export const AdminDashboardView: React.FC = () => {
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredAccount[]>([]);
  const [transactions, setTransactions] = useState<BorrowingTransaction[]>([]);
  const [bookings, setBookings] = useState<CoachBooking[]>([]);
  const [reports, setReports] = useState<StaffReport[]>([]);
  const [activeUserTab, setActiveUserTab] = useState<'all' | 'staff' | 'coach' | 'student'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadData = () => {
    setRegisteredUsers(mockDb.getRegisteredUsers());
    setTransactions([...mockDb.borrowingTransactions]);
    setBookings([...mockDb.coachBookings]);
    setReports([...mockDb.staffReports]);
  };

  useEffect(() => {
    loadData();
    const unsub = mockDb.subscribe(loadData);
    return unsub;
  }, []);

  const handleResolveReport = (reportId: string) => {
    mockDb.updateStaffReportStatus(reportId, 'resolved');
  };

  const handleAcknowledgeReport = (reportId: string) => {
    mockDb.updateStaffReportStatus(reportId, 'reviewed');
  };

  const filteredUsers = registeredUsers.filter(u => {
    const matchesTab = activeUserTab === 'all' || u.role === activeUserTab;
    const matchesSearch =
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.school_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const staffCount = registeredUsers.filter(u => u.role === 'staff').length;
  const coachCount = registeredUsers.filter(u => u.role === 'coach').length;
  const studentCount = registeredUsers.filter(u => u.role === 'student').length;
  const activeLoansCount = transactions.filter(t => t.status === 'active' || t.status === 'overdue').length;
  const pendingReportsCount = reports.filter(r => r.status === 'submitted').length;

  return (
    <div className="container-fluid px-0">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">Institutional Administration</h4>
          <span className="text-muted small">Registered staff, coaches, student borrowers, and live activity</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          <span className="badge rounded-pill px-3 py-2" style={{ background: '#EEF2FF', color: '#4F46E5', fontWeight: 700, fontSize: '0.8rem' }}>
            <i className="bi bi-shield-check me-1"></i> Executive Admin Control
          </span>
        </div>
      </div>

      {/* TOP STAT METRIC CARDS */}
      <div className="row g-3 mb-4">
        {/* Staff Registered */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-stat-modern h-100" onClick={() => setActiveUserTab('staff')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon-circle stat-icon-cyan">
              <i className="bi bi-person-workspace"></i>
            </div>
            <div className="stat-label">Staff Registered</div>
            <div className="stat-trend" style={{ color: '#0EA5E9' }}>Equipment Desk Custodians</div>
            <h3 className="stat-value text-dark">{staffCount}</h3>
          </div>
        </div>

        {/* Coach Registered */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-stat-modern h-100" onClick={() => setActiveUserTab('coach')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon-circle stat-icon-indigo">
              <i className="bi bi-person-badge"></i>
            </div>
            <div className="stat-label">Coaches Registered</div>
            <div className="stat-trend" style={{ color: '#6366F1' }}>Varsity Head & Asst</div>
            <h3 className="stat-value text-dark">{coachCount}</h3>
          </div>
        </div>

        {/* Student Registered */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-stat-modern h-100" onClick={() => setActiveUserTab('student')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon-circle stat-icon-green">
              <i className="bi bi-people-fill"></i>
            </div>
            <div className="stat-label">Students Registered</div>
            <div className="stat-trend" style={{ color: '#10B981' }}>Collegiate Athletes</div>
            <h3 className="stat-value text-dark">{studentCount}</h3>
          </div>
        </div>

        {/* Active Borrowing */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-stat-modern h-100">
            <div className="stat-icon-circle stat-icon-coral">
              <i className="bi bi-arrow-left-right"></i>
            </div>
            <div className="stat-label">Active Loans</div>
            <div className="stat-trend" style={{ color: 'var(--coral)' }}>Currently Borrowed</div>
            <h3 className="stat-value" style={{ color: 'var(--coral)' }}>{activeLoansCount}</h3>
          </div>
        </div>

        {/* Staff Incident Reports */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-stat-modern h-100">
            <div className="stat-icon-circle stat-icon-amber">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="stat-label">Staff Reports</div>
            <div className="stat-trend" style={{ color: '#F59E0B' }}>Broken & Overdue</div>
            <h3 className="stat-value text-dark">{pendingReportsCount}</h3>
          </div>
        </div>
      </div>

      {/* REGISTERED USERS SECTION */}
      <div className="card-modern mb-4">
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-0 text-dark">Registered Institutional Members</h5>
            <small className="text-muted">Verified School IDs and active campus status</small>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* SEARCH */}
            <div className="input-group-custom" style={{ padding: '0.15rem 0.65rem', background: '#F8FAFC' }}>
              <i className="bi bi-search" style={{ fontSize: '0.85rem' }}></i>
              <input
                type="text"
                placeholder="Search School ID or Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ fontSize: '0.82rem', width: '180px' }}
              />
            </div>

            {/* ROLE FILTER TABS */}
            <div className="btn-group" role="group">
              {(['all', 'staff', 'coach', 'student'] as const).map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveUserTab(tab)}
                  className={`btn btn-sm ${activeUserTab === tab ? 'btn-dark' : 'btn-outline-secondary'}`}
                  style={{ textTransform: 'capitalize', fontSize: '0.78rem', fontWeight: 600 }}
                >
                  {tab === 'all' ? 'All Members' : `${tab}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', textTransform: 'uppercase' }}>
              <tr>
                <th className="py-3 px-3">School ID</th>
                <th className="py-3">Member Name</th>
                <th className="py-3">Role</th>
                <th className="py-3">Department / Specialization</th>
                <th className="py-3">Status</th>
                <th className="py-3">Current Activity</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.84rem' }}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No registered members found.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  // Find what they are doing (borrowing or coach booking)
                  const activeLoan = transactions.find(
                    t => (t.borrower_school_id === user.school_id || t.borrower_name === user.full_name) &&
                         (t.status === 'active' || t.status === 'overdue')
                  );
                  const activeBooking = bookings.find(
                    b => (b.student_school_id === user.school_id || b.coach_school_id === user.school_id) &&
                         (b.status === 'pending' || b.status === 'approved')
                  );

                  return (
                    <tr key={user.id}>
                      <td className="px-3 fw-bold text-dark">
                        <span className="badge rounded-pill px-2 py-1" style={{ background: '#F1F5F9', color: '#334155', border: '1px solid #E2E8F0' }}>
                          {user.school_id}
                        </span>
                      </td>
                      <td>
                        <div className="fw-semibold text-dark">{user.full_name}</div>
                        <small className="text-muted">@{user.username}</small>
                      </td>
                      <td>
                        <span
                          className="badge rounded-pill px-2 py-1"
                          style={{
                            background:
                              user.role === 'admin' ? '#FEE2E2' :
                              user.role === 'staff' ? '#E0F2FE' :
                              user.role === 'coach' ? '#EEF2FF' : '#DCFCE7',
                            color:
                              user.role === 'admin' ? '#991B1B' :
                              user.role === 'staff' ? '#0369A1' :
                              user.role === 'coach' ? '#4338CA' : '#15803D',
                            textTransform: 'capitalize',
                            fontWeight: 700
                          }}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="text-secondary">{user.department || user.specialization || 'Athletics'}</td>
                      <td>
                        <span className="d-inline-flex align-items-center gap-1">
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: user.is_online ? '#10B981' : '#94A3B8'
                            }}
                          />
                          <small className={user.is_online ? 'text-success fw-semibold' : 'text-muted'}>
                            {user.is_online ? 'Online' : 'Offline'}
                          </small>
                        </span>
                      </td>
                      <td>
                        {activeLoan ? (
                          <span className={`badge ${activeLoan.status === 'overdue' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                            <i className="bi bi-box-arrow-up-right me-1"></i>
                            Borrowing: {activeLoan.items?.[0]?.equipment?.name?.slice(0, 24) || 'Equipment'}
                          </span>
                        ) : activeBooking ? (
                          <span className="badge bg-info text-dark">
                            <i className="bi bi-calendar-event me-1"></i>
                            {activeBooking.status === 'approved' ? 'Session Confirmed' : 'Booking Pending'}
                          </span>
                        ) : user.role === 'staff' ? (
                          <span className="text-muted small">Managing Equipment Desk</span>
                        ) : (
                          <span className="text-muted small">No active transaction</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2 COLUMNS: LIVE ACTIVITY & STAFF INCIDENT REPORTS */}
      <div className="row g-4">
        {/* LEFT COLUMN: LIVE BORROWING & ACTIVITY */}
        <div className="col-lg-7">
          <div className="card-modern h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Live Borrowing Activity</h5>
                <small className="text-muted">Real-time equipment transactions across all sports</small>
              </div>
              <span className="badge bg-primary rounded-pill px-3 py-1">
                {transactions.length} Total Records
              </span>
            </div>

            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle mb-0">
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.74rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th className="py-2 px-2">Borrower</th>
                    <th className="py-2">Equipment</th>
                    <th className="py-2">Return Due</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.82rem' }}>
                  {transactions.slice(0, 6).map(tx => {
                    const itemName = tx.items?.[0]?.equipment?.name || tx.remarks || 'Sports Gear';
                    return (
                      <tr key={tx.id}>
                        <td className="px-2">
                          <div className="fw-semibold text-dark">{tx.borrower_name}</div>
                          <small className="text-muted">{tx.borrower_school_id} ({tx.borrower_role})</small>
                        </td>
                        <td>
                          <span className="text-dark fw-medium">{itemName}</span>
                          <div className="small text-muted">{tx.items?.[0]?.quantity || 1} unit(s)</div>
                        </td>
                        <td>
                          <div className="text-dark">{tx.expected_return_date}</div>
                          {tx.alert_sent && (
                            <small className="text-danger fw-semibold">
                              <i className="bi bi-bell-fill me-1"></i>Alert Sent
                            </small>
                          )}
                        </td>
                        <td>
                          <span
                            className="badge rounded-pill px-2 py-1"
                            style={{
                              background:
                                tx.status === 'returned' ? '#DCFCE7' :
                                tx.status === 'overdue' ? '#FEE2E2' : '#FEF3C7',
                              color:
                                tx.status === 'returned' ? '#15803D' :
                                tx.status === 'overdue' ? '#991B1B' : '#B45309',
                              fontWeight: 700,
                              textTransform: 'capitalize'
                            }}
                          >
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: STAFF REPORTS (BROKEN / OVERDUE ITEMS) */}
        <div className="col-lg-5">
          <div className="card-modern h-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Staff Incident Reports</h5>
                <small className="text-muted">Broken gear & overdue violations filed by staff</small>
              </div>
              <span className="badge bg-danger rounded-pill px-2 py-1">
                {reports.filter(r => r.status === 'submitted').length} Pending
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                No incident reports submitted by staff.
              </div>
            ) : (
              <div className="d-flex flex-column gap-3">
                {reports.map(rep => (
                  <div
                    key={rep.id}
                    className="p-3 rounded-3"
                    style={{
                      background: rep.status === 'resolved' ? '#F8FAFC' : '#FFFBEB',
                      border: rep.status === 'resolved' ? '1px solid #E2E8F0' : '1px solid #FDE68A'
                    }}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-1">
                      <span
                        className="badge"
                        style={{
                          background: rep.report_type === 'damaged_equipment' ? '#FEE2E2' : '#FFEDD5',
                          color: rep.report_type === 'damaged_equipment' ? '#991B1B' : '#C2410C',
                          fontWeight: 700,
                          fontSize: '0.72rem'
                        }}
                      >
                        {rep.report_type === 'damaged_equipment' ? 'DAMAGED EQUIPMENT' : 'OVERDUE RETURN'}
                      </span>
                      <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>
                        {rep.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="fw-bold text-dark mt-2" style={{ fontSize: '0.86rem' }}>
                      {rep.item_name || 'Equipment Item'}
                    </div>

                    <div className="text-secondary small mt-1">
                      <strong>Borrower:</strong> {rep.borrower_name} ({rep.borrower_school_id} • {rep.borrower_role})
                    </div>

                    <p className="text-dark small mt-2 mb-2" style={{ lineHeight: 1.4 }}>
                      {rep.description}
                    </p>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                      <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                        Reported by {rep.reported_by}
                      </small>
                      {rep.status !== 'resolved' && (
                        <div className="btn-group btn-group-sm">
                          {rep.status === 'submitted' && (
                            <button
                              type="button"
                              onClick={() => handleAcknowledgeReport(rep.id)}
                              className="btn btn-outline-secondary py-0 px-2"
                              style={{ fontSize: '0.74rem' }}
                            >
                              Acknowledge
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleResolveReport(rep.id)}
                            className="btn btn-success py-0 px-2"
                            style={{ fontSize: '0.74rem' }}
                          >
                            Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
