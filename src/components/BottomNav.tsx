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
  onToggleMobileNav
}) => {
  return (
    <nav className="mobile-bottom-nav d-flex d-lg-none" aria-label="Mobile Navigation Bar">
      <button
        type="button"
        className={`bottom-nav-item ${currentTab === 'dashboard' ? 'active' : ''}`}
        onClick={() => setCurrentTab('dashboard')}
      >
        <i className="bi bi-grid-fill"></i>
        <span>Dashboard</span>
      </button>

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
