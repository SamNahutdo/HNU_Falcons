import React, { useState } from 'react';
import { UserRole } from '../types/database';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (role: UserRole, userDisplayName: string, username: string) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const u = username.toLowerCase().trim();
    if (u.includes('admin') || u.includes('arbe')) {
      onLogin('admin', "Ma'am Arbe", 'arbe');
    } else if (u.includes('staff') || u.includes('samuel') || u.includes('udtohan')) {
      onLogin('staff', 'Samuel Angelo Udtohan', 'samuel');
    } else if (u.includes('coach') || u.includes('ace') || u.includes('arcamo')) {
      onLogin('coach', 'Ace Arcamo', 'ace');
    } else {
      onLogin('student', 'Riza Velasco', 'riza');
    }
    onClose();
  };

  const handleQuickLogin = (role: UserRole, displayName: string, uname: string) => {
    setUsername(uname);
    setPassword('••••••••');
    onLogin(role, displayName, uname);
    onClose();
  };

  return (
    <div className="modal show d-block" tabIndex={-1} style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(5px)', zIndex: 1070 }}>
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div className="modal-content" style={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.35)', overflow: 'hidden' }}>

          {/* MODAL HEADER */}
          <div className="modal-header border-0 pb-0 pt-4 px-4 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <span className="badge rounded-pill px-3 py-1" style={{ background: '#EEF2F8', color: '#475569', fontWeight: 700, fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                Portal Sign In
              </span>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={onClose}
              aria-label="Close"
              style={{ fontSize: '0.85rem' }}
            ></button>
          </div>

          <div className="modal-body px-4 pt-3 pb-4">
            {/* LOGO */}
            <div className="text-center mb-3">
              <img
                src={`${import.meta.env.BASE_URL}images/Logo.png`}
                alt="Falcon Athletics Logo"
                style={{ maxHeight: '72px', objectFit: 'contain', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.12))' }}
              />
              <h5 className="fw-bold mt-2 mb-1" style={{ color: '#20295B' }}>Welcome Back</h5>
              <p className="text-muted small mb-0">Sign in to your Falcon Athletics account</p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* USERNAME */}
              <div className="mb-3">
                <label className="form-label-custom">Username</label>
                <div className="input-group-custom">
                  <i className="bi bi-person"></i>
                  <input
                    type="text"
                    placeholder="Enter username (e.g. arbe, staff1, student)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    autoFocus
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

              {/* REMEMBER ME */}
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
                <span className="text-muted fw-semibold">Defense Mode Active</span>
              </div>

              {/* SUBMIT BUTTON */}
              <button type="submit" className="btn-signin w-100">
                <span>Sign In to Portal</span>
                <i className="bi bi-arrow-right"></i>
              </button>
            </form>

            {/* QUICK 1-CLICK DEFENSE ROLES */}
            <div className="demo-box mt-3 mb-0">
              <div className="fw-bold mb-2 small text-secondary" style={{ fontSize: '0.78rem' }}>
                <i className="bi bi-lightning-charge-fill text-warning me-1"></i> QUICK 1-CLICK ROLES:
              </div>
              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="demo-pill demo-pill-admin text-start w-100"
                  onClick={() => handleQuickLogin('admin', "Ma'am Arbe", 'arbe')}
                >
                  <span>Admin (Ma'am Arbe)</span>
                </button>
                <button
                  type="button"
                  className="demo-pill demo-pill-staff text-start w-100"
                  onClick={() => handleQuickLogin('staff', 'Samuel Angelo Udtohan', 'samuel')}
                >
                  <span>Staff (Samuel Angelo Udtohan)</span>
                </button>
                <button
                  type="button"
                  className="demo-pill demo-pill-coach text-start w-100"
                  onClick={() => handleQuickLogin('coach', 'Ace Arcamo', 'ace')}
                >
                  <span>Coach (Ace Arcamo)</span>
                </button>
                <button
                  type="button"
                  className="demo-pill demo-pill-student text-start w-100"
                  onClick={() => handleQuickLogin('student', 'Riza Velasco', 'riza')}
                >
                  <span>Student (Riza Velasco)</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
