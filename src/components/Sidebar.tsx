import React from 'react';
import { UserRole } from '../types/database';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  userDisplayName: string;
  username: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  currentRole,
  setCurrentRole,
  userDisplayName,
  username
}) => {
  const getInitials = (name: string) => {
    if (name.includes('Arbe')) return 'A';
    if (name.includes('John') || username === 'staff1') return 'S';
    if (name.includes('Dela Cruz')) return 'JD';
    return name.slice(0, 2).toUpperCase();
  };

  const handleProfileClick = () => {
    // Quick role toggle for testing defense
    if (currentRole === 'admin') setCurrentRole('staff');
    else if (currentRole === 'staff') setCurrentRole('student');
    else setCurrentRole('admin');
  };

  return (
    <aside className="sidebar">
      <div>
        {/* BRAND / LOGO ONLY (Exact match to screenshots) */}
        <div className="sidebar-brand">
          <div style={{ display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
            <img src="/images/Logo.png" alt="Falcon Athletics Logo" />
          </div>
        </div>

        <ul className="sidebar-nav mt-3">
          {/* MENU SECTION */}
          <div className="sidebar-section-title">Menu</div>
          <li>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={currentTab === 'dashboard' ? 'active' : ''}
            >
              <i className="bi bi-grid-fill"></i>
              <span>Dashboard</span>
            </button>
          </li>

          {/* ADMIN PORTAL LINKS */}
          {currentRole === 'admin' && (
            <>
              <div className="sidebar-section-title">Management</div>
              <li>
                <button
                  onClick={() => setCurrentTab('equipment')}
                  className={currentTab === 'equipment' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Equipment Stock</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Borrowing (N:M)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('maintenance')}
                  className={currentTab === 'maintenance' ? 'active' : ''}
                >
                  <i className="bi bi-tools"></i>
                  <span>Maintenance</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('athletes')}
                  className={currentTab === 'athletes' ? 'active' : ''}
                >
                  <i className="bi bi-people"></i>
                  <span>Athletes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('coaches')}
                  className={currentTab === 'coaches' ? 'active' : ''}
                >
                  <i className="bi bi-person-badge"></i>
                  <span>Coaches</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('teams')}
                  className={currentTab === 'teams' ? 'active' : ''}
                >
                  <i className="bi bi-diagram-3"></i>
                  <span>Teams</span>
                </button>
              </li>

              <div className="sidebar-section-title">Database & Records</div>
              <li>
                <button
                  onClick={() => setCurrentTab('users')}
                  className={currentTab === 'users' ? 'active' : ''}
                >
                  <i className="bi bi-shield-lock"></i>
                  <span>Users & Roles</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('audit')}
                  className={currentTab === 'audit' ? 'active' : ''}
                >
                  <i className="bi bi-journal-text"></i>
                  <span>Audit Logs</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('defense')}
                  className={currentTab === 'defense' ? 'active' : ''}
                >
                  <i className="bi bi-file-earmark-bar-graph"></i>
                  <span>Reports (Views)</span>
                </button>
              </li>
            </>
          )}

          {/* STAFF PORTAL LINKS (Screenshot 3) */}
          {currentRole === 'staff' && (
            <>
              <div className="sidebar-section-title">Equipment Desk</div>
              <li>
                <button
                  onClick={() => setCurrentTab('equipment')}
                  className={currentTab === 'equipment' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Equipment Inventory</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('checkout')}
                  className={currentTab === 'checkout' ? 'active' : ''}
                >
                  <i className="bi bi-cart-plus"></i>
                  <span>New Borrowing (SP)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Active Loans & Returns</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('maintenance')}
                  className={currentTab === 'maintenance' ? 'active' : ''}
                >
                  <i className="bi bi-tools"></i>
                  <span>Maintenance Queue</span>
                </button>
              </li>
            </>
          )}

          {/* STUDENT / ATHLETE LINKS (Screenshot 4) */}
          {currentRole === 'student' && (
            <>
              <div className="sidebar-section-title">Student Athlete</div>
              <li>
                <button
                  onClick={() => setCurrentTab('equipment')}
                  className={currentTab === 'equipment' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Available Equipment</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('request_loan')}
                  className={currentTab === 'request_loan' ? 'active' : ''}
                >
                  <i className="bi bi-hand-index-thumb"></i>
                  <span>Request Loan</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-clock-history"></i>
                  <span>My Borrowings</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setCurrentTab('report_damage')}
                  className={currentTab === 'report_damage' ? 'active' : ''}
                >
                  <i className="bi bi-exclamation-octagon"></i>
                  <span>Report Damage</span>
                </button>
              </li>
            </>
          )}
        </ul>
      </div>

      {/* BOTTOM USER PROFILE CARD (Coral Card matching Screenshot 2, 3, 4) */}
      <div>
        <button
          type="button"
          className="sidebar-profile-card"
          onClick={handleProfileClick}
          title="Click to toggle perspective (Admin ↔ Staff ↔ Student)"
        >
          <div className="d-flex align-items-center gap-2 overflow-hidden">
            <div className="profile-avatar">
              {getInitials(userDisplayName)}
            </div>
            <div className="overflow-hidden text-start">
              <div className="text-truncate fw-bold" style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                {userDisplayName}
              </div>
              <div className="text-truncate" style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.85)', textTransform: 'capitalize' }}>
                {currentRole}
              </div>
            </div>
          </div>
          <div>
            <i className="bi bi-chevron-down" style={{ fontSize: '0.75rem', color: '#ffffff' }}></i>
          </div>
        </button>
      </div>
    </aside>
  );
};
