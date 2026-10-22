import React, { useState, useEffect } from 'react';
import { UserRole } from '../types/database';
import { authService } from '../services/supabase';
import { createClient } from '@supabase/supabase-js';

interface LoginViewProps {
  onLogin: (role: UserRole, userDisplayName: string, username: string, schoolId?: string) => void;
  loggedOutNotice?: boolean;
}

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL ?? '',
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
);

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loggedOutNotice = false }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(loggedOutNotice);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Register form
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');

  // Dismiss logged-out notice after 4 seconds
  useEffect(() => {
    if (loggedOutNotice) {
      const t = setTimeout(() => setShowNotice(false), 4000);
      return () => clearTimeout(t);
    }
  }, [loggedOutNotice]);

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    try {
      const profile = await authService.signIn(email.trim(), password);
      onLogin(
        profile.role as UserRole,
        profile.fullName,
        email.trim(),
        profile.schoolId ?? undefined
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // ── REGISTER (creates Supabase Auth account + inserts users row) ───────────
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setLoading(true);

    if (!regEmail.trim() || !regPassword.trim() || !regFullName.trim()) {
      setErrorMessage('All fields are required.');
      setLoading(false);
      return;
    }
    if (regPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create Supabase Auth account
      const { data, error } = await supabase.auth.signUp({
        email: regEmail.trim(),
        password: regPassword,
        options: { data: { full_name: regFullName.trim() } }
      });

      if (error) throw new Error(error.message);
      if (!data.user) throw new Error('Sign-up failed. Please try again.');

      // 2. Insert into users table with student role (admin verifies afterward)
      const { error: dbErr } = await supabase.from('users').insert({
        user_auth_id : data.user.id,
        email        : regEmail.trim(),
        full_name    : regFullName.trim(),
        role_id      : (await supabase.from('roles').select('id').eq('name', 'student').single()).data?.id,
        status       : 'inactive'   // Admin must activate before first login
      });

      if (dbErr) {
        // Cleanup orphaned auth account if DB insert fails
        await supabase.auth.signOut();
        throw new Error(`Profile creation failed: ${dbErr.message}`);
      }

      setSuccessMessage(
        `Account created for ${regFullName.trim()}. Your account is pending admin approval. Contact your administrator to activate it.`
      );
      setActiveMode('login');
      setEmail(regEmail.trim());
      setRegEmail('');
      setRegPassword('');
      setRegFullName('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">

        {/* LOGO */}
        <div className="login-logo-wrap">
          <img src={`${import.meta.env.BASE_URL}images/Logo.png`} alt="Falcon Logo" />
        </div>

        {/* HEADER */}
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'var(--coral)',
          textAlign: 'center',
          letterSpacing: '-0.3px',
          margin: '0.25rem 0 1.25rem'
        }}>
          {activeMode === 'login' ? 'PORTAL ACCESS' : 'CREATE ACCOUNT'}
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
                  background: activeMode === m ? 'var(--coral)' : 'transparent',
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

        {/* ── LOGIN FORM ────────────────────────────────────────────────────── */}
        {activeMode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>

            <div className="mb-3">
              <label className="form-label-custom">Email Address</label>
              <div className="input-group-custom">
                <i className="bi bi-envelope"></i>
                <input
                  type="email"
                  placeholder="yourname@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
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

            <div className="d-flex justify-content-end mb-4" style={{ fontSize: '0.82rem' }}>
              <span
                onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
                style={{ color: 'var(--coral)', cursor: 'pointer', fontWeight: 600 }}
              >
                Need an account?
              </span>
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              <span>{loading ? 'Signing in…' : 'ENTER PORTAL'}</span>
              {!loading && <i className="bi bi-arrow-right"></i>}
            </button>
          </form>

        ) : (
          /* ── REGISTER FORM ──────────────────────────────────────────────── */
          <form onSubmit={handleRegisterSubmit}>

            <div className="mb-3">
              <label className="form-label-custom">Full Name <span style={{ color: 'var(--coral)' }}>*</span></label>
              <div className="input-group-custom">
                <i className="bi bi-person"></i>
                <input
                  type="text"
                  placeholder="Official Full Name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Email Address <span style={{ color: 'var(--coral)' }}>*</span></label>
              <div className="input-group-custom">
                <i className="bi bi-envelope"></i>
                <input
                  type="email"
                  placeholder="yourname@example.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label-custom">Password <span style={{ color: 'var(--coral)' }}>*</span></label>
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
              New accounts are <strong>inactive</strong> until approved by an administrator.
            </div>

            <button type="submit" className="btn-signin" disabled={loading}>
              <span>{loading ? 'Creating account…' : 'REGISTER ACCOUNT'}</span>
              {!loading && <i className="bi bi-check2"></i>}
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => { setActiveMode('login'); setErrorMessage(null); }}
                className="btn btn-link text-decoration-none small text-muted"
                style={{ fontSize: '0.82rem' }}
              >
                Already registered? <span style={{ color: 'var(--coral)', fontWeight: 600 }}>Log In</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
