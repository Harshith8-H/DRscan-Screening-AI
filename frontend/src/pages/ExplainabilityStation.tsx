import React, { useState, useEffect } from 'react';
import { ScreeningDetail } from '../types';
import { api } from '../services/api';

interface ExplainabilityStationProps {
  screeningId?: string | null;
  onBack: () => void;
  onNavigateToHistory: (patientId: number) => void;
}

export const ExplainabilityStation: React.FC<ExplainabilityStationProps> = ({
  screeningId,
  onBack,
  onNavigateToHistory
}) => {
  const [activeScreeningId, setActiveScreeningId] = useState<string | null>(screeningId || null);
  const [detail, setDetail] = useState<ScreeningDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [screeningsList, setScreeningsList] = useState<{ id: string; label: string }[]>([]);

  // HUD Viewport Controls
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [activeLayer, setActiveLayer] = useState<'gradcam' | 'preprocessed' | 'annotated' | 'original'>('gradcam');

  // Doctor review form
  const [reviewDecision, setReviewDecision] = useState<string>('CONFIRMED');
  const [reviewGrade, setReviewGrade] = useState<number>(2);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [referralFacility, setReferralFacility] = useState<string>('District Hospital Eye Care Department');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);

  useEffect(() => {
    // Load screenings list for dropdown selection
    api.getScreenings().then((list) => {
      const formatted = list.map((s) => ({
        id: s.screening_id,
        label: `${s.screening_id} - ${s.patient_name || 'Patient'} (Grade ${s.dr_level ?? 0})`
      }));
      setScreeningsList(formatted);
      if (!activeScreeningId && list.length > 0) {
        setActiveScreeningId(list[0].screening_id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (activeScreeningId) {
      loadDetail(activeScreeningId);
    }
  }, [activeScreeningId]);

  const loadDetail = async (id: string) => {
    setLoading(true);
    try {
      const data = await api.getScreeningDetail(id);
      setDetail(data);
      if (data.inference) {
        setReviewGrade(data.inference.prediction.dr_level);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeScreeningId) return;
    setSubmittingReview(true);
    try {
      await api.submitDoctorReview({
        screening_id: activeScreeningId,
        decision: reviewDecision,
        final_dr_level: reviewGrade,
        clinical_notes: reviewNotes,
        referral_facility: referralFacility
      });
      setReviewSuccess('Review recorded and signed off successfully.');
      loadDetail(activeScreeningId);
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[500px] text-[#45464d] text-xs">
        <div className="flex flex-col items-center gap-2">
          <span className="material-symbols-outlined text-3xl animate-spin text-[#0051d5]">sync</span>
          <span>Loading High-Resolution PACS DICOM Viewport...</span>
        </div>
      </div>
    );
  }

  if (!detail || !detail.inference) {
    return (
      <div className="p-8 text-center text-xs text-[#45464d] bg-white rounded border border-[#cbd5e1] m-5">
        No active screening selected. Choose a study to examine.
      </div>
    );
  }

  const { screening, patient, inference, doctor_review } = detail;
  const { prediction, quality, lesions, explainability, recommendation, model } = inference;

  // Decide image source according to active layer
  let displayedImage = screening.original_image_url;
  if (activeLayer === 'gradcam' && explainability.heatmap_url) {
    displayedImage = explainability.heatmap_url;
  } else if (activeLayer === 'preprocessed' && explainability.preprocessed_url) {
    displayedImage = explainability.preprocessed_url;
  } else if (activeLayer === 'annotated' && explainability.annotated_url) {
    displayedImage = explainability.annotated_url;
  }

  return (
    <div className="p-5 flex flex-col gap-4">
      {/* Station Top Control Header */}
      <div className="bg-white p-3 rounded shadow-sm border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] rounded border border-[#cbd5e1] transition cursor-pointer"
            title="Back to Console"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[#0051d5]">{screening.screening_id}</span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#eff4ff] text-[#0b1c30] font-semibold border border-[#cbd5e1]">
              {screening.eye_side === 'RIGHT' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
            </span>
            {prediction.referable ? (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#ffdad6] text-[#93000a] border border-[#ba1a1a]/30">
                REFERABLE DR
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#002114] text-[#85f8c4]">
                NON-REFERABLE
              </span>
            )}
          </div>

          <div className="hidden lg:block text-xs text-[#45464d] border-l border-[#cbd5e1] pl-3">
            Patient: <b className="text-[#0b1c30]">{patient.name}</b> ({patient.patient_code}) • {patient.age}y {patient.sex} • {patient.village_or_phc}
          </div>
        </div>

        {/* Study Selector & Action Buttons */}
        <div className="flex items-center gap-2">
          <select
            value={activeScreeningId || ''}
            onChange={(e) => setActiveScreeningId(e.target.value)}
            className="bg-white border border-[#cbd5e1] rounded px-2.5 py-1 text-xs text-[#0b1c30] focus:outline-none focus:border-[#0051d5] font-mono"
          >
            {screeningsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          <button
            onClick={() => onNavigateToHistory(patient.id)}
            className="px-3 py-1.5 bg-[#eff4ff] hover:bg-[#e5eeff] text-[#0b1c30] rounded border border-[#cbd5e1] text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm text-[#0051d5]">manage_history</span>
            <span>History</span>
          </button>

          <a
            href={`/api/reports/${screening.screening_id}/download`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-1.5 bg-[#000000] hover:bg-[#213145] text-white rounded text-xs font-semibold flex items-center gap-1 shadow-sm transition"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            <span>Official Report</span>
          </a>
        </div>
      </div>

      {/* Main Parallel Workstation: PACS HUD Viewport (Left) & Diagnostic Panel (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8-Span): Diagnostic Dark Viewport (PACS HUD Surface) */}
        <div className="lg:col-span-8 bg-[#090d16] rounded border border-[#334155] relative overflow-hidden flex flex-col justify-between min-h-[560px]">
          {/* Top HUD Telemetry Strip */}
          <div className="absolute top-3 left-3 z-20 bg-[#0f172a]/90 backdrop-blur-sm border border-[#334155] rounded px-3 py-1.5 font-mono text-[11px] text-[#bec6e0] space-y-0.5">
            <div className="text-white font-bold flex items-center gap-1.5">
              <span>{patient.name}</span>
              <span className="text-[#85f8c4]">{patient.patient_code}</span>
            </div>
            <div>
              Laterality:{' '}
              <span className="font-bold text-[#dbe1ff]">
                {screening.eye_side === 'RIGHT' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
              </span>
            </div>
          </div>

          <div className="absolute top-3 right-3 z-20 bg-[#0f172a]/90 backdrop-blur-sm border border-[#334155] rounded px-3 py-1.5 font-mono text-[11px] text-[#bec6e0] text-right space-y-0.5">
            <div className="text-white font-bold">Forus 3nethra Classic</div>
            <div>45° Macula-Centered • Non-Mydriatic</div>
          </div>

          {/* Floating HUD Tool Palette (Center-Top) */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 bg-[#0f172a] border border-[#334155] rounded shadow-xl px-2 py-1 flex items-center gap-1 text-xs">
            {/* Layer Toggles */}
            <button
              onClick={() => setActiveLayer('original')}
              className={`px-2 py-1 rounded font-semibold text-[11px] transition ${
                activeLayer === 'original' ? 'bg-[#0051d5] text-white' : 'text-[#bec6e0] hover:text-white'
              }`}
            >
              Raw
            </button>

            <button
              onClick={() => setActiveLayer('preprocessed')}
              className={`px-2 py-1 rounded font-semibold text-[11px] transition ${
                activeLayer === 'preprocessed' ? 'bg-[#0051d5] text-white' : 'text-[#bec6e0] hover:text-white'
              }`}
            >
              Preprocessed
            </button>

            <button
              onClick={() => setActiveLayer('gradcam')}
              className={`px-2 py-1 rounded font-semibold text-[11px] transition ${
                activeLayer === 'gradcam' ? 'bg-[#0051d5] text-white' : 'text-[#bec6e0] hover:text-white'
              }`}
            >
              Grad-CAM
            </button>

            <button
              onClick={() => setActiveLayer('annotated')}
              className={`px-2 py-1 rounded font-semibold text-[11px] transition ${
                activeLayer === 'annotated' ? 'bg-[#0051d5] text-white' : 'text-[#bec6e0] hover:text-white'
              }`}
            >
              Detections
            </button>

            <div className="w-px h-4 bg-[#334155] mx-1"></div>

            {/* Zoom controls */}
            <button
              onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.2))}
              className="p-1 text-[#bec6e0] hover:text-white"
              title="Zoom out"
            >
              <span className="material-symbols-outlined text-sm">zoom_out</span>
            </button>
            <span className="font-mono text-[10px] text-white w-8 text-center">
              {zoomLevel.toFixed(1)}x
            </span>
            <button
              onClick={() => setZoomLevel(Math.min(3.0, zoomLevel + 0.2))}
              className="p-1 text-[#bec6e0] hover:text-white"
              title="Zoom in"
            >
              <span className="material-symbols-outlined text-sm">zoom_in</span>
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="p-1 text-[#bec6e0] hover:text-white"
              title="Reset Zoom"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
            </button>
          </div>

          {/* Central Fundus Canvas Viewport */}
          <div className="flex-1 flex items-center justify-center p-6 overflow-hidden relative">
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transition: 'transform 0.15s ease-out'
              }}
              className="relative max-w-full max-h-[520px] flex items-center justify-center"
            >
              {activeLayer === 'preprocessed' && !explainability.preprocessed_url ? (
                <div className="text-center text-xs text-[#bec6e0] border border-[#334155] rounded p-5 bg-[#0f172a]">
                  MATLAB preprocessed image is not available for this screening.
                </div>
              ) : (
                <img
                  src={displayedImage}
                  alt={
                    activeLayer === 'original'
                      ? 'Original Retinal Fundus'
                      : activeLayer === 'preprocessed'
                        ? 'MATLAB Preprocessed Fundus'
                        : activeLayer === 'gradcam'
                          ? 'MATLAB Grad-CAM Overlay'
                          : 'Detection / Evidence View'
                  }
                  className="max-h-[500px] w-auto object-contain rounded select-none shadow-2xl"
                />
              )}
            </div>
          </div>

          {/* Bottom HUD Telemetry Strip */}
          <div className="p-3 bg-[#0f172a]/95 border-t border-[#334155] flex items-center justify-between text-[11px] font-mono text-[#bec6e0] z-20">
            <div className="flex items-center gap-3">
              <span>Zoom: {zoomLevel.toFixed(1)}x</span>
              <span>Scale: 500µm reticle</span>
              <span className="text-[#85f8c4]">
                Quality Gate: {quality.status.toUpperCase()} ({Math.round(quality.score * 100)}%)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span>Sharpness: {quality.sharpness}</span>
              <span>Illumination: {quality.illumination}</span>
              <span className="text-[#dbe1ff]">{model.name} v{model.version}</span>
            </div>
          </div>
        </div>

        {/* Right Column (4-Span): Clinical Diagnostic Triage & Tele-Review Panel */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          {/* Finding & Severity Box */}
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#45464d]">
                AI Triage Classification
              </span>
              <span className="font-mono text-xs font-bold text-[#0051d5]">
                {Math.round(prediction.confidence * 100)}% Conf.
              </span>
            </div>

            <div>
              <div className="text-base font-bold text-[#0b1c30]">
                {prediction.label}
              </div>
              <div className="text-xs text-[#45464d] mt-0.5">
                ICDR Scale Severity: Grade {prediction.dr_level} of 4
              </div>
            </div>

            {/* Severity Meter */}
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-[#45464d]">
                <span>G0 (None)</span>
                <span>G1</span>
                <span>G2</span>
                <span>G3</span>
                <span>G4 (PDR)</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {[0, 1, 2, 3, 4].map((lvl) => {
                  const isActive = prediction.dr_level === lvl;
                  const colors = [
                    'bg-[#069669]',
                    'bg-[#316bf3]',
                    'bg-[#0051d5]',
                    'bg-[#ba1a1a]',
                    'bg-[#93000a]'
                  ];
                  return (
                    <div
                      key={lvl}
                      className={`h-2 rounded ${
                        isActive
                          ? `${colors[lvl]} ring-2 ring-[#0051d5]/40`
                          : 'bg-[#e5eeff]'
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Lesion Analysis Status */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-[#45464d] uppercase tracking-wider block">
                Lesion Analysis
              </span>
              <div className="p-2.5 rounded bg-[#f8fafc] border border-[#cbd5e1] text-[11px] text-[#45464d] leading-relaxed">
                Lesion segmentation and lesion-specific detection are not enabled in the current pipeline.
                Visual evidence is provided by MATLAB preprocessing and Grad-CAM outputs.
              </div>
            </div>

            {/* Recommendation Strip */}
            <div className="p-2.5 rounded bg-[#eff4ff] border border-[#cbd5e1] text-xs space-y-1">
              <div className="font-bold text-[#0051d5] flex items-center justify-between">
                <span>{recommendation.action.replace(/_/g, ' ')}</span>
                <span className="font-mono text-[10px] uppercase font-bold text-[#ba1a1a]">
                  {recommendation.urgency}
                </span>
              </div>
              <p className="text-[#45464d] text-[11px] leading-relaxed">
                {recommendation.reason}
              </p>
            </div>
          </div>

          {/* Specialist Tele-Ophthalmology Sign-Off Form */}
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#0051d5]">assignment_turned_in</span>
                <span>Specialist Doctor Validation &amp; Sign-off</span>
              </span>
              {doctor_review && (
                <span className="text-[10px] font-bold text-[#069669] bg-[#002114] px-1.5 py-0.5 rounded">
                  SIGNED
                </span>
              )}
            </div>

            {doctor_review ? (
              <div className="p-3 bg-[#eff4ff] rounded border border-[#cbd5e1] text-xs space-y-1.5">
                <div className="flex justify-between text-[#45464d]">
                  <span>Validated by: <b className="text-[#0b1c30]">{doctor_review.doctor_name}</b></span>
                  <span className="font-mono text-[#0051d5] font-bold">{doctor_review.decision}</span>
                </div>
                <div className="text-[#0b1c30]">
                  Clinical Confirmation: <b className="text-[#0051d5]">Grade {doctor_review.final_dr_level ?? prediction.dr_level}</b>
                </div>
                {doctor_review.clinical_notes && (
                  <p className="text-[11px] text-[#45464d] italic bg-white p-2 rounded border border-[#e2e8f0]">
                    "{doctor_review.clinical_notes}"
                  </p>
                )}
                {doctor_review.referral_facility && (
                  <div className="text-[11px] text-[#0051d5]">
                    Referral Hospital: {doctor_review.referral_facility}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-2.5 text-xs">
                {reviewSuccess && (
                  <div className="p-2 rounded bg-[#002114] text-[#85f8c4] text-xs font-semibold">
                    {reviewSuccess}
                  </div>
                )}

                <div>
                  <label className="block text-[#0b1c30] font-semibold mb-1">Clinical Review Action</label>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30] text-xs focus:border-[#0051d5]"
                  >
                    <option value="CONFIRMED">Confirm AI Findings (Concur)</option>
                    <option value="MODIFIED">Modify DR Grade (Override)</option>
                    <option value="REJECTED">Reject AI Assessment</option>
                    <option value="REQUIRES_FURTHER_REVIEW">Request Tertiary Teleconsult</option>
                  </select>
                </div>

                {reviewDecision === 'MODIFIED' && (
                  <div>
                    <label className="block text-[#0b1c30] font-semibold mb-1">Override DR Grade</label>
                    <select
                      value={reviewGrade}
                      onChange={(e) => setReviewGrade(Number(e.target.value))}
                      className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30] text-xs"
                    >
                      <option value={0}>Grade 0: No DR</option>
                      <option value={1}>Grade 1: Mild NPDR</option>
                      <option value={2}>Grade 2: Moderate NPDR</option>
                      <option value={3}>Grade 3: Severe NPDR</option>
                      <option value={4}>Grade 4: Proliferative DR</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-[#0b1c30] font-semibold mb-1">Doctor Remarks &amp; Management Notes</label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter clinical notes, OCT order, or laser treatment plan..."
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30] text-xs focus:border-[#0051d5]"
                  />
                </div>

                <div>
                  <label className="block text-[#0b1c30] font-semibold mb-1">Referral Eye Center</label>
                  <input
                    type="text"
                    value={referralFacility}
                    onChange={(e) => setReferralFacility(e.target.value)}
                    className="w-full bg-white border border-[#cbd5e1] rounded p-2 text-[#0b1c30] text-xs focus:border-[#0051d5]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2 bg-[#000000] hover:bg-[#213145] text-white font-semibold rounded text-xs transition cursor-pointer shadow-sm"
                >
                  {submittingReview ? 'Submitting...' : 'Sign Off Doctor Review (OD/OS)'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
