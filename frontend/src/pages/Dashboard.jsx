import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

function getMeetingBadgeClass(type) {
  const map = { 'M1':'badge-m1','M2':'badge-m2','M3':'badge-m3','M2+M3':'badge-m2m3','M4':'badge-m4','M5':'badge-m5' };
  return map[type] || 'badge-m1';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

const FUNNEL_STAGES = ['M1','M2','M3','M4','M5'];
const STAGE_LABELS = { M1: 'Intro Call', M2: 'Discovery', M3: 'Pitch', M4: 'Proposal', M5: 'Onboarding' };

function FunnelBar({ label, stage, count, maxCount, pct, dropPct }) {
  const badgeClass = getMeetingBadgeClass(stage);
  const barWidth = maxCount > 0 ? Math.max(8, Math.round((count / maxCount) * 100)) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span className={`badge ${badgeClass}`} style={{ minWidth: 48, textAlign: 'center' }}>{stage}</span>
        <span style={{ fontSize: 13, color: 'var(--color-gray-text)', width: 90 }}>{label}</span>
        <div style={{ flex: 1, background: 'var(--color-gray-bg)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
          <div style={{ width: `${barWidth}%`, height: '100%', background: 'var(--color-blue)', borderRadius: 4, transition: 'width 0.4s ease' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, minWidth: 28, textAlign: 'right' }}>{count}</span>
        {dropPct !== null && (
          <span style={{ fontSize: 11, color: dropPct > 50 ? 'var(--color-red)' : 'var(--color-gray-text)', minWidth: 52, textAlign: 'right' }}>
            {dropPct > 0 ? `−${dropPct}%` : ''}
          </span>
        )}
      </div>
    </div>
  );
}

function Dashboard() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('/api/clients'),
      axios.get('/api/presentations')
    ]).then(([clientsRes, presRes]) => {
      setClients(clientsRes.data);
      setPresentations(presRes.data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Stats calculations
  const totalPresentations = presentations.length;

  // Interacted = has at least one presentation
  const clientsWithPresentation = new Set(presentations.map(p => p.client_id));
  const interactedCount = clientsWithPresentation.size;

  // Won = has an M5 meeting (presentation generated for M5)
  // We derive from clients list: look for clients who have reached M5
  const wonClients = clients.filter(c => {
    const lastMeetingType = c.last_meeting_type;
    return lastMeetingType === 'M5';
  });
  const wonCount = wonClients.length;
  const winRate = interactedCount > 0 ? Math.round((wonCount / interactedCount) * 100) : 0;

  // Funnel: how many unique clients reached each stage
  const stageCounts = {};
  FUNNEL_STAGES.forEach(s => { stageCounts[s] = 0; });
  clients.forEach(c => {
    if (!c.last_meeting_type) return;
    const mt = c.last_meeting_type;
    const reached = mt === 'M2+M3' ? ['M1','M2','M3'] : FUNNEL_STAGES.slice(0, FUNNEL_STAGES.indexOf(mt) + 1);
    reached.forEach(s => { if (stageCounts[s] !== undefined) stageCounts[s]++; });
  });
  const maxStageCount = Math.max(...Object.values(stageCounts), 1);

  const recentClients = [...clients].slice(0, 8);
  const recentPresentations = [...presentations].slice(0, 8);

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Welcome back to Design Musketeer Presentation Studio.</p>
        </div>
        <button className="btn btn-yellow" onClick={() => navigate('/presentations/new')}>
          + New Presentation
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card-label">Total Presentations</div>
          <div className="stat-card-value">{totalPresentations}</div>
          <div className="stat-card-sub">All time</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Leads Interacted</div>
          <div className="stat-card-value">{interactedCount}</div>
          <div className="stat-card-sub">Had at least 1 presentation</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Clients Won</div>
          <div className="stat-card-value">{wonCount}</div>
          <div className="stat-card-sub">Reached onboarding (M5)</div>
        </div>
        <div className="stat-card" style={{ background: winRate >= 50 ? '#F0FDF4' : winRate >= 25 ? '#FFFBEB' : 'white' }}>
          <div className="stat-card-label">Win Rate</div>
          <div className="stat-card-value" style={{ color: winRate >= 50 ? 'var(--color-green)' : winRate >= 25 ? '#D97706' : 'var(--color-black)' }}>
            {interactedCount > 0 ? `${winRate}%` : '—'}
          </div>
          <div className="stat-card-sub">Won ÷ Interacted</div>
        </div>
      </div>

      {/* Funnel + Recent Clients */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: 24 }}>
        {/* Funnel */}
        <div className="card">
          <div className="card-title" style={{ marginBottom: 16 }}>Client Pipeline Funnel</div>
          {clients.length === 0 ? (
            <div style={{ color: 'var(--color-gray-text)', fontSize: 13.5, padding: '8px 0' }}>No clients yet.</div>
          ) : (
            FUNNEL_STAGES.map((stage, i) => {
              const prevCount = i > 0 ? stageCounts[FUNNEL_STAGES[i - 1]] : null;
              const currentCount = stageCounts[stage];
              const dropPct = (prevCount && prevCount > 0 && currentCount > 0)
                ? Math.round(((prevCount - currentCount) / prevCount) * 100)
                : null;
              return (
                <FunnelBar
                  key={stage}
                  stage={stage}
                  label={STAGE_LABELS[stage]}
                  count={stageCounts[stage]}
                  maxCount={maxStageCount}
                  pct={maxStageCount > 0 ? Math.round((stageCounts[stage] / maxStageCount) * 100) : 0}
                  dropPct={dropPct}
                />
              );
            })
          )}
        </div>

        {/* Recent Clients */}
        <div>
          <div className="card-title" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gray-text)', marginBottom: 12 }}>
            Recent Leads
          </div>
          <div className="table-container">
            {recentClients.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <div className="empty-state-title">No clients yet</div>
                <div className="empty-state-text">Add your first client to get started.</div>
                <button className="btn btn-primary" onClick={() => navigate('/clients')}>Add Client</button>
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Last Meeting</th>
                  </tr>
                </thead>
                <tbody>
                  {recentClients.map(client => (
                    <tr key={client.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/clients/${client.id}`)}>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13.5 }}>{client.full_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>{client.company_name || '—'}</div>
                      </td>
                      <td>
                        {client.last_meeting_type ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <span className={`badge ${getMeetingBadgeClass(client.last_meeting_type)}`}>{client.last_meeting_type}</span>
                            <span style={{ fontSize: 11, color: 'var(--color-gray-text)' }}>{formatDate(client.last_meeting_date)}</span>
                          </div>
                        ) : <span className="text-gray text-small">No meetings</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {clients.length > 0 && (
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/clients')}>
              View all clients →
            </button>
          )}
        </div>
      </div>

      {/* Recent Presentations */}
      <div>
        <div className="card-title" style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gray-text)', marginBottom: 12 }}>
          Recent Presentations
        </div>
        <div className="table-container">
          {recentPresentations.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <div className="empty-state-title">No presentations yet</div>
              <div className="empty-state-text">Generate your first presentation.</div>
              <button className="btn btn-yellow" onClick={() => navigate('/presentations/new')}>+ New Presentation</button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Format</th>
                  <th>Date</th>
                  <th>Download</th>
                </tr>
              </thead>
              <tbody>
                {recentPresentations.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{p.full_name}</div>
                      <div style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>{p.company_name || '—'}</div>
                    </td>
                    <td><span className="badge badge-m1">{p.output_format || '—'}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>{formatDate(p.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {p.file_path_pptx && (
                          <a href={`${API_BASE}${p.file_path_pptx}`} className="download-btn download-btn-pptx" download>PPTX</a>
                        )}
                        {p.file_path_pdf && (
                          <a href={`${API_BASE}${p.file_path_pdf}`} className="download-btn download-btn-pdf" download>PDF</a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {presentations.length > 0 && (
          <button className="btn btn-secondary btn-sm" style={{ marginTop: 10 }} onClick={() => navigate('/presentations')}>
            View all presentations →
          </button>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
