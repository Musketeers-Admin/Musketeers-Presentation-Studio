import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const MEETING_TYPES = [
  { id: 'M1', label: 'M1', desc: 'First touch. Intro meeting. No pitch.' },
  { id: 'M2', label: 'M2', desc: 'Discovery. Learn their world. Ask questions.' },
  { id: 'M2+M3', label: 'M2+M3', desc: 'Combined. Discover and pitch in one meeting.' },
  { id: 'M3', label: 'M3', desc: 'Pitch. Make the case for a specific service.' },
  { id: 'M4', label: 'M4', desc: 'Proposal. Scope, timeline, and investment.' },
  { id: 'M5', label: 'M5', desc: 'Onboarding. They signed. Set them up for success.' },
];

const CLIENT_TYPES = [
  'POD Seller', 'POD Enterprise', 'E-commerce brand',
  'SaaS / Tech', 'Agency', 'Creator / Influencer', 'Other'
];

const SERVICE_REQUIRED_TYPES = ['M2', 'M3', 'M2+M3'];

const INITIAL_CLIENT_FORM = {
  full_name: '', company_name: '', role: '', website_url: '',
  linkedin_url: '', industry: '', location: '', email: '', notes: '', client_type: ''
};

function getMeetingBadgeClass(type) {
  const map = {
    'M1': 'badge-m1', 'M2': 'badge-m2', 'M3': 'badge-m3',
    'M2+M3': 'badge-m2m3', 'M4': 'badge-m4', 'M5': 'badge-m5'
  };
  return map[type] || 'badge-m1';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Step1({ state, updateState, prefilledClientId, onNext, onBack }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [allClients, setAllClients] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [newClientForm, setNewClientForm] = useState(INITIAL_CLIENT_FORM);
  const [savingClient, setSavingClient] = useState(false);
  const [services, setServices] = useState([]);
  const [clientHistory, setClientHistory] = useState([]);
  const dropdownRef = useRef(null);

  useEffect(() => {
    axios.get('/api/services').then(r => setServices(r.data));
    axios.get('/api/clients').then(r => setAllClients(r.data));
    if (prefilledClientId) {
      axios.get(`/api/clients/${prefilledClientId}`).then(r => {
        const data = r.data;
        updateState({ client: data });
        setClientHistory(data.meetings || []);
        if (data.preferred_service && !state.servicePitched) {
          updateState({ servicePitched: data.preferred_service });
        }
      });
    }
  }, [prefilledClientId]);

  // When meeting type changes to M4/M5, pre-fill service from preferred_service if empty
  useEffect(() => {
    if (['M4', 'M5'].includes(state.meetingType) && !state.servicePitched && state.client?.preferred_service) {
      updateState({ servicePitched: state.client.preferred_service });
    }
  }, [state.meetingType]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDropdown]);

  // Filter clients in memory
  const filteredClients = searchQuery.trim().length > 0
    ? allClients.filter(c =>
        (c.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.email || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : allClients;

  async function selectClient(client) {
    setSearchQuery('');
    setShowDropdown(false);
    const res = await axios.get(`/api/clients/${client.id}`);
    const data = res.data;
    updateState({ client: data });
    setClientHistory(data.meetings || []);
    if (data.preferred_service) {
      updateState({ servicePitched: data.preferred_service });
    }
  }

  function clearClient() {
    updateState({ client: null, servicePitched: '' });
    setClientHistory([]);
    setSearchQuery('');
  }

  async function handleCreateClient(e) {
    e.preventDefault();
    if (!newClientForm.client_type) {
      alert('Please select a Client Type before creating.');
      return;
    }
    setSavingClient(true);
    try {
      const res = await axios.post('/api/clients', newClientForm);
      const data = res.data;
      updateState({ client: data });
      setClientHistory([]);
      setShowNewClientForm(false);
      setNewClientForm(INITIAL_CLIENT_FORM);
      axios.get('/api/clients').then(r => setAllClients(r.data));
    } catch (err) {
      alert('Error creating client: ' + err.message);
    }
    setSavingClient(false);
  }

  function isServiceRequired() {
    return SERVICE_REQUIRED_TYPES.includes(state.meetingType);
  }

  function canProceed() {
    if (!state.client || !state.meetingType || !state.meetingDate) return false;
    if (isServiceRequired() && !state.servicePitched) return false;
    return true;
  }

  const isM5 = state.meetingType === 'M5';

  return (
    <div>
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Client Selection</div>

        {state.client ? (
          <div>
            <div className="selected-client-card">
              <div className="selected-client-info">
                <div className="selected-client-name">{state.client.full_name}</div>
                <div className="selected-client-company">{state.client.company_name || state.client.industry || 'No company'}</div>
                {state.client.client_type && (
                  <span className="tag" style={{ marginTop: 4, display: 'inline-block', fontSize: 11 }}>{state.client.client_type}</span>
                )}
              </div>
              <button className="btn btn-secondary btn-sm" onClick={clearClient}>Change</button>
            </div>
            {clientHistory.length > 0 && (
              <div className="alert alert-blue">
                <div className="alert-title">Previous Meeting History</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                  {clientHistory.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`badge ${getMeetingBadgeClass(m.meeting_type)}`}>{m.meeting_type}</span>
                      <span style={{ fontSize: 12 }}>{formatDate(m.meeting_date)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ position: 'relative', marginBottom: 12 }} ref={dropdownRef}>
              <div className="search-bar">
                <span className="search-bar-icon">🔍</span>
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search clients by name, company, or email..."
                  onFocus={() => setShowDropdown(true)}
                />
              </div>
              {showDropdown && (
                <div className="search-dropdown">
                  {filteredClients.length > 0 ? (
                    filteredClients.map(c => (
                      <div key={c.id} className="search-dropdown-item" onClick={() => selectClient(c)}>
                        <div className="search-dropdown-name">{c.full_name}</div>
                        <div className="search-dropdown-company">{c.company_name || c.industry || 'No company'}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '14px 16px', color: 'var(--color-gray-text)', fontSize: 13.5 }}>
                      No clients found.{' '}
                      <button
                        style={{ background: 'none', border: 'none', color: 'var(--color-blue)', fontWeight: 600, cursor: 'pointer', fontSize: 13.5 }}
                        onClick={() => { setShowDropdown(false); setShowNewClientForm(true); }}
                      >
                        Add new client?
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setShowNewClientForm(f => !f)}
            >
              {showNewClientForm ? '— Cancel' : '+ Add New Lead'}
            </button>

            {showNewClientForm && (
              <form onSubmit={handleCreateClient} style={{ marginTop: 16, padding: 16, background: 'var(--color-gray-bg)', borderRadius: 6 }}>
                <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>New Lead</div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input className="form-input" value={newClientForm.full_name}
                      onChange={e => setNewClientForm(f => ({ ...f, full_name: e.target.value }))} required placeholder="Jane Smith" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input className="form-input" value={newClientForm.company_name}
                      onChange={e => setNewClientForm(f => ({ ...f, company_name: e.target.value }))} placeholder="Acme Inc." />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Industry</label>
                    <input className="form-input" value={newClientForm.industry}
                      onChange={e => setNewClientForm(f => ({ ...f, industry: e.target.value }))} placeholder="E-commerce, SaaS..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" value={newClientForm.email}
                      onChange={e => setNewClientForm(f => ({ ...f, email: e.target.value }))} placeholder="jane@company.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Website URL</label>
                    <input className="form-input" value={newClientForm.website_url}
                      onChange={e => setNewClientForm(f => ({ ...f, website_url: e.target.value }))} placeholder="https://..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input className="form-input" value={newClientForm.location}
                      onChange={e => setNewClientForm(f => ({ ...f, location: e.target.value }))} placeholder="New York, US" />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">
                    Client Type *
                    <span style={{ fontWeight: 400, color: 'var(--color-gray-text)', marginLeft: 6, fontSize: 12 }}>Select "Other" if unsure</span>
                  </label>
                  <select
                    className="form-input"
                    value={newClientForm.client_type}
                    onChange={e => setNewClientForm(f => ({ ...f, client_type: e.target.value }))}
                  >
                    <option value="">— Select type —</option>
                    {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <button type="submit" className="btn btn-primary btn-sm" disabled={savingClient}>
                  {savingClient ? <><span className="spinner"></span> Creating...</> : 'Create Client'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>

      {/* Meeting Type */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Meeting Type</div>
        <div className="meeting-type-grid">
          {MEETING_TYPES.map(mt => (
            <div
              key={mt.id}
              className={`meeting-type-card${state.meetingType === mt.id ? ' selected' : ''}`}
              onClick={() => updateState({ meetingType: mt.id })}
            >
              <div className="meeting-type-label">{mt.label}</div>
              <div className="meeting-type-desc">{mt.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Meeting Details */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Meeting Details</div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Meeting Date *</label>
            <input
              type="date"
              className="form-input"
              value={state.meetingDate}
              onChange={e => updateState({ meetingDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">
              Service to Pitch
              {state.meetingType === 'M1' && (
                <span style={{ fontWeight: 400, color: 'var(--color-gray-text)', marginLeft: 6, fontSize: 12 }}>(optional)</span>
              )}
              {isServiceRequired() && (
                <span style={{ color: 'var(--color-red)', marginLeft: 2 }}>*</span>
              )}
              {isM5 && (
                <span style={{ fontWeight: 400, color: 'var(--color-gray-text)', marginLeft: 6, fontSize: 12 }}>(confirmed)</span>
              )}
            </label>
            {isM5 ? (
              <div style={{
                padding: '8px 12px',
                background: 'var(--color-gray-bg)',
                border: '1px solid var(--color-gray-border)',
                borderRadius: 6,
                fontSize: 14,
                color: state.servicePitched ? 'var(--color-black)' : 'var(--color-gray-text)',
                fontStyle: state.servicePitched ? 'normal' : 'italic'
              }}>
                {state.servicePitched || 'No service on record'}
              </div>
            ) : (
              <select
                className="form-select"
                value={state.servicePitched}
                onChange={e => updateState({ servicePitched: e.target.value })}
              >
                <option value="">— Select a service —</option>
                {services.map(s => (
                  <option key={s.id} value={s.name}>{s.name} ({s.track})</option>
                ))}
              </select>
            )}
            {isServiceRequired() && !state.servicePitched && (
              <div style={{ fontSize: 11, color: 'var(--color-red)', marginTop: 4 }}>
                Required for {state.meetingType} — select a service to continue.
              </div>
            )}
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Meeting Notes</label>
          <textarea
            className="form-textarea"
            value={state.meetingNotes}
            onChange={e => updateState({ meetingNotes: e.target.value })}
            placeholder="What happened in previous meetings? What did they say? What's the context?"
            rows={3}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Extra Context for Claude</label>
          <textarea
            className="form-textarea"
            value={state.extraContext}
            onChange={e => updateState({ extraContext: e.target.value })}
            placeholder="Additional context, specific talking points, things to emphasize or avoid..."
            rows={3}
          />
          <div className="form-hint">This helps Claude personalize the presentation content.</div>
        </div>
      </div>

      <div className="wizard-nav">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={onNext}
          disabled={!canProceed()}
        >
          Next: Slide Selection →
        </button>
      </div>
    </div>
  );
}

export default Step1;
