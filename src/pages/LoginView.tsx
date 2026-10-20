import React, { useState, useEffect } from 'react';
import { UserRole } from '../types/database';
import { mockDb } from '../services/mockData';

interface QuickAccount {
  id: string;
  role: UserRole;
  displayName: string;
  username: string;
  schoolId: string;
  password?: string;
}

interface LoginViewProps {
  onLogin: (role: UserRole, userDisplayName: string, username: string, schoolId?: string) => void;
  loggedOutNotice?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loggedOutNotice = false }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [usernameOrId, setUsernameOrId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [rememberMe, setRememberMe] = useState(false);
  const [showNotice, setShowNotice] = useState(loggedOutNotice);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Register form state
  const [regSchoolId, setRegSchoolId] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');
  const [regDepartment, setRegDepartment] = useState('');

  // Quick accounts list populated from mockDb
  const [quickAccounts, setQuickAccounts] = useState<QuickAccount[]>([]);

  const loadAccounts = () => {
    const registered = mockDb.getRegisteredUsers();
    const mapped: QuickAccount[] = registered.slice(0, 5).map(u => ({
      id: u.id,
      role: u.role,
      displayName: u.full_name,
      username: u.username,
      schoolId: u.school_id,
      password: u.password || 'password123'
    }));
    setQuickAccounts(mapped);
  };

  useEffect(() => {
    loadAccounts();
    const unsubscribe = mockDb.subscribe(() => {
      loadAccounts();
    });
    return unsubscribe;
  }, []);

  const handleQuickPaste = (acc: QuickAccount) => {
    setUsernameOrId(acc.username);
    setPassword(acc.password || 'password123');
    setSelectedRole(acc.role);
    setActiveMode('login');
    setNoticeMessage(`Loaded ${acc.displayName} (${acc.role.toUpperCase()})`);
    setShowNotice(false);
    setErrorMessage(null);

    setTimeout(() => {
      setNoticeMessage(null);
    }, 3500);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    const identifier = usernameOrId.trim();
    if (!identifier) {
      setErrorMessage('Please enter your Username or School ID.');
      return;
    }

    const registered = mockDb.getRegisteredUsers();
    // Match by username or school_id (case insensitive)
    const match = registered.find(
      u => u.username.toLowerCase() === identifier.toLowerCase() ||
           u.school_id.toUpperCase() === identifier.toUpperCase()
    );

    if (match) {
      onLogin(match.role, match.full_name, match.username, match.school_id);
    } else {
      // Fallback if entering custom username
      const displayName = identifier.charAt(0).toUpperCase() + identifier.slice(1);
      onLogin(selectedRole, displayName, identifier.toLowerCase(), 'ID-GUEST');
    }
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Explicit validation: School ID is strictly required!
    if (!regSchoolId.trim()) {
      setErrorMessage('School ID is required to register into the system.');
      return;
    }
    if (!regFullName.trim() || !regUsername.trim()) {
      setErrorMessage('Full Name and Username are required.');
      return;
    }

    try {
      const newAcc = mockDb.registerUser({
        school_id: regSchoolId.trim(),
        full_name: regFullName.trim(),
        username: regUsername.trim().toLowerCase(),
        password: regPassword.trim() || 'password123',
        role: regRole,
        department: regDepartment.trim() || (regRole === 'student' ? 'Athletics Department' : 'Sports Operations')
      });

      // Autofill login form
      setUsernameOrId(newAcc.school_id);
      setPassword(newAcc.password || 'password123');
      setSelectedRole(newAcc.role);
      setActiveMode('login');
      setNoticeMessage(`Account registered for ${newAcc.full_name} (${newAcc.school_id}). You may now log in.`);

      // Reset form
      setRegSchoolId('');
      setRegFullName('');
      setRegUsername('');
      setRegPassword('');
      setRegDepartment('');
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Registration failed.');
    }
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* LOGO */}
        <div className="login-logo-wrap">
          <img src={`${import.meta.env.BASE_URL}images/Logo.png`} alt="Falcon Logo" />
        </div>

        {/* LOG IN HEADER */}
        <h2 style={{
          fontSize: '1.4rem',
          fontWeight: 800,
          color: 'var(--sidebar-bg)',
          textAlign: 'center',
          letterSpacing: '-0.3px',
          margin: '0.25rem 0 1.25rem'
        }}>
          {activeMode === 'login' ? 'PORTAL ACCESS' : 'CREATE ACCOUNT'}
        </h2>

        {/* MODE TABS */}
        <div className="d-flex justify-content-center mb-3">
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: '9999px',
              padding: '4px',
              display: 'inline-flex',
              gap: '4px'
            }}
          >
            <button
              type="button"
              onClick={() => { setActiveMode('login'); setErrorMessage(null); }}
              className="btn btn-sm rounded-pill px-4"
              style={{
                background: activeMode === 'login' ? 'var(--coral)' : 'transparent',
                color: activeMode === 'login' ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
                boxShadow: activeMode === 'login' ? '0 2px 8px rgba(255, 111, 89, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
              className="btn btn-sm rounded-pill px-3"
              style={{
                background: activeMode === 'register' ? 'var(--coral)' : 'transparent',
                color: activeMode === 'register' ? '#FFFFFF' : '#475569',
                fontWeight: 700,
                fontSize: '0.82rem',
                border: 'none',
                boxShadow: activeMode === 'register' ? '0 2px 8px rgba(255, 111, 89, 0.3)' : 'none',
                transition: 'all 0.15s ease'
              }}
            >
              Register
            </button>
          </div>
        </div>

        {/* LOGOUT ALERT */}
        {showNotice && (
          <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3" style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.82rem', border: '1px solid #BBF7D0' }}>
            <span>Logged out successfully.</span>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* NOTICE TOAST */}
        {noticeMessage && (
          <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3" style={{ background: '#EFF6FF', color: '#1E40AF', fontSize: '0.82rem', border: '1px solid #BFDBFE' }}>
            <span>{noticeMessage}</span>
            <button
              type="button"
              onClick={() => setNoticeMessage(null)}
              style={{ background: 'transparent', border: 'none', color: '#1E40AF', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {errorMessage && (
          <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3" style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '0.82rem', border: '1px solid #FECACA' }}>
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              style={{ background: 'transparent', border: 'none', color: '#991B1B', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        )}

        {/* LOG IN FORM */}
        {activeMode === 'login' ? (
          <form onSubmit={handleLoginSubmit}>
            <div className="mb-3">
              <label className="form-label-custom">Username</label>
              <div className="input-group-custom">
                <i className="bi bi-person"></i>
                <input
                  type="text"
                  placeholder="Username"
                  value={usernameOrId}
                  onChange={(e) => setUsernameOrId(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Password</label>
              <div className="input-group-custom">
                <i className="bi bi-lock"></i>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 4 ROLES SELECTOR */}
            <div className="mb-3">
              <label className="form-label-custom">Role</label>
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {(['admin', 'staff', 'coach', 'student'] as UserRole[]).map((r) => {
                  const isSelected = selectedRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setSelectedRole(r)}
                      style={{
                        background: isSelected ? 'var(--sidebar-bg)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        borderRadius: '10px',
                        padding: '0.5rem 0.2rem',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-4" style={{ fontSize: '0.82rem' }}>
              <label className="d-flex align-items-center gap-2 text-secondary mb-0" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ accentColor: 'var(--coral)' }}
                />
                <span>Remember me</span>
              </label>
              <span
                onClick={() => { setActiveMode('register'); setErrorMessage(null); }}
                style={{ color: 'var(--coral)', cursor: 'pointer', fontWeight: 600 }}
              >
                Need an account?
              </span>
            </div>

            <button type="submit" className="btn-signin">
              <span>ENTER PORTAL</span>
              <i className="bi bi-arrow-right"></i>
            </button>
          </form>
        ) : (
          /* CREATE ACCOUNT FORM (REQUIRES SCHOOL ID) */
          <form onSubmit={handleRegisterSubmit}>
            <div className="mb-3">
              <label className="form-label-custom">
                School ID <span style={{ color: 'var(--coral)' }}>*</span>
              </label>
              <div className="input-group-custom" style={{ borderColor: !regSchoolId ? '#CBD5E1' : 'var(--coral)' }}>
                <i className="bi bi-person-badge"></i>
                <input
                  type="text"
                  placeholder="e.g. 2024-00101 or STF-2023-014"
                  value={regSchoolId}
                  onChange={(e) => setRegSchoolId(e.target.value)}
                  required
                />
              </div>
              <small className="text-muted" style={{ fontSize: '0.72rem' }}>
                Required for registration in Falcon Athletics system.
              </small>
            </div>

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
              <label className="form-label-custom">Username <span style={{ color: 'var(--coral)' }}>*</span></label>
              <div className="input-group-custom">
                <i className="bi bi-at"></i>
                <input
                  type="text"
                  placeholder="Username"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Password <span style={{ color: 'var(--coral)' }}>*</span></label>
              <div className="input-group-custom">
                <i className="bi bi-lock"></i>
                <input
                  type="password"
                  placeholder="Set password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* ROLE SELECTOR */}
            <div className="mb-3">
              <label className="form-label-custom">Register As</label>
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                {(['student', 'coach', 'staff'] as UserRole[]).map((r) => {
                  const isSelected = regRole === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRegRole(r)}
                      style={{
                        background: isSelected ? 'var(--sidebar-bg)' : '#F1F5F9',
                        color: isSelected ? '#FFFFFF' : '#475569',
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        borderRadius: '10px',
                        padding: '0.5rem 0.2rem',
                        border: 'none',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-4">
              <label className="form-label-custom">Department or Specialization</label>
              <div className="input-group-custom">
                <i className="bi bi-building"></i>
                <input
                  type="text"
                  placeholder={regRole === 'coach' ? 'e.g. Baseball & Pitching' : 'e.g. College of Computer Studies'}
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="btn-signin">
              <span>REGISTER WITH SCHOOL ID</span>
              <i className="bi bi-check2"></i>
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

        {/* QUICK LOGINS (Realistic accounts with School IDs) */}
        <div className="demo-box mt-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold text-secondary" style={{ fontSize: '0.78rem' }}>
              Select Active Account
            </span>
          </div>

          <div className="d-flex flex-column gap-2">
            {quickAccounts.map((acc) => (
              <button
                key={acc.id}
                type="button"
                onClick={() => handleQuickPaste(acc)}
                className="btn btn-sm text-start d-flex justify-content-between align-items-center"
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '0.55rem 0.85rem',
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <span className="fw-bold text-dark">{acc.displayName}</span>
                  <span className="text-muted ms-2" style={{ fontSize: '0.74rem', textTransform: 'capitalize' }}>
                    ({acc.role})
                  </span>
                </div>
                <span className="text-primary fw-semibold" style={{ fontSize: '0.74rem' }}>
                  Select
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
