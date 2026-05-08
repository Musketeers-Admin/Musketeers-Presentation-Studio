import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import API_BASE from '../config';

function getMeetingBadgeClass(type) {
  const map = {
    'M1': 'badge-m1', 'M2': 'badge-m2', 'M3': 'badge-m3',
    'M2+M3': 'badge-m2m3', 'M4': 'badge-m4', 'M5': 'badge-m5'
  };
  return map[type] || 'badge-m1';
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Presentations() {
  const navigate = useNavigate();
  const [presentations, setPresentations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    fetchPresentations();
  }, []);

  async function fetchPresentations() {
    setLoading(true);
    const res = await axios.get('/api/presentations');
    setPresentations(res.data);
    setLoading(false);
  }

  async function deletePresentation(id) {
    if (!window.confirm('Delete this presentation?')) return;
    await axios.delete(`/api/presentations/${id}`);
    setPresentations(ps => ps.filter(p => p.id !== id));
  }

  const FILTERS = ['All', 'M1', 'M2', 'M2+M3', 'M3', 'M4', 'M5'];

  const filtered = presentations.filter(p => {
    if (activeFilter === 'All') return true;
    return p.output_format === activeFilter || true; // filter by meeting type would need join
    // For now, show all since meeting type isn't stored directly on presentations
  });

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <span>Loading presentations...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Presentations</h1>
          <p className="page-subtitle">{presentations.length} presentation{presentations.length !== 1 ? 's' : ''} generated.</p>
        </div>
        <button className="btn btn-yellow" onClick={() => navigate('/presentations/new')}>
          + New Presentation
        </button>
      </div>

      {presentations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <div className="empty-state-title">No presentations yet</div>
          <div className="empty-state-text">Generate your first AI-powered presentation for a client.</div>
          <button className="btn btn-yellow" onClick={() => navigate('/presentations/new')}>
            + New Presentation
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th>Company</th>
                <th>Format</th>
                <th>Slides</th>
                <th>Date</th>
                <th>Downloads</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {presentations.map(p => {
                let slides = [];
                if (Array.isArray(p.slide_list)) slides = p.slide_list;
                else {
                  try { slides = JSON.parse(p.slide_list || '[]'); } catch {}
                }
                return (
                  <tr key={p.id}>
                    <td>
                      <span
                        style={{ fontWeight: 600, cursor: 'pointer', color: 'var(--color-blue)' }}
                        onClick={() => navigate(`/clients/${p.client_id}`)}
                      >
                        {p.full_name}
                      </span>
                    </td>
                    <td>{p.company_name || '—'}</td>
                    <td>
                      <span className="badge badge-m1">{p.output_format || '—'}</span>
                    </td>
                    <td>{slides.length} slides</td>
                    <td style={{ fontSize: 12.5 }}>{formatDate(p.created_at)}</td>
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
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-danger btn-sm" onClick={() => deletePresentation(p.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Presentations;
