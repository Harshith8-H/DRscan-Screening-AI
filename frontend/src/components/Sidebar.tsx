import React from 'react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingReviewsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  pendingReviewsCount
}) => {
  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 bg-[#131b2e] text-[#bec6e0] border-r border-[#000000] z-40 flex flex-col justify-between overflow-y-auto">
      <div className="py-3 flex flex-col gap-1">
        {/* Section 1: Clinical Workflows */}
        <div className="px-4 py-1.5">
          <span className="font-mono text-[10px] text-[#7c839b] tracking-wider uppercase font-semibold">
            Clinical Workflows
          </span>
        </div>

        <nav className="flex flex-col gap-0.5 px-2">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold ${
              currentTab === 'dashboard'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">dashboard</span>
              <span>Dashboard</span>
            </div>
          </button>

          {/* New Screening */}
          <button
            onClick={() => setCurrentTab('new-screening')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold ${
              currentTab === 'new-screening'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">add_circle</span>
              <span>New Screening</span>
            </div>
            <span className="font-mono text-[10px] bg-[#dbe1ff]/20 text-[#dbe1ff] px-1.5 py-0.5 rounded font-bold">
              OD/OS
            </span>
          </button>

          {/* AI Clinical Screening & Explainability */}
          <button
            onClick={() => setCurrentTab('ai-clinical-screening-and-explainability')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold text-left ${
              currentTab === 'ai-clinical-screening-and-explainability'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">visibility</span>
              <span className="truncate">AI Screening & Explainability</span>
            </div>
          </button>

          {/* Pending Doctor Reviews */}
          <button
            onClick={() => setCurrentTab('pending-doctor-reviews')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold ${
              currentTab === 'pending-doctor-reviews'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">assignment_turned_in</span>
              <span>Pending Doctor Reviews</span>
            </div>
            {pendingReviewsCount > 0 && (
              <span className="font-mono text-[10px] bg-[#ba1a1a] text-white px-1.5 py-0.5 rounded font-bold">
                {pendingReviewsCount}
              </span>
            )}
          </button>

          {/* Patient History & Progression */}
          <button
            onClick={() => setCurrentTab('patient-history-and-progression')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold ${
              currentTab === 'patient-history-and-progression'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">manage_history</span>
              <span>Patient History & Progression</span>
            </div>
          </button>

          {/* Section 2: Telemetry & Reports */}
          <div className="px-2 pt-3 pb-1">
            <span className="font-mono text-[10px] text-[#7c839b] tracking-wider uppercase font-semibold">
              Telemetry & Reports
            </span>
          </div>

          {/* District Rural Deployment */}
          <button
            onClick={() => setCurrentTab('district-rural-deployment')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold ${
              currentTab === 'district-rural-deployment'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">hub</span>
              <span>District Rural Deployment</span>
            </div>
          </button>

          {/* Clinical Reports */}
          <button
            onClick={() => setCurrentTab('clinical-reports')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold ${
              currentTab === 'clinical-reports'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">description</span>
              <span>Clinical Reports</span>
            </div>
          </button>

          {/* System Diagnostics */}
          <button
            onClick={() => setCurrentTab('system-diagnostics')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded transition-colors text-xs font-semibold ${
              currentTab === 'system-diagnostics'
                ? 'bg-[#0051d5] text-white border-l-4 border-white shadow-sm'
                : 'text-[#bec6e0] hover:bg-white/10 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <span className="material-symbols-outlined text-base">settings</span>
              <span>System Diagnostics</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Bottom Telemetry Footer */}
      <div className="p-3 bg-[#002114]/40 border-t border-[#000000]">
        <div className="flex flex-col gap-1 text-[11px] font-mono">
          <div className="flex items-center justify-between text-[#bec6e0]">
            <span>v2.4.1-clinical</span>
            <span className="text-[#85f8c4] font-bold">CDSCO B</span>
          </div>
          <div className="text-[10px] text-[#bec6e0]/80 truncate">
            EfficientNet-B0 DR v1.0.0
          </div>
          <div className="w-full bg-white/10 h-1.5 rounded-full mt-1 overflow-hidden">
            <div className="bg-[#0051d5] h-full" style={{ width: '84%' }}></div>
          </div>
          <div className="flex items-center justify-between text-[#bec6e0] text-[10px] mt-0.5">
            <span>Disk: 84%</span>
            <span>1,420 cached</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
