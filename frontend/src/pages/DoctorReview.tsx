import React, { useState, useEffect } from 'react';
import {
  FileCheck2,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Filter,
  ArrowRight
} from 'lucide-react';
import { Screening } from '../types';
import { api } from '../services/api';

interface DoctorReviewProps {
  onSelectScreening: (screeningId: string) => void;
}

export const DoctorReview: React.FC<DoctorReviewProps> = ({ onSelectScreening }) => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<'pending' | 'referable' | 'all'>('pending');

  useEffect(() => {
    loadData();
  }, [filterMode]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (filterMode === 'pending') {
        const list = await api.getPendingReviews();
        setScreenings(list);
      } else if (filterMode === 'referable') {
        const list = await api.getScreenings({ referable_only: true });
        setScreenings(list);
      } else {
        const list = await api.getScreenings();
        setScreenings(list);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = screenings.filter((s) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      s.screening_id.toLowerCase().includes(term) ||
      (s.patient_name && s.patient_name.toLowerCase().includes(term)) ||
      (s.patient_code && s.patient_code.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
            <FileCheck2 className="w-5 h-5 text-teal-400" />
            <span>District Tele-Ophthalmologist Review Queue</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Prioritized clinical triage worklist for rural PHC screenings flagged with referable DR or diagnostic ambiguity.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setFilterMode('pending')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterMode === 'pending'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Pending Review
          </button>
          <button
            onClick={() => setFilterMode('referable')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterMode === 'referable'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Referable
          </button>
          <button
            onClick={() => setFilterMode('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition ${
              filterMode === 'all'
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Records
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 space-x-2">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by screening ID, patient code, or patient name..."
          className="bg-transparent border-none text-xs text-slate-200 focus:outline-none w-full"
        />
      </div>

      {/* Review Queue Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s) => (
          <div
            key={s.screening_id}
            className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 flex flex-col justify-between space-y-3 transition group"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-teal-400">{s.screening_id}</span>
                <span className="text-[11px] text-slate-400">
                  {new Date(s.created_at).toLocaleDateString()}
                </span>
              </div>

              <div className="mt-2">
                <div className="font-bold text-slate-200 text-sm">{s.patient_name || 'Patient'}</div>
                <div className="text-slate-400 text-xs">
                  {s.patient_code} • {s.eye_side === 'RIGHT' ? 'OD (Right)' : 'OS (Left)'}
                </div>
              </div>

              <div className="mt-3 flex items-center space-x-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                    s.dr_level && s.dr_level >= 2
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  Grade {s.dr_level ?? 0}: {s.dr_label ? s.dr_label.split(' (')[0] : 'N/A'}
                </span>

                {s.confidence && (
                  <span className="text-[11px] text-slate-400 font-mono">
                    {Math.round(s.confidence * 100)}% Conf
                  </span>
                )}
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between">
              <div>
                {s.review_decision ? (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{s.review_decision}</span>
                  </span>
                ) : (
                  <span className="text-amber-400 text-xs font-semibold flex items-center space-x-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Doctor Sign-off</span>
                  </span>
                )}
              </div>

              <button
                onClick={() => onSelectScreening(s.screening_id)}
                className="px-3 py-1.5 bg-teal-500/10 hover:bg-teal-500 text-teal-400 hover:text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1"
              >
                <span>Review</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-xl space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-semibold text-slate-200">No screenings in queue</h3>
          <p className="text-xs text-slate-400">All referable screenings have been reviewed or filter matched no records.</p>
        </div>
      )}
    </div>
  );
};
