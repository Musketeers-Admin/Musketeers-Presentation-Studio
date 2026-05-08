import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const INITIAL_FORM = {
  title: '', client_name: '', industry: '', service_type: '', client_type_tag: '',
  situation: '', problem: '', solution: '', result: '', metrics: '', testimonial: '',
  nda: false, duration: '', relationship_status: 'Active'
};

const CS_SECTIONS = ['situation', 'problem', 'solution', 'result', 'metrics'];
const SECTION_LABELS = {
  situation: 'Situation', problem: 'Problem', solution: 'Solution', result: 'Result', metrics: 'Metrics'
};

function StatusBadge({ status }) {
  const isActive = !status || status === 'Active';
  return (
    <span style={{
      fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 600, display: 'inline-block',
      background: isActive ? '#DCFCE7' : '#F3F4F6',
      color: isActive ? '#166534' : '#6B7280'
    }}>
      {status || 'Active'}
    </span>
  );
}

// Handles image display and upload for a single section.
// Edit mode (caseStudyId provided): uploads directly to API.
// Add mode (no caseStudyId): stores pending images in parent state via callbacks.
function SectionImages({ caseStudyId, section, images, onImageAdded, onImageDeleted, pendingImgs, onPendingAdd, onPendingRemove }) {
  const isEdit = !!caseStudyId;
  const [showUpload, setShowUpload] = useState(false);
  const [desc, setDesc] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const sectionImages = (images || []).filter(img => img.section === section)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  const pendingSection = (pendingImgs || []).filter(p => p.section === section);

  async function handleEditUpload() {
    if (!fileRef.current?.files?.[0]) { alert('Please select a file.'); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', fileRef.current.files[0]);
      fd.append('description', desc);
      fd.append('section', section);
      const res = await axios.post(`/api/case-studies/${caseStudyId}/images`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onImageAdded(res.data);
      setDesc('');
      setShowUpload(false);
      if (fileRef.current) fileRef.current.value = '';
    } catch (err) { alert('Upload error: ' + err.message); }
    setUploading(false);
  }

  function handleAddPending() {
    if (!fileRef.current?.files?.[0]) { alert('Please select a file.'); return; }
    const file = fileRef.current.files[0];
    const previewUrl = URL.createObjectURL(file);
    onPendingAdd({ section, file, description: desc, previewUrl, key: Date.now() + Math.random() });
    setDesc('');
    setShowUpload(false);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleDelete(imgId) {
    if (!window.confirm('Remove this image?')) return;
    await axios.delete(`/api/case-studies/${caseStudyId}/images/${imgId}`);
    onImageDeleted(imgId);
  }

  const displayImages = isEdit ? sectionImages : pendingSection;
  const hasImages = displayImages.length > 0;

  return (
    <div style={{ marginTop: 8, padding: '10px 12px', background: 'var(--color-gray-bg)', borderRadius: 6, border: '1px solid var(--color-gray-border)' }}>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gray-text)', marginBottom: hasImages ? 8 : 0 }}>
        Images for this section
      </div>

      {hasImages && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 8 }}>
          {displayImages.map(img => (
            <div key={isEdit ? img.id : img.key} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'white', borderRadius: 4, padding: '6px 8px', border: '1px solid var(--color-gray-border)' }}>
              <img
                src={isEdit ? `http://localhost:3001${img.image_path}` : img.previewUrl}
                alt={img.description || section}
                style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }}
              />
              <div style={{ flex: 1, fontSize: 12, color: 'var(--color-gray-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {img.description || <span style={{ fontStyle: 'italic' }}>No description</span>}
              </div>
              <button
                type="button"
                onClick={() => isEdit ? handleDelete(img.id) : onPendingRemove(img.key)}
                style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--color-red)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                title="Remove"
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {showUpload ? (
        <div>
          <div style={{ marginBottom: 6 }}>
            <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" style={{ fontSize: 11, display: 'block', width: '100%' }} />
          </div>
          <input
            className="form-input"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="What does this image show?"
            style={{ fontSize: 11, marginBottom: 6 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button type="button" className="btn btn-primary btn-sm" disabled={uploading} style={{ fontSize: 11 }}
              onClick={isEdit ? handleEditUpload : handleAddPending}>
              {uploading ? 'Uploading...' : 'Save image'}
            </button>
            <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }}
              onClick={() => { setShowUpload(false); setDesc(''); }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-secondary btn-sm" style={{ fontSize: 11 }} onClick={() => setShowUpload(true)}>
          + Add image to this section
        </button>
      )}
    </div>
  );
}

function CaseStudyModal({ onClose, onSave, initial }) {
  const [form, setForm] = useState(initial
    ? { ...INITIAL_FORM, ...initial, nda: !!initial.nda, duration: initial.duration || '', relationship_status: initial.relationship_status || 'Active' }
    : INITIAL_FORM
  );
  const [saving, setSaving] = useState(false);
  const [images, setImages] = useState(initial?.images || []);
  const [pendingImages, setPendingImages] = useState([]);
  const isEdit = !!initial?.id;

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      let res;
      if (isEdit) {
        res = await axios.put(`/api/case-studies/${initial.id}`, form);
      } else {
        res = await axios.post('/api/case-studies', form);
      }
      const savedCS = res.data;

      // Upload pending images after creating new case study
      if (!isEdit && pendingImages.length > 0) {
        const uploadedImages = [];
        for (const img of pendingImages) {
          try {
            const fd = new FormData();
            fd.append('image', img.file);
            fd.append('description', img.description || '');
            fd.append('section', img.section);
            const imgRes = await axios.post(`/api/case-studies/${savedCS.id}/images`, fd, {
              headers: { 'Content-Type': 'multipart/form-data' }
            });
            uploadedImages.push(imgRes.data);
          } catch (err) {
            console.error('Image upload error:', err);
          }
        }
        savedCS.images = uploadedImages;
      }

      onSave({ ...savedCS, images: isEdit ? images : (savedCS.images || []) });
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 740 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? 'Edit Case Study' : 'Add Case Study'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Row 1: Title + Client Name */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" name="title" value={form.title} onChange={handleChange} required
                  placeholder="e.g. From 5-day proof cycle to 24-hour delivery" />
              </div>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input className="form-input" name="client_name" value={form.client_name} onChange={handleChange}
                  placeholder="WeScale, TopShelf..." />
              </div>
            </div>

            {/* Row 2: Duration + Status */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input className="form-input" name="duration" value={form.duration} onChange={handleChange}
                  placeholder="e.g. 6-7 years, 15 months, Ongoing" />
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select className="form-input" name="relationship_status" value={form.relationship_status} onChange={handleChange}>
                  <option value="Active">Active</option>
                  <option value="Concluded">Concluded</option>
                </select>
              </div>
            </div>

            {/* Row 3: Industry + Service Type */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Industry</label>
                <input className="form-input" name="industry" value={form.industry} onChange={handleChange}
                  placeholder="E-commerce, Print on Demand..." />
              </div>
              <div className="form-group">
                <label className="form-label">Service Type</label>
                <input className="form-input" name="service_type" value={form.service_type} onChange={handleChange}
                  placeholder="General Subscription, POD..." />
              </div>
            </div>

            {/* Row 4: Client Type Tag + NDA */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client Type Tag</label>
                <input className="form-input" name="client_type_tag" value={form.client_type_tag} onChange={handleChange}
                  placeholder="DTC, SaaS, POD Platform..." />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 4 }}>
                  <input type="checkbox" name="nda" checked={form.nda} onChange={handleChange} style={{ width: 16, height: 16 }} />
                  <span className="form-label" style={{ marginBottom: 0 }}>NDA — anonymize client name</span>
                </label>
              </div>
            </div>

            {/* Section fields with inline image upload */}
            {CS_SECTIONS.map(field => (
              <div key={field} className="form-group">
                <label className="form-label" style={{ textTransform: 'capitalize' }}>{SECTION_LABELS[field]}</label>
                {field === 'metrics' ? (
                  <input className="form-input" name={field} value={form[field]} onChange={handleChange}
                    placeholder="5 days → 24 hours. Revenue +40%. Replaced 5 freelancers." />
                ) : (
                  <textarea className="form-textarea" rows={2} name={field} value={form[field]} onChange={handleChange} />
                )}
                {isEdit ? (
                  <SectionImages
                    caseStudyId={initial.id}
                    section={field}
                    images={images}
                    onImageAdded={img => setImages(imgs => [...imgs, img])}
                    onImageDeleted={imgId => setImages(imgs => imgs.filter(i => i.id !== imgId))}
                  />
                ) : (
                  <SectionImages
                    section={field}
                    pendingImgs={pendingImages}
                    onPendingAdd={img => setPendingImages(imgs => [...imgs, img])}
                    onPendingRemove={key => setPendingImages(imgs => imgs.filter(i => i.key !== key))}
                  />
                )}
              </div>
            ))}

            <div className="form-group">
              <label className="form-label">Testimonial</label>
              <textarea className="form-textarea" rows={3} name="testimonial" value={form.testimonial} onChange={handleChange}
                placeholder='"Quote from the client" — Name, Role, Company' />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving...</> : 'Save Case Study'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CaseStudies() {
  const [caseStudies, setCaseStudies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editCS, setEditCS] = useState(null);
  const [expanded, setExpanded] = useState({});

  useEffect(() => { fetchCaseStudies(); }, []);

  async function fetchCaseStudies() {
    setLoading(true);
    const res = await axios.get('/api/case-studies');
    setCaseStudies(res.data);
    setLoading(false);
  }

  async function deleteCS(id) {
    if (!window.confirm('Delete this case study?')) return;
    await axios.delete(`/api/case-studies/${id}`);
    setCaseStudies(cs => cs.filter(c => c.id !== id));
  }

  function handleSave(saved) {
    if (editCS?.id) {
      setCaseStudies(cs => cs.map(c => c.id === saved.id ? saved : c));
    } else {
      setCaseStudies(cs => [saved, ...cs]);
    }
    setShowModal(false);
    setEditCS(null);
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state"><div className="spinner spinner-lg"></div><span>Loading...</span></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Case Studies</h1>
          <p className="page-subtitle">{caseStudies.length} case stud{caseStudies.length !== 1 ? 'ies' : 'y'} in your library.</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditCS(null); setShowModal(true); }}>+ Add Case Study</button>
      </div>

      {caseStudies.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <div className="empty-state-title">No case studies yet</div>
          <div className="empty-state-text">Add case studies to include in your presentations.</div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Case Study</button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {caseStudies.map(cs => (
            <div key={cs.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              <div
                style={{ padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }}
                onClick={() => setExpanded(e => ({ ...e, [cs.id]: !e[cs.id] }))}
              >
                <div style={{ flex: 1 }}>
                  {/* FIX 7: Client name as primary heading, title as subtitle */}
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: cs.client_name ? 2 : 6 }}>
                    {cs.client_name || cs.title}
                  </div>
                  {cs.client_name && (
                    <div style={{ fontSize: 12.5, color: 'var(--color-gray-text)', marginBottom: 6 }}>
                      {cs.title}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                    <StatusBadge status={cs.relationship_status} />
                    {cs.duration && <span className="tag">{cs.duration}</span>}
                    {cs.service_type && <span className="tag">{cs.service_type}</span>}
                    {cs.client_type_tag && <span className="tag">{cs.client_type_tag}</span>}
                    {cs.industry && <span className="tag">{cs.industry}</span>}
                    {cs.nda === 1 && <span className="badge badge-nda">NDA</span>}
                    {cs.images && cs.images.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--color-gray-text)' }}>
                        📷 {cs.images.length} image{cs.images.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={e => { e.stopPropagation(); setEditCS(cs); setShowModal(true); }}
                  >Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={e => { e.stopPropagation(); deleteCS(cs.id); }}>Delete</button>
                  <span style={{ color: 'var(--color-gray-text)', fontSize: 14 }}>{expanded[cs.id] ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded[cs.id] && (
                <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-gray-border)', background: 'var(--color-gray-bg)' }}>
                  <div style={{ paddingTop: 16 }}>
                    {CS_SECTIONS.map(section => cs[section] ? (
                      <div key={section} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-gray-border)' }}>
                        <div className="info-label">{SECTION_LABELS[section]}</div>
                        <div style={{ fontSize: 13.5, lineHeight: 1.6, marginTop: 4 }}>{cs[section]}</div>
                        {cs.images && cs.images.filter(img => img.section === section).length > 0 && (
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                            {cs.images.filter(img => img.section === section)
                              .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
                              .map(img => (
                                <div key={img.id} style={{ position: 'relative' }}>
                                  <img
                                    src={`http://localhost:3001${img.image_path}`}
                                    alt={img.description || section}
                                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-gray-border)' }}
                                  />
                                  {img.description && (
                                    <div style={{ fontSize: 10, color: 'var(--color-gray-text)', maxWidth: 64, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                                      {img.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    ) : null)}
                    {cs.testimonial && (
                      <div style={{ background: 'white', padding: '12px 16px', borderRadius: 6, border: '1px solid var(--color-gray-border)' }}>
                        <div className="info-label">Testimonial</div>
                        <div style={{ fontSize: 13.5, fontStyle: 'italic', lineHeight: 1.6, marginTop: 6 }}>{cs.testimonial}</div>
                      </div>
                    )}
                    <div style={{ marginTop: 12 }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => { setEditCS(cs); setShowModal(true); }}
                      >
                        Edit &amp; Manage Images →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CaseStudyModal
          onClose={() => { setShowModal(false); setEditCS(null); }}
          onSave={handleSave}
          initial={editCS}
        />
      )}
    </div>
  );
}

export default CaseStudies;
