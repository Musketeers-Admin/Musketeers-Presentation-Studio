import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';

// Steps: 1=Client&Meeting, 2=Slides, 3=CaseStudies, 4=Generate
// Step 3 can be skipped if case study slide is not selected

function WizardProgress({ currentStep, step3Skipped }) {
  const steps = [
    { num: 1, label: 'Step 1', title: 'Client & Meeting' },
    { num: 2, label: 'Step 2', title: 'Slide Selection' },
    { num: 3, label: 'Step 3', title: 'Case Studies' },
    { num: 4, label: 'Step 4', title: 'Generate' },
  ];

  return (
    <div className="wizard-progress">
      {steps.map((step, i) => {
        const isSkipped = step.num === 3 && step3Skipped;
        const isActive = currentStep === step.num && !isSkipped;
        const isCompleted = currentStep > step.num && !isSkipped;
        return (
          <React.Fragment key={step.num}>
            <div className={`wizard-step${isActive ? ' active' : ''}${isCompleted ? ' completed' : ''}${isSkipped ? ' skipped' : ''}`}>
              <div className="wizard-step-num">
                {isCompleted ? '✓' : isSkipped ? '—' : step.num}
              </div>
              <div className="wizard-step-info">
                <div className="wizard-step-label" style={isSkipped ? { textDecoration: 'line-through', opacity: 0.45 } : {}}>
                  {step.label}
                </div>
                <div className="wizard-step-title" style={isSkipped ? { opacity: 0.45, fontSize: 11 } : {}}>
                  {isSkipped ? 'Skipped' : step.title}
                </div>
              </div>
            </div>
            {i < steps.length - 1 && (
              <div className={`wizard-connector${isCompleted || (isSkipped && currentStep > step.num) ? ' done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function SummaryPanel({ state, step3Skipped }) {
  return (
    <div className="card wizard-sidebar">
      <div className="card-title">Summary</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <div className="info-label">Client</div>
          <div className="info-value">{state.client ? state.client.full_name : '—'}</div>
          {state.client?.company_name && (
            <div style={{ fontSize: 12, color: 'var(--color-gray-text)' }}>{state.client.company_name}</div>
          )}
        </div>
        <div>
          <div className="info-label">Meeting Type</div>
          <div className="info-value">
            {state.meetingType ? (
              <span className={`badge badge-${state.meetingType.toLowerCase().replace('+', '')}`}>{state.meetingType}</span>
            ) : '—'}
          </div>
        </div>
        <div>
          <div className="info-label">Service</div>
          <div className="info-value">{state.servicePitched || '—'}</div>
        </div>
        <div>
          <div className="info-label">Date</div>
          <div className="info-value">{state.meetingDate || '—'}</div>
        </div>
        <div>
          <div className="info-label">Slides Selected</div>
          <div className="info-value">{state.selectedSlides ? state.selectedSlides.length : '—'}</div>
        </div>
        <div>
          <div className="info-label">Case Studies</div>
          <div className="info-value">
            {step3Skipped ? <span style={{ color: 'var(--color-gray-text)', fontStyle: 'italic', fontSize: 12 }}>Skipped</span> : (state.selectedCaseStudies ? state.selectedCaseStudies.length : '—')}
          </div>
        </div>
        <div>
          <div className="info-label">Format</div>
          <div className="info-value">{state.outputFormat || '—'}</div>
        </div>
      </div>
    </div>
  );
}

function NewPresentation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prefilledClientId = searchParams.get('client_id');

  const [step, setStep] = useState(1);
  const [step3Skipped, setStep3Skipped] = useState(false);
  const [state, setState] = useState({
    client: null,
    meetingType: '',
    meetingDate: new Date().toISOString().split('T')[0],
    servicePitched: '',
    extraContext: '',
    meetingNotes: '',
    selectedSlides: [],
    allPossibleSlides: [],
    selectedCaseStudies: [],
    partnerBrandIds: [],
    brandNameToggle: true,
    outputFormat: 'Both',
  });

  function updateState(updates) {
    setState(s => ({ ...s, ...updates }));
  }

  function goNext() { setStep(s => Math.min(s + 1, 4)); }

  // Skip step 3, go directly to step 4
  function goNextSkipStep3() {
    setStep3Skipped(true);
    updateState({ selectedCaseStudies: [] });
    setStep(4);
  }

  function goBack() {
    if (step === 1) {
      navigate('/presentations');
    } else if (step === 4 && step3Skipped) {
      // Go back to step 2, not step 3
      setStep(2);
    } else {
      setStep(s => s - 1);
    }
  }

  // When step 2 advances normally, reset skip flag
  function handleStep2Next() {
    setStep3Skipped(false);
    goNext();
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: 20 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/presentations')}>
          ← Back to Presentations
        </button>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">New Presentation</h1>
          <p className="page-subtitle">Build a personalized AI-generated presentation in 4 steps.</p>
        </div>
      </div>

      <WizardProgress currentStep={step} step3Skipped={step3Skipped} />

      <div className="wizard-layout">
        <div className="wizard-main">
          {step === 1 && (
            <Step1
              state={state}
              updateState={updateState}
              prefilledClientId={prefilledClientId}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 2 && (
            <Step2
              state={state}
              updateState={updateState}
              onNext={handleStep2Next}
              onNextSkipStep3={goNextSkipStep3}
              onBack={goBack}
            />
          )}
          {step === 3 && !step3Skipped && (
            <Step3
              state={state}
              updateState={updateState}
              onNext={goNext}
              onBack={goBack}
            />
          )}
          {step === 4 && (
            <Step4
              state={state}
              updateState={updateState}
              step3Skipped={step3Skipped}
              onBack={goBack}
            />
          )}
        </div>

        <SummaryPanel state={state} step3Skipped={step3Skipped} />
      </div>
    </div>
  );
}

export default NewPresentation;
