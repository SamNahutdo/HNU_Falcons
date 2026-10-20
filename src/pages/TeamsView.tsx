import React, { useState } from 'react';
import {
  Trophy,
  Users,
  Plus,
  UserCheck,
  Calendar,
  AlertCircle,
  CheckCircle2
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
      setNotification({ type: 'success', message: 'Athlete successfully rostered to team (Junction record created)!' });
      onRefresh();
    } catch (err: unknown) {
      setNotification({
        type: 'error',
        message: err instanceof Error ? err.message : 'Failed to roster athlete.'
      });
    }
  };

  return (
    <div className="content-container">
      {notification && (
        <div style={{
          padding: '0.85rem 1.25rem',
          borderRadius: 'var(--radius-md)',
          background: notification.type === 'success' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.15)',
          border: `1px solid ${notification.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
          color: notification.type === 'success' ? '#34d399' : '#f87171',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.875rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {notification.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="btn btn-secondary btn-icon" style={{ width: '28px', height: '28px' }}>
            &times;
          </button>
        </div>
      )}

      {/* Sports Catalog Summary Bar */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div>
            <h3 className="card-title">
              <Trophy size={18} color="#f59e0b" />
              University Sports Disciplines Master (sports table)
            </h3>
            <p className="card-subtitle">Foundational 3NF entity referenced by teams and equipment tables</p>
          </div>
          <span className="badge badge-neutral">{sports.length} Recognized Codes</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
          {sports.map((sport) => {
            const countTeams = teams.filter(t => t.sport_id === sport.id).length;
            return (
              <div
                key={sport.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{sport.name}</span>
                  <span className="badge badge-info" style={{ fontSize: '0.68rem' }}>{sport.category}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                  {countTeams} active varsity squad{countTeams !== 1 ? 's' : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Teams Roster Manager (Junction 1) */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1.5rem', alignItems: 'flex-start' }}>
        {/* Teams List Column */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '0.85rem' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Varsity Teams ({teams.length})</h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {teams.map((t) => {
              const isSelected = t.id === selectedTeam?.id;
              const sport = sports.find(s => s.id === t.sport_id);
              const countAthletes = teamMembers.filter(tm => tm.team_id === t.id).length;
              return (
                <div
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  style={{
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1px solid ${isSelected ? 'var(--primary)' : 'var(--border-light)'}`,
                    background: isSelected ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                    cursor: 'pointer',
                    transition: 'all var(--transition-fast)'
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSelected ? '#93c5fd' : 'var(--text-main)' }}>
                    {t.team_name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.35rem', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>{sport?.name} &bull; SY {t.school_year}</span>
                    <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{countAthletes} Athletes</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Team Roster (Junction 1: team_members) */}
        {selectedTeam && (
          <div className="card">
            <div className="card-header">
              <div>
                <h3 className="card-title">
                  <Users size={18} color="#3b82f6" />
                  {selectedTeam.team_name} — Active Roster
                </h3>
                <p className="card-subtitle">
                  Many-to-Many Junction Table <code style={{ color: '#93c5fd' }}>team_members</code> carrying intersection attributes (position, jersey)
                </p>
              </div>

              {currentRole !== 'student' && (
                <button
                  onClick={() => setIsAssignOpen(true)}
                  className="btn btn-primary btn-sm"
                >
                  <Plus size={14} /> Assign Athlete to Roster
                </button>
              )}
            </div>

            {/* Coach banner */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              border: '1px solid var(--border-subtle)',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.85rem'
            }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={18} color="#60a5fa" />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Head Coach:</div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                  {selectedTeam.coach?.user?.full_name || 'Kenneth Carter'}
                  <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                    ({selectedTeam.coach?.license_level || 'FIBA Level 3'})
                  </span>
                </div>
              </div>
            </div>

            {/* Roster Table */}
            <div className="table-responsive">
              <table className="data-table">
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
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                        No athletes currently assigned to this team roster.
                      </td>
                    </tr>
                  ) : (
                    currentMembers.map((tm) => (
                      <tr key={tm.id}>
                        <td>
                          <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: 'var(--radius-md)',
                            background: 'rgba(37, 99, 235, 0.15)',
                            border: '1px solid rgba(37, 99, 235, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontFamily: 'var(--font-mono)',
                            color: '#60a5fa'
                          }}>
                            {tm.jersey_number ?? '-'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{tm.athlete?.user?.full_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{tm.athlete?.emergency_contact}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.82rem', fontFamily: 'var(--font-mono)' }}>{tm.athlete?.student_number}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tm.athlete?.department}</div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tm.position}</span>
                        </td>
                        <td>
                          <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Calendar size={13} color="var(--text-muted)" />
                            <span>{tm.joined_at}</span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${tm.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>
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

      {/* ASSIGN ATHLETE MODAL (Junction 1 inserter) */}
      {isAssignOpen && selectedTeam && (
        <div className="modal-backdrop" onClick={() => setIsAssignOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <form onSubmit={handleAssignSubmit}>
              <div className="modal-header">
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Assign Athlete to {selectedTeam.team_name}</h3>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Inserts record into N:M junction table <code style={{ color: '#93c5fd' }}>team_members</code></p>
                </div>
                <button type="button" onClick={() => setIsAssignOpen(false)} className="btn btn-secondary btn-icon" style={{ width: '30px', height: '30px' }}>
                  &times;
                </button>
              </div>

              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Select Varsity Athlete</label>
                  <select
                    className="form-control"
                    value={assignAthleteId}
                    onChange={(e) => setAssignAthleteId(e.target.value)}
                    required
                  >
                    {athletes.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.user?.full_name} ({a.student_number} - {a.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Position / Tactical Role</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Center / Wing Spiker / Sprinter"
                    value={assignPosition}
                    onChange={(e) => setAssignPosition(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Jersey Number (0-99)</label>
                  <input
                    type="number"
                    className="form-control"
                    min={0}
                    max={99}
                    value={assignJersey}
                    onChange={(e) => setAssignJersey(parseInt(e.target.value) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAssignOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
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
