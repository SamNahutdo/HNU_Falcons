import React, { useState } from 'react';
import { UserRole } from '../types/database';

interface LoginViewProps {
  onLogin: (role: UserRole, userDisplayName: string, username: string) => void;
  loggedOutNotice?: boolean;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin, loggedOutNotice = true }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showNotice, setShowNotice] = useState(loggedOutNotice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.toLowerCase().trim();
    if (u.includes('admin') || u.includes('arbe')) {
      onLogin('admin', "Ma'am Arbe", 'arbe');
    } else if (u.includes('staff') || u.includes('john')) {
      onLogin('staff', 'Custodian John', 'staff1');
    } else if (u.includes('coach') || u.includes('reyes')) {
      onLogin('admin', 'Coach Michael Reyes', 'coach');
    } else {
      onLogin('student', 'Juan Dela Cruz', 'student');
    }
  };

  const handleQuickLogin = (role: UserRole, displayName: string, uname: string) => {
    setUsername(uname);
    setPassword('••••••••');
    onLogin(role, displayName, uname);
  };

  return (
    <div className="login-page-wrapper">
      <div className="login-card">
        {/* LOGO ONLY */}
        <div className="login-logo-wrap">
          <img src="/images/Logo.png" alt="Falcon Logo" />
        </div>

        <div className="text-center mb-4">
          <span className="badge rounded-pill px-3 py-1" style={{ background: '#EEF2F8', color: '#475569', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            Portal Access
          </span>
        </div>

        {/* LOGOUT ALERT NOTICE (Screenshot 1) */}
        {showNotice && (
          <div className="d-flex align-items-center justify-content-between py-2 px-3 mb-3 rounded-3" style={{ background: '#DCFCE7', color: '#166534', fontSize: '0.82rem', border: '1px solid #BBF7D0' }}>
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-check-circle-fill text-success"></i>
              <span>You have been logged out safely.</span>
            </div>
            <button
              type="button"
              onClick={() => setShowNotice(false)}
              style={{ background: 'transparent', border: 'none', color: '#166534', cursor: 'pointer', fontSize: '1rem', lineHeight: 1 }}
            >
              &times;
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* USERNAME */}
          <div className="mb-3">
            <label className="form-label-custom">Username</label>
            <div className="input-group-custom">
              <i className="bi bi-person"></i>
              <input
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          {/* PASSWORD */}
          <div className="mb-3">
            <label className="form-label-custom">Password</label>
            <div className="input-group-custom">
              <i className="bi bi-lock"></i>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* REMEMBER ME & DEFENSE MODE */}
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
            <span style={{ color: '#64748B', cursor: 'pointer', fontWeight: 600 }}>
              Defense Mode
            </span>
          </div>

          {/* SIGN IN BUTTON */}
          <button type="submit" className="btn-signin">
            Sign In to Portal <i className="bi bi-arrow-right"></i>
          </button>
        </form>

        {/* QUICK DEFENSE LOGINS WIDGET (Screenshot 1) */}
        <div className="demo-box">
          <div className="fw-bold mb-2 small text-secondary" style={{ fontSize: '0.78rem' }}>
            <i className="bi bi-lightning-charge-fill text-warning me-1"></i> QUICK DEFENSE LOGINS:
          </div>
          <div className="d-flex flex-column gap-2">
            <button
              type="button"
              className="demo-pill demo-pill-admin text-start w-100"
              onClick={() => handleQuickLogin('admin', "Ma'am Arbe", 'arbe')}
            >
              <span>👑</span> <span>Admin (Ma'am Arbe)</span>
            </button>
            <button
              type="button"
              className="demo-pill demo-pill-staff text-start w-100"
              onClick={() => handleQuickLogin('staff', 'Custodian John', 'staff1')}
            >
              <span>⚾</span> <span>Staff (Custodian John)</span>
            </button>
            <button
              type="button"
              className="demo-pill demo-pill-coach text-start w-100"
              onClick={() => handleQuickLogin('admin', 'Coach Michael Reyes', 'coach')}
            >
              <span>⚾</span> <span>Coach (Michael Reyes)</span>
            </button>
            <button
              type="button"
              className="demo-pill demo-pill-student text-start w-100"
              onClick={() => handleQuickLogin('student', 'Juan Dela Cruz', 'student')}
            >
              <span>🏃</span> <span>Student (Juan Dela Cruz)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
