import React, { useState } from 'react';
import {
  Search,
  Phone,
  GraduationCap,
  Trophy,
  Package
} from 'lucide-react';
import { Athlete, TeamMember, Team, BorrowingTransaction } from '../types/database';

interface AthletesViewProps {
  athletes: Athlete[];
  teamMembers: TeamMember[];
  teams: Team[];
  transactions: BorrowingTransaction[];
}

export const AthletesView: React.FC<AthletesViewProps> = ({
  athletes,
  teamMembers,
  teams,
  transactions
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAthletes = athletes.filter(a => {
    const name = a.user?.full_name?.toLowerCase() || '';
    const studentNum = a.student_number.toLowerCase();
    const dept = a.department.toLowerCase();
    const query = searchTerm.toLowerCase();
    return name.includes(query) || studentNum.includes(query) || dept.includes(query);
  });

  return (
    <div className="content-container">
      {/* Search Header */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-control"
            placeholder="Search athlete by name, student number, or academic department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <span className="badge badge-neutral" style={{ padding: '0.6rem 1rem' }}>
          Total Rostered Athletes: {athletes.length}
        </span>
      </div>

      {/* Athletes Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredAthletes.map((ath) => {
          const memberships = teamMembers.filter(tm => tm.athlete_id === ath.id);
          const activeLoans = transactions.filter(t => t.athlete_id === ath.id && t.status !== 'returned');

          return (
            <div key={ath.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '44px',
                    height: '44px',
                    borderRadius: 'var(--radius-md)',
                    background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: '#ffffff'
                  }}>
                    {ath.user?.full_name?.charAt(0) || 'A'}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{ath.user?.full_name}</h3>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {ath.student_number} &bull; Year {ath.year_level}
                    </div>
                  </div>
                </div>

                <span className="badge badge-success">Active Varsity</span>
              </div>

              {/* Department & Academics */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.02)',
                borderRadius: 'var(--radius-md)',
                padding: '0.75rem',
                border: '1px solid var(--border-subtle)',
                marginBottom: '0.85rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.35rem',
                fontSize: '0.8rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <GraduationCap size={14} color="#60a5fa" />
                  <span>{ath.department}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                  <Phone size={14} color="#34d399" />
                  <span>{ath.emergency_contact}</span>
                </div>
              </div>

              {/* Team Memberships (Junction 1) */}
              <div style={{ marginBottom: '0.85rem' }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Team Allocations (team_members)
                </div>
                {memberships.length === 0 ? (
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Unassigned to active teams.</div>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {memberships.map(m => {
                      const t = teams.find(team => team.id === m.team_id);
                      return (
                        <span key={m.id} className="badge badge-neutral" style={{ fontSize: '0.72rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <Trophy size={11} color="#f59e0b" />
                          <span>{t?.team_name || 'Team'}</span>
                          <strong style={{ color: '#60a5fa' }}>#{m.jersey_number}</strong> ({m.position})
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Gear Loans */}
              <div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Active Equipment Checkouts
                </div>
                {activeLoans.length === 0 ? (
                  <span className="badge badge-success" style={{ fontSize: '0.72rem' }}>All Borrowed Gear Returned</span>
                ) : (
                  <span className="badge badge-warning" style={{ fontSize: '0.72rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                    <Package size={12} /> {activeLoans.length} Active Transaction{activeLoans.length > 1 ? 's' : ''} Pending Return
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
