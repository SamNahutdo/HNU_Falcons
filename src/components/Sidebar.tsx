import React from 'react';
import { UserRole } from '../types/database';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole?: (role: UserRole) => void;
  userDisplayName: string;
  username: string;
  isOpen?: boolean;
  onClose?: () => void;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentRole,
  userDisplayName,
  username,
  isOpen = false,
  onClose,
  onLogout
}) => {
  const handleNav = (tab: string) => {
    setCurrentTab(tab);
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside className={`sidebar ${isOpen ? 'show' : ''}`}>
      {/* Mobile close button */}
      <button
        type="button"
        className="sidebar-close-btn d-lg-none"
        onClick={onClose}
        aria-label="Close navigation menu"
      >
        <i className="bi bi-x-lg"></i>
      </button>

      {/* SCROLLABLE NAVIGATION AREA */}
      <div className="sidebar-scroll-area">
        {/* BRAND / LOGO ONLY */}
        <div className="sidebar-brand">
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src={`${import.meta.env.BASE_URL}images/Logo.png`} alt="Falcon Athletics Logo" />
          </div>
        </div>

        {/* LOGGED IN USER PILL */}
        <div className="px-3 py-2 mb-2">
          <div className="p-2 rounded-3" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <div className="text-white fw-bold small text-truncate">{userDisplayName}</div>
            <div className="d-flex justify-content-between align-items-center mt-1">
              <span className="badge rounded-pill text-capitalize" style={{ background: 'var(--coral)', fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}>
                {currentRole}
              </span>
              <small className="text-muted" style={{ fontSize: '0.7rem' }}>@{username}</small>
            </div>
          </div>
        </div>

        <ul className="sidebar-nav mt-1">
          {/* ADMIN PORTAL */}
          {currentRole === 'admin' && (
            <>
              <div className="sidebar-section-title">Menu</div>
              <li>
                <button
                  onClick={() => handleNav('dashboard')}
                  className={currentTab === 'dashboard' ? 'active' : ''}
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>Dashboard</span>
                </button>
              </li>
              <div className="sidebar-section-title">Administration</div>
              <li>
                <button onClick={() => handleNav('admin-staff')} className={currentTab === 'admin-staff' ? 'active' : ''}>
                  <i className="bi bi-person-workspace"></i>
                  <span>Staff</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('admin-coaches')} className={currentTab === 'admin-coaches' ? 'active' : ''}>
                  <i className="bi bi-person-badge"></i>
                  <span>Coaches</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('admin-students')} className={currentTab === 'admin-students' ? 'active' : ''}>
                  <i className="bi bi-people-fill"></i>
                  <span>Students</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('admin-loans')} className={currentTab === 'admin-loans' ? 'active' : ''}>
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Active Loans</span>
                </button>
              </li>
              <li>
                <button onClick={() => handleNav('admin-reports')} className={currentTab === 'admin-reports' ? 'active' : ''}>
                  <i className="bi bi-flag-fill"></i>
                  <span>Staff Reports</span>
                </button>
              </li>
            </>
          )}

          {/* ==========================================================
              2. STAFF PORTAL (Added to Sidebar as requested)
              ========================================================== */}
          {currentRole === 'staff' && (
            <>
              <div className="sidebar-section-title">Operations</div>
              <li>
                <button
                  onClick={() => handleNav('equipment')}
                  className={currentTab === 'equipment' || currentTab === 'dashboard' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Equipment & Days</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Borrowers & Alerts</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('bookings')}
                  className={currentTab === 'bookings' ? 'active' : ''}
                >
                  <i className="bi bi-calendar2-check"></i>
                  <span>Student Bookings</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('reports')}
                  className={currentTab === 'reports' ? 'active' : ''}
                >
                  <i className="bi bi-flag-fill"></i>
                  <span>Reports to Admin</span>
                </button>
              </li>
            </>
          )}

          {/* ==========================================================
              3. COACH PORTAL (Added to Sidebar as requested)
              ========================================================== */}
          {currentRole === 'coach' && (
            <>
              <div className="sidebar-section-title">Coaching</div>
              <li>
                <button
                  onClick={() => handleNav('dashboard')}
                  className={currentTab === 'dashboard' ? 'active' : ''}
                >
                  <i className="bi bi-grid-fill"></i>
                  <span>Coach Dashboard</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('bookings')}
                  className={currentTab === 'bookings' ? 'active' : ''}
                >
                  <i className="bi bi-calendar-check"></i>
                  <span>Student Bookings</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Borrow Equipment</span>
                </button>
              </li>
            </>
          )}

          {/* ==========================================================
              4. STUDENT PORTAL (Added to Sidebar as requested)
              ========================================================== */}
          {currentRole === 'student' && (
            <>
              <div className="sidebar-section-title">Athletics</div>
              <li>
                <button
                  onClick={() => handleNav('equipment')}
                  className={currentTab === 'equipment' || currentTab === 'dashboard' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Available Equipment</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('bookings')}
                  className={currentTab === 'bookings' ? 'active' : ''}
                >
                  <i className="bi bi-calendar2-plus"></i>
                  <span>Book a Coach</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('activity')}
                  className={currentTab === 'activity' ? 'active' : ''}
                >
                  <i className="bi bi-clock-history"></i>
                  <span>My Loans & Bookings</span>
                </button>
              </li>
            </>
          )}

          {/* SESSION / LOG OUT MENU ITEM */}
          {onLogout && (
            <>
              <div className="sidebar-section-title">Session</div>
              <li>
                <button
                  type="button"
                  onClick={() => {
                    if (onClose) onClose();
                    onLogout();
                  }}
                  className="sidebar-nav-logout-btn"
                  title="Sign out of portal"
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Log Out</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>
    </aside>
  );
};
