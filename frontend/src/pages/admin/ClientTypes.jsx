import React, { useState, useEffect } from 'react';
import axios from 'axios';

const EMPTY_FORM = {
  name: '', description: '', positioning_notes: '',
  key_pain_points: '', recommended_services: '', example_companies: ''
};

const FIELD_LABELS = {
  description: 'Description',
  positioning_notes: 'Positioning Notes',
  key_pain_points: 'Key Pain Points',
  recommended_services: 'Recommended Services',
  example_companies: 'Example Companies',
};

function ClientTypeModal({ initial, onClose, onSave }) {
  const [form, setForm] = useState(initial ? { ...initial } : EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (initial?.id) {
        res = await axios.put(`/api/client-types/${initial.id}`, form);
      } else {
        res = await axios.post('/api/client-types', form);
      }
      onSave(res.data);
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{initial?.id ? 'Edit Client Type' : 'Add Client Type'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Type Name *</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
                placeholder="e.g. POD Enterprise"
              />
            </div>
            {Object.entries(FIELD_LABELS).map(([key, label]) => (
              <div key={key} className="form-group">
                <label className="form-label">{label}</label>
                <textarea
                  className="form-textarea"
                  rows={key === 'description' ? 2 : 3}
                  value={form[key] || ''}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  placeholder={
                    key === 'description' ? 'Who they are and what they do...' :
                    key === 'positioning_notes' ? 'How to position Design Musketeer for this client type...' :
                    key === 'key_pain_points' ? 'Common problems and challenges...' :
                    key === 'recommended_services' ? 'e.g. POD Subscription, General Subscription' :
                    'e.g. ShineOn, WeScale, typical companies'
                  }
                />
              </div>
            ))}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving...</> : 'Save Client Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ClientTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editType, setEditType] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { fetchTypes(); }, []);

  async function fetchTypes() {
    setLoading(true);
    const res = await axios.get('/api/client-types');
    setTypes(res.data);
    setLoading(false);
  }

  async function deleteType(id) {
    if (!window.confirm('Delete this client type?')) return;
    await axios.delete(`/api/client-types/${id}`);
    setTypes(t => t.filter(ct => ct.id !== id));
  }

  function handleSave(saved) {
    if (editType?.id) {
      setTypes(t => t.map(ct => ct.id === saved.id ? saved : ct));
    } else {
      setTypes(t => [...t, saved]);
    }
    setShowModal(false);
    setEditType(null);
  }

  if (loading) return (
    <div className="page-container">
      <div className="loading-state"><div className="spinner spinner-lg"></div><span>Loading...</span></div>
    </div>
  );

  return (
    <div className="page-container">
      <style>{`
        @media (max-width: 600px) {
          .client-types-header {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 12px !important;
          }
          .client-types-header .btn {
            width: 100%;
          }
          .client-type-row-actions {
            flex-wrap: wrap;
          }
        }
      `}</style>
      <div className="page-header client-types-header">
        <div>
          <h1 className="page-title">Client Types</h1>
          <p className="page-subtitle">Define how to position Design Musketeer for each type of client. Claude reads these when generating presentations.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditType(null); setShowModal(true); }}>+ Add Client Type</button>
      </div>

      {types.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🏷️</div>
          <div className="empty-state-title">No client types yet</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Client Type</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {types.map(ct => (
            <div key={ct.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '14px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => setExpanded(e => ({ ...e, [ct.id]: !e[ct.id] }))}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{ct.name}</div>
                  {ct.description && (
                    <div style={{ fontSize: 12, color: 'var(--color-gray-text)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 500 }}>
                      {ct.description}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setEditType(ct); setShowModal(true); }}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); deleteType(ct.id); }}>Delete</button>
                  <span style={{ color: 'var(--color-gray-text)', fontSize: 14 }}>{expanded[ct.id] ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded[ct.id] && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-gray-border)', background: 'var(--color-gray-bg)' }}>
                  <div style={{ paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {Object.entries(FIELD_LABELS).map(([key, label]) => ct[key] ? (
                      <div key={key} style={key === 'description' ? { gridColumn: '1 / -1' } : {}}>
                        <div className="info-label">{label}</div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 4, whiteSpace: 'pre-wrap' }}>{ct[key]}</div>
                      </div>
                    ) : null)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ClientTypeModal
          initial={editType}
          onClose={() => { setShowModal(false); setEditType(null); }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

export default ClientTypes;
