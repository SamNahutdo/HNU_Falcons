import React from 'react';
import { UserRole } from '../types/database';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
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
  setCurrentRole: _setCurrentRole,
  userDisplayName: _userDisplayName,
  username: _username,
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
              onClick={() => handleNav('dashboard')}
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
                  onClick={() => handleNav('equipment')}
                  className={currentTab === 'equipment' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Equipment Stock</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Borrowing</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('maintenance')}
                  className={currentTab === 'maintenance' ? 'active' : ''}
                >
                  <i className="bi bi-tools"></i>
                  <span>Maintenance</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('athletes')}
                  className={currentTab === 'athletes' ? 'active' : ''}
                >
                  <i className="bi bi-people"></i>
                  <span>Athletes</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('coaches')}
                  className={currentTab === 'coaches' ? 'active' : ''}
                >
                  <i className="bi bi-person-badge"></i>
                  <span>Coaches</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('teams')}
                  className={currentTab === 'teams' ? 'active' : ''}
                >
                  <i className="bi bi-diagram-3"></i>
                  <span>Teams</span>
                </button>
              </li>

              <div className="sidebar-section-title">Database & Records</div>
              <li>
                <button
                  onClick={() => handleNav('users')}
                  className={currentTab === 'users' ? 'active' : ''}
                >
                  <i className="bi bi-shield-lock"></i>
                  <span>Users & Roles</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('audit')}
                  className={currentTab === 'audit' ? 'active' : ''}
                >
                  <i className="bi bi-journal-text"></i>
                  <span>Audit Logs</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('defense')}
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
                  onClick={() => handleNav('equipment')}
                  className={currentTab === 'equipment' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Equipment Inventory</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('checkout')}
                  className={currentTab === 'checkout' ? 'active' : ''}
                >
                  <i className="bi bi-cart-plus"></i>
                  <span>New Borrowing</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Active Loans & Returns</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('maintenance')}
                  className={currentTab === 'maintenance' ? 'active' : ''}
                >
                  <i className="bi bi-tools"></i>
                  <span>Maintenance Queue</span>
                </button>
              </li>
            </>
          )}

          {/* COACH PORTAL LINKS */}
          {currentRole === 'coach' && (
            <>
              <div className="sidebar-section-title">Coaching & Squads</div>
              <li>
                <button
                  onClick={() => handleNav('teams')}
                  className={currentTab === 'teams' ? 'active' : ''}
                >
                  <i className="bi bi-diagram-3"></i>
                  <span>My Teams & Rosters</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('athletes')}
                  className={currentTab === 'athletes' ? 'active' : ''}
                >
                  <i className="bi bi-people"></i>
                  <span>Athletes Directory</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('equipment')}
                  className={currentTab === 'equipment' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Team Equipment</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-arrow-left-right"></i>
                  <span>Gear Checkouts</span>
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
                  onClick={() => handleNav('equipment')}
                  className={currentTab === 'equipment' ? 'active' : ''}
                >
                  <i className="bi bi-box-seam"></i>
                  <span>Available Equipment</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('request_loan')}
                  className={currentTab === 'request_loan' ? 'active' : ''}
                >
                  <i className="bi bi-hand-index-thumb"></i>
                  <span>Request Loan</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('borrowing')}
                  className={currentTab === 'borrowing' ? 'active' : ''}
                >
                  <i className="bi bi-clock-history"></i>
                  <span>My Borrowings</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleNav('report_damage')}
                  className={currentTab === 'report_damage' ? 'active' : ''}
                >
                  <i className="bi bi-exclamation-octagon"></i>
                  <span>Report Damage</span>
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
