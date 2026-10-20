import React from 'react';

interface TopbarProps {
  onLogout: () => void;
  onOpenConfig: () => void;
  isLive: boolean;
  searchTerm: string;
  setSearchTerm: (s: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onLogout,
  onOpenConfig,
  isLive,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <header className="topbar">
      {/* SEARCH BAR (Matching screenshot exactly) */}
      <div className="topbar-search-wrap">
        <input
          type="text"
          className="topbar-search-input"
          placeholder="Search equipment, transactions, athletes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <i className="bi bi-search topbar-search-icon"></i>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="topbar-actions">
        {/* Supabase status button */}
        <button
          onClick={onOpenConfig}
          className="btn btn-sm rounded-pill d-none d-md-inline-flex align-items-center gap-1"
          style={{
            background: isLive ? '#DCFCE7' : '#FEF3C7',
            color: isLive ? '#15803D' : '#B45309',
            border: `1px solid ${isLive ? '#BBF7D0' : '#FDE68A'}`,
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '0.45rem 0.95rem'
          }}
          title="Supabase PostgreSQL Settings"
        >
          <i className="bi bi-database"></i>
          <span>{isLive ? 'Supabase: Live Cloud' : 'Supabase: Standby (Mock)'}</span>
        </button>

        {/* LOGOUT BUTTON (Exact match to screenshot) */}
        <button
          type="button"
          onClick={onLogout}
          className="topbar-logout-btn"
          title="Sign out of portal"
        >
          <i className="bi bi-box-arrow-right"></i> Log Out
        </button>
      </div>
    </header>
  );
};
