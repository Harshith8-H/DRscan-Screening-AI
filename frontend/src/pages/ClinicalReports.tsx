import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Screening, Patient } from '../types';

interface ClinicalReportsProps {
  onSelectScreening: (screeningId: string) => void;
}

export const ClinicalReports: React.FC<ClinicalReportsProps> = ({ onSelectScreening }) => {
  const [screenings, setScreenings] = useState<Screening[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGrade, setFilterGrade] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    Promise.all([api.getScreenings(), api.getPatients()])
      .then(([screeningsData, patientsData]) => {
        setScreenings(screeningsData);
        setPatients(patientsData);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load clinical reports data', err);
        setLoading(false);
      });
  }, []);

  const getPatientName = (patientId: number) => {
    const p = patients.find((pat) => pat.id === patientId);
    return p ? p.name : `Patient #${patientId}`;
  };

  const getPatientCode = (patientId: number) => {
    const p = patients.find((pat) => pat.id === patientId);
    return p ? p.patient_code : 'N/A';
  };

  const filteredScreenings = screenings.filter((s) => {
    if (filterGrade !== 'ALL') {
      if (s.dr_level?.toString() !== filterGrade) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const pName = (s.patient_name || getPatientName(s.patient_id)).toLowerCase();
      const sId = s.screening_id.toLowerCase();
      const code = (s.patient_code || getPatientCode(s.patient_id)).toLowerCase();
      if (!pName.includes(q) && !sId.includes(q) && !code.includes(q)) return false;
    }
    return true;
  });

  const getGradeBadge = (grade?: number) => {
    switch (grade) {
      case 0:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#85f8c4]/30 text-[#005232]">Grade 0: Normal</span>;
      case 1:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#e0e879]/40 text-[#4c4b00]">Grade 1: Mild NPDR</span>;
      case 2:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#f1be91]/50 text-[#853e00]">Grade 2: Moderate NPDR</span>;
      case 3:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#ffdad6] text-[#ba1a1a]">Grade 3: Severe NPDR</span>;
      case 4:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#93000a] text-white">Grade 4: PDR (Refer)</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-200 text-slate-700">Pending</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#bec6e0]/30 pb-4">
        <div>
          <h1 className="text-xl font-bold text-[#131b2e] tracking-tight flex items-center gap-2">
            <span className="material-symbols-outlined text-[#0051d5]">description</span>
            Clinical Diagnostic Reports Archive
          </h1>
          <p className="text-xs text-[#444653] mt-0.5 font-mono">
            Tele-ophthalmology PDF reports with ReportLab Grad-CAM integration, doctor sign-offs, and ABHA linkage
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white border border-[#bec6e0]/40 rounded-lg px-3 py-1.5 shadow-sm text-xs flex items-center gap-2">
            <span className="text-[#444653]">Total Generated Reports:</span>
            <span className="font-mono font-bold text-[#0051d5] text-sm">{screenings.length}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#bec6e0]/30 rounded-lg p-3 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <span className="material-symbols-outlined text-base text-[#444653]">search</span>
          <input
            type="text"
            placeholder="Search by Patient, ABHA / Code, or Study ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-80 px-3 py-1.5 bg-[#f8f9ff] border border-[#bec6e0]/40 rounded text-xs focus:outline-none focus:border-[#0051d5]"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
          <span className="text-[#444653] font-medium">Filter Grade:</span>
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="px-2.5 py-1.5 bg-[#f8f9ff] border border-[#bec6e0]/40 rounded text-xs focus:outline-none focus:border-[#0051d5] font-mono"
          >
            <option value="ALL">All Diagnostic Grades</option>
            <option value="0">Grade 0 - Normal</option>
            <option value="1">Grade 1 - Mild NPDR</option>
            <option value="2">Grade 2 - Moderate NPDR</option>
            <option value="3">Grade 3 - Severe NPDR</option>
            <option value="4">Grade 4 - PDR</option>
          </select>
        </div>
      </div>

      {/* Reports Table */}
      <div className="bg-white border border-[#bec6e0]/30 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-[#444653] flex flex-col items-center justify-center gap-2">
            <span className="material-symbols-outlined text-2xl animate-spin text-[#0051d5]">sync</span>
            <span>Loading clinical studies and medical reports...</span>
          </div>
        ) : filteredScreenings.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#444653]">
            No matching clinical reports found for the selected query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#eef0ff] border-b border-[#bec6e0]/30 text-[#444653] font-semibold text-[11px] uppercase tracking-wider font-mono">
                <tr>
                  <th className="py-2.5 px-4">Study / Screening ID</th>
                  <th className="py-2.5 px-4">Patient Name & Code</th>
                  <th className="py-2.5 px-4">Laterality</th>
                  <th className="py-2.5 px-4">AI Diagnostic Grade</th>
                  <th className="py-2.5 px-4">Quality Score</th>
                  <th className="py-2.5 px-4">Review Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#bec6e0]/20 text-[#131b2e]">
                {filteredScreenings.map((s) => (
                  <tr key={s.id} className="hover:bg-[#f8f9ff] transition-colors">
                    <td className="py-3 px-4 font-mono font-medium text-[#0051d5]">
                      {s.screening_id}
                      <div className="text-[10px] text-[#444653] font-normal font-sans">
                        {new Date(s.created_at).toLocaleDateString()} {new Date(s.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-xs">{s.patient_name || getPatientName(s.patient_id)}</div>
                      <div className="text-[10px] font-mono text-[#444653]">{s.patient_code || getPatientCode(s.patient_id)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono px-2 py-0.5 bg-slate-100 border border-slate-200 rounded font-bold text-[11px]">
                        {s.eye_side}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {getGradeBadge(s.dr_level)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <div className="flex items-center gap-1.5">
                        <div className="w-12 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${
                              (s.image_quality_score || 0) >= 0.7 ? 'bg-[#069669]' : 'bg-[#d97706]'
                            }`}
                            style={{ width: `${Math.min(100, (s.image_quality_score || 0) * 100)}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[#444653]">
                          {((s.image_quality_score || 0) * 100).toFixed(0)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {s.review_decision ? (
                        <div className="flex items-center gap-1 text-[#069669] font-medium text-[11px]">
                          <span className="material-symbols-outlined text-sm">verified</span>
                          <span>{s.review_decision}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[#ba1a1a] text-[11px] font-mono font-medium">
                          <span className="material-symbols-outlined text-xs">pending</span>
                          Pending Review
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onSelectScreening(s.screening_id)}
                          className="px-2.5 py-1 bg-white border border-[#bec6e0]/60 hover:bg-[#eef0ff] hover:text-[#0051d5] text-[#131b2e] rounded text-xs font-medium transition flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-sm">visibility</span>
                          <span>View Station</span>
                        </button>

                        <button
                          onClick={() => api.downloadReport(s.screening_id)}
                          className="px-2.5 py-1 bg-[#0051d5] hover:bg-[#316bf3] text-white rounded text-xs font-medium transition flex items-center gap-1 shadow-sm"
                          title="Generate official tele-ophthalmology PDF report"
                        >
                          <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                          <span>Download PDF</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Tele-Ophthalmology Compliance Notice */}
      <div className="bg-[#eef0ff] border border-[#dbe1ff] rounded-lg p-4 flex items-start gap-3 text-xs text-[#444653]">
        <span className="material-symbols-outlined text-[#0051d5] text-lg mt-0.5">verified_user</span>
        <div>
          <span className="font-bold text-[#131b2e]">Statutory Compliance: Ayushman Bharat Digital Mission (ABDM) & CDSCO</span>
          <p className="mt-0.5">
            Every clinical report generated through DRscan XAI-PACS contains cryptographic timestamping, MATLAB preprocessing and Grad-CAM visual evidence, operator identity tracking, and conforms to National Telemedicine Guidelines for ophthalmic screening in rural primary healthcare centers.
          </p>
        </div>
      </div>
    </div>
  );
};
