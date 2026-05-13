import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Login failed'); return; }
      login(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="sidebar-logo-dots" style={{ margin: '0 auto 12px', width: 28 }}>
            <div className="sidebar-logo-dot" style={{ background: '#FFD81D' }} />
            <div className="sidebar-logo-dot" style={{ background: '#FC2E12' }} />
            <div className="sidebar-logo-dot" style={{ background: '#0D41FF' }} />
            <div className="sidebar-logo-dot" style={{ background: '#30E047' }} />
          </div>
          <div className="login-brand-name">Design Musketeer</div>
          <div className="login-brand-sub">Presentation Studio</div>
        </div>

        <h1 className="login-title">Sign in</h1>

        {error && <div className="alert alert-red" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
