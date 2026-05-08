import React, { useState, useEffect } from 'react';
import axios from 'axios';

const INITIAL_FORM = {
  name: '', track: 'subscription', description: '',
  pricing_tier_1: '', pricing_tier_2: '', pricing_tier_3: '',
  pricing_custom: false, deliverables: ''
};

function ServiceModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial ? {
    ...initial,
    deliverables: Array.isArray(initial.deliverables)
      ? initial.deliverables.join('\n')
      : (typeof initial.deliverables === 'string' ? (() => {
        try { return JSON.parse(initial.deliverables).join('\n'); } catch { return initial.deliverables; }
      })() : ''),
    pricing_custom: !!initial.pricing_custom
  } : INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      deliverables: form.deliverables.split('\n').map(s => s.trim()).filter(Boolean)
    };
    try {
      let res;
      if (initial && initial.id) {
        res = await axios.put(`/api/services/${initial.id}`, payload);
      } else {
        res = await axios.post('/api/services', payload);
      }
      onSave(res.data);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initial?.id ? 'Edit Service' : 'Add Service'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Service Name *</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} required placeholder="General Subscription" />
              </div>
              <div className="form-group">
                <label className="form-label">Track *</label>
                <select className="form-select" name="track" value={form.track} onChange={handleChange}>
                  <option value="subscription">Subscription</option>
                  <option value="project">Project</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" rows={2} name="description" value={form.description} onChange={handleChange} placeholder="Brief description of the service..." />
            </div>
            <div className="form-group">
              <label className="form-label">Tier 1 Pricing</label>
              <input className="form-input" name="pricing_tier_1" value={form.pricing_tier_1} onChange={handleChange} placeholder="Essential — $1,499/mo · 70 hrs/mo..." />
            </div>
            <div className="form-group">
              <label className="form-label">Tier 2 Pricing</label>
              <input className="form-input" name="pricing_tier_2" value={form.pricing_tier_2} onChange={handleChange} placeholder="Standard — $2,499/mo..." />
            </div>
            <div className="form-group">
              <label className="form-label">Tier 3 Pricing</label>
              <input className="form-input" name="pricing_tier_3" value={form.pricing_tier_3} onChange={handleChange} placeholder="Ultimate — $4,999/mo..." />
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" name="pricing_custom" checked={form.pricing_custom} onChange={handleChange} />
                <span className="form-label" style={{ marginBottom: 0 }}>Custom pricing (project-based)</span>
              </label>
            </div>
            <div className="form-group">
              <label className="form-label">Deliverables (one per line)</label>
              <textarea className="form-textarea" rows={5} name="deliverables" value={form.deliverables} onChange={handleChange} placeholder="Branding&#10;Design&#10;Web&#10;Development..." />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving...</> : 'Save Service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editService, setEditService] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  async function fetchServices() {
    setLoading(true);
    const res = await axios.get('/api/services');
    setServices(res.data.map(s => ({
      ...s,
      deliverables: (() => {
        try { return JSON.parse(s.deliverables); } catch { return s.deliverables || []; }
      })()
    })));
    setLoading(false);
  }

  async function deleteService(id) {
    if (!window.confirm('Delete this service?')) return;
    await axios.delete(`/api/services/${id}`);
    setServices(ss => ss.filter(s => s.id !== id));
  }

  function handleSave(saved) {
    const parsed = { ...saved, deliverables: (() => { try { return JSON.parse(saved.deliverables); } catch { return saved.deliverables || []; } })() };
    if (editService?.id) {
      setServices(ss => ss.map(s => s.id === parsed.id ? parsed : s));
    } else {
      setServices(ss => [...ss, parsed]);
    }
    setShowModal(false);
    setEditService(null);
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state"><div className="spinner spinner-lg"></div><span>Loading services...</span></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Services</h1>
          <p className="page-subtitle">{services.length} service{services.length !== 1 ? 's' : ''} configured.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditService(null); setShowModal(true); }}>+ Add Service</button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Track</th>
              <th>Tier 1</th>
              <th>Deliverables</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {services.map(s => (
              <tr key={s.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{s.name}</div>
                  {s.description && <div style={{ fontSize: 12, color: 'var(--color-gray-text)', marginTop: 2 }}>{s.description}</div>}
                </td>
                <td>
                  <span className={`badge badge-${s.track}`}>{s.track}</span>
                </td>
                <td style={{ fontSize: 12.5, maxWidth: 200 }}>{s.pricing_tier_1 || '—'}</td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(Array.isArray(s.deliverables) ? s.deliverables : []).slice(0, 3).map((d, i) => (
                      <span key={i} className="tag">{d}</span>
                    ))}
                    {Array.isArray(s.deliverables) && s.deliverables.length > 3 && (
                      <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>+{s.deliverables.length - 3} more</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="btn btn-secondary btn-sm" onClick={() => { setEditService(s); setShowModal(true); }}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => deleteService(s.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <ServiceModal
          onClose={() => { setShowModal(false); setEditService(null); }}
          onSave={handleSave}
          initial={editService}
        />
      )}
    </div>
  );
}

export default Services;
