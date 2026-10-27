import React, { useState, useEffect } from 'react';
import { UserRole } from '../types/database';
import { authService } from '../services/supabase';

interface LoginViewProps {
  onLogin: (role: UserRole, userDisplayName: string, username: string, schoolId?: string) => void;
  loggedOutNotice?: boolean;
  initialError?: string | null;
}

export const LoginView: React.FC<LoginViewProps> = ({
  onLogin,
  loggedOutNotice = false,
  initialError = null
}) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNotice, setShowNotice] = useState(loggedOutNotice);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // Register form
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regSchoolId, setRegSchoolId] = useState('');
  const [regRole, setRegRole] = useState<'student' | 'coach' | 'staff'>('student');

  // Always start with empty fields and clear browser auto-population
  useEffect(() => {
    setIdentifier('');
    setPassword('');
  }, []);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutSeconds > 0) {
      const timer = setTimeout(() => setLockoutSeconds(s => s - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [lockoutSeconds]);

  // Dismiss logged-out notice after 4 seconds
  useEffect(() => {
    if (loggedOutNotice) {
      const t = setTimeout(() => setShowNotice(false), 4000);
      return () => clearTimeout(t);
    }
  }, [loggedOutNotice]);

  // LOGIN
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutSeconds > 0) return;

    setErrorMessage(null);
    setLoading(true);

    try {
      const profile = await authService.signIn(identifier.trim(), password);
      setFailedAttempts(0);
      onLogin(profile.role, profile.fullName, profile.email, profile.schoolId ?? undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed. Check your credentials.';
      if (!msg.toLowerCase().includes('pending administrator')) {
        const nextFail = failedAttempts + 1;
        setFailedAttempts(nextFail);
        if (nextFail >= 4) {
          setLockoutSeconds(30);
          setErrorMessage('Too many failed sign-in attempts. Portal locked for 30 seconds to prevent brute-force.');
          return;
        }
      }
      setErrorMessage(msg);
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
    if (regPassword.length < 12) {
      setErrorMessage('Password must be at least 12 characters.');
      setLoading(false);
      return;
    }

    try {
      const finalSchoolId = regSchoolId.trim() || (() => {
        const randomValue = new Uint32Array(1);
        window.crypto.getRandomValues(randomValue);
        return `2026${String((randomValue[0] % 90000) + 10000)}`;
      })();
      if (!/^[A-Za-z0-9-]{6,15}$/.test(finalSchoolId)) {
        throw new Error('ID must be 6 to 15 characters and contain only letters, numbers, or hyphens.');
      }

      const registration = await authService.registerUser({
        email: regEmail.trim(),
        password: regPassword,
        fullName: regFullName.trim(),
        schoolId: finalSchoolId,
        role: regRole
      });

      setSuccessMessage(
        `Registration submitted for ${registration.fullName} as ${registration.role.toUpperCase()} (ID: ${finalSchoolId})! Your account is pending administrator approval before you can sign in. Please wait for an administrator to verify and approve your account.`
      );
      setActiveMode('login');
      setIdentifier(registration.email);
      setPassword('');
      setRegEmail('');
      setRegPassword('');
      setRegFullName('');
      setRegSchoolId('');
      setRegRole('student');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
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

        {/* LOGIN / REGISTER CARD */}
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

          {initialError && (
            <div className="py-2 px-3 mb-3 rounded-3" role="alert"
              style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.82rem', border: '1px solid #FDE68A' }}>
              {initialError}
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
            <form onSubmit={handleLoginSubmit} autoComplete="off">

              <div className="mb-3">
                <label className="form-label-custom">ID, Username, or Email</label>
                <div className="input-group-custom">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    name="falcon_identifier_input"
                    id="falcon_identifier_input"
                    placeholder="Enter ID, username, or email"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    autoComplete="off"
                    disabled={lockoutSeconds > 0}
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
                    name="falcon_auth_secret_field"
                    id="falcon_auth_secret_field"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    disabled={lockoutSeconds > 0}
                    required
                  />
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center mb-4" style={{ fontSize: '0.82rem' }}>

                <span
                  onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
                  style={{ color: 'var(--coral, #FF6F59)', cursor: 'pointer', fontWeight: 600 }}
                >
                  Need an account?
                </span>
              </div>

              <button
                type="submit"
                className="btn-signin"
                disabled={loading || lockoutSeconds > 0}
                style={{
                  width: '100%',
                  opacity: lockoutSeconds > 0 ? 0.6 : 1,
                  cursor: lockoutSeconds > 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <span>
                  {lockoutSeconds > 0
                    ? `LOCKED OUT (${lockoutSeconds}s)`
                    : loading
                      ? 'Signing in…'
                      : 'ENTER PORTAL'}
                </span>
                {!loading && lockoutSeconds === 0 && <i className="bi bi-arrow-right"></i>}
              </button>
            </form>

          ) : (
            /* REGISTER FORM */
            <form onSubmit={handleRegisterSubmit}>

              {/* Role Selection (Student, Coach, Staff - Admin excluded) */}
              <div className="mb-3">
                <label className="form-label-custom">Role / Account Type <span style={{ color: 'var(--coral, #FF6F59)' }}>*</span></label>
                <div className="input-group-custom">
                  <i className="bi bi-person-badge"></i>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as 'student' | 'coach' | 'staff')}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      padding: '0.65rem 0.75rem',
                      outline: 'none',
                      color: '#1E293B',
                      fontSize: '0.9rem',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    required
                  >
                    <option value="student">Varsity Athlete / Student</option>
                    <option value="coach">Varsity Coach</option>
                    <option value="staff">Staff / Equipment Custodian</option>
                  </select>
                </div>
              </div>

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
                <label className="form-label-custom">
                  {regRole === 'student'
                    ? 'Student ID Number (e.g. 2024-20411)'
                    : regRole === 'coach'
                      ? 'Coach Employee ID (e.g. EMP-2024-001)'
                      : 'Staff Employee ID (e.g. STAFF-003)'}
                </label>
                <div className="input-group-custom">
                  <i className="bi bi-card-text"></i>
                  <input
                    type="text"
                    maxLength={15}
                    placeholder={
                      regRole === 'student'
                        ? 'e.g. 202420411'
                        : regRole === 'coach'
                          ? 'e.g. EMP-2024-001'
                          : 'e.g. STAFF-003'
                    }
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
                    placeholder="At least 12 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    autoComplete="new-password"
                    minLength={12}
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
