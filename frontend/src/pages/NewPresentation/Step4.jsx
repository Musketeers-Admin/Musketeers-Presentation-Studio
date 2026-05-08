import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE from '../../config';
import axios from 'axios';

function Step4({ state, updateState, step3Skipped, onBack }) {
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [formatPPTX, setFormatPPTX] = useState(true);
  const [formatPDF, setFormatPDF] = useState(true);

  function getOutputFormat() {
    if (formatPPTX && formatPDF) return 'Both';
    if (formatPPTX) return 'PPTX';
    if (formatPDF) return 'PDF';
    return null;
  }

  async function handleGenerate() {
    const outputFormat = getOutputFormat();
    if (!outputFormat) {
      alert('Please select at least one output format (PPTX or PDF).');
      return;
    }

    setGenerating(true);
    setError(null);
    setResult(null);

    try {
      const caseStudyIds = Array.isArray(state.selectedCaseStudies)
        ? state.selectedCaseStudies.map(cs => (typeof cs === 'object' ? cs.id : cs))
        : [];

      const payload = {
        client_id: state.client.id,
        meeting_type: state.meetingType,
        meeting_date: state.meetingDate,
        service_pitched: state.servicePitched,
        notes: state.meetingNotes,
        extra_context: state.extraContext,
        slides: state.selectedSlides,
        case_study_ids: caseStudyIds,
        partner_brand_ids: state.partnerBrandIds || [],
        output_format: outputFormat,
        brand_name_toggle: state.brandNameToggle,
        record_preferences: true,
        all_possible_slides: state.allPossibleSlides || [],
      };

      const res = await axios.post('/api/presentations/generate', payload, {
        timeout: 120000 // 2 minute timeout
      });
      setResult(res.data);
      updateState({ outputFormat });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Unknown error';
      setError(msg);
    }
    setGenerating(false);
  }

  if (result) {
    return (
      <div className="card">
        <div className="generate-success">
          <div className="generate-success-icon">✅</div>
          <h2 className="generate-success-title">Presentation Generated!</h2>
          <p className="generate-success-sub">
            Your {state.meetingType} presentation for {state.client?.full_name} is ready.
          </p>

          <div className="download-actions step4-download-actions">
            {result.file_path_pptx && (
              <a
                href={`${API_BASE}${result.file_path_pptx}`}
                className="btn btn-primary btn-lg"
                download
              >
                Download PPTX
              </a>
            )}
            {result.file_path_pdf && (
              <a
                href={`${API_BASE}${result.file_path_pdf}`}
                className="btn btn-danger btn-lg"
                download
              >
                Download PDF
              </a>
            )}
          </div>

          <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={() => navigate(`/clients/${state.client.id}`)}>
              View Client Record
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/presentations/new')}>
              New Presentation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .step4-format-row {
          display: flex;
          gap: 16px;
        }
        .step4-format-row label {
          flex: 1;
          min-width: 0;
        }
        .step4-nav {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
        }
        @media (max-width: 600px) {
          .step4-format-row {
            flex-direction: column;
            gap: 10px;
          }
          .step4-nav {
            flex-direction: column-reverse;
          }
          .step4-nav .btn-yellow {
            width: 100%;
            justify-content: center;
          }
          .step4-nav .btn-secondary {
            width: 100%;
            justify-content: center;
          }
          .step4-info-grid {
            grid-template-columns: 1fr !important;
          }
          .step4-download-actions {
            flex-direction: column;
          }
          .step4-download-actions a {
            width: 100%;
            text-align: center;
          }
        }
      `}</style>

      {/* Output Format */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Output Format</div>
        <div className="step4-format-row">
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '14px 20px', border: `2px solid ${formatPPTX ? 'var(--color-blue)' : 'var(--color-gray-border)'}`, borderRadius: 6, background: formatPPTX ? '#EEF2FF' : 'white', transition: 'all 0.15s' }}>
            <input type="checkbox" checked={formatPPTX} onChange={e => setFormatPPTX(e.target.checked)} style={{ width: 18, height: 18 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>PPTX</div>
              <div style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>PowerPoint file for editing</div>
            </div>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '14px 20px', border: `2px solid ${formatPDF ? 'var(--color-blue)' : 'var(--color-gray-border)'}`, borderRadius: 6, background: formatPDF ? '#EEF2FF' : 'white', transition: 'all 0.15s' }}>
            <input type="checkbox" checked={formatPDF} onChange={e => setFormatPDF(e.target.checked)} style={{ width: 18, height: 18 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>PDF</div>
              <div style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>PDF for sharing/email</div>
            </div>
          </label>
        </div>
      </div>

      {/* Summary */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Presentation Summary</div>
        <div className="info-grid step4-info-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <div className="info-item">
            <div className="info-label">Client</div>
            <div className="info-value">{state.client?.full_name}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Company</div>
            <div className="info-value">{state.client?.company_name || '—'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Meeting Type</div>
            <div className="info-value">
              <span className={`badge badge-${state.meetingType?.toLowerCase().replace('+', '')}`}>{state.meetingType}</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-label">Meeting Date</div>
            <div className="info-value">{state.meetingDate}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Service Pitched</div>
            <div className="info-value">{state.servicePitched || '—'}</div>
          </div>
          <div className="info-item">
            <div className="info-label">Slides Selected</div>
            <div className="info-value">{state.selectedSlides?.length || 0} slides</div>
          </div>
          <div className="info-item">
            <div className="info-label">Case Studies</div>
            <div className="info-value">{state.selectedCaseStudies?.length || 0} selected</div>
          </div>
          <div className="info-item">
            <div className="info-label">Brand Names</div>
            <div className="info-value">{state.brandNameToggle ? 'Shown' : 'Anonymized'}</div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="alert alert-red" style={{ marginBottom: 16 }}>
          <div className="alert-title">Generation Failed</div>
          <div style={{ marginTop: 4 }}>{error}</div>
          {error.includes('ANTHROPIC_API_KEY') && (
            <div style={{ marginTop: 8, fontSize: 13 }}>
              Make sure you've added your API key to <code>backend/.env</code>: <code>ANTHROPIC_API_KEY=sk-ant-...</code>
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      {generating ? (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ marginBottom: 16 }}>
            <div className="spinner spinner-lg" style={{ margin: '0 auto', borderTopColor: 'var(--color-blue)' }}></div>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>Claude is writing your slides...</div>
          <div style={{ fontSize: 13.5, color: 'var(--color-gray-text)' }}>
            This usually takes 20–40 seconds. Please don't close this page.
          </div>
        </div>
      ) : (
        <div className="step4-nav">
          <button className="btn btn-secondary" onClick={onBack}>← Back</button>
          <button
            className="btn btn-yellow btn-lg"
            onClick={handleGenerate}
            disabled={!state.client || !state.meetingType || (state.selectedSlides?.length === 0)}
          >
            Generate Presentation
          </button>
        </div>
      )}
    </div>
  );
}

export default Step4;
