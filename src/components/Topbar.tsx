import React from 'react';
import { UserRole } from '../types/database';

interface TopbarProps {
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  currentRole: UserRole;
  currentTab: string;
}

export const Topbar: React.FC<TopbarProps> = ({
  searchTerm,
  setSearchTerm,
  currentRole,
  currentTab
}) => {
  const adminSearchPlaceholder: Record<string, string> = {
    dashboard: 'Search members by name or school ID...',
    'admin-admins': 'Search administrators by name or admin ID...',
    'admin-staff': 'Search staff by name or school ID...',
    'admin-coaches': 'Search coaches by name or school ID...',
    'admin-students': 'Search students by name or school ID...',
    'admin-verifications': 'Search pending accounts by name or school ID...',
    'admin-loans': 'Search borrowers, school IDs, or equipment...',
    'admin-reports': 'Search borrowers, equipment, or reports...'
  };

  return (
    <header className="topbar">
      <div className="d-flex align-items-center flex-grow-1 me-2" style={{ maxWidth: '420px' }}>
        {/* SEARCH BAR */}
        <div className="topbar-search-wrap flex-grow-1">
          <input
            type="text"
            className="topbar-search-input"
            placeholder={currentRole === 'admin' ? adminSearchPlaceholder[currentTab] || 'Search...' : 'Search equipment, athletes...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="bi bi-search topbar-search-icon"></i>
        </div>
      </div>

    </header>
  );
};
