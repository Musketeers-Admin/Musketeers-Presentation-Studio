import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

const COLOR_FIELDS = [
  { key: 'primary_color',   label: 'Primary Blue',       default: '#0D41FF' },
  { key: 'accent_yellow',   label: 'Accent Yellow',      default: '#FFD81D' },
  { key: 'accent_red',      label: 'Accent Red',         default: '#FC2E12' },
  { key: 'accent_green',    label: 'Accent Green',       default: '#30E047' },
  { key: 'bg_dark',         label: 'Background Dark',    default: '#0A0A0A' },
  { key: 'bg_light',        label: 'Background Light',   default: '#FFFFFF' },
  { key: 'text_primary',    label: 'Text Primary',       default: '#000000' },
  { key: 'text_secondary',  label: 'Text Secondary',     default: '#707070' },
];

const LOGO_SLOTS = [
  { slot: 'primary',        label: 'Primary Logo',        description: 'Full color logo',              previewBg: '#FFFFFF', textColor: '#A8A8A8' },
  { slot: 'wordmark_dark',  label: 'Wordmark (Dark)',      description: 'Used on light slide backgrounds', previewBg: '#FFFFFF', textColor: '#A8A8A8' },
  { slot: 'wordmark_light', label: 'Wordmark (Light)',     description: 'Used on dark slide backgrounds',  previewBg: '#0A0A0A', textColor: 'rgba(255,255,255,0.3)' },
  { slot: 'icon',           label: 'Icon / Mark',          description: 'Symbol or icon mark',          previewBg: '#F5F5F5', textColor: '#A8A8A8' },
];

function BrandGuide() {
  const [guide, setGuide] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState(null);

  const logoRefs = {
    primary:        useRef(),
    wordmark_dark:  useRef(),
    wordmark_light: useRef(),
    icon:           useRef(),
  };

  useEffect(() => { fetchGuide(); }, []);

  async function fetchGuide() {
    setLoading(true);
    const res = await axios.get('/api/brand-guide');
    setGuide(res.data);
    setLoading(false);
  }

  function handleChange(key, value) {
    setGuide(g => ({ ...g, [key]: value }));
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put('/api/brand-guide', guide);
      alert('Brand guide saved.');
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  }

  async function handleLogoUpload(slot) {
    const ref = logoRefs[slot];
    const file = ref.current?.files?.[0];
    if (!file) return;
    setUploadingSlot(slot);
    try {
      const fd = new FormData();
      fd.append('logo', file);
      const res = await axios.post(`/api/brand-guide/logo/${slot}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setGuide(g => ({ ...g, [res.data.key]: res.data.value }));
      if (ref.current) ref.current.value = '';
    } catch (err) { alert('Upload error: ' + err.message); }
    setUploadingSlot(null);
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
          <h1 className="page-title">Brand Guide</h1>
          <p className="page-subtitle">Brand colors and logos applied to all generated presentations.</p>
        </div>
      </div>

      <style>{`
        .logo-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        @media (max-width: 1024px) {
          .logo-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 767px) {
          .logo-grid { grid-template-columns: 1fr; }
        }
        .logo-card {
          display: flex;
          flex-direction: column;
          gap: 8px;
          border: 1px solid var(--color-gray-border);
          border-radius: 8px;
          padding: 12px;
          min-width: 0;
          overflow: hidden;
        }
        .logo-card-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--color-black);
          letter-spacing: 0.01em;
        }
        .logo-card-desc {
          font-size: 11px;
          color: var(--color-gray-text);
          margin-top: -4px;
          line-height: 1.4;
        }
        .logo-preview {
          min-height: 160px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid var(--color-gray-border);
          flex-shrink: 0;
        }
        .logo-preview img {
          max-width: 80%;
          max-height: 80%;
          object-fit: contain;
          display: block;
        }
        .logo-preview-empty {
          font-size: 11px;
          font-weight: 500;
        }
        .logo-upload-row {
          display: flex;
          gap: 6px;
          align-items: center;
          flex-wrap: wrap;
        }
        .logo-upload-row input[type="file"] {
          font-size: 11px;
          flex: 1;
          min-width: 0;
        }
      `}</style>

      <form onSubmit={handleSave}>
        {/* Logo Uploads */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Logos</div>
          <div className="logo-grid">
            {LOGO_SLOTS.map(({ slot, label, description, previewBg, textColor }) => {
              const key = `logo_${slot}`;
              const logoPath = guide[key];
              return (
                <div key={slot} className="logo-card">
                  <div className="logo-card-label">{label}</div>
                  <div className="logo-card-desc">{description}</div>
                  <div className="logo-preview" style={{ background: previewBg }}>
                    {logoPath ? (
                      <img src={`${API_BASE}${logoPath}`} alt={label} />
                    ) : (
                      <span className="logo-preview-empty" style={{ color: textColor }}>No logo</span>
                    )}
                  </div>
                  <div className="logo-upload-row">
                    <input ref={logoRefs[slot]} type="file" accept=".png,.jpg,.jpeg,.svg,.webp" />
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 11, whiteSpace: 'nowrap', flexShrink: 0 }}
                      disabled={uploadingSlot === slot}
                      onClick={() => handleLogoUpload(slot)}
                    >
                      {uploadingSlot === slot ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colors */}
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-title">Brand Colors</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {COLOR_FIELDS.map(({ key, label, default: def }) => (
              <div key={key} className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">{label}</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="color"
                    value={guide[key] || def}
                    onChange={e => handleChange(key, e.target.value)}
                    style={{ width: 40, height: 34, padding: 2, borderRadius: 4, border: '1px solid var(--color-gray-border)', cursor: 'pointer', background: 'white' }}
                  />
                  <input
                    className="form-input"
                    value={guide[key] || def}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder={def}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </div>
                <div style={{ width: '100%', height: 6, borderRadius: 3, background: guide[key] || def, marginTop: 5, border: '1px solid var(--color-gray-border)' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner"></span> Saving...</> : 'Save Brand Guide'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default BrandGuide;
