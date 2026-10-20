import React from 'react';
import { UserRole } from '../types/database';

interface BottomNavProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onToggleMobileNav: () => void;
  currentRole: UserRole;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  setCurrentTab,
  onToggleMobileNav,
  currentRole
}) => {
  return (
    <nav className="mobile-bottom-nav d-flex d-lg-none" aria-label="Mobile Navigation Bar">
      {/* 1. Dashboard */}
      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentTab('dashboard')}
      >
        <i className="bi bi-grid-fill"></i>
        <span>Home</span>
      </button>

      {/* 2. Equipment */}
      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'equipment' || currentTab === 'checkout' ? 'active' : ''}`}
        onClick={() => setCurrentTab('equipment')}
      >
        <i className="bi bi-box-seam"></i>
        <span>Stock</span>
      </button>

      {/* 3. Loans */}
      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'borrowing' ? 'active' : ''}`}
        onClick={() => setCurrentTab('borrowing')}
      >
        <i className="bi bi-arrow-left-right"></i>
        <span>Loans</span>
      </button>

      {/* 4. Roster / Teams */}
      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'athletes' || currentTab === 'teams' ? 'active' : ''}`}
        onClick={() => setCurrentTab(currentRole === 'admin' ? 'athletes' : 'teams')}
      >
        <i className="bi bi-people"></i>
        <span>Roster</span>
      </button>

      {/* 5. More / Full Menu */}
      <button
        type="button"
        className="bottom-nav-item"
        onClick={onToggleMobileNav}
        aria-label="Open Full Navigation Menu"
      >
        <i className="bi bi-list"></i>
        <span>Menu</span>
      </button>
    </nav>
  );
};
