import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

function PartnerBrands() {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editBrand, setEditBrand] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', industry_tag: '', nda: false });
  const fileRef = useRef();

  useEffect(() => { fetchBrands(); }, []);

  async function fetchBrands() {
    setLoading(true);
    const res = await axios.get('/api/partner-brands');
    setBrands(res.data);
    setLoading(false);
  }

  function openAdd() {
    setEditBrand(null);
    setForm({ name: '', industry_tag: '', nda: false });
    setShowForm(true);
  }

  function openEdit(brand) {
    setEditBrand(brand);
    setForm({ name: brand.name, industry_tag: brand.industry_tag || '', nda: !!brand.nda });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditBrand(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('industry_tag', form.industry_tag);
      fd.append('nda', form.nda ? 'true' : 'false');
      if (fileRef.current?.files?.[0]) fd.append('logo', fileRef.current.files[0]);

      let res;
      if (editBrand) {
        res = await axios.put(`/api/partner-brands/${editBrand.id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setBrands(b => b.map(br => br.id === editBrand.id ? res.data : br));
      } else {
        res = await axios.post('/api/partner-brands', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        setBrands(b => [...b, res.data]);
      }
      closeForm();
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this partner brand?')) return;
    await axios.delete(`/api/partner-brands/${id}`);
    setBrands(b => b.filter(br => br.id !== id));
  }

  if (loading) return (
    <div className="page-container">
      <div className="loading-state"><div className="spinner spinner-lg"></div><span>Loading...</span></div>
    </div>
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Partner Brands</h1>
          <p className="page-subtitle">{brands.length} partner brand{brands.length !== 1 ? 's' : ''} in your library.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>+ Add Partner Brand</button>
      </div>

      {brands.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🤝</div>
          <div className="empty-state-title">No partner brands yet</div>
          <div className="empty-state-text">Add brands to show in the "Trusted by" section of your Proof slide.</div>
          <button className="btn btn-primary" onClick={openAdd}>Add Partner Brand</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {brands.map(brand => (
            <div key={brand.id} className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 80, background: 'var(--color-gray-bg)', borderRadius: 6, overflow: 'hidden' }}>
                {brand.logo_path ? (
                  <img
                    src={`${API_BASE}${brand.logo_path}`}
                    alt={brand.name}
                    style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ fontSize: 32, color: 'var(--color-gray-text)' }}>🤝</span>
                )}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{brand.name}</div>
                {brand.industry_tag && <div style={{ fontSize: 12, color: 'var(--color-gray-text)', marginTop: 2 }}>{brand.industry_tag}</div>}
                {brand.nda === 1 && <span className="badge badge-nda" style={{ marginTop: 4, display: 'inline-block' }}>NDA</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEdit(brand)}>Edit</button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => handleDelete(brand.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={closeForm}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editBrand ? 'Edit Partner Brand' : 'Add Partner Brand'}</h2>
              <button className="modal-close" onClick={closeForm}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Brand Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="e.g. Printify, Gooten, Gelato" />
                </div>
                <div className="form-group">
                  <label className="form-label">Industry Tag</label>
                  <input className="form-input" value={form.industry_tag} onChange={e => setForm(f => ({ ...f, industry_tag: e.target.value }))} placeholder="POD Platform, E-commerce..." />
                </div>
                <div className="form-group">
                  <label className="form-label">Logo</label>
                  <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.gif,.webp,.svg" style={{ fontSize: 13 }} />
                  {editBrand?.logo_path && !fileRef.current?.files?.[0] && (
                    <div style={{ marginTop: 8 }}>
                      <img src={`${API_BASE}${editBrand.logo_path}`} alt="current" style={{ height: 48, objectFit: 'contain' }} />
                      <div style={{ fontSize: 11, color: 'var(--color-gray-text)', marginTop: 2 }}>Current logo — upload new to replace</div>
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input type="checkbox" checked={form.nda} onChange={e => setForm(f => ({ ...f, nda: e.target.checked }))} style={{ width: 16, height: 16 }} />
                    <span className="form-label" style={{ marginBottom: 0 }}>NDA — hide logo when brand names are anonymized</span>
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeForm}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><span className="spinner"></span> Saving...</> : 'Save Brand'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default PartnerBrands;
