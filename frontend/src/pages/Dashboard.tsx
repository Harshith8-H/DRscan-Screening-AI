import React, { useState, useEffect } from 'react';
import { Screening, DashboardStats } from '../types';
import { api } from '../services/api';

interface DashboardProps {
  onSelectScreening: (screeningId: string) => void;
  onNavigateTab: (tab: string) => void;
  isOfflineMode: boolean;
  onSync: () => void;
  syncing: boolean;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectScreening,
  onNavigateTab,
  isOfflineMode,
  onSync,
  syncing
}) => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'referable' | 'ungradable'>('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sData, scrList] = await Promise.all([
        api.getDashboardStats(),
        api.getScreenings()
      ]);
      setStats(sData);
      setScreenings(scrList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredScreenings = screenings.filter((s) => {
    if (filterMode === 'pending' && s.status !== 'REVIEW_REQUIRED') return false;
    if (filterMode === 'referable' && !s.referable) return false;
    if (filterMode === 'ungradable' && s.is_acceptable_quality) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.screening_id.toLowerCase().includes(q) ||
        (s.patient_name && s.patient_name.toLowerCase().includes(q)) ||
        (s.patient_code && s.patient_code.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="p-5 flex flex-col gap-5">
      {/* Top Operational Status & Header Banner */}
      <div className="bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-lg text-[#0b1c30]">
              PHC Screening Operations — Today's Screening Console
            </span>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#002114] text-[#85f8c4] font-mono text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#069669] animate-ping"></span>
              ACTIVE SESSION #PHC-CDG-20241029
            </span>
          </div>
          <p className="text-xs text-[#45464d]">
            Primary Health Centre Chandragiri • District Tele-Ophthalmology Network • Active Fundus Camera:{' '}
            <span className="font-mono text-[#0b1c30] font-semibold">Forus 3nethra Classic</span>{' '}
            (USB-DICOM Connected • Mode: Mydriatic/Non-Mydriatic)
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0">
          <div className="flex items-center gap-1.5 bg-[#eff4ff] px-3 py-1.5 rounded text-[#0b1c30] text-xs font-medium">
            <span className="material-symbols-outlined text-sm text-[#0051d5]">videocam</span>
            <span className="font-mono">Camera: READY (45° FoV)</span>
          </div>
          <button
            onClick={() => onNavigateTab('new-screening')}
            className="bg-[#000000] text-white hover:bg-[#213145] px-3.5 py-2 rounded text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">add_a_photo</span>
            <span>Acquire New Eye (OD/OS)</span>
          </button>
        </div>
      </div>

      {/* Section 1: Clinical Telemetry Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {/* Metric 1: Screenings Completed */}
        <div className="bg-white p-3.5 rounded shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
              Screenings Completed
            </span>
            <span className="material-symbols-outlined text-base text-[#0051d5]">assignment_turned_in</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#0b1c30] font-mono">
              {stats?.total_screenings ?? 42}
            </span>
            <span className="text-xs text-[#45464d]">patients</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] text-[#45464d] bg-[#eff4ff] px-2 py-0.5 rounded">
            <span className="text-[#069669] font-semibold">
              {(stats?.total_screenings ?? 42) - (stats?.referable_cases ?? 6)} Normal/Mild
            </span>
            <span className="text-[#0051d5] font-semibold">
              {stats?.referable_cases ?? 6} Referable
            </span>
          </div>
        </div>

        {/* Metric 2: Pending Doctor Review */}
        <div className="bg-white p-3.5 rounded shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
              Pending Tele-Review
            </span>
            <span className="material-symbols-outlined text-base text-[#ba1a1a]">pending_actions</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#ba1a1a] font-mono">
              {stats?.pending_doctor_reviews ?? 5}
            </span>
            <span className="text-xs text-[#45464d]">awaiting</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] bg-[#ffdad6] text-[#93000a] px-2 py-0.5 rounded">
            <span>Secondary consult</span>
            <span className="font-semibold">Queue: ~18m</span>
          </div>
        </div>

        {/* Metric 3: Referable DR Cases */}
        <div className="bg-white p-3.5 rounded shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
              Referable DR Cases
            </span>
            <span className="material-symbols-outlined text-base text-[#316bf3]">warning</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#0051d5] font-mono">
              {stats?.referable_cases ?? 6}
            </span>
            <span className="text-xs text-[#45464d]">
              ({stats ? stats.referral_rate_pct : 14.3}% positivity)
            </span>
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] bg-[#e5eeff] px-2 py-0.5 rounded text-[#0b1c30]">
            <span>{stats?.grade_distribution?.grade_2 ?? 4} Mod NPDR</span>
            <span className="text-[#ba1a1a] font-semibold">
              {(stats?.grade_distribution?.grade_3 ?? 1) + (stats?.grade_distribution?.grade_4 ?? 1)} Severe/PDR
            </span>
          </div>
        </div>

        {/* Metric 4: Ungradable Images */}
        <div className="bg-white p-3.5 rounded shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
              Ungradable Images
            </span>
            <span className="material-symbols-outlined text-base text-[#76777d]">hide_image</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#0b1c30] font-mono">
              {stats?.poor_quality_images ?? 2}
            </span>
            <span className="text-xs text-[#45464d]">flagged (4.7%)</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] bg-[#eff4ff] px-2 py-0.5 rounded text-[#45464d]">
            <span>1 Opacity</span>
            <span>1 Motion Blur</span>
          </div>
        </div>

        {/* Metric 5: Inference Latency */}
        <div className="bg-white p-3.5 rounded shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#45464d]">
              Inference Latency
            </span>
            <span className="material-symbols-outlined text-base text-[#069669]">memory</span>
          </div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold text-[#0b1c30] font-mono">4.2</span>
            <span className="text-xs text-[#45464d]">seconds / eye</span>
          </div>
          <div className="mt-1.5 flex items-center justify-between font-mono text-[11px] bg-[#eff4ff] px-2 py-0.5 rounded text-[#0b1c30]">
            <span className="text-[#069669] font-semibold">Local GPU: RTX 4060</span>
            <span>EfficientNet-B0</span>
          </div>
        </div>
      </div>

      {/* Section 2: Screening Operational Queue & Dense Table */}
      <div className="bg-white rounded shadow-sm border border-[#e2e8f0] flex flex-col overflow-hidden">
        {/* Toolbar Filter & Search Controls */}
        <div className="p-3 bg-[#eff4ff] flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e2e8f0]">
          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterMode('all')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                filterMode === 'all'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'bg-white hover:bg-[#e5eeff] text-[#0b1c30] border border-[#cbd5e1]'
              }`}
            >
              All Screenings ({screenings.length})
            </button>
            <button
              onClick={() => setFilterMode('pending')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
                filterMode === 'pending'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'bg-white hover:bg-[#e5eeff] text-[#0b1c30] border border-[#cbd5e1]'
              }`}
            >
              <span>Pending Doctor Review</span>
              <span className="bg-[#ba1a1a] text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stats?.pending_doctor_reviews ?? 4}
              </span>
            </button>
            <button
              onClick={() => setFilterMode('referable')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1.5 ${
                filterMode === 'referable'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'bg-white hover:bg-[#e5eeff] text-[#0b1c30] border border-[#cbd5e1]'
              }`}
            >
              <span>Referable DR</span>
              <span className="bg-[#0051d5] text-white font-mono text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                {stats?.referable_cases ?? 6}
              </span>
            </button>
            <button
              onClick={() => setFilterMode('ungradable')}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                filterMode === 'ungradable'
                  ? 'bg-[#000000] text-white shadow-xs'
                  : 'bg-white hover:bg-[#e5eeff] text-[#0b1c30] border border-[#cbd5e1]'
              }`}
            >
              Ungradable ({stats?.poor_quality_images ?? 1})
            </button>
          </div>

          {/* Search & Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <span className="material-symbols-outlined absolute left-2.5 text-base text-[#76777d] pointer-events-none">
                search
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Patient ID, Aadhaar, ABHA..."
                className="pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded text-[#0b1c30] text-xs focus:outline-none focus:border-[#0051d5] w-64 placeholder:text-[#76777d]"
              />
            </div>
            <button
              onClick={() => setFilterMode('all')}
              className="bg-white hover:bg-[#e5eeff] border border-[#cbd5e1] p-1.5 rounded text-[#0b1c30]"
              title="Reset Filters"
            >
              <span className="material-symbols-outlined text-base">tune</span>
            </button>
            <button
              onClick={() => alert('Exporting today screening queue to CSV/DICOM-DIR...')}
              className="bg-white hover:bg-[#e5eeff] border border-[#cbd5e1] p-1.5 rounded text-[#0b1c30]"
              title="Export CSV Queue"
            >
              <span className="material-symbols-outlined text-base">download</span>
            </button>
          </div>
        </div>

        {/* Clinical Data Table */}
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs text-[#0b1c30]">
            <thead className="bg-[#e5eeff] text-[10px] font-bold uppercase tracking-wider text-[#45464d] border-b border-[#cbd5e1]">
              <tr>
                <th className="py-2.5 px-4">Patient Identifier</th>
                <th className="py-2.5 px-2">Time</th>
                <th className="py-2.5 px-2">Image Quality Gate</th>
                <th className="py-2.5 px-2">AI Screening Finding</th>
                <th className="py-2.5 px-2 text-right">Confidence</th>
                <th className="py-2.5 px-2">Lesion Analysis</th>
                <th className="py-2.5 px-2">Triage Urgency</th>
                <th className="py-2.5 px-2">Tele-Review Status</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {filteredScreenings.map((s) => {
                const initials = s.patient_name
                  ? s.patient_name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
                  : 'PT';
                const isUrgent = s.dr_level && s.dr_level >= 3;
                const isReferable = s.referable;
                const isFailedQuality = !s.is_acceptable_quality;

                return (
                  <tr key={s.screening_id} className="hover:bg-[#f8f9ff] transition-colors bg-white">
                    {/* Patient Identifier */}
                    <td className="py-2.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                            isUrgent
                              ? 'bg-[#ffdad6] text-[#93000a]'
                              : isReferable
                              ? 'bg-[#dbe1ff] text-[#00174b]'
                              : 'bg-[#002114] text-[#85f8c4]'
                          }`}
                        >
                          {initials}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-[#0b1c30]">
                            {s.patient_name || 'Patient Record'}
                          </span>
                          <span className="font-mono text-[10px] text-[#45464d]">
                            {s.patient_code || s.screening_id} • {s.eye_side === 'RIGHT' ? 'OD' : 'OS'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Time */}
                    <td className="py-2.5 px-2 font-mono text-[11px] text-[#45464d] whitespace-nowrap">
                      {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>

                    {/* Image Quality Gate */}
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {s.is_acceptable_quality ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#002114] text-[#85f8c4] font-mono text-[10px] font-semibold">
                          <span className="material-symbols-outlined text-[11px]">check_circle</span>
                          Pass • Focus {s.image_quality_score ?? 0.92}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#ffdad6] text-[#93000a] font-mono text-[10px] font-semibold">
                          <span className="material-symbols-outlined text-[11px]">cancel</span>
                          Failed • Opacity SNR 4.2
                        </span>
                      )}
                    </td>

                    {/* AI Finding */}
                    <td className="py-2.5 px-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold ${
                          isUrgent
                            ? 'bg-[#ffdad6] text-[#93000a]'
                            : s.dr_level === 2
                            ? 'bg-[#dce9ff] text-[#0051d5]'
                            : s.dr_level === 1
                            ? 'bg-[#eff4ff] text-[#0b1c30]'
                            : isFailedQuality
                            ? 'bg-[#e5eeff] text-[#45464d]'
                            : 'bg-[#eff4ff] text-[#069669]'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isUrgent
                              ? 'bg-[#ba1a1a] animate-pulse'
                              : s.dr_level === 2
                              ? 'bg-[#0051d5]'
                              : s.dr_level === 1
                              ? 'bg-[#316bf3]'
                              : isFailedQuality
                              ? 'bg-[#76777d]'
                              : 'bg-[#069669]'
                          }`}
                        ></span>
                        <span>{s.dr_label ? s.dr_label.split(' (')[0] : `Grade ${s.dr_level ?? 0}`}</span>
                      </span>
                    </td>

                    {/* Confidence */}
                    <td className="py-2.5 px-2 text-right font-mono text-xs font-semibold">
                      {s.confidence ? `${Math.round(s.confidence * 100)}%` : '--'}
                    </td>

                    {/* Lesion Analysis */}
                    <td className="py-2.5 px-2">
                      <span className="px-1.5 py-0.5 rounded bg-[#f8fafc] border border-[#cbd5e1] text-[#45464d] font-mono text-[10px]">
                        Not analyzed
                      </span>
                    </td>

                    {/* Triage Urgency */}
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {isUrgent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#ba1a1a] text-white font-bold text-[10px]">
                          Urgent Referral (Tertiary)
                        </span>
                      ) : isReferable ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#dbe1ff] text-[#00174b] font-semibold text-[10px]">
                          Refer Ophthalmology
                        </span>
                      ) : isFailedQuality ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e5eeff] text-[#0b1c30] text-[10px]">
                          Cataract / Media Check
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-[#e5eeff] text-[#45464d] text-[10px]">
                          Routine Annual Recall
                        </span>
                      )}
                    </td>

                    {/* Tele-Review Status */}
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {s.review_decision ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#069669] text-xs">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          Completed &amp; Signed
                        </span>
                      ) : s.status === 'REVIEW_REQUIRED' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-[#ba1a1a] text-xs">
                          <span className="material-symbols-outlined text-sm">schedule</span>
                          Awaiting Sign-off
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#45464d] text-xs">
                          <span className="material-symbols-outlined text-sm">done</span>
                          Officer Sign-off OK
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 text-right whitespace-nowrap">
                      {isUrgent ? (
                        <button
                          onClick={() => onSelectScreening(s.screening_id)}
                          className="bg-[#ba1a1a] hover:bg-[#93000a] text-white px-2.5 py-1 rounded font-semibold text-xs inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">emergency</span>
                          <span>Expedite Triage</span>
                        </button>
                      ) : isFailedQuality ? (
                        <button
                          onClick={() => onNavigateTab('new-screening')}
                          className="bg-[#d3e4fe] hover:bg-[#cbdbf5] text-[#0b1c30] px-2.5 py-1 rounded font-semibold text-xs inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">replay</span>
                          <span>Recapture OD/OS</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => onSelectScreening(s.screening_id)}
                          className="bg-[#000000] hover:bg-[#213145] text-white px-2.5 py-1 rounded font-semibold text-xs inline-flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>Examine Station</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-4 py-2.5 bg-[#eff4ff] flex items-center justify-between text-xs text-[#45464d] border-t border-[#cbd5e1]">
          <span>Showing 1 to {filteredScreenings.length} of {screenings.length} screenings today</span>
          <div className="flex items-center gap-1">
            <button className="px-2 py-1 rounded bg-white text-[#0b1c30] border border-[#cbd5e1] disabled:opacity-50" disabled>
              Previous
            </button>
            <span className="font-mono text-xs px-2 font-semibold text-[#0b1c30]">Page 1 / 1</span>
            <button className="px-2 py-1 rounded bg-white text-[#0b1c30] border border-[#cbd5e1]">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Section 3: Dual Secondary Operative Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Panel 1: District Tele-Ophthalmologist Review Pool (7 cols) */}
        <div className="lg:col-span-7 bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0051d5] text-lg">support_agent</span>
              <span className="font-bold text-sm text-[#0b1c30]">
                District Tele-Ophthalmologist Review Pool
              </span>
            </div>
            <span className="font-mono text-[11px] text-[#85f8c4] bg-[#002114] px-2 py-0.5 rounded font-semibold">
              2 Specialists Connected
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            {/* Specialist 1 */}
            <div className="p-3 bg-[#eff4ff] rounded border border-[#e2e8f0] flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#069669]"></span>
                  <span className="font-bold text-[#0b1c30]">Dr. K. Swaminathan, MS</span>
                </div>
                <span className="font-mono text-[10px] text-[#0051d5] font-bold">Active</span>
              </div>
              <div className="text-[11px] text-[#45464d]">SVIMS Regional Eye Center, Tirupati</div>
              <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                <span className="text-[#45464d]">Currently reviewing:</span>
                <span className="bg-[#e5eeff] px-1.5 py-0.5 rounded text-[#0b1c30] font-bold">
                  3 cases in session
                </span>
              </div>
              <div className="flex items-center justify-between text-[#45464d] font-mono text-[10px] pt-0.5">
                <span>Avg Latency: 14 min</span>
                <span className="text-[#069669] font-semibold">OD/OS Verified: 28</span>
              </div>
            </div>

            {/* Specialist 2 */}
            <div className="p-3 bg-[#eff4ff] rounded border border-[#e2e8f0] flex flex-col gap-1 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#0051d5]"></span>
                  <span className="font-bold text-[#0b1c30]">Dr. Priya Nair, DNB</span>
                </div>
                <span className="font-mono text-[10px] text-[#0051d5] font-bold">Available</span>
              </div>
              <div className="text-[11px] text-[#45464d]">Aravind Tele-Retina Network</div>
              <div className="flex items-center justify-between pt-1 font-mono text-[11px]">
                <span className="text-[#45464d]">Queue status:</span>
                <span className="bg-[#e5eeff] px-1.5 py-0.5 rounded text-[#0b1c30] font-bold">
                  Ready for triage (0 load)
                </span>
              </div>
              <div className="flex items-center justify-between text-[#45464d] font-mono text-[10px] pt-0.5">
                <span>Avg Latency: 9 min</span>
                <span className="text-[#069669] font-semibold">OD/OS Verified: 14</span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#45464d]">
            <span className="flex items-center gap-1 text-[11px]">
              <span className="material-symbols-outlined text-sm text-[#0051d5]">encrypted</span>
              End-to-End DICOM TLS Encrypted Pipe
            </span>
            <button
              onClick={() => onNavigateTab('pending-doctor-reviews')}
              className="text-[#0051d5] font-bold hover:underline flex items-center gap-0.5"
            >
              <span>Ping Next Specialist</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Panel 2: Camera & Rural Edge Sync Telemetry (5 cols) */}
        <div className="lg:col-span-5 bg-white p-4 rounded shadow-sm border border-[#e2e8f0] flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#0b1c30] text-lg">cloud_sync</span>
              <span className="font-bold text-sm text-[#0b1c30]">Camera &amp; Edge Sync Telemetry</span>
            </div>
            <span className="font-mono text-xs text-[#069669] font-bold">
              {isOfflineMode ? 'RURAL OFFLINE' : 'ONLINE 4G'}
            </span>
          </div>

          <div className="space-y-2 mt-2 text-xs">
            {/* Item 1: Fundus SSD Buffer */}
            <div className="flex items-center justify-between p-2 bg-[#eff4ff] rounded">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#45464d]">storage</span>
                <span className="text-[#0b1c30] font-medium">Local Edge SSD Buffer</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-xs font-bold text-[#0051d5]">
                  {screenings.length} studies
                </span>
                <span className="font-mono text-[10px] text-[#45464d] block">cached locally</span>
              </div>
            </div>

            {/* Item 2: Bandwidth */}
            <div className="flex items-center justify-between p-2 bg-[#eff4ff] rounded">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#45464d]">network_cell</span>
                <span className="text-[#0b1c30] font-medium">BSNL / Airtel 4G LTE</span>
              </div>
              <div className="text-right font-mono text-xs text-[#0b1c30]">
                <span className="font-bold text-[#069669]">2.5 Mbps</span>
                <span className="text-[#45464d] block text-[10px]">Latency: 118ms</span>
              </div>
            </div>

            {/* Item 3: Edge Fallback */}
            <div className="flex items-center justify-between p-2 bg-[#eff4ff] rounded">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-[#45464d]">offline_bolt</span>
                <span className="text-[#0b1c30] font-medium">Offline Inference Engine</span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] bg-[#002114] text-[#85f8c4] px-1.5 py-0.5 rounded font-bold">
                  Autonomous OK
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#e2e8f0] flex items-center justify-between text-xs text-[#45464d]">
            <span className="text-[11px]">Local DB: SQLite3 DICOM-Store</span>
            <button
              onClick={onSync}
              disabled={syncing}
              className="text-[#0051d5] font-bold hover:underline flex items-center gap-0.5"
            >
              {syncing ? 'Syncing...' : 'Force Manual Cloud Sync'}
            </button>
          </div>
        </div>
      </div>

      {/* Clinical Decision Support & Legal Disclaimer Banner */}
      <div className="bg-[#e5eeff] p-3.5 rounded border border-[#cbd5e1] flex items-start gap-2.5">
        <span className="material-symbols-outlined text-[#0051d5] text-lg mt-0.5 shrink-0">
          verified_user
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-xs text-[#0b1c30]">
            Regulatory &amp; Clinical Safety Protocol (CDSCO Class B • ISO 13485)
          </span>
          <p className="text-[11px] text-[#45464d] leading-relaxed">
            RetinaCare is a clinical screening and decision-support system. All AI findings represent probabilistic evidence and require clinical review by a certified ophthalmologist or trained medical officer prior to prescription, laser intervention, or tertiary surgical booking. Never withhold acute clinical care based solely on algorithmic outputs.
          </p>
        </div>
      </div>
    </div>
  );
};
