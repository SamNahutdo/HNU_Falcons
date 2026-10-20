import React from 'react';
import { UserRole } from '../types/database';

interface TopbarProps {
  onOpenConfig?: () => void;
  isLive?: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  userDisplayName: string;
  currentRole: UserRole;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenConfig,
  searchTerm,
  setSearchTerm,
  userDisplayName,
  currentRole
}) => {
  return (
    <header className="topbar">
      <div className="d-flex align-items-center flex-grow-1 me-2" style={{ maxWidth: '420px' }}>
        {/* SEARCH BAR */}
        <div className="topbar-search-wrap flex-grow-1">
          <input
            type="text"
            className="topbar-search-input"
            placeholder="Search equipment, athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <i className="bi bi-search topbar-search-icon"></i>
        </div>
      </div>

      {/* RIGHT ACTIONS: LOGGED IN USER PROFILE */}
      <div className="topbar-actions">
        {/* Logged in User Display (Desktop) */}
        <div
          onClick={onOpenConfig}
          className="d-none d-md-inline-flex align-items-center gap-2 px-3 py-2 rounded-pill"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
            fontSize: '0.85rem',
            cursor: onOpenConfig ? 'pointer' : 'default',
            transition: 'all 0.15s ease'
          }}
          title="Logged In User"
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10B981',
              display: 'inline-block'
            }}
          ></span>
          <span style={{ fontWeight: 800, color: 'var(--sidebar-bg)' }}>{userDisplayName}</span>
          <span
            className="badge rounded-pill text-capitalize"
            style={{
              background: '#F1F5F9',
              color: '#64748B',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.25rem 0.55rem'
            }}
          >
            {currentRole}
          </span>
        </div>

        {/* Logged in User Avatar (Mobile) */}
        <div
          onClick={onOpenConfig}
          className="d-inline-flex d-md-none align-items-center justify-content-center fw-bold text-white rounded-circle shadow-sm"
          style={{
            width: '38px',
            height: '38px',
            background: 'var(--coral-gradient)',
            fontSize: '0.85rem',
            cursor: onOpenConfig ? 'pointer' : 'default'
          }}
          title={`${userDisplayName} (${currentRole})`}
        >
          {userDisplayName.charAt(0)}
        </div>
      </div>
    </header>
  );
};
