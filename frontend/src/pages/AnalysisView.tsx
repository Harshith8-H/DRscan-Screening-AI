import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileText,
  Info,
  Maximize2,
  Layers,
  Sparkles,
  ShieldAlert,
  Clock,
  ExternalLink
} from 'lucide-react';
import { ScreeningDetail } from '../types';
import { api } from '../services/api';

interface AnalysisViewProps {
  screeningId: string;
  onBack: () => void;
  onNavigateToHistory: (patientId: number) => void;
}

export const AnalysisView: React.FC<AnalysisViewProps> = ({
  screeningId,
  onBack,
  onNavigateToHistory
}) => {
  const [detail, setDetail] = useState<ScreeningDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeViewTab, setActiveViewTab] = useState<'gradcam' | 'preprocessed' | 'original' | 'annotated' | 'side-by-side'>('gradcam');
  
  // Doctor review form state
  const [reviewDecision, setReviewDecision] = useState<string>('CONFIRMED');
  const [reviewGrade, setReviewGrade] = useState<number>(0);
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [referralFacility, setReferralFacility] = useState<string>('District Hospital Eye Care Department');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccessMsg, setReviewSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    loadDetail();
  }, [screeningId]);

  const loadDetail = async () => {
    setLoading(true);
    try {
      const data = await api.getScreeningDetail(screeningId);
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
    setSubmittingReview(true);
    try {
      await api.submitDoctorReview({
        screening_id: screeningId,
        decision: reviewDecision,
        final_dr_level: reviewGrade,
        clinical_notes: reviewNotes,
        referral_facility: referralFacility
      });
      setReviewSuccessMsg('Review recorded and signed off successfully.');
      loadDetail();
    } catch (err: any) {
      alert(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400">Loading Explainable AI multi-modal outputs...</p>
        </div>
      </div>
    );
  }

  if (!detail || !detail.inference) {
    return (
      <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <p className="text-sm text-slate-300">Screening record not found or still processing.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 bg-slate-800 text-teal-400 rounded-lg text-xs font-semibold"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const { screening, patient, inference, doctor_review } = detail;
  const { prediction, quality, lesions, explainability, recommendation, model } = inference;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-teal-400 text-base">{screening.screening_id}</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-300">
                {screening.eye_side === 'RIGHT' ? 'OD (Right Eye)' : 'OS (Left Eye)'}
              </span>
              {prediction.referable ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse">
                  REFERABLE DR DETECTED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  NON-REFERABLE (MONITOR)
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Patient: <span className="text-slate-200 font-semibold">{patient.name}</span> ({patient.patient_code}) • {patient.age}y {patient.sex} • {patient.village_or_phc}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigateToHistory(patient.id)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
          >
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>Longitudinal History</span>
          </button>

          <a
            href={`/api/reports/${screening.screening_id}/download`}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-1.5 shadow-lg shadow-teal-500/20 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Official Medical PDF</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Visual Explainability Gallery & Findings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (7-Span): Multi-Modal Visual Evidence Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-4 space-y-3">
            {/* View Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveViewTab('gradcam')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeViewTab === 'gradcam'
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Grad-CAM Heatmap
                </button>
                <button
                  onClick={() => setActiveViewTab('preprocessed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeViewTab === 'preprocessed'
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Preprocessed
                </button>
                <button
                  onClick={() => setActiveViewTab('annotated')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeViewTab === 'annotated'
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Detections
                </button>
                <button
                  onClick={() => setActiveViewTab('original')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeViewTab === 'original'
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Original
                </button>
                <button
                  onClick={() => setActiveViewTab('side-by-side')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    activeViewTab === 'side-by-side'
                      ? 'bg-teal-500 text-slate-950'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Compare All
                </button>
              </div>

              <div className="text-[11px] text-slate-400 font-mono">
                Res: {model.input_size} • RGB
              </div>
            </div>

            {/* Display Canvas */}
            <div className="relative bg-black rounded-xl overflow-hidden min-h-[380px] flex items-center justify-center border border-slate-800">
              {activeViewTab === 'gradcam' && (
                <img
                  src={explainability.heatmap_url || screening.original_image_url}
                  alt="Grad-CAM Heatmap"
                  className="max-h-[460px] w-auto object-contain"
                />
              )}
{activeViewTab === 'annotated' && (
                <img
                  src={explainability.annotated_url || screening.original_image_url}
                  alt="Annotated Detections"
                  className="max-h-[460px] w-auto object-contain"
                />
              )}
              {activeViewTab === 'original' && (
                <img
                  src={screening.original_image_url}
                  alt="Original Retinal Fundus"
                  className="max-h-[460px] w-auto object-contain"
                />
              )}
              {activeViewTab === 'side-by-side' && (
                <div className="grid grid-cols-2 gap-2 p-2 w-full">
                  <div className="text-center">
                    <img
                      src={screening.original_image_url}
                      alt="Original"
                      className="w-full h-44 object-contain rounded bg-slate-950"
                    />
                    <div className="text-[10px] text-slate-400 mt-1 font-semibold">1. Original Photo</div>
                  </div>
                  <div className="text-center">
                    <img
                      src={explainability.heatmap_url || screening.original_image_url}
                      alt="Grad-CAM"
                      className="w-full h-44 object-contain rounded bg-slate-950"
                    />
                    <div className="text-[10px] text-teal-400 mt-1 font-semibold">3. Grad-CAM Activation</div>
                  </div>
                  <div className="text-center">
                    {explainability.preprocessed_url ? (
                      <img
                        src={explainability.preprocessed_url}
                        alt="MATLAB Preprocessed"
                        className="w-full h-44 object-contain rounded bg-slate-950"
                      />
                    ) : (
                      <div className="w-full h-44 flex items-center justify-center rounded bg-slate-950 text-[10px] text-slate-500">
                        Preprocessed image unavailable
                      </div>
                    )}
                    <div className="text-[10px] text-teal-400 mt-1 font-semibold">2. MATLAB Preprocessed</div>
                  </div>
                  <div className="text-center">
                    <img
                      src={explainability.annotated_url || screening.original_image_url}
                      alt="Detections"
                      className="w-full h-44 object-contain rounded bg-slate-950"
                    />
                    <div className="text-[10px] text-rose-400 mt-1 font-semibold">4. Detection / Evidence View</div>
                  </div>
                </div>
              )}

              {/* View Overlay Caption */}
              <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                {activeViewTab === 'gradcam' && 'Grad-CAM highlights neural network activation hot-spots (Red/Yellow = Highest Diagnostic Weight)'}
                {activeViewTab === 'preprocessed' && 'MATLAB-preprocessed fundus image used by the EfficientNet-B0 inference pipeline'}
                {activeViewTab === 'annotated' && 'Detection / evidence view generated from the available MATLAB Grad-CAM overlay'}
                {activeViewTab === 'original' && 'Raw captured fundus photograph before contrast enhancement'}
                {activeViewTab === 'side-by-side' && 'Multi-modal synchronization comparison'}
              </div>
            </div>

            {/* Quality Gate Status Strip */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="text-slate-400">Quality Gate:</span>
                <span
                  className={`font-semibold uppercase px-2 py-0.5 rounded text-[10px] ${
                    quality.is_acceptable
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {quality.status} (Score: {Math.round(quality.score * 100)}%)
                </span>
              </div>
              <div className="text-slate-400 text-[11px] flex space-x-3">
                <span>Sharpness: {quality.sharpness}</span>
                <span>Illumination: {quality.illumination}</span>
              </div>
            </div>
            {quality.issues.length > 0 && (
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <div>
                  <span className="font-semibold">Quality Notice: </span>
                  {quality.issues.join(' ')}
                </div>
              </div>
            )}
          </div>

          {/* Model Information Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
            <div className="font-semibold text-slate-300 flex items-center justify-between">
              <span>Model Audit & Transparency</span>
              <span className="text-[10px] text-teal-400 font-mono">Inference: {inference.inference_time_ms} ms</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-400 text-[11px]">
              <div>
                <span className="text-slate-500 block">Model:</span>
                <span className="text-slate-200 font-mono">{model.name}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Version:</span>
                <span className="text-slate-200 font-mono">v{model.version}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Architecture:</span>
                <span className="text-slate-200 truncate block">{model.architecture}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Trained On:</span>
                <span className="text-slate-200 truncate block">{model.dataset}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5-Span): Triage Classification, Lesions & Doctor Review */}
        <div className="lg:col-span-5 space-y-4">
          {/* DR Classification & Confidence Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div>
              <span className="text-xs uppercase font-mono font-bold tracking-wider text-slate-400">
                AI Triage Classification
              </span>
              <div className="flex items-baseline justify-between mt-1">
                <h2 className="text-xl font-extrabold text-white">
                  {prediction.label}
                </h2>
                <div className="text-sm font-bold text-teal-400 font-mono">
                  {Math.round(prediction.confidence * 100)}% Conf.
                </div>
              </div>
            </div>

            {/* Severity Meter (0 to 4) */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-mono text-slate-400">
                <span>Grade 0</span>
                <span>Grade 1</span>
                <span>Grade 2</span>
                <span>Grade 3</span>
                <span>Grade 4</span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {[0, 1, 2, 3, 4].map((lvl) => {
                  const isActive = prediction.dr_level === lvl;
                  const colors: Record<number, string> = {
                    0: isActive ? 'bg-emerald-500 shadow-lg shadow-emerald-500/40 ring-2 ring-emerald-300' : 'bg-slate-800',
                    1: isActive ? 'bg-blue-500 shadow-lg shadow-blue-500/40 ring-2 ring-blue-300' : 'bg-slate-800',
                    2: isActive ? 'bg-amber-500 shadow-lg shadow-amber-500/40 ring-2 ring-amber-300' : 'bg-slate-800',
                    3: isActive ? 'bg-orange-500 shadow-lg shadow-orange-500/40 ring-2 ring-orange-300' : 'bg-slate-800',
                    4: isActive ? 'bg-rose-500 shadow-lg shadow-rose-500/40 ring-2 ring-rose-300' : 'bg-slate-800'
                  };
                  return (
                    <div
                      key={lvl}
                      className={`h-2.5 rounded-full transition-all ${colors[lvl]}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Class Probabilities Distribution */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-semibold text-slate-400">Posterior Probabilities</span>
              <div className="space-y-1">
                {Object.entries(prediction.class_probabilities).map(([k, v]) => {
                  const pct = Math.round(v * 100);
                  return (
                    <div key={k} className="flex items-center text-[10px] space-x-2">
                      <span className="w-16 text-slate-400 font-mono capitalize">{k.replace('_', ' ')}</span>
                      <div className="flex-1 bg-slate-950 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-teal-500 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-8 text-right font-mono text-slate-300">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lesion Analysis Status */}
            <div className="border-t border-slate-800 pt-4">
              <span className="text-xs font-semibold text-slate-300 block mb-2">Lesion Analysis</span>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-[11px] text-slate-400">
                Lesion segmentation and lesion-specific detection are not enabled in the current pipeline.
                The visual evidence currently comes from the MATLAB preprocessing and Grad-CAM outputs.
              </div>
            </div>

            {/* Recommendation & Clinical Guideline Box */}
            <div className="bg-teal-500/10 border border-teal-500/30 rounded-xl p-3.5 text-xs space-y-1.5">
              <div className="font-bold text-teal-300 flex items-center justify-between">
                <span>Action: {recommendation.action.replace(/_/g, ' ')}</span>
                <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-teal-500/20">
                  {recommendation.urgency}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">{recommendation.reason}</p>
              {recommendation.clinical_guideline && (
                <p className="text-teal-400/90 text-[11px] italic pt-1 border-t border-teal-500/20">
                  Guideline: {recommendation.clinical_guideline}
                </p>
              )}
            </div>
          </div>

          {/* Doctor Tele-Ophthalmology Review Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-slate-200 flex items-center space-x-1.5">
                <FileCheck2 className="w-4 h-4 text-teal-400" />
                <span>Specialist Tele-Ophthalmologist Review</span>
              </div>
              {doctor_review && (
                <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  REVIEW SIGNED
                </span>
              )}
            </div>

            {doctor_review ? (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                <div className="text-slate-400 flex justify-between">
                  <span>Reviewed by: <b className="text-slate-200">{doctor_review.doctor_name}</b></span>
                  <span className="font-mono text-[10px] text-teal-400">{doctor_review.decision}</span>
                </div>
                <div className="text-slate-300">
                  Final Decision: <span className="font-bold text-teal-300">Grade {doctor_review.final_dr_level ?? prediction.dr_level}</span>
                </div>
                {doctor_review.clinical_notes && (
                  <div className="text-slate-400 text-[11px] bg-slate-900/60 p-2 rounded">
                    "{doctor_review.clinical_notes}"
                  </div>
                )}
                {doctor_review.referral_facility && (
                  <div className="text-[11px] text-teal-400">
                    Referral: {doctor_review.referral_facility}
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-3 text-xs">
                {reviewSuccessMsg && (
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-400 text-xs font-semibold">
                    {reviewSuccessMsg}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Decision</label>
                  <select
                    value={reviewDecision}
                    onChange={(e) => setReviewDecision(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  >
                    <option value="CONFIRMED">Confirm AI Findings (Concur)</option>
                    <option value="MODIFIED">Modify DR Grade (Override)</option>
                    <option value="REJECTED">Reject AI Assessment</option>
                    <option value="REQUIRES_FURTHER_REVIEW">Request Tertiary Vitreo-Retinal Teleconsult</option>
                  </select>
                </div>

                {reviewDecision === 'MODIFIED' && (
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Override Final DR Grade</label>
                    <select
                      value={reviewGrade}
                      onChange={(e) => setReviewGrade(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
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
                  <label className="block text-slate-300 font-semibold mb-1">Clinical Notes & Findings</label>
                  <textarea
                    rows={2}
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Enter doctor clinical remarks, laser/anti-VEGF recommendation..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Referral Eye Center</label>
                  <input
                    type="text"
                    value={referralFacility}
                    onChange={(e) => setReferralFacility(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg transition"
                >
                  {submittingReview ? 'Submitting...' : 'Sign Off Doctor Tele-Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
