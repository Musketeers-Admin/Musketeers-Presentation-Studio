import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const ALL_SLIDES = [
  { id: 1, name: 'Cover', type: 'personalized' },
  { id: 2, name: 'Who we are', type: 'mixed' },
  { id: 3, name: 'Who you are', type: 'personalized' },
  { id: 4, name: 'What we noticed', type: 'personalized' },
  { id: 5, name: 'The challenge', type: 'personalized' },
  { id: 6, name: 'Our solution for you', type: 'personalized' },
  { id: 7, name: 'Discovery questions', type: 'mixed' },
  { id: 8, name: 'Case study', type: 'mixed' },
  { id: 9, name: 'What we heard', type: 'personalized' },
  { id: 10, name: 'Scope of work', type: 'personalized' },
  { id: 11, name: 'Timeline', type: 'personalized' },
  { id: 12, name: 'Investment', type: 'personalized' },
  { id: 13, name: 'How we work', type: 'mixed' },
  { id: 14, name: 'How revisions work', type: 'fixed' },
  { id: 15, name: 'Day one playbook', type: 'personalized' },
  { id: 16, name: 'Your team', type: 'personalized' },
  { id: 17, name: "What we're building together", type: 'personalized' },
  { id: 18, name: 'Week 1 expectations', type: 'personalized' },
  { id: 19, name: 'Next step', type: 'mixed' },
  { id: 20, name: 'Proof + Trusted by', type: 'fixed' },
];

const SLIDE_MAP = {};
ALL_SLIDES.forEach(s => { SLIDE_MAP[s.id] = s; });

function getSlideBadgeClass(type) {
  if (type === 'personalized') return 'badge-personalized';
  if (type === 'fixed') return 'badge-fixed';
  return 'badge-mixed';
}

function hasCaseStudySlide(selectedSlides) {
  return selectedSlides.includes(8);
}

