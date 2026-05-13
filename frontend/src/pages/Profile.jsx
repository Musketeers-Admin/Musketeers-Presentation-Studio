import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import API_BASE from '../config';

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword && newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }
    if (newPassword && newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    setSaving(true);
    try {
      const body = { name };
      if (newPassword) { body.currentPassword = currentPassword; body.newPassword = newPassword; }
      const r = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await r.json();
      if (!r.ok) { setError(data.error || 'Failed to save.'); return; }
      setSuccess('Profile updated successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      refreshUser();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Profile</h1>
          <p className="page-subtitle">{user?.email}</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 560 }}>
        {success && <div className="alert alert-green" style={{ marginBottom: 20 }}>{success}</div>}
        {error && <div className="alert alert-red" style={{ marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="card-title">Account Details</div>

          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              type="text"
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
            <p className="form-hint">Email can only be changed by an admin.</p>
          </div>

          <div className="divider" />

          <div className="card-title" style={{ marginTop: 20 }}>Change Password</div>
          <p className="form-hint" style={{ marginBottom: 16 }}>Leave blank to keep your current password.</p>

          <div className="form-group">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-input"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              placeholder="Required to change password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input
              type="password"
              className="form-input"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', border: 'none' }}>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
