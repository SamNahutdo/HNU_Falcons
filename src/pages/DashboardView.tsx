import React from 'react';
import {
  BorrowingTransaction,
  Equipment,
  UserRole
} from '../types/database';

interface DashboardViewProps {
  currentRole: UserRole;
  equipmentList?: Equipment[];
  transactions: BorrowingTransaction[];
  onOpenCheckout: () => void;
  onOpenReturn: (tx: BorrowingTransaction) => void;
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentRole,
  transactions,
  onOpenCheckout,
  onOpenReturn,
  onNavigate
}) => {
  // Key metrics matching screenshots
  const totalEquipment = 133;
  const availableEquipment = 113;
  const borrowedCount = 12;
  const maintenanceCount = 1;
  const overdueCount = 8;
  const pendingCount = 0;

  return (
    <div className="container-fluid px-0">
      {/* ====================================================================
          1. ADMIN DASHBOARD (Screenshot 2)
          ==================================================================== */}
      {currentRole === 'admin' && (
        <>
          {/* STATS ROW (Matching Screenshot 2) */}
          <div className="row g-3 mb-4">
            {/* Card 1: Total Equipment */}
            <div className="col">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-coral">
                  <i className="bi bi-graph-up-arrow"></i>
                </div>
                <div className="stat-label">Total Equipment</div>
                <div className="stat-trend">+Master Stock</div>
                <h3 className="stat-value" style={{ color: 'var(--coral)' }}>{totalEquipment}</h3>
              </div>
            </div>

            {/* Card 2: Available Stock */}
            <div className="col">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-cyan">
                  <i className="bi bi-percent"></i>
                </div>
                <div className="stat-label">Available Stock</div>
                <div className="stat-trend" style={{ color: '#0EA5E9' }}>Ready to Issue</div>
                <h3 className="stat-value text-dark">{availableEquipment}</h3>
              </div>
            </div>

            {/* Card 3: Active Loans */}
            <div className="col">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-green">
                  <i className="bi bi-people-fill"></i>
                </div>
                <div className="stat-label">Active Loans</div>
                <div className="stat-trend" style={{ color: '#10B981' }}>With Athletes</div>
                <h3 className="stat-value text-dark">{borrowedCount}</h3>
              </div>
            </div>

            {/* Card 4: Maintenance */}
            <div className="col">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-indigo">
                  <i className="bi bi-cart3"></i>
                </div>
                <div className="stat-label">Maintenance</div>
                <div className="stat-trend" style={{ color: '#6366F1' }}>Active Work Orders</div>
                <h3 className="stat-value text-dark">{maintenanceCount}</h3>
              </div>
            </div>

            {/* Card 5: Review Items */}
            <div className="col">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-amber">
                  <i className="bi bi-chat-dots-fill"></i>
                </div>
                <div className="stat-label">Review Items</div>
                <div className="stat-trend" style={{ color: '#F59E0B' }}>Pending & Overdue</div>
                <h3 className="stat-value text-dark">{pendingCount + overdueCount}</h3>
              </div>
            </div>
          </div>

          {/* MAIN CONTENT GRID (70% Left / 30% Right) */}
          <div className="row g-4">
            {/* LEFT COLUMN: Summary Activity & Recent Transactions */}
            <div className="col-lg-8 d-flex flex-column gap-4">
              {/* SUMMARY ACTIVITY CHART (Exact matching SVG Spline) */}
              <div className="card-modern">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">Summary Activity</h5>
                    <small className="text-muted">Equipment loan & return trends across the season</small>
                  </div>
                  <div className="dropdown">
                    <button className="pill-btn dropdown-toggle" type="button">
                      Month
                    </button>
                  </div>
                </div>

                {/* SVG Area Spline Chart with coral gradient fill and June peak dot */}
                <div className="position-relative" style={{ height: '240px', width: '100%' }}>
                  <svg viewBox="0 0 700 220" style={{ width: '100%', height: '100%' }}>
                    <defs>
                      <linearGradient id="coralArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#FF6F59" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#FF6F59" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Y-axis guidelines */}
                    <line x1="40" y1="30" x2="680" y2="30" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="40" y1="75" x2="680" y2="75" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="40" y1="120" x2="680" y2="120" stroke="#F1F5F9" strokeWidth="1" />
                    <line x1="40" y1="165" x2="680" y2="165" stroke="#F1F5F9" strokeWidth="1" />

                    {/* Y-axis text labels */}
                    <text x="15" y="35" fill="#94A3B8" fontSize="11" fontFamily="inherit">30+</text>
                    <text x="15" y="80" fill="#94A3B8" fontSize="11" fontFamily="inherit">40</text>
                    <text x="15" y="125" fill="#94A3B8" fontSize="11" fontFamily="inherit">30</text>
                    <text x="15" y="170" fill="#94A3B8" fontSize="11" fontFamily="inherit">20</text>
                    <text x="15" y="210" fill="#94A3B8" fontSize="11" fontFamily="inherit">10</text>

                    {/* Area fill path */}
                    <path
                      d="M 50 160 C 80 162, 100 155, 140 158 C 170 162, 190 170, 220 168 C 260 165, 290 90, 310 70 C 330 110, 350 160, 380 150 C 420 120, 460 90, 500 110 C 540 130, 580 120, 620 100 C 650 90, 670 85, 680 80 L 680 215 L 50 215 Z"
                      fill="url(#coralArea)"
                    />

                    {/* Spline stroke line */}
                    <path
                      d="M 50 160 C 80 162, 100 155, 140 158 C 170 162, 190 170, 220 168 C 260 165, 290 90, 310 70 C 330 110, 350 160, 380 150 C 420 120, 460 90, 500 110 C 540 130, 580 120, 620 100 C 650 90, 670 85, 680 80"
                      fill="none"
                      stroke="#FF6F59"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />

                    {/* Highlight peak circle at June */}
                    <circle cx="310" cy="70" r="5" fill="#FF6F59" stroke="#FFFFFF" strokeWidth="2.5" />

                    {/* Month labels along bottom */}
                    {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, idx) => (
                      <text
                        key={m}
                        x={50 + idx * 56}
                        y="215"
                        fill="#94A3B8"
                        fontSize="11"
                        textAnchor="middle"
                        fontFamily="inherit"
                      >
                        {m}
                      </text>
                    ))}
                  </svg>
                </div>
              </div>

              {/* RECENT TRANSACTIONS TABLE */}
              <div className="card-modern">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <h5 className="fw-bold mb-0 text-dark">Recent Transactions</h5>
                    <i className="bi bi-search text-muted" style={{ fontSize: '0.95rem' }}></i>
                  </div>
                  <button onClick={() => onNavigate('borrowing')} className="pill-btn">
                    <i className="bi bi-sliders"></i> Filter
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Borrower</th>
                        <th>Equipment Items (N:M)</th>
                        <th>Return Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #3B82F6, #1D4ED8)', fontSize: '0.82rem', flexShrink: 0 }}>
                              JD
                            </div>
                            <div>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Juan Dela Cruz</div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>2024-00101</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            Rawlings Alloy Baseball Bat 33-inch <span className="text-primary">&times; 2</span>
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold text-secondary" style={{ fontSize: '0.85rem' }}>
                            Sep 30, 2026
                          </div>
                        </td>
                        <td>
                          <span className="pill-soft pill-coral">
                            <i className="bi bi-exclamation-triangle-fill"></i> Overdue
                          </span>
                        </td>
                      </tr>

                      <tr>
                        <td>
                          <div className="d-flex align-items-center gap-3">
                            <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white shadow-sm" style={{ width: '38px', height: '38px', background: 'linear-gradient(135deg, #10B981, #059669)', fontSize: '0.82rem', flexShrink: 0 }}>
                              MB
                            </div>
                            <div>
                              <div className="fw-bold text-dark" style={{ fontSize: '0.88rem' }}>Mark Bautista</div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>2023-00452</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            Loan Verification Glove <span className="text-primary">&times; 2</span>
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold text-secondary" style={{ fontSize: '0.85rem' }}>
                            Sep 24, 2026
                          </div>
                        </td>
                        <td>
                          <span className="pill-soft pill-green">
                            <i className="bi bi-check-circle-fill"></i> Returned
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Hero Coral Card & Upcoming Returns */}
            <div className="col-lg-4 d-flex flex-column gap-4">
              {/* HERO CORAL CARD (Screenshot 2) */}
              <div style={{ background: 'var(--coral-gradient)', borderRadius: '22px', padding: '1.75rem', color: '#FFFFFF', boxShadow: 'var(--coral-shadow)' }}>
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <h2 className="fw-bold mb-0 text-white" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
                      {totalEquipment} <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>Units</span>
                    </h2>
                    <div style={{ fontSize: '0.88rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginTop: '2px' }}>
                      Master Equipment Stock
                    </div>
                  </div>
                  <div className="bg-white bg-opacity-25 rounded-circle p-2 text-white d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px' }}>
                    <i className="bi bi-shield-check" style={{ fontSize: '1.2rem' }}></i>
                  </div>
                </div>

                {/* Breakdown rows */}
                <div className="my-4 d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1 bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                        <i className="bi bi-arrow-up text-white" style={{ fontSize: '0.75rem' }}></i>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Available Stock</span>
                    </div>
                    <span className="fw-bold" style={{ fontSize: '0.95rem' }}>{availableEquipment} Units</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1 bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                        <i className="bi bi-arrow-down text-white" style={{ fontSize: '0.75rem' }}></i>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active On Loan</span>
                    </div>
                    <span className="fw-bold" style={{ fontSize: '0.95rem' }}>{borrowedCount} Active</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge rounded-circle p-1 bg-white bg-opacity-25 d-flex align-items-center justify-content-center" style={{ width: '24px', height: '24px' }}>
                        <i className="bi bi-arrow-down text-white" style={{ fontSize: '0.75rem' }}></i>
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>In Maintenance</span>
                    </div>
                    <span className="fw-bold" style={{ fontSize: '0.95rem' }}>{maintenanceCount} Items</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={onOpenCheckout}
                  className="btn btn-light w-100 rounded-pill fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                  style={{ color: 'var(--coral)' }}
                >
                  Add New Equipment <i className="bi bi-caret-right-fill"></i>
                </button>
              </div>

              {/* UPCOMING RETURNS (Screenshot 2) */}
              <div className="card-modern">
                <h6 className="fw-bold mb-3 text-dark">Upcoming Returns</h6>
                <div className="d-flex flex-column gap-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="rounded-circle" style={{ width: '8px', height: '8px', background: '#10B981' }}></span>
                      <span className="fw-semibold small text-dark">Mark Bautista</span>
                    </div>
                    <span className="pill-soft pill-green" style={{ fontSize: '0.7rem' }}>Sep 24</span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-2">
                      <span className="rounded-circle" style={{ width: '8px', height: '8px', background: '#F59E0B' }}></span>
                      <span className="fw-semibold small text-dark">Juan Dela Cruz</span>
                    </div>
                    <span className="pill-soft pill-amber" style={{ fontSize: '0.7rem' }}>Sep 29</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====================================================================
          2. STAFF DASHBOARD (Screenshot 3)
          ==================================================================== */}
      {currentRole === 'staff' && (
        <>
          {/* STATS ROW (Screenshot 3) */}
          <div className="row g-3 mb-4">
            <div className="col-md-3 col-6">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-coral">
                  <i className="bi bi-box-seam"></i>
                </div>
                <div className="stat-label">Equipment Stock</div>
                <div className="stat-trend">+Total Inventory</div>
                <h3 className="stat-value" style={{ color: 'var(--coral)' }}>{totalEquipment}</h3>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-cyan">
                  <i className="bi bi-check-circle-fill"></i>
                </div>
                <div className="stat-label">Ready for Issue</div>
                <div className="stat-trend" style={{ color: '#0EA5E9' }}>Available for loan</div>
                <h3 className="stat-value text-dark">{availableEquipment}</h3>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-green">
                  <i className="bi bi-arrow-repeat"></i>
                </div>
                <div className="stat-label">Active Loans</div>
                <div className="stat-trend" style={{ color: '#10B981' }}>Out with athletes</div>
                <h3 className="stat-value text-dark">{borrowedCount}</h3>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-amber">
                  <i className="bi bi-clock-history"></i>
                </div>
                <div className="stat-label">Overdue Loans</div>
                <div className="stat-trend text-danger">Requires notice</div>
                <h3 className="stat-value text-danger">{overdueCount}</h3>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* ACTIVE LOANS PENDING RETURN TABLE (Screenshot 3) */}
            <div className="col-lg-8">
              <div className="card-modern">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">Active Loans Pending Return</h5>
                    <small className="text-muted">Loans currently in circulation with athletes</small>
                  </div>
                  <button onClick={() => onNavigate('borrowing')} className="pill-btn">
                    <i className="bi bi-arrow-left-right"></i> Process Returns
                  </button>
                </div>

                <div className="table-responsive">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Tx ID</th>
                        <th>Borrower</th>
                        <th>Equipment Items</th>
                        <th>Return Due</th>
                        <th className="text-end">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="badge bg-light text-secondary border">#13</span></td>
                        <td>
                          <div className="fw-bold text-dark">Juan Dela Cruz</div>
                          <small className="text-muted">2024-00101</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>
                            Last Remaining Helmet &times; 1
                          </span>
                        </td>
                        <td>
                          <span className="pill-soft pill-blue">
                            Oct 21, 2026
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => onOpenReturn(transactions[0] || ({} as BorrowingTransaction))}
                            className="pill-btn"
                          >
                            Return
                          </button>
                        </td>
                      </tr>

                      <tr>
                        <td><span className="badge bg-light text-secondary border">#12</span></td>
                        <td>
                          <div className="fw-bold text-dark">Juan Dela Cruz</div>
                          <small className="text-muted">2024-00101</small>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>
                            Return Test Bat &times; 2
                          </span>
                        </td>
                        <td>
                          <span className="pill-soft pill-blue">
                            Oct 22, 2026
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            onClick={() => onOpenReturn(transactions[1] || ({} as BorrowingTransaction))}
                            className="pill-btn"
                          >
                            Return
                          </button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* QUICK ACTIONS & STATUS (Screenshot 3) */}
            <div className="col-lg-4 d-flex flex-column gap-4">
              {/* HERO CORAL ACTION CARD */}
              <div style={{ background: 'var(--coral-gradient)', borderRadius: '22px', padding: '1.75rem', color: '#FFFFFF', boxShadow: 'var(--coral-shadow)' }}>
                <h5 className="fw-bold mb-1 text-white">Desk Actions</h5>
                <p className="small mb-3" style={{ color: 'rgba(255,255,255,0.85)' }}>Fast checkout & return management</p>

                <div className="d-flex flex-column gap-2 mb-3">
                  <button
                    onClick={onOpenCheckout}
                    className="btn btn-light w-100 rounded-pill fw-bold py-2 shadow-sm d-flex align-items-center justify-content-center gap-2"
                    style={{ color: 'var(--coral)' }}
                  >
                    <i className="bi bi-cart-plus-fill"></i> Issue New Loan (SP)
                  </button>
                  <button
                    onClick={() => onNavigate('borrowing')}
                    className="btn btn-outline-light w-100 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-2"
                  >
                    <i className="bi bi-arrow-left-right"></i> Active Loans Queue
                  </button>
                </div>
              </div>

              {/* QUICK INVENTORY STATUS (Screenshot 3) */}
              <div className="card-modern">
                <h6 className="fw-bold mb-3 text-dark">Quick Inventory Status</h6>
                <div className="d-flex flex-column gap-3">
                  <div
                    onClick={() => onNavigate('equipment')}
                    className="d-flex justify-content-between align-items-center p-2 rounded-3"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-box-seam text-primary fs-5"></i>
                      <span className="fw-semibold text-dark small">Inspect Equipment Inventory</span>
                    </div>
                    <i className="bi bi-chevron-right text-muted small"></i>
                  </div>
                  <div
                    onClick={() => onNavigate('maintenance')}
                    className="d-flex justify-content-between align-items-center p-2 rounded-3"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-tools text-warning fs-5"></i>
                      <span className="fw-semibold text-dark small">Maintenance Queue</span>
                    </div>
                    <i className="bi bi-chevron-right text-muted small"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ====================================================================
          3. STUDENT ATHLETE DASHBOARD (Screenshot 4)
          ==================================================================== */}
      {currentRole === 'student' && (
        <>
          {/* STATS ROW (Screenshot 4) */}
          <div className="row g-3 mb-4">
            <div className="col-md-4 col-6">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-coral">
                  <i className="bi bi-box-seam-fill"></i>
                </div>
                <div className="stat-label">Currently Borrowed</div>
                <div className="stat-trend" style={{ color: '#0EA5E9' }}>Active loans</div>
                <h3 className="stat-value" style={{ color: 'var(--coral)' }}>11</h3>
              </div>
            </div>
            <div className="col-md-4 col-6">
              <div className="card-stat-modern h-100">
                <div className="stat-icon-circle stat-icon-cyan">
                  <i className="bi bi-hourglass-split"></i>
                </div>
                <div className="stat-label">Pending Requests</div>
                <div className="stat-trend" style={{ color: '#0EA5E9' }}>Awaiting approval</div>
                <h3 className="stat-value text-dark">0</h3>
              </div>
            </div>
            <div className="col-md-4 col-12">
              <div className="card-stat-modern h-100 justify-content-center">
                <div className="stat-label mb-2">Need Equipment?</div>
                <button
                  onClick={onOpenCheckout}
                  className="btn btn-light rounded-pill fw-bold py-2 shadow-sm w-100 d-flex align-items-center justify-content-center gap-2"
                  style={{ color: 'var(--coral)', border: '1px solid var(--border-soft)' }}
                >
                  <i className="bi bi-hand-index-thumb-fill"></i> Request Loan Now
                </button>
              </div>
            </div>
          </div>

          <div className="row g-4">
            {/* MY ACTIVE BORROWINGS (Screenshot 4) */}
            <div className="col-lg-8">
              <div className="card-modern">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <h5 className="fw-bold mb-0 text-dark">My Active Equipment Loans</h5>
                    <small className="text-muted">Equipment currently signed out under your student ID</small>
                  </div>
                  <button onClick={() => onNavigate('borrowing')} className="pill-btn">View History</button>
                </div>

                <div className="table-responsive">
                  <table className="table-modern">
                    <thead>
                      <tr>
                        <th>Tx ID</th>
                        <th>Equipment Items</th>
                        <th>Borrow Date</th>
                        <th>Return Due</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><span className="badge bg-light text-secondary border">#1</span></td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>
                            Rawlings Alloy Baseball Bat 33-inch &times; 2
                          </span>
                        </td>
                        <td>Sep 25, 2026</td>
                        <td>
                          <span className="pill-soft pill-coral">
                            <i className="bi bi-exclamation-circle-fill"></i> Sep 30, 2026
                          </span>
                        </td>
                        <td>
                          <span className="pill-soft pill-green">Borrowed</span>
                        </td>
                      </tr>

                      <tr>
                        <td><span className="badge bg-light text-secondary border">#3</span></td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>
                            Loan Verification Glove &times; 2
                          </span>
                        </td>
                        <td>Sep 27, 2026</td>
                        <td>
                          <span className="pill-soft pill-coral">
                            <i className="bi bi-exclamation-circle-fill"></i> Sep 29, 2026
                          </span>
                        </td>
                        <td>
                          <span className="pill-soft pill-green">Borrowed</span>
                        </td>
                      </tr>

                      <tr>
                        <td><span className="badge bg-light text-secondary border">#4</span></td>
                        <td>
                          <span className="badge bg-light text-dark border px-2 py-1" style={{ fontSize: '0.75rem' }}>
                            Rawlings Alloy Baseball Bat 33-inch &times; 1
                          </span>
                        </td>
                        <td>Sep 27, 2026</td>
                        <td>
                          <span className="pill-soft pill-coral">
                            <i className="bi bi-exclamation-circle-fill"></i> Sep 30, 2026
                          </span>
                        </td>
                        <td>
                          <span className="pill-soft pill-green">Borrowed</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* STUDENT PROFILE SUMMARY (Screenshot 4) */}
            <div className="col-lg-4 d-flex flex-column gap-4">
              <div style={{ background: 'var(--coral-gradient)', borderRadius: '22px', padding: '1.75rem', color: '#FFFFFF', boxShadow: 'var(--coral-shadow)' }}>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <div className="profile-avatar" style={{ width: '48px', height: '48px', fontSize: '1.1rem' }}>
                    JD
                  </div>
                  <div>
                    <h5 className="fw-bold mb-0 text-white">Juan Dela Cruz</h5>
                    <small style={{ color: 'rgba(255,255,255,0.85)' }}>2024-00101</small>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2 mb-3 small" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  <div><strong>Department:</strong> College of Computer Studies (Year 3)</div>
                  <div>
                    <strong>Team(s):</strong>
                    <span className="badge bg-white text-dark rounded-pill px-2 py-1 ms-1">Falcons Men Varsity Baseball</span>
                    <span className="badge bg-white text-dark rounded-pill px-2 py-1 ms-1 mt-1">Falcons Table Tennis Team</span>
                  </div>
                </div>

                <button
                  onClick={() => alert('Damage report logged for custodian review.')}
                  className="btn btn-outline-light w-100 rounded-pill fw-bold py-2 d-flex align-items-center justify-content-center gap-2"
                >
                  <i className="bi bi-exclamation-triangle"></i> Report Damaged Gear
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
