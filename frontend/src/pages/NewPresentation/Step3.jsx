import React, { useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE from '../../config';

const INITIAL_CS_FORM = {
  title: '', client_name: '', industry: '', service_type: '',
  client_type_tag: '', situation: '', problem: '', solution: '',
  result: '', metrics: '', testimonial: '', nda: false
};

function getAnonymizedName(cs) {
  if (cs.industry) return `a ${cs.industry} company`;
  if (cs.client_type_tag) return `a ${cs.client_type_tag} client`;
  return 'a confidential client';
}

function scoreCaseStudy(cs, clientIndustry, clientType, servicePitched) {
  let score = 0;
  const csIndustry = (cs.industry || '').toLowerCase();
  const csClientType = (cs.client_type_tag || '').toLowerCase();
  const csService = (cs.service_type || '').toLowerCase();

  if (clientIndustry) {
    if (csIndustry === clientIndustry) score += 5;
    else if (csIndustry && csIndustry.includes(clientIndustry)) score += 3;
  }
  if (clientType && csClientType && csClientType.includes(clientType)) score += 3;
  if (cs.metrics && cs.metrics.length > 30) score += 3;
  else if (cs.metrics) score += 2;
  if (cs.testimonial) score += 2;
  if (servicePitched && csService && csService.includes(servicePitched)) score += 1;
  if (cs.is_active) score += 1;
  return score;
}

function Step3({ state, updateState, onNext, onBack }) {
  const [caseStudies, setCaseStudies] = useState([]);
  const [partnerBrands, setPartnerBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState(INITIAL_CS_FORM);
  const [saving, setSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState(
    state.selectedCaseStudies ? state.selectedCaseStudies.map(cs => cs.id || cs) : []
  );
  const [selectedPartnerIds, setSelectedPartnerIds] = useState(
    state.partnerBrandIds || []
  );

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    const [csRes, pbRes] = await Promise.all([
      axios.get('/api/case-studies'),
      axios.get('/api/partner-brands')
    ]);
    setCaseStudies(csRes.data);
    setPartnerBrands(pbRes.data);

    // Auto pre-select if no prior selection
    const priorSelected = state.selectedCaseStudies ? state.selectedCaseStudies.map(cs => cs.id || cs) : [];
    if (priorSelected.length === 0 && csRes.data.length > 0) {
      const clientIndustry = (state.client?.industry || '').toLowerCase();
      const clientType = (state.client?.client_type || '').toLowerCase();
      const servicePitched = (state.servicePitched || '').toLowerCase();
      const scored = csRes.data
        .map(cs => ({ ...cs, _score: scoreCaseStudy(cs, clientIndustry, clientType, servicePitched) }))
        .sort((a, b) => b._score - a._score);
      const autoIds = scored.filter(cs => cs._score >= 3).slice(0, 2).map(cs => cs.id);
      if (autoIds.length > 0) {
        setSelectedIds(autoIds);
        updateState({ selectedCaseStudies: autoIds });
      }
    }

    setLoading(false);
  }

  function toggleCaseStudy(id) {
    let newSelected;
    if (selectedIds.includes(id)) {
      newSelected = selectedIds.filter(sid => sid !== id);
    } else {
      newSelected = [...selectedIds, id];
    }
    setSelectedIds(newSelected);
    updateState({ selectedCaseStudies: newSelected });
  }

  function togglePartnerBrand(id) {
    let newSelected;
    if (selectedPartnerIds.includes(id)) {
      newSelected = selectedPartnerIds.filter(pid => pid !== id);
    } else {
      newSelected = [...selectedPartnerIds, id];
    }
    setSelectedPartnerIds(newSelected);
    updateState({ partnerBrandIds: newSelected });
  }

  async function handleAddCaseStudy(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post('/api/case-studies', addForm);
      setCaseStudies(cs => [res.data, ...cs]);
      setAddForm(INITIAL_CS_FORM);
      setShowAddForm(false);
      const newId = res.data.id;
      const newSelected = [...selectedIds, newId];
      setSelectedIds(newSelected);
      updateState({ selectedCaseStudies: newSelected });
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  }

  const clientIndustry = state.client?.industry?.toLowerCase() || '';
  const sorted = [...caseStudies].sort((a, b) => {
    const aRelevant = a.industry?.toLowerCase().includes(clientIndustry) && clientIndustry;
    const bRelevant = b.industry?.toLowerCase().includes(clientIndustry) && clientIndustry;
    if (aRelevant && !bRelevant) return -1;
    if (!aRelevant && bRelevant) return 1;
    return 0;
  });

  // When brand name toggle is OFF, NDA partner brands are hidden from selection
  const visiblePartners = partnerBrands.filter(pb => state.brandNameToggle || !pb.nda);

  return (
    <div>
      {/* Brand Name Toggle */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Brand Name Settings</div>
        <div className="toggle-wrapper">
          <label className="toggle">
            <input
              type="checkbox"
              checked={state.brandNameToggle}
              onChange={e => updateState({ brandNameToggle: e.target.checked })}
            />
            <span className="toggle-slider"></span>
          </label>
          <div>
            <div className="toggle-label">
              Show brand names in case studies: <strong>{state.brandNameToggle ? 'ON' : 'OFF'}</strong>
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-gray-text)', marginTop: 2 }}>
              {state.brandNameToggle
                ? 'Client names will be shown (except NDA-protected ones).'
                : 'All client names will be anonymized in the presentation.'}
            </div>
          </div>
        </div>
      </div>

      {/* Case Studies */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>Select Case Studies</div>
            <div style={{ fontSize: 13, color: 'var(--color-gray-text)' }}>
              {selectedIds.length} selected. Relevant ones shown first.
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(f => !f)}>
            {showAddForm ? '— Cancel' : '+ Add Case Study'}
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <form onSubmit={handleAddCaseStudy} style={{ marginBottom: 20, padding: 16, background: 'var(--color-gray-bg)', borderRadius: 6 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, fontSize: 14 }}>New Case Study</div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={addForm.title}
                  onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} required
                  placeholder="e.g. From 5-day to 24-hour delivery" />
              </div>
              <div className="form-group">
                <label className="form-label">Client Name</label>
                <input className="form-input" value={addForm.client_name}
                  onChange={e => setAddForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Acme Inc." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Industry</label>
                <input className="form-input" value={addForm.industry}
                  onChange={e => setAddForm(f => ({ ...f, industry: e.target.value }))} placeholder="E-commerce" />
              </div>
              <div className="form-group">
                <label className="form-label">Service Type</label>
                <input className="form-input" value={addForm.service_type}
                  onChange={e => setAddForm(f => ({ ...f, service_type: e.target.value }))} placeholder="General Subscription" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Client Type Tag</label>
                <input className="form-input" value={addForm.client_type_tag}
                  onChange={e => setAddForm(f => ({ ...f, client_type_tag: e.target.value }))} placeholder="DTC, SaaS, POD..." />
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', paddingBottom: 6 }}>
                  <input type="checkbox" checked={addForm.nda}
                    onChange={e => setAddForm(f => ({ ...f, nda: e.target.checked }))} />
                  <span className="form-label" style={{ marginBottom: 0 }}>NDA (anonymize name)</span>
                </label>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Situation</label>
              <textarea className="form-textarea" rows={2} value={addForm.situation}
                onChange={e => setAddForm(f => ({ ...f, situation: e.target.value }))} placeholder="What was happening before?" />
            </div>
            <div className="form-group">
              <label className="form-label">Problem</label>
              <textarea className="form-textarea" rows={2} value={addForm.problem}
                onChange={e => setAddForm(f => ({ ...f, problem: e.target.value }))} placeholder="What was the core pain?" />
            </div>
            <div className="form-group">
              <label className="form-label">Solution</label>
              <textarea className="form-textarea" rows={2} value={addForm.solution}
                onChange={e => setAddForm(f => ({ ...f, solution: e.target.value }))} placeholder="What did DM do?" />
            </div>
            <div className="form-group">
              <label className="form-label">Result</label>
              <textarea className="form-textarea" rows={2} value={addForm.result}
                onChange={e => setAddForm(f => ({ ...f, result: e.target.value }))} placeholder="What happened after?" />
            </div>
            <div className="form-group">
              <label className="form-label">Metrics</label>
              <input className="form-input" value={addForm.metrics}
                onChange={e => setAddForm(f => ({ ...f, metrics: e.target.value }))} placeholder="Key numbers, %, time saved..." />
            </div>
            <div className="form-group">
              <label className="form-label">Testimonial</label>
              <textarea className="form-textarea" rows={2} value={addForm.testimonial}
                onChange={e => setAddForm(f => ({ ...f, testimonial: e.target.value }))} placeholder='"Quote from client" — Name, Role, Company' />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving...</> : 'Save Case Study'}
            </button>
          </form>
        )}

        {loading ? (
          <div className="loading-state" style={{ padding: 30 }}>
            <div className="spinner spinner-lg"></div>
            <span>Loading...</span>
          </div>
        ) : sorted.length === 0 ? (
          <div className="empty-state" style={{ padding: 30 }}>
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">No case studies yet</div>
            <div className="empty-state-text">Add your first case study above.</div>
          </div>
        ) : (
          <div className="case-study-grid">
            {sorted.map(cs => {
              const isSelected = selectedIds.includes(cs.id);
              const isRelevant = clientIndustry && cs.industry?.toLowerCase().includes(clientIndustry);
              // Live preview: anonymize when toggle is OFF
              const showName = state.brandNameToggle && !cs.nda;
              const displayName = showName ? cs.client_name : getAnonymizedName(cs);
              return (
                <div
                  key={cs.id}
                  className={`case-study-card${isSelected ? ' selected' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => toggleCaseStudy(cs.id)}
                >
                  <div className="case-study-card-header">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1 }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {}}
                        style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }}
                      />
                      <div>
                        <div className="case-study-title">
                          {displayName}
                          {!showName && cs.client_name && (
                            <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--color-blue)', fontStyle: 'italic', fontWeight: 400 }}>anonymized</span>
                          )}
                        </div>
                        {cs.title && (
                          <div style={{ fontSize: 12, color: 'var(--color-gray-text)', marginTop: 2, fontWeight: 400 }}>{cs.title}</div>
                        )}
                      </div>
                    </div>
                    {cs.nda === 1 && <span className="badge badge-nda">NDA</span>}
                  </div>
                  <div className="case-study-meta">
                    {cs.service_type && <span className="tag">{cs.service_type}</span>}
                    {cs.client_type_tag && <span className="tag">{cs.client_type_tag}</span>}
                    {cs.industry && <span className="tag">{cs.industry}</span>}
                    {isRelevant && (
                      <span className="badge badge-m4" style={{ fontSize: 10 }}>Relevant</span>
                    )}
                  </div>
                  {cs.metrics && (
                    <div className="case-study-result">
                      <strong>Result:</strong> {cs.metrics}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Partner Brands */}
      {visiblePartners.length > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ marginBottom: 12 }}>
            <div className="card-title" style={{ marginBottom: 2 }}>Partner Brands — "Trusted by"</div>
            <div style={{ fontSize: 13, color: 'var(--color-gray-text)' }}>
              Select brands to show in the Proof slide's "Trusted by" section.
              {!state.brandNameToggle && <span style={{ color: 'var(--color-yellow)', marginLeft: 6 }}>NDA-marked brands are hidden (toggle is OFF).</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
            {visiblePartners.map(pb => {
              const isSelected = selectedPartnerIds.includes(pb.id);
              return (
                <div
                  key={pb.id}
                  onClick={() => togglePartnerBrand(pb.id)}
                  style={{
                    border: `2px solid ${isSelected ? 'var(--color-blue)' : 'var(--color-gray-border)'}`,
                    borderRadius: 6,
                    padding: 10,
                    cursor: 'pointer',
                    background: isSelected ? '#EEF2FF' : 'white',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {pb.logo_path ? (
                      <img src={`${API_BASE}${pb.logo_path}`} alt={pb.name} style={{ maxWidth: 80, maxHeight: 40, objectFit: 'contain' }} />
                    ) : (
                      <span style={{ fontSize: 24 }}>🤝</span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, textAlign: 'center', color: 'var(--color-black)' }}>{pb.name}</div>
                  {pb.industry_tag && <div style={{ fontSize: 10, color: 'var(--color-gray-text)', textAlign: 'center' }}>{pb.industry_tag}</div>}
                  {isSelected && <div style={{ fontSize: 10, color: 'var(--color-blue)', fontWeight: 700 }}>✓ Selected</div>}
                </div>
              );
            })}
          </div>
          {selectedPartnerIds.length > 0 && (
            <div style={{ marginTop: 10, fontSize: 12, color: 'var(--color-gray-text)' }}>
              {selectedPartnerIds.length} brand{selectedPartnerIds.length !== 1 ? 's' : ''} selected for the Proof slide.
            </div>
          )}
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button className="btn btn-primary" onClick={onNext}>
          Next: Generate →
        </button>
      </div>
    </div>
  );
}

export default Step3;
