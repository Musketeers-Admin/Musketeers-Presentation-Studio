import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [connected, setConnected] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkStatus();
  }, []);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await axios.get('/api/settings/api-key-status');
      setConnected(res.data.connected);
    } catch {}
    setLoading(false);
  }

  async function handleSave() {
    if (!apiKey.trim()) return;
    setSaving(true);
    setSaved(false);
    try {
      await axios.put('/api/settings', { key: 'anthropic_api_key', value: apiKey.trim() });
      setSaved(true);
      setApiKey('');
      await checkStatus();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
    setSaving(false);
  }

  async function handleClear() {
    if (!window.confirm('Remove the saved API key? The app will fall back to the .env file.')) return;
    await axios.put('/api/settings', { key: 'anthropic_api_key', value: '' });
    setConnected(false);
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Configure API keys and application preferences.</p>
        </div>
      </div>

      {/* API Key Card */}
      <div className="card" style={{ maxWidth: 580 }}>
        <div className="card-title">Claude API Key</div>
        <p style={{ fontSize: 13.5, color: 'var(--color-gray-text)', marginBottom: 20, lineHeight: 1.6 }}>
          The API key is used to generate slide content with Claude. It's stored securely in the local SQLite database.
          If a key is saved here, it takes priority over the <code>.env</code> file.
        </p>

        {/* Status indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '10px 14px', borderRadius: 6, background: connected ? '#F0FDF4' : '#FEF2F2', border: `1px solid ${connected ? '#BBF7D0' : '#FECACA'}` }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--color-green)' : 'var(--color-red)', flexShrink: 0 }} />
          <div style={{ fontSize: 13.5, fontWeight: 600, color: connected ? '#166534' : '#991B1B' }}>
            {loading ? 'Checking...' : connected ? 'Connected — API key is saved and active' : 'Not connected — paste your key below'}
          </div>
        </div>

        {/* Key input */}
        <div className="form-group" style={{ marginBottom: 16 }}>
          <label className="form-label">Claude API Key</label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-api03-..."
              style={{ flex: 1, fontFamily: 'monospace', fontSize: 13 }}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
            <button
              className="btn btn-secondary"
              onClick={() => setShowKey(v => !v)}
              style={{ flexShrink: 0 }}
              title={showKey ? 'Hide' : 'Show'}
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
          <div style={{ fontSize: 12, color: 'var(--color-gray-text)', marginTop: 6 }}>
            Get your key at <strong>console.anthropic.com</strong>. It starts with <code>sk-ant-</code>.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
          >
            {saving ? <><span className="spinner"></span> Saving...</> : 'Save API Key'}
          </button>
          {connected && (
            <button className="btn btn-danger btn-sm" onClick={handleClear}>
              Remove Key
            </button>
          )}
          {saved && (
            <span style={{ fontSize: 13, color: 'var(--color-green)', fontWeight: 600 }}>
              ✓ Saved successfully
            </span>
          )}
        </div>
      </div>

      {/* Info card */}
      <div className="card" style={{ maxWidth: 580, marginTop: 20 }}>
        <div className="card-title">How the API key is used</div>
        <ul style={{ fontSize: 13.5, color: 'var(--color-gray-text)', lineHeight: 1.8, paddingLeft: 20 }}>
          <li>When you generate a presentation, Claude writes the slide content.</li>
          <li>The key is stored locally in your SQLite database — never sent anywhere else.</li>
          <li>You are billed by Anthropic based on your usage (tokens consumed per generation).</li>
          <li>A typical presentation generation uses ~3,000–8,000 output tokens.</li>
        </ul>
      </div>
    </div>
  );
}

export default Settings;
