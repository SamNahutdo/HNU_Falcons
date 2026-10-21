import React, { useState, useEffect } from 'react';
import { mockDb } from '../services/mockData';
import { RegisteredAccount, BorrowingTransaction, CoachBooking, StaffReport } from '../types/database';

interface AdminDashboardViewProps {
  currentTab: string;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  onNavigate: (tab: string) => void;
}

interface AdminSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  placeholder: string;
}

const AdminSearch: React.FC<AdminSearchProps> = ({ searchTerm, onSearchChange, placeholder }) => (
  <div className="topbar-search-wrap mb-3" style={{ width: '100%' }}>
    <input
      type="text"
      className="topbar-search-input"
      placeholder={placeholder}
      value={searchTerm}
      onChange={event => onSearchChange(event.target.value)}
    />
    <i className="bi bi-search topbar-search-icon"></i>
  </div>
);

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  currentTab,
  searchTerm,
  setSearchTerm,
  onNavigate
}) => {
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredAccount[]>([]);
  const [transactions, setTransactions] = useState<BorrowingTransaction[]>([]);
  const [bookings, setBookings] = useState<CoachBooking[]>([]);
  const [reports, setReports] = useState<StaffReport[]>([]);
  const [activeUserTab, setActiveUserTab] = useState<'all' | 'staff' | 'coach' | 'student'>('all');
  const [userRemovalError, setUserRemovalError] = useState<string | null>(null);

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

  const handleRemoveUser = (user: RegisteredAccount) => {
    const confirmed = window.confirm(
      `Remove ${user.full_name} (${user.role}) from the system? They will no longer be able to log in.`
    );
    if (!confirmed) return;

    setUserRemovalError(null);
    try {
      mockDb.removeRegisteredUser(user.id);
    } catch (error: unknown) {
      setUserRemovalError(error instanceof Error ? error.message : 'Could not remove this account.');
    }
  };

  const search = searchTerm.trim().toLowerCase();
  const dashboardAccounts = registeredUsers.filter(user =>
    !search ||
    user.full_name.toLowerCase().includes(search) ||
    user.school_id.toLowerCase().includes(search) ||
    user.username.toLowerCase().includes(search) ||
    (user.department || '').toLowerCase().includes(search) ||
    (user.specialization || '').toLowerCase().includes(search)
  );
  const pageRole = currentTab === 'admin-staff'
    ? 'staff'
    : currentTab === 'admin-coaches'
      ? 'coach'
      : currentTab === 'admin-students'
        ? 'student'
        : null;
  const filteredUsers = registeredUsers.filter(u => {
    const selectedRole = pageRole || (currentTab === 'dashboard' ? activeUserTab : 'all');
    const matchesTab = selectedRole === 'all' || u.role === selectedRole;
    const matchesSearch =
      !search ||
      u.full_name.toLowerCase().includes(search) ||
      u.school_id.toLowerCase().includes(search) ||
      u.username.toLowerCase().includes(search) ||
      (u.department || '').toLowerCase().includes(search) ||
      (u.specialization || '').toLowerCase().includes(search);
    return matchesTab && matchesSearch;
  });
  const pendingUsers = registeredUsers.filter(user =>
    !user.is_verified &&
    (!search ||
      user.full_name.toLowerCase().includes(search) ||
      user.school_id.toLowerCase().includes(search) ||
      user.username.toLowerCase().includes(search) ||
      user.role.includes(search) ||
      (user.department || '').toLowerCase().includes(search) ||
      (user.specialization || '').toLowerCase().includes(search))
  );
  const filteredLoans = transactions.filter(tx => {
    if (tx.status !== 'active' && tx.status !== 'overdue') return false;
    const equipmentName = tx.items?.[0]?.equipment?.name || tx.remarks || '';
    return !search ||
      (tx.borrower_name || '').toLowerCase().includes(search) ||
      (tx.borrower_school_id || '').toLowerCase().includes(search) ||
      equipmentName.toLowerCase().includes(search) ||
      tx.status.includes(search);
  });
  const filteredReports = reports.filter(report =>
    !search ||
    report.borrower_name.toLowerCase().includes(search) ||
    report.borrower_school_id.toLowerCase().includes(search) ||
    (report.item_name || '').toLowerCase().includes(search) ||
    report.description.toLowerCase().includes(search) ||
    report.reported_by.toLowerCase().includes(search) ||
    report.status.includes(search)
  );

  const staffCount = registeredUsers.filter(u => u.role === 'staff').length;
  const coachCount = registeredUsers.filter(u => u.role === 'coach').length;
  const studentCount = registeredUsers.filter(u => u.role === 'student').length;
  const activeLoansCount = transactions.filter(t => t.status === 'active' || t.status === 'overdue').length;
  const pendingReportsCount = reports.filter(r => r.status === 'submitted').length;
  const today = new Date();
  const userRegistrationsByDay = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6 + index);
    const dateKey = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0')
    ].join('-');

    return {
      date,
      dateKey,
      count: dashboardAccounts.filter(user => user.created_at.slice(0, 10) === dateKey).length
    };
  });
  const maxDailyRegistrations = Math.max(...userRegistrationsByDay.map(day => day.count));
  const chartAxisMaximum = Math.max(3, maxDailyRegistrations);
  const chartPoints = userRegistrationsByDay.map((day, index) => ({
    ...day,
    x: 48 + index * 105,
    y: 172 - (day.count / chartAxisMaximum) * 126
  }));
  const chartLinePath = chartPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const chartAreaPath = `${chartLinePath} L ${chartPoints[chartPoints.length - 1].x} 180 L ${chartPoints[0].x} 180 Z`;
  const registrationsThisWeek = userRegistrationsByDay.reduce((total, day) => total + day.count, 0);
  const pageTitle = currentTab === 'admin-staff'
    ? 'Registered Staff'
    : currentTab === 'admin-coaches'
      ? 'Registered Coaches'
      : currentTab === 'admin-students'
        ? 'Registered Students'
        : currentTab === 'admin-verifications'
          ? 'Account Verification'
        : currentTab === 'admin-loans'
          ? 'Active Loans'
          : currentTab === 'admin-reports'
            ? 'Staff Reports'
            : 'Falcons Administration';

  if (currentTab === 'dashboard') {
    const recentAccounts = [...dashboardAccounts]
      .sort((first, second) => second.created_at.localeCompare(first.created_at))
      .slice(0, 4);

    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard-main">
          <header className="admin-dashboard-header">
            <div>
              <h1>{pageTitle}</h1>
            </div>
            <AdminSearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              placeholder="Search members by name or school ID..."
            />
          </header>

          <div className="admin-stat-grid">
            <button type="button" className="admin-stat-card stat-tint-blue" onClick={() => onNavigate('admin-staff')}>
              <span className="admin-stat-label">Staff Registered</span>
              <strong>{staffCount}</strong>
            </button>
            <button type="button" className="admin-stat-card stat-tint-purple" onClick={() => onNavigate('admin-coaches')}>
              <span className="admin-stat-label">Coaches Registered</span>
              <strong>{coachCount}</strong>
            </button>
            <button type="button" className="admin-stat-card stat-tint-cyan" onClick={() => onNavigate('admin-students')}>
              <span className="admin-stat-label">Students Registered</span>
              <strong>{studentCount}</strong>
            </button>
            <button type="button" className="admin-stat-card stat-tint-green" onClick={() => onNavigate('admin-loans')}>
              <span className="admin-stat-label">Active Loans</span>
              <strong>{activeLoansCount}</strong>
            </button>
            <button type="button" className="admin-stat-card stat-tint-amber" onClick={() => onNavigate('admin-reports')}>
              <span className="admin-stat-label">Staff Reports</span>
              <strong>{pendingReportsCount}</strong>
            </button>
          </div>

          <div className="admin-analytics-grid">
            <section className="admin-panel admin-chart-panel" aria-labelledby="user-registration-title">
              <div className="admin-panel-heading">
                <div>
                  <h2 id="user-registration-title">User Registrations</h2>
                </div>
                <span className="admin-period-pill">{registrationsThisWeek} this week</span>
              </div>
              <div className="admin-chart">
                <svg
                  viewBox="0 0 700 230"
                  role="img"
                  aria-label="New user registrations by day for the last seven days"
                >
                  <defs>
                    <linearGradient id="userRegistrationArea" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#35b77b" stopOpacity="0.24" />
                      <stop offset="100%" stopColor="#35b77b" stopOpacity="0.01" />
                    </linearGradient>
                  </defs>
                  {[46, 88, 130, 172].map((y, index) => (
                    <g key={y}>
                      <line x1="48" y1={y} x2="678" y2={y} stroke="#edf0f6" strokeWidth="1" />
                      <text x="38" y={y + 4} fill="#9aa2b1" fontSize="11" textAnchor="end">
                        {Math.round(chartAxisMaximum * (3 - index) / 3)}
                      </text>
                    </g>
                  ))}
                  <path d={chartAreaPath} fill="url(#userRegistrationArea)" />
                  <path d={chartLinePath} fill="none" stroke="#35b77b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  {chartPoints.map(point => (
                    <g key={point.dateKey}>
                      <circle cx={point.x} cy={point.y} r="5" fill="#35b77b" stroke="#FFFFFF" strokeWidth="2.5" />
                      <title>{`${point.date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}: ${point.count} new ${point.count === 1 ? 'user' : 'users'}`}</title>
                      <text x={point.x} y="211" fill="#7e8798" fontSize="11" textAnchor="middle">
                        {point.date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </text>
                    </g>
                  ))}
                </svg>
              </div>
              <div className="admin-chart-legend"><span /> New user accounts</div>
            </section>

            <section className="admin-total-card" aria-label="User account summary">
              <span className="admin-total-icon"><i className="bi bi-people-fill"></i></span>
              <div className="admin-total-label">{search ? 'Matching Accounts' : 'Registered Accounts'}</div>
              <strong>{dashboardAccounts.length}</strong>
              <div className="admin-total-row">
                <span>Online now</span>
                <b>{dashboardAccounts.filter(user => user.is_online).length}</b>
              </div>
              <div className="admin-total-row">
                <span>Added this week</span>
                <b>{registrationsThisWeek}</b>
              </div>
              <button type="button" onClick={() => onNavigate('admin-students')}>
                Browse students <i className="bi bi-arrow-right"></i>
              </button>
            </section>
          </div>
        </div>

        <aside className="admin-activity-rail" aria-label="Account and system activity">
          <section className="admin-rail-summary">
            <div className="admin-rail-title">
              <div>
                <h2>System status</h2>
              </div>
              <span className="admin-live-dot" aria-label="Live" />
            </div>
            <div className="admin-rail-stat">
              <span>Verified accounts</span>
              <strong>{registeredUsers.filter(user => user.is_verified).length}</strong>
            </div>
            <button type="button" className="admin-pending-link" onClick={() => onNavigate('admin-verifications')}>
              <span>Pending verification</span>
              <b>{pendingUsers.length}<i className="bi bi-chevron-right"></i></b>
            </button>
          </section>

          <section className="admin-rail-section">
            <div className="admin-rail-title">
              <div>
                <h2>Recent accounts</h2>
              </div>
            </div>
            <div className="admin-recent-list">
              {recentAccounts.length === 0 ? (
                <p className="admin-empty-state">No accounts match your search.</p>
              ) : recentAccounts.map(user => (
                <div className="admin-recent-account" key={user.id}>
                  <span className={`admin-account-avatar avatar-${user.role}`}>
                    {user.full_name.split(/\s+/).map(part => part[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                  <div className="admin-account-details">
                    <strong>{user.full_name}</strong>
                    <span>{user.role} · {new Date(user.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`admin-account-status ${user.is_verified ? 'verified' : 'unverified'}`} title={user.is_verified ? 'Verified' : 'Needs verification'} />
                </div>
              ))}
            </div>
          </section>

          <section className="admin-rail-attention">
            <span className="admin-attention-icon"><i className="bi bi-bell"></i></span>
            <h2>Needs attention</h2>
            <button type="button" onClick={() => onNavigate('admin-loans')}>
              Review {activeLoansCount + pendingReportsCount} items
              <i className="bi bi-arrow-right"></i>
            </button>
          </section>
        </aside>
      </div>
    );
  }

  if (currentTab === 'admin-verifications') {
    return (
      <div className="container-fluid px-0">
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h4 className="fw-bold mb-1 text-dark">{pageTitle}</h4>
          </div>
          <span className="badge rounded-pill px-3 py-2 bg-warning text-dark">
            {pendingUsers.length} Pending
          </span>
        </div>

        <div className="card-modern">
          <AdminSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search pending accounts by name or school ID..."
          />
          {pendingUsers.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-person-check text-success" style={{ fontSize: '2rem' }}></i>
              <p className="fw-semibold text-dark mt-3 mb-1">No accounts waiting for verification</p>
              <small className="text-muted">New registrations will appear here for admin review.</small>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                  <tr>
                    <th className="py-3 px-3">School ID</th>
                    <th className="py-3">Name</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">Department</th>
                    <th className="py-3">Registered</th>
                    <th className="py-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '0.84rem' }}>
                  {pendingUsers.map(user => (
                    <tr key={user.id}>
                      <td className="px-3 fw-semibold">{user.school_id}</td>
                      <td>
                        <div className="fw-semibold text-dark">{user.full_name}</div>
                        <small className="text-muted">@{user.username}</small>
                      </td>
                      <td className="text-capitalize">{user.role}</td>
                      <td className="text-secondary">{user.department || user.specialization || 'Athletics'}</td>
                      <td>{new Date(user.created_at).toLocaleDateString()}</td>
                      <td className="text-end">
                        <button
                          type="button"
                          className="btn btn-sm btn-success"
                          onClick={() => mockDb.verifyRegisteredUser(user.id)}
                        >
                          <i className="bi bi-check-circle me-1"></i>Verify
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid px-0">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1 text-dark">{pageTitle}</h4>
          <span className="text-muted small">
            {currentTab === 'dashboard'
              ? 'Overview of registered members, active loans, and staff reports'
              : currentTab === 'admin-staff'}
          </span>
        </div>
      </div>

      {/* TOP STAT METRIC CARDS */}
      {currentTab === 'dashboard' && (
      <div className="row g-3 mb-4">
        {/* Staff Registered */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-stat-modern h-100" onClick={() => onNavigate('admin-staff')} style={{ cursor: 'pointer' }}>
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
          <div className="card-stat-modern h-100" onClick={() => onNavigate('admin-coaches')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon-circle stat-icon-indigo">
              <i className="bi bi-person-badge"></i>
            </div>
            <div className="stat-label">Coaches Registered</div>
            <div className="stat-trend" style={{ color: '#287B9C' }}>Varsity Head & Asst</div>
            <h3 className="stat-value text-dark">{coachCount}</h3>
          </div>
        </div>

        {/* Student Registered */}
        <div className="col-12 col-sm-6 col-xl">
          <div className="card-stat-modern h-100" onClick={() => onNavigate('admin-students')} style={{ cursor: 'pointer' }}>
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
          <div className="card-stat-modern h-100" onClick={() => onNavigate('admin-loans')} style={{ cursor: 'pointer' }}>
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
          <div className="card-stat-modern h-100" onClick={() => onNavigate('admin-reports')} style={{ cursor: 'pointer' }}>
            <div className="stat-icon-circle stat-icon-amber">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div className="stat-label">Staff Reports</div>
            <div className="stat-trend" style={{ color: '#F59E0B' }}>Broken & Overdue</div>
            <h3 className="stat-value text-dark">{pendingReportsCount}</h3>
          </div>
        </div>
      </div>
      )}

      {/* REGISTERED USERS SECTION */}
      {(currentTab === 'dashboard' || pageRole !== null) && (
      <div className="card-modern mb-4">
        {userRemovalError && (
          <div className="alert alert-danger" role="alert">
            {userRemovalError}
          </div>
        )}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h5 className="fw-bold mb-0 text-dark">
              {pageRole ? pageTitle : 'Registered Institutional Members'}
            </h5>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap">
            {/* ROLE FILTER TABS */}
            {currentTab === 'dashboard' && <div className="btn-group" role="group">
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
            </div>}
          </div>
        </div>

        <AdminSearch
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          placeholder={
            currentTab === 'admin-staff'
              ? 'Search staff by name or school ID...'
              : currentTab === 'admin-coaches'
                ? 'Search coaches by name or school ID...'
                : currentTab === 'admin-students'
                  ? 'Search students by name or school ID...'
                  : 'Search members by name or school ID...'
          }
        />

        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', textTransform: 'uppercase' }}>
              <tr>
                <th className="py-3 px-3">School ID</th>
                <th className="py-3">Member Name</th>
                <th className="py-3">Role</th>
                <th className="py-3">Department</th>
                <th className="py-3">Status</th>
                <th className="py-3">Current Activity</th>
                {pageRole && <th className="py-3 text-end">Actions</th>}
              </tr>
            </thead>
            <tbody style={{ fontSize: '0.84rem' }}>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={pageRole ? 7 : 6} className="text-center py-4 text-muted">
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
                      {pageRole && (
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveUser(user)}
                            aria-label={`Remove ${user.full_name}`}
                          >
                            <i className="bi bi-trash me-1"></i>Remove
                          </button>
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
      )}

      {/* DASHBOARD OVERVIEW: LIVE ACTIVITY & STAFF INCIDENT REPORTS */}
      {currentTab === 'dashboard' && (
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
      )}

      {currentTab === 'admin-loans' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Active Borrowing Activity</h5>
            </div>
            <span className="badge bg-primary rounded-pill px-3 py-1">{filteredLoans.length} Active Records</span>
          </div>
          <AdminSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search borrowers, school IDs, or equipment..."
          />
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead style={{ background: '#F8FAFC', color: '#64748B', fontSize: '0.76rem', textTransform: 'uppercase' }}>
                <tr>
                  <th className="py-3 px-3">Borrower</th>
                  <th className="py-3">Equipment</th>
                  <th className="py-3">Return Due</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.84rem' }}>
                {filteredLoans.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-4 text-muted">No active loans found.</td></tr>
                ) : filteredLoans.map(tx => (
                  <tr key={tx.id}>
                    <td className="px-3">
                      <div className="fw-semibold text-dark">{tx.borrower_name || 'Unknown borrower'}</div>
                      <small className="text-muted">{tx.borrower_school_id || 'No school ID'} ({tx.borrower_role || 'borrower'})</small>
                    </td>
                    <td>
                      <span className="text-dark fw-medium">{tx.items?.[0]?.equipment?.name || tx.remarks || 'Sports Gear'}</span>
                      <div className="small text-muted">{tx.items?.[0]?.quantity || 1} unit(s)</div>
                    </td>
                    <td>{tx.expected_return_date}</td>
                    <td>
                      <span className={`badge ${tx.status === 'overdue' ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {currentTab === 'admin-reports' && (
        <div className="card-modern">
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
            <div>
              <h5 className="fw-bold mb-0 text-dark">Staff Incident Reports</h5>
            </div>
            <span className="badge bg-danger rounded-pill px-2 py-1">
              {reports.filter(report => report.status === 'submitted').length} Pending
            </span>
          </div>
          <AdminSearch
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Search borrowers, equipment, or reports..."
          />
          {filteredReports.length === 0 ? (
            <div className="text-center py-4 text-muted small">No matching staff reports found.</div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {filteredReports.map(rep => (
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
                    <span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{rep.status.toUpperCase()}</span>
                  </div>
                  <div className="fw-bold text-dark mt-2" style={{ fontSize: '0.86rem' }}>{rep.item_name || 'Equipment Item'}</div>
                  <div className="text-secondary small mt-1">
                    <strong>Borrower:</strong> {rep.borrower_name} ({rep.borrower_school_id} • {rep.borrower_role})
                  </div>
                  <p className="text-dark small mt-2 mb-2" style={{ lineHeight: 1.4 }}>{rep.description}</p>
                  <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                    <small className="text-muted" style={{ fontSize: '0.72rem' }}>Reported by {rep.reported_by}</small>
                    {rep.status !== 'resolved' && (
                      <div className="btn-group btn-group-sm">
                        {rep.status === 'submitted' && (
                          <button type="button" onClick={() => handleAcknowledgeReport(rep.id)} className="btn btn-outline-secondary py-0 px-2">
                            Acknowledge
                          </button>
                        )}
                        <button type="button" onClick={() => handleResolveReport(rep.id)} className="btn btn-success py-0 px-2">
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
      )}
    </div>
  );
};
