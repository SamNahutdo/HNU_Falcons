import React, { useState } from 'react';
import { Database, X, CheckCircle, AlertCircle, Copy } from 'lucide-react';
import {
  getSupabaseCredentials,
  saveSupabaseCredentials,
  testLiveSupabaseConnection
} from '../services/supabase';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigUpdated: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  onConfigUpdated
}) => {
  const current = getSupabaseCredentials();
  const [url, setUrl] = useState(current.url);
  const [anonKey, setAnonKey] = useState(current.anonKey);
  const [mode, setMode] = useState<'live' | 'mock'>(current.mode);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleTest = async () => {
    if (!url || !anonKey) {
      setTestResult({ success: false, message: 'Please enter both the Supabase URL and Anon Key.' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const res = await testLiveSupabaseConnection(url.trim(), anonKey.trim());
    setTesting(false);
    setTestResult(res);
  };

  const handleSave = () => {
    saveSupabaseCredentials(url.trim(), anonKey.trim(), mode);
    onConfigUpdated();
    onClose();
  };

  const handleCopySqlNotice = () => {
    setCopied(true);
    navigator.clipboard.writeText('-- Run the entire file in supabase/schema.sql inside your Supabase SQL Editor');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Database size={18} color="#3b82f6" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800 }}>Supabase Cloud Database Settings</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cloud PostgreSQL + Row Level Security + Automated Triggers</p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-secondary btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          {/* Mode Selector */}
          <div style={{
            background: 'rgba(0, 0, 0, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem',
            border: '1px solid var(--border-light)',
            marginBottom: '1.25rem'
          }}>
            <label className="form-label" style={{ marginBottom: '0.5rem' }}>Operating Mode</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div
                onClick={() => setMode('live')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${mode === 'live' ? 'var(--primary)' : 'var(--border-light)'}`,
                  background: mode === 'live' ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
                  <span>Live Supabase Cloud</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Queries PostgreSQL tables, views, and executes PL/pgSQL RPC transactions.
                </p>
              </div>

              <div
                onClick={() => setMode('mock')}
                style={{
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  border: `1px solid ${mode === 'mock' ? 'var(--accent-gold)' : 'var(--border-light)'}`,
                  background: mode === 'mock' ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
                  <span>Standby Mock DB</span>
                </div>
                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Zero-config fallback for offline demo or defense stress test without cloud lag.
                </p>
              </div>
            </div>
          </div>

          {/* Connection URL & Anon Key */}
          <div className="form-group">
            <label className="form-label">Project URL (VITE_SUPABASE_URL)</label>
            <input
              type="text"
              className="form-control"
              placeholder="https://your-project.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anon / Public API Key (VITE_SUPABASE_ANON_KEY)</label>
            <input
              type="password"
              className="form-control"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={anonKey}
              onChange={(e) => setAnonKey(e.target.value)}
            />
          </div>

          {/* Test connection output */}
          {testResult && (
            <div style={{
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${testResult.success ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)'}`,
              background: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              marginBottom: '1rem',
              fontSize: '0.82rem'
            }}>
              {testResult.success ? (
                <CheckCircle size={16} color="#10b981" />
              ) : (
                <AlertCircle size={16} color="#ef4444" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* Instructions Box */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem',
            fontSize: '0.78rem'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ fontWeight: 700, color: '#93c5fd' }}>SQL Setup in 1-Click:</span>
              <button onClick={handleCopySqlNotice} className="btn btn-secondary btn-sm" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                <Copy size={12} /> {copied ? 'Copied Notice' : 'Copy SQL Path'}
              </button>
            </div>
            <p style={{ color: 'var(--text-muted)' }}>
              1. Open your Supabase Dashboard &rarr; SQL Editor.<br />
              2. Paste the contents of <code style={{ color: '#38bdf8' }}>supabase/schema.sql</code> and click <strong>Run</strong>.<br />
              3. Retrieve your API keys from <strong>Project Settings &rarr; API</strong> and paste them above.
            </p>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleTest}
            disabled={testing}
          >
            {testing ? 'Testing Query...' : 'Test Connection'}
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSave}
          >
            Save & Apply Settings
          </button>
        </div>
      </div>
    </div>
  );
};
