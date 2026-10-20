import React, { useState } from 'react';
import {
  Search,
  Phone,
  GraduationCap,
  Trophy,
  Package,
  Users,
  CheckCircle2,
  UserCheck
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

  const assignedAthletesCount = new Set(teamMembers.map(tm => tm.athlete_id)).size;
  const activeBorrowersCount = new Set(
    transactions.filter(t => t.status !== 'returned').map(t => t.athlete_id)
  ).size;

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* 4 TOP SUMMARY STATS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.75rem'
      }}>
        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-coral">
            <Users size={22} />
          </div>
          <div className="stat-label">Total Student Athletes</div>
          <div className="stat-trend">Institutional Registry</div>
          <div className="stat-value" style={{ color: 'var(--coral)' }}>{athletes.length}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-cyan">
            <UserCheck size={22} />
          </div>
          <div className="stat-label">Rostered in Squads</div>
          <div className="stat-trend">Assigned to active teams</div>
          <div className="stat-value" style={{ color: '#0EA5E9' }}>{assignedAthletesCount}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-amber">
            <Package size={22} />
          </div>
          <div className="stat-label">Active Borrowers</div>
          <div className="stat-trend">Currently with loaned gear</div>
          <div className="stat-value" style={{ color: '#F59E0B' }}>{activeBorrowersCount}</div>
        </div>

        <div className="card-stat-modern">
          <div className="stat-icon-circle stat-icon-indigo">
            <Trophy size={22} />
          </div>
          <div className="stat-label">Varsity Squads</div>
          <div className="stat-trend">Competitive categories</div>
          <div className="stat-value" style={{ color: '#6366F1' }}>{teams.length}</div>
        </div>
      </div>

      {/* Search Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{
          position: 'relative',
          flex: '1 1 300px',
          maxWidth: '520px',
          background: '#FFFFFF',
          borderRadius: '9999px',
          border: '1.5px solid #E2E8F0',
          padding: '0.5rem 1rem 0.5rem 2.4rem',
          display: 'flex',
          alignItems: 'center'
        }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', color: '#94A3B8' }} />
          <input
            type="text"
            placeholder="Search athletes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: 'none',
              outline: 'none',
              width: '100%',
              background: 'transparent',
              fontSize: '0.88rem',
              color: '#1E293B',
              fontFamily: 'inherit'
            }}
          />
        </div>

        <span className="pill-soft pill-coral" style={{ padding: '0.5rem 1.15rem' }}>
          {filteredAthletes.length} athletes
        </span>
      </div>

      {/* Athletes Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.25rem' }}>
        {filteredAthletes.map((ath) => {
          const memberships = teamMembers.filter(tm => tm.athlete_id === ath.id);
          const activeLoans = transactions.filter(t => t.athlete_id === ath.id && t.status !== 'returned');

          return (
            <div key={ath.id} className="card-modern" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      background: 'var(--coral-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: '1.15rem',
                      color: '#ffffff',
                      boxShadow: '0 4px 12px rgba(255, 111, 89, 0.35)'
                    }}>
                      {ath.user?.full_name?.charAt(0) || 'A'}
                    </div>
                    <div>
                      <h3 style={{ margin: '0 0 2px', fontSize: '1.05rem', fontWeight: 800, color: 'var(--sidebar-bg)' }}>
                        {ath.user?.full_name}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: '#64748B', fontFamily: 'var(--font-mono)' }}>
                        {ath.student_number} &bull; Year {ath.year_level}
                      </div>
                    </div>
                  </div>

                  <span className="pill-soft pill-green">
                    <CheckCircle2 size={12} /> Active Varsity
                  </span>
                </div>

                {/* Department & Contact Card */}
                <div style={{
                  background: '#F8FAFC',
                  borderRadius: '14px',
                  padding: '0.85rem 1rem',
                  border: '1px solid #E2E8F0',
                  marginBottom: '1rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  fontSize: '0.82rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#334155', fontWeight: 600 }}>
                    <GraduationCap size={15} color="var(--coral)" />
                    <span>{ath.department}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B' }}>
                    <Phone size={14} color="#10B981" />
                    <span>{ath.emergency_contact}</span>
                  </div>
                </div>

                {/* Team Memberships */}
                <div style={{ marginBottom: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.45rem' }}>
                    Assigned Teams & Positions
                  </div>
                  {memberships.length === 0 ? (
                    <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic' }}>Unassigned to active teams.</div>
                  ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                      {memberships.map(m => {
                        const t = teams.find(team => team.id === m.team_id);
                        return (
                          <span key={m.id} className="pill-soft pill-blue" style={{ fontSize: '0.75rem' }}>
                            <Trophy size={12} color="#0284C7" />
                            <span>{t?.team_name || 'Team'}</span>
                            <strong style={{ color: 'var(--coral)' }}>#{m.jersey_number}</strong> ({m.position})
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Active Gear Loans Status Footer */}
              <div style={{
                paddingTop: '0.85rem',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>
                  Equipment Status:
                </span>
                {activeLoans.length === 0 ? (
                  <span className="pill-soft pill-green">
                    <CheckCircle2 size={12} /> All Gear Returned
                  </span>
                ) : (
                  <span className="pill-soft pill-amber">
                    <Package size={12} /> {activeLoans.length} Loan{activeLoans.length > 1 ? 's' : ''} Active
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
