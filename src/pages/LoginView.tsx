import React, { useState, useEffect } from 'react';
import { UserRole } from '../types/database';

interface QuickAccount {
  id: string;
  role: UserRole;
  displayName: string;
  username: string;
  password?: string;
  isCustom?: boolean;
}

const DEFAULT_QUICK_ACCOUNTS: QuickAccount[] = [
  { id: '1', role: 'admin', displayName: "Ma'am Arbe", username: 'arbe', password: 'password123' },
  { id: '2', role: 'staff', displayName: 'Samuel Angelo Udtohan', username: 'samuel', password: 'password123' },
  { id: '3', role: 'coach', displayName: 'Ace Arcamo', username: 'ace', password: 'password123' },
  { id: '4', role: 'student', displayName: 'Riza Velasco', username: 'riza', password: 'password123' },
];

const STORAGE_CUSTOM_ACCOUNTS = 'fare_custom_quick_accounts';

interface LoginViewProps {
  onLogin: (role: UserRole, userDisplayName: string, username: string) => void;
  loggedOutNotice?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loggedOutNotice = false }) => {
  const [activeMode, setActiveMode] = useState<'login' | 'register'>('login');

  // Login form state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [rememberMe, setRememberMe] = useState(false);
  const [showNotice, setShowNotice] = useState(loggedOutNotice);
  const [pastedNotice, setPastedNotice] = useState<string | null>(null);

  // Register form state
  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('student');

  // Quick accounts list
  const [quickAccounts, setQuickAccounts] = useState<QuickAccount[]>(DEFAULT_QUICK_ACCOUNTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CUSTOM_ACCOUNTS);
      if (stored) {
        const parsed: QuickAccount[] = JSON.parse(stored);
        setQuickAccounts([...DEFAULT_QUICK_ACCOUNTS, ...parsed]);
      }
    } catch (e) {
      console.warn('Storage read error:', e);
    }
  }, []);

  // Paste into login form without auto-redirecting
  const handleQuickPaste = (acc: QuickAccount) => {
    setUsername(acc.username);
    setPassword(acc.password || 'password123');
    setSelectedRole(acc.role);
    setActiveMode('login');
    setPastedNotice(`Loaded ${acc.displayName} (${acc.role}).`);
    setShowNotice(false);

    setTimeout(() => {
      setPastedNotice(null);
    }, 3500);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const uname = username.trim() || 'user';

    let displayName = username;
    const match = quickAccounts.find(q => q.username.toLowerCase() === uname.toLowerCase());
    if (match) {
      displayName = match.displayName;
    } else {
      displayName = uname.charAt(0).toUpperCase() + uname.slice(1);
    }

    onLogin(selectedRole, displayName, uname);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regUsername.trim() || !regFullName.trim()) return;

    const newAcc: QuickAccount = {
      id: Date.now().toString(),
      role: regRole,
      displayName: regFullName.trim(),
      username: regUsername.trim().toLowerCase(),
      password: regPassword || 'password123',
      isCustom: true
    };

    const updated = [...quickAccounts, newAcc];
    setQuickAccounts(updated);

    try {
      const customOnly = updated.filter(a => a.isCustom);
      localStorage.setItem(STORAGE_CUSTOM_ACCOUNTS, JSON.stringify(customOnly));
    } catch (err) {
      console.warn('Storage write error:', err);
    }

    // Autofill login form
    setUsername(newAcc.username);
    setPassword(newAcc.password || 'password123');
    setSelectedRole(newAcc.role);
    setActiveMode('login');
    setPastedNotice(`Account created for ${newAcc.displayName}.`);

    setRegFullName('');
    setRegUsername('');
    setRegPassword('');
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* LOGO */}
        <div className="login-logo-wrap">
          <img src="/images/Logo.png" alt="Falcon Logo" />
        </div>

        {/* LOG IN HEADER */}
        <h2 style={{
          fontSize: '1.5rem',
          fontWeight: 800,
          color: 'var(--sidebar-bg)',
          textAlign: 'center',
          letterSpacing: '-0.3px',
          margin: '0.25rem 0 1.25rem'
        }}>
          LOG IN
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
              onClick={() => setActiveMode('login')}
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
              onClick={() => setActiveMode('register')}
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
              Create Account
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

        {/* CREDENTIALS PASTED TOAST */}
        {pastedNotice && (
          <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3" style={{ background: '#EFF6FF', color: '#1E40AF', fontSize: '0.82rem', border: '1px solid #BFDBFE' }}>
            <span>{pastedNotice}</span>
            <button
              type="button"
              onClick={() => setPastedNotice(null)}
              style={{ background: 'transparent', border: 'none', color: '#1E40AF', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
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
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
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
                onClick={() => setActiveMode('register')}
                style={{ color: 'var(--coral)', cursor: 'pointer', fontWeight: 600 }}
              >
                Create Account
              </span>
            </div>

            <button type="submit" className="btn-signin">
              <span>LOG IN</span>
              <i className="bi bi-arrow-right"></i>
            </button>
          </form>
        ) : (
          /* CREATE ACCOUNT FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div className="mb-3">
              <label className="form-label-custom">Full Name</label>
              <div className="input-group-custom">
                <i className="bi bi-card-heading"></i>
                <input
                  type="text"
                  placeholder="Full name"
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label-custom">Username</label>
              <div className="input-group-custom">
                <i className="bi bi-person"></i>
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
              <label className="form-label-custom">Password</label>
              <div className="input-group-custom">
                <i className="bi bi-lock"></i>
                <input
                  type="password"
                  placeholder="Password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* 4 ROLES SELECTOR IN REGISTER */}
            <div className="mb-4">
              <label className="form-label-custom">Role</label>
              <div className="d-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {(['admin', 'staff', 'coach', 'student'] as UserRole[]).map((r) => {
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

            <button type="submit" className="btn-signin">
              <span>CREATE ACCOUNT</span>
              <i className="bi bi-check2"></i>
            </button>

            <div className="text-center mt-3">
              <button
                type="button"
                onClick={() => setActiveMode('login')}
                className="btn btn-link text-decoration-none small text-muted"
                style={{ fontSize: '0.82rem' }}
              >
                Already have an account? <span style={{ color: 'var(--coral)', fontWeight: 600 }}>Log In</span>
              </button>
            </div>
          </form>
        )}

        {/* QUICK LOGINS */}
        <div className="demo-box mt-4">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <span className="fw-bold text-secondary" style={{ fontSize: '0.78rem' }}>
              Quick Logins
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
                  <span className="text-muted ms-2" style={{ fontSize: '0.74rem' }}>
                    ({acc.role})
                  </span>
                </div>
                <span className="text-muted" style={{ fontSize: '0.72rem' }}>
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
