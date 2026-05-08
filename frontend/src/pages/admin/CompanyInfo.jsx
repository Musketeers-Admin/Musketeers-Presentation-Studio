import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FIELD_LABELS = {
  name: 'Company Name',
  tagline: 'Tagline',
  positioning: 'Positioning Statement',
  team_size: 'Team Size',
  monthly_deliverables: 'Monthly Deliverables',
  clients_served: 'Clients Served',
  years_in_industry: 'Years in Industry',
  locations: 'Locations',
  website: 'Website',
  email: 'Contact Email',
  brand_voice: 'Brand Voice',
};

const LONG_TEXT_FIELDS = ['positioning', 'brand_voice', 'tagline'];

function CompanyInfo() {
  const [fields, setFields] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchInfo();
  }, []);

  async function fetchInfo() {
    setLoading(true);
    const res = await axios.get('/api/company-info');
    const obj = {};
    res.data.forEach(item => { obj[item.key] = item.value || ''; });
    setFields(obj);
    setLoading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updates = Object.entries(fields).map(([key, value]) => ({ key, value }));
      await axios.put('/api/company-info', updates);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Error saving: ' + err.message);
    }
    setSaving(false);
  }

  function handleChange(key, value) {
    setFields(f => ({ ...f, [key]: value }));
    setSaved(false);
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <span>Loading company info...</span>
        </div>
      </div>
    );
  }

  const sections = {
    'Company Identity': ['name', 'tagline', 'positioning', 'website', 'email'],
    'Stats & Scale': ['team_size', 'monthly_deliverables', 'clients_served', 'years_in_industry', 'locations'],
    'Brand Voice': ['brand_voice'],
  };

  // Collect any keys not covered by sections
  const coveredKeys = new Set(Object.values(sections).flat());
  const otherKeys = Object.keys(fields).filter(k => !coveredKeys.has(k));

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Company Info</h1>
          <p className="page-subtitle">This data feeds into every presentation Claude generates.</p>
        </div>
        {saved && (
          <div className="alert alert-green" style={{ margin: 0, padding: '8px 16px' }}>
            Saved successfully!
          </div>
        )}
      </div>

      <form onSubmit={handleSave}>
        {Object.entries(sections).map(([sectionName, keys]) => (
          <div className="card" style={{ marginBottom: 20 }} key={sectionName}>
            <div className="card-title">{sectionName}</div>
            {keys.filter(k => k in fields || LONG_TEXT_FIELDS.includes(k)).map(key => (
              <div className="form-group" key={key}>
                <label className="form-label">{FIELD_LABELS[key] || key}</label>
                {LONG_TEXT_FIELDS.includes(key) ? (
                  <textarea
                    className="form-textarea"
                    rows={key === 'brand_voice' || key === 'positioning' ? 4 : 2}
                    value={fields[key] || ''}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder={`Enter ${FIELD_LABELS[key] || key}...`}
                  />
                ) : (
                  <input
                    className="form-input"
                    value={fields[key] || ''}
                    onChange={e => handleChange(key, e.target.value)}
                    placeholder={`Enter ${FIELD_LABELS[key] || key}...`}
                  />
                )}
              </div>
            ))}
          </div>
        ))}

        {otherKeys.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">Additional Fields</div>
            {otherKeys.map(key => (
              <div className="form-group" key={key}>
                <label className="form-label">{key}</label>
                <input
                  className="form-input"
                  value={fields[key] || ''}
                  onChange={e => handleChange(key, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <><span className="spinner"></span> Saving...</> : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default CompanyInfo;