function Step2({ state, updateState, onNext, onNextSkipStep3, onBack }) {
  const [suggested, setSuggested] = useState([]);
  const [removedSlides, setRemovedSlides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkedOrder, setCheckedOrder] = useState([]);
  const [uncheckedOrder, setUncheckedOrder] = useState([]);
  const [learnedApplied, setLearnedApplied] = useState(false);
  const [prefDataPoints, setPrefDataPoints] = useState(0);
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const dragItem = useRef(null);

  useEffect(() => {
    if (!state.client || !state.meetingType) { setLoading(false); return; }
    fetchSuggested();
  }, [state.client, state.meetingType]);

  async function fetchSuggested() {
    setLoading(true);
    try {
      const res = await axios.get('/api/presentations/suggest-slides', {
        params: { client_id: state.client.id, meeting_type: state.meetingType }
      });
      const { slides, removedSlides: removed, learnedApplied: learned, prefDataPoints: pts } = res.data;
      setSuggested(slides);
      setRemovedSlides(removed || []);
      setLearnedApplied(!!learned);
      setPrefDataPoints(pts || 0);

      const allIds = ALL_SLIDES.map(s => s.id);
      const unchecked = allIds.filter(id => !slides.includes(id));
      setCheckedOrder(slides);
      setUncheckedOrder(unchecked);
      updateState({ selectedSlides: slides, allPossibleSlides: allIds });
    } catch (err) { console.error(err); }
    setLoading(false);
  }

  function resetToSuggested() {
    const allIds = ALL_SLIDES.map(s => s.id);
    const unchecked = allIds.filter(id => !suggested.includes(id));
    setCheckedOrder([...suggested]);
    setUncheckedOrder(unchecked);
    updateState({ selectedSlides: suggested });
  }

  async function handleResetPreferences() {
    if (!window.confirm(`Reset learned preferences for ${state.meetingType}? It will go back to default logic.`)) return;
    await axios.get('/api/presentations/reset-preferences', { params: { meeting_type: state.meetingType } });
    fetchSuggested();
  }

  function uncheckSlide(id) {
    const newChecked = checkedOrder.filter(sid => sid !== id);
    setCheckedOrder(newChecked);
    setUncheckedOrder(u => [...u, id]);
    updateState({ selectedSlides: newChecked });
  }

  function recheckSlide(id) {
    const newChecked = [...checkedOrder, id];
    setCheckedOrder(newChecked);
    setUncheckedOrder(u => u.filter(sid => sid !== id));
    updateState({ selectedSlides: newChecked });
  }

  function handleDragStart(e, index) {
    dragItem.current = index;
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragEnter(index) {
    if (dragItem.current === index) return;
    setDragOverIndex(index);
  }

  function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function handleDrop(e, index) {
    e.preventDefault();
    if (dragItem.current === null || dragItem.current === index) {
      dragItem.current = null;
      setDragOverIndex(null);
      return;
    }
    const newOrder = [...checkedOrder];
    const draggedId = newOrder.splice(dragItem.current, 1)[0];
    newOrder.splice(index, 0, draggedId);
    dragItem.current = null;
    setDragOverIndex(null);
    setCheckedOrder(newOrder);
    updateState({ selectedSlides: newOrder });
  }

  function handleDragEnd() {
    dragItem.current = null;
    setDragOverIndex(null);
  }

  const caseStudyIncluded = hasCaseStudySlide(checkedOrder);
  const selectedCount = checkedOrder.length;

  if (loading) {
    return (
      <div className="card">
        <div className="loading-state">
          <div className="spinner spinner-lg"></div>
          <span>Calculating suggested slides...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <style>{`
        .slide-drag-handle {
          cursor: grab;
          color: var(--color-gray-text);
          font-size: 16px;
          padding: 0 4px;
          user-select: none;
          display: flex;
          align-items: center;
          opacity: 0.5;
          transition: opacity 0.15s;
        }
        .slide-drag-handle:active { cursor: grabbing; }
        .slide-item:hover .slide-drag-handle { opacity: 1; }
        .slide-item-drag-over {
          border-top: 2px solid var(--color-blue) !important;
        }
        .hidden-slides-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          padding: 10px 0;
          font-size: 13px;
          font-weight: 600;
          color: var(--color-gray-text);
          border: none;
          background: none;
          width: 100%;
          text-align: left;
        }
        .hidden-slides-toggle:hover { color: var(--color-black); }
        .slide-item-unchecked {
          opacity: 0.6;
        }
      `}</style>

      {/* Learned preferences notice */}
      {learnedApplied && (
        <div className="alert alert-blue" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="alert-title">Based on your preferences</div>
              <div style={{ fontSize: 13, marginTop: 2 }}>Slide selection learned from {prefDataPoints} previous {state.meetingType} presentations.</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleResetPreferences}>Reset to Default</button>
          </div>
        </div>
      )}

      {/* Removed slides notice */}
      {removedSlides.length > 0 && !learnedApplied && (
        <div className="alert alert-yellow" style={{ marginBottom: 16 }}>
          <div className="alert-title">Slides automatically removed for this meeting:</div>
          <ul style={{ marginTop: 8, paddingLeft: 20 }}>
            {removedSlides.map(s => (
              <li key={s.id} style={{ marginBottom: 4, fontSize: 13 }}>
                <strong>Slide {s.id}: {s.name}</strong> — {s.reason}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div className="card-title" style={{ marginBottom: 2 }}>Slide Selection</div>
            <div style={{ fontSize: 13, color: 'var(--color-gray-text)' }}>
              {selectedCount} slides selected. Drag to reorder.
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={resetToSuggested}>Reset to Suggested</button>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="badge badge-personalized">personalized</span>
            <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>Claude writes fresh</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="badge badge-mixed">mixed</span>
            <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>Semi-personalized</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="badge badge-fixed">fixed</span>
            <span style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>Standard content</span>
          </div>
        </div>

        {/* Active (checked) slides — draggable */}
        <div className="slide-list">
          {checkedOrder.map((id, index) => {
            const slide = SLIDE_MAP[id];
            if (!slide) return null;
            const isDragTarget = dragOverIndex === index;
            return (
              <div
                key={id}
                className={`slide-item${isDragTarget ? ' slide-item-drag-over' : ''}`}
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragEnter={() => handleDragEnter(index)}
                onDragOver={handleDragOver}
                onDrop={e => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
              >
                <span className="slide-drag-handle" title="Drag to reorder">⠿</span>
                <input
                  type="checkbox"
                  checked={true}
                  onChange={() => uncheckSlide(id)}
                  style={{ cursor: 'pointer', width: 16, height: 16 }}
                />
                <div className="slide-item-num">{index + 1}</div>
                <div className="slide-item-name">{slide.name}</div>
                <span className={`badge ${getSlideBadgeClass(slide.type)}`}>{slide.type}</span>
              </div>
            );
          })}
        </div>

        {/* Hidden (unchecked) slides — collapsible */}
        {uncheckedOrder.length > 0 && (
          <div style={{ borderTop: '1px solid var(--color-gray-border)', marginTop: 8 }}>
            <button className="hidden-slides-toggle" onClick={() => setHiddenOpen(o => !o)}>
              <span style={{ fontSize: 12 }}>{hiddenOpen ? '▼' : '▶'}</span>
              Hidden slides ({uncheckedOrder.length})
            </button>
            {hiddenOpen && (
              <div className="slide-list" style={{ marginTop: 0 }}>
                {uncheckedOrder.map(id => {
                  const slide = SLIDE_MAP[id];
                  if (!slide) return null;
                  return (
                    <div key={id} className="slide-item slide-item-unchecked">
                      <span style={{ width: 20, display: 'inline-block' }} />
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => recheckSlide(id)}
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                      <div className="slide-item-num" style={{ color: 'var(--color-gray-text)' }}>—</div>
                      <div className="slide-item-name">{slide.name}</div>
                      <span className={`badge ${getSlideBadgeClass(slide.type)}`}>{slide.type}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case study notice */}
      {!caseStudyIncluded && (
        <div className="alert" style={{ marginTop: 12, background: '#F9FAFB', border: '1px solid var(--color-gray-border)', borderRadius: 6, padding: '10px 14px', fontSize: 13, color: 'var(--color-gray-text)' }}>
          Case study slide is unchecked — Step 3 will be skipped and you'll go directly to Generate.
        </div>
      )}

      <div className="wizard-nav">
        <button className="btn btn-secondary" onClick={onBack}>← Back</button>
        <button
          className="btn btn-primary"
          onClick={caseStudyIncluded ? onNext : onNextSkipStep3}
          disabled={selectedCount === 0}
        >
          {caseStudyIncluded ? 'Continue to Case Studies →' : 'Continue to Generate →'}
        </button>
      </div>
    </div>
  );
}

export default Step2;
