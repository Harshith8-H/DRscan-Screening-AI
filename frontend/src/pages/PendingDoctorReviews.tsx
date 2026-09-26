import React, { useState, useEffect } from 'react';
import { Screening } from '../types';
import { api } from '../services/api';

interface PendingDoctorReviewsProps {
  onSelectScreening: (screeningId: string) => void;
}

export const PendingDoctorReviews: React.FC<PendingDoctorReviewsProps> = ({ onSelectScreening }) => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const list = await api.getPendingReviews();
      setScreenings(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = screenings.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      s.screening_id.toLowerCase().includes(q) ||
      (s.patient_name && s.patient_name.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Header */}
      <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-[#0b1c30] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#ba1a1a]">assignment_turned_in</span>
            <span>District Tele-Ophthalmologist Review Worklist</span>
          </h1>
          <p className="text-xs text-[#45464d] mt-0.5">
            Prioritized clinical verification queue for rural PHC cases flagged with referable diabetic retinopathy or poor image quality.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-mono text-xs px-2.5 py-1 rounded bg-[#ffdad6] text-[#93000a] font-bold">
            {screenings.length} cases awaiting validation
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center bg-white border border-[#cbd5e1] rounded px-3 py-1.5 gap-2 max-w-md shadow-xs">
        <span className="material-symbols-outlined text-base text-[#76777d]">search</span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter worklist by patient name, study ID..."
          className="bg-transparent text-xs text-[#0b1c30] focus:outline-none w-full"
        />
      </div>

      {/* Triage Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => {
          const isUrgent = s.dr_level && s.dr_level >= 3;
          return (
            <div
              key={s.screening_id}
              className="bg-white rounded border border-[#e2e8f0] p-4 flex flex-col justify-between gap-3 shadow-xs hover:border-[#0051d5] transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#0051d5]">{s.screening_id}</span>
                  <span className="font-mono text-[10px] text-[#45464d]">
                    {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-sm text-[#0b1c30]">{s.patient_name || 'Patient'}</div>
                  <div className="text-[11px] text-[#45464d] font-mono">
                    {s.patient_code} • {s.eye_side === 'RIGHT' ? 'OD (Right)' : 'OS (Left)'}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      isUrgent
                        ? 'bg-[#ffdad6] text-[#93000a]'
                        : 'bg-[#dbe1ff] text-[#00174b]'
                    }`}
                  >
                    Grade {s.dr_level}: {s.dr_label ? s.dr_label.split(' (')[0] : 'Referable'}
                  </span>
                  {s.confidence && (
                    <span className="font-mono text-[10px] text-[#45464d]">
                      {Math.round(s.confidence * 100)}% Conf
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-[#e2e8f0] pt-2.5 flex items-center justify-between">
                <span className="text-[11px] text-[#ba1a1a] font-semibold flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  <span>Awaiting Sign-off</span>
                </span>

                <button
                  onClick={() => onSelectScreening(s.screening_id)}
                  className="bg-[#000000] hover:bg-[#213145] text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer transition shadow-xs"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  <span>Examine</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="p-8 text-center text-xs text-[#45464d] bg-white rounded border border-[#e2e8f0]">
          <span className="material-symbols-outlined text-3xl text-[#069669] mb-1 block">check_circle</span>
          <span>Zero pending reviews. All referable cases have been signed off.</span>
        </div>
      )}
    </div>
  );
};
