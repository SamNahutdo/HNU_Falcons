import React, { useState } from 'react';
import {
  Trophy,
  Users,
  Plus,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Shield,
  Award
} from 'lucide-react';
import { Sport, Team, TeamMember, Athlete, UserRole } from '../types/database';
import { databaseService } from '../services/supabase';

interface TeamsViewProps {
  sports: Sport[];
  teams: Team[];
  teamMembers: TeamMember[];
  athletes: Athlete[];
  currentRole: UserRole;
  onRefresh: () => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  sports,
  teams,
  teamMembers,
  athletes,
  currentRole,
  onRefresh
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  // Form states
  const [assignAthleteId, setAssignAthleteId] = useState(athletes[0]?.id || '');
  const [assignPosition, setAssignPosition] = useState('Guard / Forward');
  const [assignJersey, setAssignJersey] = useState(10);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
  const currentMembers = teamMembers.filter(tm => tm.team_id === selectedTeam?.id);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam) return;

    try {
      await databaseService.addTeamMember(
        selectedTeam.id,
        assignAthleteId,
        assignPosition,
        Number(assignJersey)
      );
      setIsAssignOpen(false);
      setNotification({ type: 'success', message: 'Athlete successfully rostered to team!' });
      onRefresh();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to roster athlete.'
      });
    }
  };

  return (
    <div style={{ maxWidth: '1440px', margin: '0 auto' }}>
      {/* Notifications */}
      {notification && (
        <div style={{
          padding: '0.9rem 1.25rem',
          borderRadius: '14px',
          background: notification.type === 'success' ? '#ECFDF5' : '#FEF2F2',
          border: `1.5px solid ${notification.type === 'success' ? '#A7F3D0' : '#FECACA'}`,
          color: notification.type === 'success' ? '#065F46' : '#991B1B',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} color="#10B981" /> : <AlertCircle size={18} color="#EF4444" />}
            <span>{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: 'inherit' }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Sports Catalog Summary Bar */}
      <div className="card-modern" style={{ marginBottom: '1.75rem', padding: '1.5rem' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.25rem',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--sidebar-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Trophy size={20} color="var(--coral)" />
            Sports
          </h3>
          <span className="pill-soft pill-coral">
            {sports.length} sports
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          {sports.map((sport) => {
            const countTeams = teams.filter(t => t.sport_id === sport.id).length;
            return (
              <div
                key={sport.id}
                style={{
                  background: '#F8FAFC',
                  borderRadius: '14px',
                  padding: '1rem 1.15rem',
                  border: '1px solid #E2E8F0',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#1E293B' }}>{sport.name}</span>
                  <span className="pill-soft pill-blue" style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem' }}>
                    {sport.category}
                  </span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Shield size={13} color="#94A3B8" />
                  <span>{countTeams} active varsity squad{countTeams !== 1 ? 's' : ''}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teams Roster Manager Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '1.5rem',
        alignItems: 'flex-start'
      }}>
        {/* Teams List Column */}
        <div className="card-modern" style={{ padding: '1.5rem' }}>
          <div style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--sidebar-bg)' }}>
              Varsity Teams ({teams.length})
            </h4>
            <span className="pill-soft pill-blue">Select to inspect</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {teams.map((t) => {
              const isSelected = t.id === selectedTeam?.id;
              const sport = sports.find(s => s.id === t.sport_id);
              const countAthletes = teamMembers.filter(tm => tm.team_id === t.id).length;

              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  style={{
                    padding: '0.95rem 1.15rem',
                    borderRadius: '14px',
                    border: `1.5px solid ${isSelected ? 'var(--coral)' : '#E2E8F0'}`,
                    background: isSelected ? '#FFF5F3' : '#FFFFFF',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: isSelected ? '0 4px 12px rgba(255, 111, 89, 0.15)' : 'none'
                  }}
                >
                  <div style={{
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    color: isSelected ? 'var(--coral)' : '#1E293B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span>{t.team_name}</span>
                    <span className="pill-soft pill-coral" style={{ fontSize: '0.68rem', padding: '0.2rem 0.6rem' }}>
                      {countAthletes} Athletes
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.45rem', fontSize: '0.78rem', color: '#64748B' }}>
                    <span>{sport?.name} &bull; SY {t.school_year}</span>
                    <span style={{ fontWeight: 600 }}>Coach {t.coach?.user?.full_name?.split(' ')[0] || 'Arcamo'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Team Active Roster */}
        {selectedTeam && (
          <div className="card-modern" style={{ padding: '1.75rem', gridColumn: 'span 2' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1.5rem',
              flexWrap: 'wrap',
              gap: '1rem'
            }}>
          <h3 style={{
            margin: 0,
            fontSize: '1.2rem',
            fontWeight: 800,
            color: 'var(--sidebar-bg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <Users size={20} color="var(--coral)" />
            {selectedTeam.team_name} Roster
          </h3>

          {currentRole !== 'student' && (
            <button
              onClick={() => setIsAssignOpen(true)}
              style={{
                background: 'var(--coral-gradient)',
                border: 'none',
                borderRadius: '9999px',
                padding: '0.6rem 1.35rem',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                boxShadow: 'var(--coral-shadow)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Plus size={15} /> Assign Athlete
            </button>
          )}
            </div>

            {/* Coach Banner */}
            <div style={{
              background: '#F8FAFC',
              borderRadius: '16px',
              padding: '1rem 1.25rem',
              border: '1px solid #E2E8F0',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--coral-gradient)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                boxShadow: '0 4px 10px rgba(255, 111, 89, 0.3)'
              }}>
                <Award size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Designated Head Coach</div>
                <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#1E293B' }}>
                  {selectedTeam.coach?.user?.full_name || 'Coach Ace Arcamo'}
                  <span style={{ fontSize: '0.78rem', fontWeight: 600, color: '#64748B', marginLeft: '0.65rem' }}>
                    ({selectedTeam.coach?.license_level || 'FIBA Level 3'})
                  </span>
                </div>
              </div>
            </div>

            {/* Roster Table */}
            <div style={{ overflowX: 'auto' }}>
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Jersey #</th>
                    <th>Athlete Full Name</th>
                    <th>Student ID & Dept</th>
                    <th>Tactical Position</th>
                    <th>Rostered Since</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {currentMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '3rem 1rem' }}>
                        <Users size={36} style={{ opacity: 0.35, marginBottom: '0.5rem' }} />
                        <div style={{ fontWeight: 600 }}>No athletes currently assigned to this team roster</div>
                      </td>
                    </tr>
                  ) : (
                    currentMembers.map((tm) => (
                      <tr key={tm.id}>
                        <td>
                          <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '10px',
                            background: '#FFF5F3',
                            border: '1.5px solid var(--coral)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--coral)',
                            fontSize: '0.9rem'
                          }}>
                            {tm.jersey_number ?? '-'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.92rem' }}>{tm.athlete?.user?.full_name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tm.athlete?.emergency_contact}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.85rem', fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#1E293B' }}>
                            {tm.athlete?.student_number}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{tm.athlete?.department}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, fontSize: '0.86rem', color: '#334155' }}>{tm.position}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748B' }}>
                            <Calendar size={13} color="var(--coral)" />
                            <span>{tm.joined_at}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`pill-soft ${tm.status === 'active' ? 'pill-green' : 'pill-amber'}`}>
                            {tm.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ASSIGN ATHLETE MODAL */}
      {isAssignOpen && selectedTeam && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }} onClick={() => setIsAssignOpen(false)}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: '1px solid #E2E8F0',
            overflow: 'hidden'
          }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleAssignSubmit}>
              <div style={{
                padding: '1.25rem 1.75rem',
                borderBottom: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#FAFBFD'
              }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--sidebar-bg)' }}>
                    Assign Athlete to {selectedTeam.team_name}
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748B' }}>
                    Creates record in team_members junction table
                  </p>
                </div>
                <button type="button" onClick={() => setIsAssignOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#94A3B8' }}>
                  &times;
                </button>
              </div>

              <div style={{ padding: '1.5rem 1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label className="form-label-custom">Select Varsity Athlete</label>
                  <select
                    value={assignAthleteId}
                    onChange={(e) => setAssignAthleteId(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                  >
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.user?.full_name} ({a.student_number} - {a.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label-custom">Tactical Position / Field Role</label>
                  <input
                    type="text"
                    placeholder="e.g., Center / Point Guard / Wing Spiker"
                    value={assignPosition}
                    onChange={(e) => setAssignPosition(e.target.value)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                  />
                </div>

                <div>
                  <label className="form-label-custom">Jersey Number (0-99)</label>
                  <input
                    type="number"
                    min={0}
                    max={99}
                    value={assignJersey}
                    onChange={(e) => setAssignJersey(parseInt(e.target.value) || 0)}
                    required
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '12px', border: '1.5px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{
                padding: '1.15rem 1.75rem',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '0.75rem',
                background: '#FAFBFD'
              }}>
                <button
                  type="button"
                  onClick={() => setIsAssignOpen(false)}
                  style={{
                    padding: '0.6rem 1.25rem',
                    borderRadius: '9999px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.6rem 1.45rem',
                    borderRadius: '9999px',
                    border: 'none',
                    background: 'var(--coral-gradient)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    boxShadow: 'var(--coral-shadow)',
                    cursor: 'pointer'
                  }}
                >
                  Confirm Roster Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
