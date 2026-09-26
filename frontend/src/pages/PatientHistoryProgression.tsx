import React, { useState, useEffect } from 'react';
import { Patient, PatientHistory } from '../types';
import { api } from '../services/api';

interface PatientHistoryProgressionProps {
  initialPatientId?: number | null;
  onSelectScreening: (screeningId: string) => void;
}

export const PatientHistoryProgression: React.FC<PatientHistoryProgressionProps> = ({
  initialPatientId,
  onSelectScreening
}) => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(initialPatientId || null);
  const [historyData, setHistoryData] = useState<PatientHistory | null>(null);
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
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5]">manage_history</span>
            <span>Longitudinal Diabetic Retinopathy Progression Monitor</span>
          </h1>
          <p className="text-xs text-[#45464d] mt-0.5">
            Serial fundus screening telemetry tracking disease severity progression to detect rapid capillary deterioration.
          </p>
        </div>

        {/* Patient Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#0b1c30] font-semibold">Select Patient:</label>
          <select
            value={selectedPatientId || ''}
            onChange={(e) => setSelectedPatientId(Number(e.target.value))}
            className="bg-white border border-[#cbd5e1] rounded px-3 py-1.5 text-xs text-[#0b1c30] focus:border-[#0051d5] font-medium"
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
        <div className="py-12 text-center text-xs text-[#45464d]">
          Loading patient trajectory data...
        </div>
      ) : historyData ? (
        <div className="flex flex-col gap-5">
          {/* Patient Header Card */}
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#0b1c30]">{historyData.patient.name}</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#eff4ff] text-[#0051d5] font-bold">
                  {historyData.patient.patient_code}
                </span>
                <span className="text-xs text-[#45464d]">
                  {historyData.patient.age} yrs • {historyData.patient.sex}
                </span>
              </div>
              <div className="text-xs text-[#45464d] flex gap-4 flex-wrap">
                <span>Village/PHC: <b className="text-[#0b1c30]">{historyData.patient.village_or_phc || 'PHC'}</b></span>
                <span>Diabetes Duration: <b className="text-[#0b1c30]">{historyData.patient.diabetes_duration_years || 'N/A'} yrs</b></span>
                {historyData.patient.hba1c && (
                  <span>HbA1c: <b className="text-[#d97706]">{historyData.patient.hba1c}%</b></span>
                )}
              </div>
            </div>

            <div className="text-right">
              <div className="text-[11px] text-[#45464d]">Trajectory Risk Status:</div>
              <div className="text-sm font-bold text-[#0051d5]">{historyData.risk_trend || 'Stable'}</div>
            </div>
          </div>

          {/* Progression Alert */}
          {historyData.progression_alert && (
            <div className="p-3.5 rounded bg-[#ffdad6] border border-[#ba1a1a]/30 flex items-start gap-2.5 text-[#93000a]">
              <span className="material-symbols-outlined text-lg shrink-0 mt-0.5">warning</span>
              <div className="text-xs leading-relaxed">
                <span className="font-bold uppercase tracking-wider block">Clinical Progression Detected</span>
                <span>{historyData.progression_alert}</span>
              </div>
            </div>
          )}

          {/* DR Severity Progression Chart */}
          <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="text-xs font-bold text-[#0b1c30] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#0051d5]">trending_up</span>
                <span>Diabetic Retinopathy Grade Over Serial Screenings (ICDR Scale)</span>
              </span>
              <span className="text-xs text-[#45464d] font-mono">
                {historyData.screenings.length} serial studies recorded
              </span>
            </div>

            {/* SVG Visual Timeline */}
            <div className="bg-[#f8f9ff] rounded p-4 border border-[#e2e8f0]">
              <div className="relative h-44 w-full flex items-end justify-between px-8 pt-4 pb-2">
                {[0, 1, 2, 3, 4].map((lvl) => {
                  const bottomPct = (lvl / 4) * 80 + 10;
                  return (
                    <div
                      key={lvl}
                      style={{ bottom: `${bottomPct}%` }}
                      className="absolute left-10 right-4 border-b border-[#cbd5e1]/60 flex items-center"
                    >
                      <span className="absolute -left-8 text-[10px] font-mono text-[#76777d]">
                        Grade {lvl}
                      </span>
                    </div>
                  );
                })}

                {historyData.screenings.map((s) => {
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
                      <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition bg-[#131b2e] text-white px-2 py-1 rounded text-[10px] whitespace-nowrap z-20 pointer-events-none shadow-lg">
                        <div className="font-bold text-[#85f8c4]">Grade {lvl}: {s.label}</div>
                        <div className="text-[#bec6e0]">{new Date(s.date).toLocaleDateString()}</div>
                      </div>

                      {/* Dot */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-md transition transform group-hover:scale-125 ${
                          lvl >= 2 ? 'bg-[#ba1a1a] ring-2 ring-[#ba1a1a]/30' : 'bg-[#0051d5] ring-2 ring-[#0051d5]/30'
                        }`}
                      >
                        {lvl}
                      </div>

                      <div className="absolute top-7 text-[10px] text-[#45464d] font-mono whitespace-nowrap">
                        {new Date(s.date).toLocaleDateString(undefined, { month: 'short', year: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-4"></div>
            </div>
          </div>

          {/* Serial Study Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {historyData.screenings.map((s) => (
              <div
                key={s.screening_id}
                className="bg-white rounded border border-[#e2e8f0] p-3.5 flex flex-col justify-between gap-3 shadow-xs"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#0051d5]">{s.screening_id}</span>
                    <span className="text-[#45464d] text-[11px] font-mono">{new Date(s.date).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <img
                      src={s.gradcam_url || s.image_url}
                      alt="Fundus"
                      className="w-14 h-14 rounded object-cover bg-black border border-[#cbd5e1]"
                    />
                    <div className="text-xs space-y-0.5">
                      <div className="font-bold text-[#0b1c30]">
                        Grade {s.dr_level}: {s.label ? s.label.split(' (')[0] : 'Study'}
                      </div>
                      <div className="text-[11px] text-[#45464d] font-mono">
                        {s.eye_side} Eye • {s.confidence ? `${Math.round(s.confidence * 100)}% Conf` : ''}
                      </div>
                      {s.referable && (
                        <span className="text-[10px] text-[#ba1a1a] font-bold block uppercase">
                          Referable Case
                        </span>
                      )}
                    </div>
                  </div>

                  {s.doctor_decision && (
                    <div className="text-[11px] text-[#069669] bg-[#eff4ff] p-1.5 rounded flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">verified</span>
                      <span>Review: {s.doctor_decision}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectScreening(s.screening_id)}
                  className="w-full py-1.5 bg-[#eff4ff] hover:bg-[#0051d5] hover:text-white text-[#0051d5] font-semibold rounded text-xs transition cursor-pointer flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>Examine Study</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
};
