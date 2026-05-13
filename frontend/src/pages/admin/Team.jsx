import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import API_BASE from '../../config';

function UserModal({ user, onClose, onSaved }) {
  const isEdit = !!user;
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user?.role || 'member');
  const [active, setActive] = useState(user?.active !== undefined ? !!user.active : true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const body = isEdit
        ? { name, email, role, active }
        : { name, email, password, role };
      const r = await fetch(
        `${API_BASE}/api/users${isEdit ? `/${user.id}` : ''}`,
        { method: isEdit ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
      );
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Failed to save.'); return; }
      onSaved(data);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit User' : 'Add User'}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>{error}</div>}
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">Password</label>
                <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
                <p className="form-hint">At least 8 characters.</p>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="admin">Admin</option>
                  <option value="member">Member</option>
                </select>
              </div>
              {isEdit && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={active ? 'active' : 'inactive'} onChange={e => setActive(e.target.value === 'active')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ResetPasswordModal({ user, onClose }) {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const r = await fetch(`${API_BASE}/api/users/${user.id}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Failed.'); return; }
      setDone(true);
    } catch {
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 440 }}>
        <div className="modal-header">
          <span className="modal-title">Reset Password — {user.name}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        {done ? (
          <div className="modal-body">
            <div className="alert alert-green">Password reset successfully.</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {error && <div className="alert alert-red" style={{ marginBottom: 16 }}>{error}</div>}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoFocus />
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Reset Password'}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function Team() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { type: 'add'|'edit'|'reset', user? }

  useEffect(() => {
    fetch(`${API_BASE}/api/users`)
      .then(r => r.json())
      .then(setUsers)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name}? This cannot be undone.`)) return;
    const r = await fetch(`${API_BASE}/api/users/${u.id}`, { method: 'DELETE' });
    const data = await r.json();
    if (!r.ok) { alert(data.error); return; }
    setUsers(prev => prev.filter(x => x.id !== u.id));
  };

  const handleSaved = (saved) => {
    setUsers(prev => {
      const exists = prev.find(u => u.id === saved.id);
      return exists ? prev.map(u => u.id === saved.id ? saved : u) : [...prev, saved];
    });
    setModal(null);
  };

  const fmt = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Team</h1>
          <p className="page-subtitle">Manage who has access to Presentation Studio.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ type: 'add' })}>+ Add User</button>
      </div>

      {loading ? (
        <div className="loading-state"><div className="spinner spinner-lg" /></div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Joined</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>
                    {u.name}
                    {u.id === currentUser?.id && <span className="badge badge-m2" style={{ marginLeft: 8, fontSize: 10 }}>You</span>}
                  </td>
                  <td style={{ color: 'var(--color-gray-text)' }}>{u.email}</td>
                  <td>
                    <span className={`badge ${u.role === 'admin' ? 'badge-m3' : 'badge-m1'}`}>{u.role}</span>
                  </td>
                  <td>
                    <span className={`badge ${u.active ? 'badge-m4' : 'badge-m1'}`}>{u.active ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td style={{ color: 'var(--color-gray-text)', fontSize: 13 }}>{fmt(u.last_login)}</td>
                  <td style={{ color: 'var(--color-gray-text)', fontSize: 13 }}>{fmt(u.created_at)}</td>
                  <td>
                    <div className="table-actions">
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'reset', user: u })}>Reset PW</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => setModal({ type: 'edit', user: u })}>Edit</button>
                      {u.id !== currentUser?.id && (
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(u)}>Delete</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.type === 'add' && (
        <UserModal onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'edit' && (
        <UserModal user={modal.user} onClose={() => setModal(null)} onSaved={handleSaved} />
      )}
      {modal?.type === 'reset' && (
        <ResetPasswordModal user={modal.user} onClose={() => setModal(null)} />
      )}
    </div>
  );
}
