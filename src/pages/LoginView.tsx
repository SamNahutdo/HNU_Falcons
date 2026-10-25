import React, { useState, useEffect } from 'react';
import { UserRole, RegisteredAccount } from '../types/database';
import { authService, getSupabaseCredentials } from '../services/supabase';
import { mockDb } from '../services/mockData';
import { createClient } from '@supabase/supabase-js';

interface LoginViewProps {
  onLogin: (role: UserRole, userDisplayName: string, username: string, schoolId?: string) => void;
  loggedOutNotice?: boolean;
}

const supabaseCredentials = getSupabaseCredentials();
const supabase = supabaseCredentials.isLiveConfigured
  ? createClient(supabaseCredentials.url, supabaseCredentials.anonKey)
  : null;

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loggedOutNotice = false }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Pre-fill Admin account by default as requested
  const [email, setEmail] = useState('arbe');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(loggedOutNotice);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register form
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regSchoolId, setRegSchoolId] = useState('');

  // Accepted & verified accounts from mockDb (updates live whenever admin approves accounts)
  const [acceptedAccounts, setAcceptedAccounts] = useState<RegisteredAccount[]>(() =>
    mockDb.getRegisteredUsers().filter(a => a.status === 'active' && a.is_verified !== false)
  );
  const [accountFilter, setAccountFilter] = useState<'all' | 'admin' | 'staff' | 'coach' | 'student'>('all');

  useEffect(() => {
    const syncAccounts = () => {
      const active = mockDb.getRegisteredUsers().filter(
        a => a.status === 'active' && a.is_verified !== false
      );
      setAcceptedAccounts(active);
    };

    syncAccounts();
    const unsub = mockDb.subscribe(syncAccounts);
    return unsub;
  }, []);

  // Dismiss logged-out notice after 4 seconds
  useEffect(() => {
    if (loggedOutNotice) {
      const t = setTimeout(() => setShowNotice(false), 4000);
      return () => clearTimeout(t);
    }
  }, [loggedOutNotice]);

  // Quick fill or immediate login
  const handleSelectAccount = (acc: RegisteredAccount, autoLogin = false) => {
    setActiveMode('login');
    setEmail(acc.username);
    setPassword(acc.password || 'password123');
    setErrorMessage(null);

    if (autoLogin) {
      onLogin(
        acc.role as UserRole,
        acc.full_name,
        acc.username,
        acc.school_id
      );
    }
  };

  // LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const inputVal = email.trim();
      const pwdVal = password;

      // 1. Try authService.signIn
      try {
        const profile = await authService.signIn(inputVal, pwdVal);
        onLogin(
          profile.role as UserRole,
          profile.fullName,
          inputVal,
          profile.schoolId ?? undefined
        );
        return;
      } catch (authErr: unknown) {
        // Fallback to local accounts
        const lowerInput = inputVal.toLowerCase();
        const found = mockDb.getRegisteredUsers().find(u =>
          u.username.toLowerCase() === lowerInput ||
          u.school_id.toLowerCase() === lowerInput ||
          u.full_name.toLowerCase() === lowerInput ||
          `${u.username}@falcons.edu.ph`.toLowerCase() === lowerInput ||
          `${u.username}@example.com`.toLowerCase() === lowerInput ||
          ((u as any).email && (u as any).email.toLowerCase() === lowerInput)
        );

        if (found) {
          if (found.password && found.password !== pwdVal) {
            throw new Error('Invalid password. Please check your credentials.');
          }
          if ((found.status as string) === 'inactive' || found.is_verified === false) {
            throw new Error('Your account is pending admin approval. Contact your administrator.');
          }
          onLogin(
            found.role as UserRole,
            found.full_name,
            found.username,
            found.school_id
          );
          return;
        }

        throw authErr;
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // REGISTER
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (!regEmail.trim() || !regPassword.trim() || !regFullName.trim()) {
      setErrorMessage('Full name, email, and password are required.');
      setLoading(false);
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // Generated clean school id if not provided
      const finalSchoolId = regSchoolId.trim() || '2026' + Math.floor(10000 + Math.random() * 90000);
      const generatedUsername = regEmail.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

      // 1. Try Supabase Auth if configured
      if (supabase) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email: regEmail.trim(),
            password: regPassword,
            options: { data: { full_name: regFullName.trim() } }
          });

          if (!error && data?.user) {
            const roleRes = await supabase.from('roles').select('id').eq('name', 'student').single();
            await supabase.from('users').insert({
              user_auth_id : data.user.id,
              email        : regEmail.trim(),
              full_name    : regFullName.trim(),
              school_id    : finalSchoolId,
              role_id      : roleRes.data?.id,
              status       : 'inactive'
            });
          }
        } catch (supaErr) {
          console.warn('[Register fallback to local]', supaErr);
        }
      }

      // 2. Always register into mockDb so Admin can approve and verify it
      mockDb.registerUser({
        school_id: finalSchoolId,
        full_name: regFullName.trim(),
        username: generatedUsername,
        password: regPassword,
        role: 'student',
        department: 'Student Affairs & Athletics',
        email: regEmail.trim()
      } as any);

      setSuccessMessage(
        `Account registered for ${regFullName.trim()} (ID: ${finalSchoolId}). Status: Pending Admin Verification. Once accepted by Admin, it will immediately appear on the left side!`
      );
      setActiveMode('login');
      setEmail(generatedUsername);
      setPassword(regPassword);
      setRegEmail('');
      setRegPassword('');
      setRegFullName('');
      setRegSchoolId('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const filteredAccounts = acceptedAccounts.filter(acc =>
    accountFilter === 'all' ? true : acc.role === accountFilter
  );

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA', icon: 'bi-shield-shaded', label: 'Admin' };
      case 'staff':
        return { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0', icon: 'bi-box-seam', label: 'Staff' };
      case 'coach':
        return { bg: '#FEF3C7', color: '#B45309', border: '#FDE68A', icon: 'bi-whistle', label: 'Coach' };
      case 'student':
      default:
        return { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE', icon: 'bi-mortarboard', label: 'Student' };
    }
  };

  return (
    <div className="login-page-wrapper" style={{ padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '2rem',
        maxWidth: '1060px',
        width: '100%',
        alignItems: 'stretch',
        justifyContent: 'center'
      }}>

        {/* =========================================================================
            LEFT PANEL: ACCEPTED & VERIFIED ACCOUNTS (QUICK LOG IN WITHOUT TYPING)
           ========================================================================= */}
        <div style={{
          flex: '1 1 360px',
          maxWidth: '460px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.18)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          padding: '1.75rem',
          minHeight: '520px'
        }}>
          {/* Panel Header */}
          <div className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
            <div>
              <h5 style={{ fontWeight: 800, color: 'var(--sidebar-bg, #20295B)', marginBottom: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <i className="bi bi-people-fill" style={{ color: 'var(--coral, #FF6F59)' }}></i>
                Accepted Accounts
              </h5>
              <small style={{ color: '#64748B', fontSize: '0.78rem' }}>
                Verified profiles • Click to fill or sign in
              </small>
            </div>
            <span className="badge rounded-pill" style={{ background: '#DCFCE7', color: '#15803D', border: '1px solid #BBF7D0', fontWeight: 700, fontSize: '0.75rem' }}>
              {acceptedAccounts.length} Active
            </span>
          </div>

          {/* Filter Chips */}
          <div className="d-flex gap-1 mb-3 flex-wrap" style={{ fontSize: '0.75rem' }}>
            {(['all', 'admin', 'staff', 'coach', 'student'] as const).map(tab => (
              <button
                key={tab}
                type="button"
                onClick={() => setAccountFilter(tab)}
                className="btn btn-sm"
                style={{
                  borderRadius: '20px',
                  padding: '0.2rem 0.65rem',
                  fontSize: '0.74rem',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  background: accountFilter === tab ? 'var(--coral, #FF6F59)' : '#F1F5F9',
                  color: accountFilter === tab ? '#FFFFFF' : '#475569',
                  border: 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Accounts List (Scrollable) */}
          <div style={{ flex: 1, overflowY: 'auto', maxHeight: '430px', paddingRight: '4px' }}>
            {filteredAccounts.length === 0 ? (
              <div className="text-center py-4 text-muted small">
                <i className="bi bi-person-x fs-3 d-block mb-2 text-secondary"></i>
                No accounts found in this category.
              </div>
            ) : (
              filteredAccounts.map(acc => {
                const badge = getRoleBadgeStyle(acc.role);
                const isCurrent = email === acc.username || email === acc.school_id;

                return (
                  <div
                    key={acc.id}
                    onClick={() => handleSelectAccount(acc, false)}
                    style={{
                      background: isCurrent ? '#F0F9FF' : '#FFFFFF',
                      border: isCurrent ? '2px solid #0EA5E9' : '1px solid #E2E8F0',
                      borderRadius: '14px',
                      padding: '0.75rem 0.9rem',
                      marginBottom: '0.65rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: isCurrent ? '0 4px 12px rgba(14, 165, 233, 0.15)' : '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--coral, #FF6F59)')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = isCurrent ? '#0EA5E9' : '#E2E8F0')}
                  >
                    <div className="d-flex justify-content-between align-items-start">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: badge.bg,
                          color: badge.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 700
                        }}>
                          <i className={`bi ${badge.icon}`}></i>
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#1E293B', lineHeight: 1.2 }}>
                            {acc.full_name}
                          </div>
                          <small style={{ color: '#64748B', fontSize: '0.72rem' }}>
                            User: <strong style={{ color: '#0F172A' }}>{acc.username}</strong> • ID: {acc.school_id}
                          </small>
                        </div>
                      </div>

                      <span
                        className="badge"
                        style={{
                          background: badge.bg,
                          color: badge.color,
                          border: `1px solid ${badge.border}`,
                          fontSize: '0.68rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {badge.label}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top" style={{ fontSize: '0.72rem' }}>
                      <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                        Password: <code>{acc.password || 'password123'}</code>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelectAccount(acc, true);
                        }}
                        className="btn btn-sm py-0 px-2 rounded-pill"
                        style={{
                          background: 'var(--coral, #FF6F59)',
                          color: '#FFFFFF',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          border: 'none'
                        }}
                      >
                        ⚡ Log In
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-2 pt-2 border-top text-center" style={{ fontSize: '0.72rem', color: '#64748B' }}>
            <i className="bi bi-info-circle me-1 text-primary"></i>
            New accounts approved in the Admin menu appear here automatically.
          </div>
        </div>

        {/* =========================================================================
            RIGHT PANEL: LOGIN / REGISTER CARD (PRE-FILLED WITH ADMIN CREDENTIALS)
           ========================================================================= */}
        <div className="login-card" style={{
          flex: '1 1 380px',
          maxWidth: '460px',
          borderRadius: '24px',
          boxShadow: '0 12px 36px rgba(15, 23, 42, 0.18)',
          background: '#FFFFFF',
          padding: '2.25rem 2rem'
        }}>

          {/* LOGO */}
          <div className="login-logo-wrap" style={{ textAlign: 'center', marginBottom: '1rem' }}>
            <img
              src={`${import.meta.env.BASE_URL}images/Logo.png`}
              alt="Falcon Logo"
              style={{ maxHeight: '78px', width: 'auto' }}
            />
          </div>

          {/* HEADER */}
          <h2 style={{
            fontSize: '1.35rem',
            fontWeight: 800,
            color: 'var(--coral, #FF6F59)',
            textAlign: 'center',
            letterSpacing: '-0.3px',
            margin: '0.2rem 0 1rem'
          }}>
            {activeMode === 'login' ? 'PORTAL ACCESS' : 'REGISTER ACCOUNT'}
          </h2>

          {/* MODE TABS */}
          <div className="d-flex justify-content-center mb-3">
            <div style={{
              background: '#F1F5F9', borderRadius: '9999px',
              padding: '4px', display: 'inline-flex', gap: '4px'
            }}>
              {(['login', 'register'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setActiveMode(m); setErrorMessage(null); setSuccessMessage(null); }}
                  className="btn btn-sm rounded-pill px-4"
                  style={{
                    background: activeMode === m ? 'var(--coral, #FF6F59)' : 'transparent',
                    color: activeMode === m ? '#FFFFFF' : '#475569',
                    fontWeight: 700, fontSize: '0.82rem',
                    border: 'none', transition: 'all 0.15s ease',
                    textTransform: 'capitalize'
                  }}
                >
                  {m === 'login' ? 'Log In' : 'Register'}
                </button>
              ))}
            </div>
          </div>

          {/* LOGGED OUT NOTICE */}
          {showNotice && (
            <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3"
              style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.82rem', border: '1px solid #BBF7D0' }}>
              <span>Logged out successfully.</span>
              <button type="button" onClick={() => setShowNotice(false)}
                style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>
                &times;
              </button>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {successMessage && (
            <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3"
              style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.82rem', border: '1px solid #BBF7D0' }}>
              <span>{successMessage}</span>
              <button type="button" onClick={() => setSuccessMessage(null)}
                style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>
                &times;
              </button>
            </div>
          )}

          {/* ERROR MESSAGE */}
          {errorMessage && (
            <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3"
              style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '0.82rem', border: '1px solid #FECACA' }}>
              <span>{errorMessage}</span>
              <button type="button" onClick={() => setErrorMessage(null)}
                style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}>
                &times;
              </button>
            </div>
          )}

          {/* LOGIN FORM */}
          {activeMode === 'login' ? (
            <form onSubmit={handleLoginSubmit}>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label-custom mb-0">Username / Email / School ID</label>
                  <small className="text-muted" style={{ fontSize: '0.7rem' }}>Default: Admin (arbe)</small>
                </div>
                <div className="input-group-custom">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    placeholder="Enter username, email, or school ID"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    required
                  />
                </div>
                <small className="text-muted" style={{ fontSize: '0.72rem', display: 'block', marginTop: '3px' }}>
                  To log in as staff, coach, or student, simply delete these characters and type their account.
                </small>
              </div>

              <div className="mb-4">
                <label className="form-label-custom">Password</label>
                <div className="input-group-custom">
                  <i className="bi bi-lock"></i>
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4" style={{ fontSize: '0.82rem' }}>
                <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                  <i className="bi bi-shield-check text-success me-1"></i>
                  Ready to Sign In
                </span>
                <span
                  onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
                  style={{ color: 'var(--coral, #FF6F59)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Need an account?
                </span>
              </div>

              <button type="submit" className="btn-signin" disabled={loading} style={{ width: '100%' }}>
                <span>{loading ? 'Signing in…' : 'ENTER PORTAL'}</span>
                {!loading && <i className="bi bi-arrow-right"></i>}
              </button>
            </form>

          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit}>

              <div className="mb-3">
                <label className="form-label-custom">Full Name <span style={{ color: 'var(--coral, #FF6F59)' }}>*</span></label>
                <div className="input-group-custom">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    placeholder="e.g. Maria Clara"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">School ID / Student Number</label>
                <div className="input-group-custom">
                  <i className="bi bi-card-text"></i>
                  <input
                    type="text"
                    placeholder="e.g. 202610088 (Optional)"
                    value={regSchoolId}
                    onChange={(e) => setRegSchoolId(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label-custom">Email Address <span style={{ color: 'var(--coral, #FF6F59)' }}>*</span></label>
                <div className="input-group-custom">
                  <i className="bi bi-envelope"></i>
                  <input
                    type="email"
                    placeholder="yourname@falcons.edu.ph"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label-custom">Password <span style={{ color: 'var(--coral, #FF6F59)' }}>*</span></label>
                <div className="input-group-custom">
                  <i className="bi bi-lock"></i>
                  <input
                    type="password"
                    placeholder="Min. 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>

              {/* Info note */}
              <div style={{
                background: '#EFF6FF', border: '1px solid #BFDBFE',
                borderRadius: '10px', padding: '0.6rem 0.85rem',
                fontSize: '0.78rem', color: '#1E40AF', marginBottom: '1rem'
              }}>
                <i className="bi bi-info-circle me-1"></i>
                New registrations are set to <strong>Pending Verification</strong> until approved in the Admin Dashboard.
              </div>

              <button type="submit" className="btn-signin" disabled={loading} style={{ width: '100%' }}>
                <span>{loading ? 'Creating account…' : 'SUBMIT REGISTRATION'}</span>
                {!loading && <i className="bi bi-check2"></i>}
              </button>

              <div className="text-center mt-3">
                <button
                  type="button"
                  onClick={() => { setActiveMode('login'); setErrorMessage(null); }}
                  className="btn btn-link text-decoration-none small text-muted"
                  style={{ fontSize: '0.82rem' }}
                >
                  Already registered? <span style={{ color: 'var(--coral, #FF6F59)', fontWeight: 600 }}>Log In</span>
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
