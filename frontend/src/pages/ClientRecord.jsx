import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

const CLIENT_TYPES = ['POD Seller','POD Enterprise','E-commerce brand','SaaS / Tech','Agency','Creator / Influencer','Other'];

function getMeetingBadgeClass(type) {
  const map = { 'M1':'badge-m1','M2':'badge-m2','M3':'badge-m3','M2+M3':'badge-m2m3','M4':'badge-m4','M5':'badge-m5' };
  return map[type] || 'badge-m1';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return dateStr; }
}

// Timeline driven by presentations (not meetings)
function PresentationTimeline({ presentations }) {
  const steps = ['M1','M2','M3','M4','M5'];
  const completedTypes = new Set(
    presentations.filter(p => p.meeting_type).map(p => p.meeting_type)
  );
  presentations.forEach(p => {
    if (p.meeting_type === 'M2+M3') { completedTypes.add('M2'); completedTypes.add('M3'); }
  });

  function getDate(step) {
    const p = presentations.find(p =>
      p.meeting_type === step ||
      (step === 'M2' && p.meeting_type === 'M2+M3') ||
      (step === 'M3' && p.meeting_type === 'M2+M3')
    );
    return p ? formatDate(p.meeting_date || p.created_at) : null;
  }

  return (
    <div className="meeting-timeline">
      {steps.map((step, i) => {
        const done = completedTypes.has(step);
        return (
          <React.Fragment key={step}>
            <div className="timeline-step">
              <div className={`timeline-dot${done ? ' completed' : ''}`}>{done ? '✓' : step}</div>
              <div className="timeline-label">{step}</div>
              {getDate(step) && <div className="timeline-date">{getDate(step)}</div>}
            </div>
            {i < steps.length - 1 && <div className={`timeline-connector${done ? ' completed' : ''}`} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function MeetingResultForm({ meetingId, clientId, onAdded, onCancel }) {
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [files, setFiles] = useState([]);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef();

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('meeting_id', meetingId);
      fd.append('client_id', clientId);
      fd.append('notes', notes);
      fd.append('result_date', date);
      files.forEach(f => fd.append('files', f));
      const res = await axios.post('/api/meeting-results', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      onAdded(res.data);
      setNotes(''); setFiles([]);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--color-gray-bg)', borderRadius: 8, padding: 16, marginTop: 12, border: '1px solid var(--color-gray-border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Add Meeting Result</div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <label className="form-label">Date</label>
        <input className="form-input" type="date" value={date} onChange={e => setDate(e.target.value)} style={{ maxWidth: 180 }} />
      </div>
      <div className="form-group" style={{ marginBottom: 10 }}>
        <label className="form-label">Notes — what happened, decisions made</label>
        <textarea className="form-textarea" value={notes} onChange={e => setNotes(e.target.value)} rows={4} placeholder="Client was interested in General Subscription. Showed budget of ~$2K/mo..." />
      </div>
      <div className="form-group" style={{ marginBottom: 14 }}>
        <label className="form-label">Attachments (optional)</label>
        <input ref={fileRef} type="file" multiple accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx" onChange={e => setFiles(Array.from(e.target.files))} style={{ fontSize: 13 }} />
        {files.length > 0 && <div style={{ fontSize: 12, color: 'var(--color-gray-text)', marginTop: 4 }}>{files.length} file{files.length !== 1 ? 's' : ''} selected</div>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving || !notes.trim()}>
          {saving ? <><span className="spinner"></span> Saving...</> : 'Save Result'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function MeetingResultCard({ result }) {
  const isImage = (path) => /\.(png|jpg|jpeg|gif|webp)$/i.test(path);
  return (
    <div style={{ background: 'white', border: '1px solid var(--color-gray-border)', borderRadius: 6, padding: 12, marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-blue)' }}>Result</span>
        <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>{formatDate(result.result_date)}</span>
      </div>
      {result.notes && <p style={{ fontSize: 13.5, lineHeight: 1.6, marginBottom: result.file_paths?.length ? 10 : 0, whiteSpace: 'pre-wrap' }}>{result.notes}</p>}
      {result.file_paths && result.file_paths.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {result.file_paths.map((fp, i) => (
            isImage(fp) ? (
              <a key={i} href={`${API_BASE}${fp}`} target="_blank" rel="noreferrer">
                <img src={`${API_BASE}${fp}`} alt="attachment" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--color-gray-border)' }} />
              </a>
            ) : (
              <a key={i} href={`${API_BASE}${fp}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{ fontSize: 12 }}>
                📄 {fp.split('/').pop()}
              </a>
            )
          ))}
        </div>
      )}
    </div>
  );
}

function MeetingCard({ meeting, clientId, onResultAdded }) {
  const [open, setOpen] = useState(false);
  const [showResultForm, setShowResultForm] = useState(false);
  const [results, setResults] = useState(meeting.results || []);

  function handleResultAdded(result) {
    setResults(r => [result, ...r]);
    setShowResultForm(false);
    if (onResultAdded) onResultAdded();
  }

  return (
    <div className="meeting-card">
      <div className="meeting-card-header" onClick={() => setOpen(o => !o)}>
        <span className={`badge ${getMeetingBadgeClass(meeting.meeting_type)}`}>{meeting.meeting_type}</span>
        <span style={{ fontWeight: 600, flex: 1 }}>{formatDate(meeting.meeting_date)}</span>
        {meeting.service_pitched && <span className="tag">{meeting.service_pitched}</span>}
        {results.length > 0 && (
          <span style={{ fontSize: 11, background: 'var(--color-blue)', color: 'white', borderRadius: 10, padding: '1px 7px', fontWeight: 600 }}>
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        )}
        <span style={{ color: 'var(--color-gray-text)', fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="meeting-card-body">
          {meeting.notes && (
            <div style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gray-text)', marginBottom: 4 }}>Notes</div>
              <p style={{ whiteSpace: 'pre-wrap' }}>{meeting.notes}</p>
            </div>
          )}
          {!meeting.notes && (
            <p style={{ color: 'var(--color-gray-text)', fontStyle: 'italic', marginBottom: 10 }}>No notes recorded for this meeting.</p>
          )}

          <div style={{ borderTop: '1px solid var(--color-gray-border)', paddingTop: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gray-text)' }}>
                Meeting Results
              </div>
              {!showResultForm && (
                <button className="btn btn-secondary btn-sm" style={{ fontSize: 12 }} onClick={() => setShowResultForm(true)}>
                  + Add Result
                </button>
              )}
            </div>
            {results.map(r => <MeetingResultCard key={r.id} result={r} />)}
            {showResultForm && (
              <MeetingResultForm
                meetingId={meeting.id}
                clientId={clientId}
                onAdded={handleResultAdded}
                onCancel={() => setShowResultForm(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const MEETING_TYPES = ['M1','M2','M2+M3','M3','M4','M5'];

function LogMeetingForm({ clientId, onLogged, onCancel }) {
  const [form, setForm] = useState({
    meeting_type: 'M1',
    meeting_date: new Date().toISOString().split('T')[0],
    notes: '',
    service_pitched: ''
  });
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await axios.post('/api/meetings', { ...form, client_id: clientId });
      onLogged(res.data);
    } catch (err) { alert('Error: ' + err.message); }
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{ background: 'var(--color-gray-bg)', borderRadius: 8, padding: 16, marginBottom: 16, border: '1px solid var(--color-gray-border)' }}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Log a Meeting</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Meeting Type</label>
          <select className="form-input" value={form.meeting_type} onChange={e => setForm(f => ({ ...f, meeting_type: e.target.value }))}>
            {MEETING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Date</label>
          <input className="form-input" type="date" value={form.meeting_date} onChange={e => setForm(f => ({ ...f, meeting_date: e.target.value }))} />
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">Service Pitched</label>
        <input className="form-input" value={form.service_pitched} onChange={e => setForm(f => ({ ...f, service_pitched: e.target.value }))} placeholder="Optional" />
      </div>
      <div className="form-group" style={{ marginBottom: 12 }}>
        <label className="form-label">Notes</label>
        <textarea className="form-textarea" rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="What happened, key takeaways..." />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
          {saving ? <><span className="spinner"></span> Saving...</> : 'Log Meeting'}
        </button>
        <button type="button" className="btn btn-secondary btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

function ClientRecord() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [meetingResults, setMeetingResults] = useState([]);
  const [meetings, setMeetings] = useState([]);
  const [showLogMeetingForm, setShowLogMeetingForm] = useState(false);

  useEffect(() => { fetchClient(); }, [id]);

  async function fetchClient() {
    setLoading(true);
    try {
      const [clientRes, resultsRes, presRes, meetingsRes] = await Promise.all([
        axios.get(`/api/clients/${id}`),
        axios.get(`/api/meeting-results?client_id=${id}`),
        axios.get(`/api/presentations?client_id=${id}`),
        axios.get(`/api/meetings?client_id=${id}`)
      ]);
      const data = clientRes.data;
      setClient(data);
      setMeetingResults(resultsRes.data);
      setPresentations(presRes.data);
      setMeetings(meetingsRes.data);
      setEditForm({
        full_name: data.full_name || '',
        company_name: data.company_name || '',
        role: data.role || '',
        website_url: data.website_url || '',
        linkedin_url: data.linkedin_url || '',
        industry: data.industry || '',
        location: data.location || '',
        email: data.email || '',
        notes: data.notes || '',
        client_type: data.client_type || ''
      });
    } catch { navigate('/clients'); }
    setLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await axios.put(`/api/clients/${id}`, editForm);
      setClient(c => ({ ...c, ...res.data }));
      setEditing(false);
    } catch (err) { alert('Error saving: ' + err.message); }
    setSaving(false);
  }

  async function deletePresentation(presId) {
    if (!window.confirm('Delete this presentation? The file will be permanently removed.')) return;
    try {
      await axios.delete(`/api/presentations/${presId}`);
      setPresentations(ps => ps.filter(p => p.id !== presId));
    } catch (err) { alert('Error deleting presentation: ' + err.message); }
  }

  function getMeetingsWithResults() {
    return meetings.map(m => ({
      ...m,
      results: meetingResults.filter(r => r.meeting_id === m.id)
    }));
  }

  function handleMeetingLogged(newMeeting) {
    setMeetings(ms => [newMeeting, ...ms]);
    setShowLogMeetingForm(false);
  }

  // Determine if this is a Client (has M5) or Lead
  const isClient = presentations.some(p => p.meeting_type === 'M5');

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state"><div className="spinner spinner-lg"></div><span>Loading...</span></div>
      </div>
    );
  }
  if (!client) return null;

  const meetingsWithResults = getMeetingsWithResults();

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/clients')}>← Back to Leads &amp; Clients</button>
      </div>

      {/* Header */}
      <div className="client-header">
        <div className="client-name-block">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
            <h1 className="client-name">{client.full_name}</h1>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              background: isClient ? '#DCFCE7' : '#F3F4F6',
              color: isClient ? '#166534' : '#6B7280'
            }}>
              {isClient ? 'Client' : 'Lead'}
            </span>
          </div>
          {client.company_name && <div className="client-company">{client.company_name}</div>}
          {client.role && <div style={{ fontSize: 13, color: 'var(--color-gray-text)', marginTop: 2 }}>{client.role}</div>}
          {client.client_type && (
            <span className="tag" style={{ marginTop: 6, display: 'inline-block' }}>{client.client_type}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={() => setEditing(e => !e)}>
            {editing ? 'Cancel Edit' : 'Edit'}
          </button>
          <button className="btn btn-yellow" onClick={() => navigate(`/presentations/new?client_id=${id}`)}>
            + New Presentation
          </button>
        </div>
      </div>

      {/* Edit Form */}
      {editing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Edit Info</div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" value={editForm.full_name} onChange={e => setEditForm(f => ({ ...f, full_name: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Company Name</label>
              <input className="form-input" value={editForm.company_name} onChange={e => setEditForm(f => ({ ...f, company_name: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Role</label>
              <input className="form-input" value={editForm.role} onChange={e => setEditForm(f => ({ ...f, role: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Industry</label>
              <input className="form-input" value={editForm.industry} onChange={e => setEditForm(f => ({ ...f, industry: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Location</label>
              <input className="form-input" value={editForm.location} onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Website URL</label>
              <input className="form-input" value={editForm.website_url} onChange={e => setEditForm(f => ({ ...f, website_url: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">LinkedIn URL</label>
              <input className="form-input" value={editForm.linkedin_url} onChange={e => setEditForm(f => ({ ...f, linkedin_url: e.target.value }))} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Client Type</label>
              <select className="form-input" value={editForm.client_type} onChange={e => setEditForm(f => ({ ...f, client_type: e.target.value }))}>
                <option value="">— Select type —</option>
                {CLIENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? <><span className="spinner"></span> Saving...</> : 'Save Changes'}
            </button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Info Grid */}
      {!editing && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-title">Information</div>
          <div className="info-grid">
            <div className="info-item">
              <div className="info-label">Email</div>
              <div className="info-value">{client.email || '—'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Location</div>
              <div className="info-value">{client.location || '—'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Industry</div>
              <div className="info-value">{client.industry || '—'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Client Type</div>
              <div className="info-value">
                {client.client_type ? <span className="tag">{client.client_type}</span> : '—'}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">Role</div>
              <div className="info-value">{client.role || '—'}</div>
            </div>
            <div className="info-item">
              <div className="info-label">Website</div>
              <div className="info-value">
                {client.website_url ? <a href={client.website_url} target="_blank" rel="noreferrer">{client.website_url}</a> : '—'}
              </div>
            </div>
            <div className="info-item">
              <div className="info-label">LinkedIn</div>
              <div className="info-value">
                {client.linkedin_url ? <a href={client.linkedin_url} target="_blank" rel="noreferrer">View Profile</a> : '—'}
              </div>
            </div>
            {client.notes && (
              <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                <div className="info-label">Notes</div>
                <div className="info-value" style={{ whiteSpace: 'pre-wrap', fontWeight: 400 }}>{client.notes}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Journey Timeline (from presentations) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-title">Presentation Journey</div>
        {presentations.length > 0 ? (
          <PresentationTimeline presentations={presentations} />
        ) : (
          <div style={{ color: 'var(--color-gray-text)', fontSize: 13.5, padding: '12px 0' }}>No presentations generated yet.</div>
        )}
      </div>

      {/* Manual Meeting Logs (separate from presentations) */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Meeting Logs</h2>
          {!showLogMeetingForm && (
            <button className="btn btn-secondary btn-sm" onClick={() => setShowLogMeetingForm(true)}>
              + Log Meeting
            </button>
          )}
        </div>
        {showLogMeetingForm && (
          <LogMeetingForm
            clientId={id}
            onLogged={handleMeetingLogged}
            onCancel={() => setShowLogMeetingForm(false)}
          />
        )}
        {meetingsWithResults.length > 0 ? (
          meetingsWithResults.map(m => (
            <MeetingCard key={m.id} meeting={m} clientId={id} onResultAdded={fetchClient} />
          ))
        ) : (
          !showLogMeetingForm && (
            <div style={{ color: 'var(--color-gray-text)', fontSize: 13.5, padding: '12px 0' }}>
              No meeting logs yet. Use "+ Log Meeting" to record a meeting separately from presentations.
            </div>
          )
        )}
      </div>

      {/* Presentations */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Presentations</h2>
          <button className="btn btn-yellow btn-sm" onClick={() => navigate(`/presentations/new?client_id=${id}`)}>
            + New Presentation
          </button>
        </div>
        {presentations.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Format</th>
                  <th>Slides</th>
                  <th>Downloads</th>
                  <th style={{ width: 40 }}></th>
                </tr>
              </thead>
              <tbody>
                {presentations.map(p => {
                  let slides = [];
                  try { slides = Array.isArray(p.slide_list) ? p.slide_list : JSON.parse(p.slide_list || '[]'); } catch {}
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.meeting_type ? (
                          <span className={`badge ${getMeetingBadgeClass(p.meeting_type)}`}>{p.meeting_type}</span>
                        ) : '—'}
                      </td>
                      <td>{formatDate(p.meeting_date || p.created_at)}</td>
                      <td><span className="badge badge-m1">{p.output_format || '—'}</span></td>
                      <td>{slides.length} slides</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {p.file_path_pptx && (
                            <a href={`${API_BASE}${p.file_path_pptx}`} className="download-btn download-btn-pptx" download>PPTX</a>
                          )}
                          {p.file_path_pdf && (
                            <a href={`${API_BASE}${p.file_path_pdf}`} className="download-btn download-btn-pdf" download>PDF</a>
                          )}
                        </div>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          style={{ padding: '3px 8px', fontSize: 13 }}
                          onClick={() => deletePresentation(p.id)}
                          title="Delete presentation"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '30px 0' }}>
            <div className="empty-state-title">No presentations yet</div>
            <div className="empty-state-text">Generate the first presentation for {client.full_name}.</div>
            <button className="btn btn-yellow" onClick={() => navigate(`/presentations/new?client_id=${id}`)}>
              + New Presentation
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ClientRecord;
