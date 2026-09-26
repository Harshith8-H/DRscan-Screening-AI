import React, { useState, useEffect } from 'react';
import {
  History,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Eye,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { Patient, PatientHistory as IPatientHistory } from '../types';
import { api } from '../services/api';

interface PatientHistoryProps {
  initialPatientId?: number | null;
  onSelectScreening: (screeningId: string) => void;
}

export const PatientHistory: React.FC<PatientHistoryProps> = ({ initialPatientId, onSelectScreening }) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(initialPatientId || null);
  const [historyData, setHistoryData] = useState<IPatientHistory | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getPatients().then((list) => {
      setPatients(list);
      if (!selectedPatientId && list.length > 0) {
        setSelectedPatientId(list[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedPatientId) {
      loadHistory(selectedPatientId);
    }
  }, [selectedPatientId]);

  const loadHistory = async (id: number) => {
    setLoading(true);
    try {
      const data = await api.getPatientHistory(id);
      setHistoryData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <History className="w-5 h-5 text-teal-400" />
            <span>Longitudinal Retinopathy Progression Monitoring</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tracking disease progression over serial visits to detect rapid capillary deterioration and prevent irreversible vision loss.
          </p>
        </div>

        {/* Patient Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-300 font-semibold">Select Patient:</label>
          <select
            value={selectedPatientId || ''}
            onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-teal-500 font-medium"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.patient_code} - {p.name} ({p.village_or_phc || 'PHC'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">
          Loading longitudinal patient trajectory...
        </div>
      ) : historyData ? (
        <div className="space-y-6">
          {/* Patient Overview Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white">{historyData.patient.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-teal-400">
                  {historyData.patient.patient_code}
                </span>
                <span className="text-xs text-slate-400">
                  {historyData.patient.age} yrs • {historyData.patient.sex}
                </span>
              </div>
              <div className="text-xs text-slate-400 flex space-x-4">
                <span>Village: <b className="text-slate-300">{historyData.patient.village_or_phc || 'PHC'}</b></span>
                <span>Diabetes Duration: <b className="text-slate-300">{historyData.patient.diabetes_duration_years || 'N/A'} yrs</b></span>
                {historyData.patient.hba1c && (
                  <span>HbA1c: <b className="text-amber-400">{historyData.patient.hba1c}%</b></span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-xs text-slate-400">Trajectory Assessment:</div>
              <div className="text-sm font-bold text-teal-400">{historyData.risk_trend || 'Stable'}</div>
            </div>
          </div>

          {/* Progression Alert Banner */}
          {historyData.progression_alert && (
            <div className="bg-rose-500/10 border border-rose-500/40 rounded-2xl p-4 flex items-start space-x-3 text-rose-300">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-rose-400">
                  Automated Clinical Progression Alert
                </div>
                <div className="text-xs mt-1 leading-relaxed">
                  {historyData.progression_alert}
                </div>
              </div>
            </div>
          )}

          {/* DR Severity Progression Chart (Section 20) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                <span>Diabetic Retinopathy Grade Over Time (ICDR Severity Scale)</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {historyData.screenings.length} serial screenings recorded
              </span>
            </div>

            {/* Visual SVG Timeline Chart */}
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800/80">
              <div className="relative h-48 w-full flex items-end justify-between px-6 pt-6 pb-2">
                {/* Horizontal reference lines for Grades 0-4 */}
                {[0, 1, 2, 3, 4].map((lvl) => {
                  const bottomPct = (lvl / 4) * 80 + 10;
                  return (
                    <div
                      key={lvl}
                      style={{ bottom: `${bottomPct}%` }}
                      className="absolute left-10 right-4 border-b border-slate-800/60 flex items-center"
                    >
                      <span className="absolute -left-8 text-[10px] font-mono text-slate-500">
                        G{lvl}
                      </span>
                    </div>
                  );
                })}

                {/* Plot Points & Connecting Lines */}
                {historyData.screenings.map((s, idx) => {
                  const lvl = s.dr_level ?? 0;
                  const bottomPct = (lvl / 4) * 80 + 10;
                  return (
                    <div
                      key={s.screening_id}
                      style={{ bottom: `${bottomPct}%` }}
                      className="relative z-10 flex flex-col items-center group cursor-pointer"
                      onClick={() => onSelectScreening(s.screening_id)}
                    >
                      {/* Tooltip */}
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition bg-slate-900 border border-slate-700 px-2 py-1 rounded text-[10px] whitespace-nowrap z-20 pointer-events-none shadow-xl">
                        <div className="font-bold text-teal-300">Grade {lvl}: {s.label}</div>
                        <div className="text-slate-400">{new Date(s.date).toLocaleDateString()}</div>
                      </div>

                      {/* Point Dot */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs shadow-lg transition transform group-hover:scale-125 ${
                          lvl >= 2
                            ? 'bg-rose-500 text-white ring-4 ring-rose-500/20'
                            : 'bg-teal-500 text-slate-950 ring-4 ring-teal-500/20'
                        }`}
                      >
                        {lvl}
                      </div>

                      {/* Date label at bottom */}
                      <div className="absolute top-8 text-[10px] text-slate-400 font-mono whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-6" /> {/* Spacer for date labels */}
            </div>
          </div>

          {/* Historical Screening Cards */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Serial Fundus Screening Records
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {historyData.screenings.map((s) => (
                <div
                  key={s.screening_id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-teal-400">{s.screening_id}</span>
                      <span className="text-slate-400 text-[11px]">{new Date(s.date).toLocaleDateString()}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <img
                        src={s.gradcam_url || s.image_url}
                        alt="Fundus"
                        className="w-16 h-16 rounded-lg object-cover bg-black border border-slate-800"
                      />
                      <div className="text-xs space-y-1">
                        <div className="font-semibold text-slate-200">
                          Grade {s.dr_level}: {s.label ? s.label.split(' (')[0] : 'N/A'}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {s.eye_side} Eye • {s.confidence ? `${Math.round(s.confidence*100)}% Conf` : ''}
                        </div>
                        {s.referable && (
                          <div className="text-[10px] text-rose-400 font-bold uppercase">
                            Referable Finding
                          </div>
                        )}
                      </div>
                    </div>

                    {s.doctor_decision && (
                      <div className="text-[11px] text-emerald-400 bg-emerald-500/10 p-1.5 rounded flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Doctor: {s.doctor_decision}</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onSelectScreening(s.screening_id)}
                    className="w-full py-1.5 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300 font-semibold rounded-lg text-xs transition flex items-center justify-center space-x-1"
                  >
                    <span>View Explainability</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
