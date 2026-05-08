import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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

const CLIENT_TYPES = [
  'POD Seller',
  'POD Enterprise',
  'E-commerce brand',
  'SaaS / Tech',
  'Agency',
  'Creator / Influencer',
  'Other'
];

const INITIAL_FORM = {
  full_name: '', company_name: '', role: '', website_url: '',
  linkedin_url: '', industry: '', location: '', email: '', notes: '', client_type: ''
};

function ClientModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial || INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      if (initial && initial.id) {
        const res = await axios.put(`/api/clients/${initial.id}`, form);
        onSave(res.data);
      } else {
        const res = await axios.post('/api/clients', form);
        onSave(res.data);
      }
    } catch (err) {
      alert('Error saving client: ' + err.message);
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initial && initial.id ? 'Edit Lead' : 'Add New Lead'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" name="full_name" value={form.full_name} onChange={handleChange} required placeholder="Jane Smith" />
              </div>
              <div className="form-group">
                <label className="form-label">Company Name</label>
                <input className="form-input" name="company_name" value={form.company_name} onChange={handleChange} placeholder="Acme Inc." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Role / Title</label>
                <input className="form-input" name="role" value={form.role} onChange={handleChange} placeholder="CEO, Founder..." />
              </div>
              <div className="form-group">
                <label className="form-label">Industry</label>
                <input className="form-input" name="industry" value={form.industry} onChange={handleChange} placeholder="E-commerce, SaaS..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" name="email" value={form.email} onChange={handleChange} type="email" placeholder="jane@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" name="location" value={form.location} onChange={handleChange} placeholder="New York, US" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Website URL</label>
                <input className="form-input" name="website_url" value={form.website_url} onChange={handleChange} placeholder="https://..." />
              </div>
              <div className="form-group">
                <label className="form-label">LinkedIn URL</label>
                <input className="form-input" name="linkedin_url" value={form.linkedin_url} onChange={handleChange} placeholder="https://linkedin.com/in/..." />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Client Type</label>
              <select className="form-input" name="client_type" value={form.client_type} onChange={handleChange}>
                <option value="">— Select type —</option>
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Notes</label>
              <textarea className="form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Internal notes about this client..." rows={3} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving...</> : 'Save Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editClient, setEditClient] = useState(null);

  useEffect(() => {
    fetchClients();
  }, []);

  async function fetchClients() {
    setLoading(true);
    const res = await axios.get('/api/clients');
    setClients(res.data);
    setLoading(false);
  }

  async function deleteClient(id, name) {
    if (!window.confirm(`Delete client "${name}"? This will also delete their meetings and presentations.`)) return;
    await axios.delete(`/api/clients/${id}`);
    setClients(cs => cs.filter(c => c.id !== id));
  }

  function handleSave(savedClient) {
    if (editClient && editClient.id) {
      setClients(cs => cs.map(c => c.id === savedClient.id ? { ...c, ...savedClient } : c));
    } else {
      setClients(cs => [{ ...savedClient, meeting_count: 0 }, ...cs]);
    }
    setShowModal(false);
    setEditClient(null);
  }

  const filtered = clients.filter(c => {
    const q = search.toLowerCase();
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.company_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.industry?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="page-container">
      <style>{`
        .leads-page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .leads-card-view { display: none; }
        @media (max-width: 768px) {
          .leads-table-view table thead tr th:nth-child(3),
          .leads-table-view table tbody tr td:nth-child(3) {
            display: none;
          }
        }
        @media (max-width: 600px) {
          .leads-page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }
          .leads-page-header .btn { width: 100%; }
          .leads-table-view { display: none; }
          .leads-card-view { display: flex; flex-direction: column; gap: 10px; }
        }
        .lead-card {
          background: white;
          border: 1px solid var(--color-gray-border);
          border-radius: 8px;
          padding: 14px 16px;
          cursor: pointer;
        }
        .lead-card-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
          margin-bottom: 8px;
        }
        .lead-card-name {
          font-weight: 700;
          font-size: 14px;
          color: var(--color-blue);
        }
        .lead-card-company {
          font-size: 12px;
          color: var(--color-gray-text);
          margin-top: 2px;
        }
        .lead-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }
        .lead-card-actions {
          display: flex;
          gap: 8px;
          border-top: 1px solid var(--color-gray-border);
          padding-top: 10px;
        }
        .lead-card-actions .btn { flex: 1; font-size: 12px; }
      `}</style>
      <div className="page-header leads-page-header">
        <div>
          <h1 className="page-title">Leads &amp; Clients</h1>
          <p className="page-subtitle">{clients.length} lead{clients.length !== 1 ? 's' : ''} in your pipeline.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditClient(null); setShowModal(true); }}>
          + Add Lead
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 20 }}>
        <div className="search-bar" style={{ maxWidth: 400 }}>
          <span className="search-bar-icon">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search leads by name, company, email..."
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <span>Loading clients...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">👥</div>
          <div className="empty-state-title">{search ? 'No results found' : 'No leads yet'}</div>
          <div className="empty-state-text">{search ? 'Try a different search term.' : 'Add your first lead to get started.'}</div>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Lead</button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop/tablet table */}
          <div className="table-container leads-table-view">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Industry</th>
                  <th>Location</th>
                  <th>Meetings</th>
                  <th>Last Meeting</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(client => (
                  <tr key={client.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--color-blue)' }}
                          onClick={() => navigate(`/clients/${client.id}`)}>
                          {client.full_name}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 10,
                          background: client.is_client ? '#DCFCE7' : '#F3F4F6',
                          color: client.is_client ? '#166534' : '#6B7280'
                        }}>
                          {client.is_client ? 'Client' : 'Lead'}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>{client.company_name || '—'}</div>
                      {client.client_type && (
                        <span className="tag" style={{ marginTop: 3, display: 'inline-block', fontSize: 10 }}>{client.client_type}</span>
                      )}
                    </td>
                    <td>{client.industry || '—'}</td>
                    <td>{client.location || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 700 }}>{client.meeting_count || 0}</span>
                    </td>
                    <td>
                      {client.last_meeting_type ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <span className={`badge ${getMeetingBadgeClass(client.last_meeting_type)}`}>{client.last_meeting_type}</span>
                          <span style={{ fontSize: 11, color: 'var(--color-gray-text)' }}>{formatDate(client.last_meeting_date)}</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/clients/${client.id}`)}>View</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => { setEditClient(client); setShowModal(true); }}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => deleteClient(client.id, client.full_name)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile card list */}
          <div className="leads-card-view">
            {filtered.map(client => (
              <div key={client.id} className="lead-card" onClick={() => navigate(`/clients/${client.id}`)}>
                <div className="lead-card-top">
                  <div>
                    <div className="lead-card-name">{client.full_name}</div>
                    {client.company_name && <div className="lead-card-company">{client.company_name}</div>}
                  </div>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
                    background: client.is_client ? '#DCFCE7' : '#F3F4F6',
                    color: client.is_client ? '#166534' : '#6B7280',
                    flexShrink: 0
                  }}>
                    {client.is_client ? 'Client' : 'Lead'}
                  </span>
                </div>
                <div className="lead-card-meta">
                  {client.client_type && <span className="tag" style={{ fontSize: 11 }}>{client.client_type}</span>}
                  {client.industry && <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>{client.industry}</span>}
                  {client.last_meeting_type && (
                    <span className={`badge ${getMeetingBadgeClass(client.last_meeting_type)}`}>{client.last_meeting_type}</span>
                  )}
                  {client.last_meeting_date && (
                    <span style={{ fontSize: 11, color: 'var(--color-gray-text)' }}>{formatDate(client.last_meeting_date)}</span>
                  )}
                </div>
                <div className="lead-card-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/clients/${client.id}`)}>View</button>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditClient(client); setShowModal(true); }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteClient(client.id, client.full_name)}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && (
        <ClientModal
          onClose={() => { setShowModal(false); setEditClient(null); }}
          onSave={handleSave}
          initial={editClient}
        />
      )}
    </div>
  );
}

export default Clients;
