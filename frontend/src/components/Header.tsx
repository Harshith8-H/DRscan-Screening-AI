import React, { useState } from 'react';
import { User } from '../types';

interface HeaderProps {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  syncCount: number;
  onSync: () => void;
  syncing: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  setCurrentUser,
  isOfflineMode,
  setIsOfflineMode,
  syncCount,
  onSync,
  syncing
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);

  const demoUsers: User[] = [
    {
      id: 1,
      username: 'dr.sunita',
      email: 'dr.sunita@phc-chandragiri.gov.in',
      full_name: 'Dr. Sunita Rao, MBBS',
      role: 'OPERATOR',
      medical_council_id: 'AP-MC-44912',
      phc_center: 'PHC Chandragiri (Chittoor District, AP)'
    },
    {
      id: 2,
      username: 'dr.priya',
      email: 'dr.priya@district-telehealth.gov.in',
      full_name: 'Dr. Priya Sharma, MS (Ophthalmology)',
      role: 'DOCTOR',
      medical_council_id: 'MCI-OPHTH-88421',
      phc_center: 'District Civil Hospital Eye Department'
    }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-[#131b2e] text-white border-b border-[#000000] z-50">
      <div className="h-14 w-full px-5 flex items-center justify-between gap-4">
        {/* Brand & Clinic Info */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-tr from-[#0051d5] to-[#316bf3] flex items-center justify-center text-white shadow-md">
            <span className="material-symbols-outlined text-xl">visibility</span>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm tracking-tight text-white">RetinaCare</span>
            <span className="font-mono text-[10px] text-[#bec6e0]">XAI-PACS v2.4</span>
          </div>

          <div className="h-6 w-px bg-white/20 mx-1 hidden sm:block"></div>

          <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded border border-white/10 text-xs">
            <span className="material-symbols-outlined text-sm text-[#dbe1ff]">local_hospital</span>
            <span className="font-medium text-[#dbe1ff]">
              PHC Chandragiri (Chittoor District, AP) • Tele-Ophthalmology Unit
            </span>
          </div>
        </div>

        {/* Status Indicators & Profile */}
        <div className="flex items-center gap-4">
          {/* Connectivity Status Pill */}
          {!isOfflineMode ? (
            <div
              onClick={() => setIsOfflineMode(true)}
              className="cursor-pointer flex items-center gap-1.5 bg-[#002114] px-2.5 py-1 rounded border border-[#069669]/30 text-xs hover:border-[#069669] transition"
              title="Click to simulate Rural Offline Mode"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#069669] animate-pulse"></span>
              <span className="font-mono text-[11px] text-[#85f8c4]">
                Online • DICOM Store SCP Active (Sync: 120ms)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                onClick={() => setIsOfflineMode(false)}
                className="cursor-pointer flex items-center gap-1.5 bg-[#ffdad6]/20 px-2.5 py-1 rounded border border-[#ba1a1a]/40 text-xs hover:border-[#ba1a1a] transition"
                title="Click to restore Online Mode"
              >
                <span className="inline-block w-2 h-2 rounded-full bg-[#ffdad6]"></span>
                <span className="font-mono text-[11px] text-[#ffdad6]">
                  Rural Offline ({syncCount} queued)
                </span>
              </div>
              {syncCount > 0 && (
                <button
                  onClick={onSync}
                  disabled={syncing}
                  className="px-2 py-1 bg-[#0051d5] hover:bg-[#316bf3] text-white rounded text-[11px] font-semibold flex items-center gap-1 shadow-sm"
                >
                  <span className={`material-symbols-outlined text-xs ${syncing ? 'animate-spin' : ''}`}>sync</span>
                  <span>Sync</span>
                </button>
              )}
            </div>
          )}

          {/* Notifications */}
          <button className="relative flex items-center justify-center p-1.5 text-[#bec6e0] hover:text-white rounded hover:bg-white/10 transition">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="absolute -top-0.5 -right-0.5 bg-[#ba1a1a] text-white font-mono text-[9px] px-1 rounded-full font-bold">
              3
            </span>
          </button>

          {/* User Persona Switcher */}
          <div className="relative">
            <div
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 pl-2.5 border-l border-white/20 cursor-pointer"
            >
              <div className="text-right hidden md:block">
                <div className="font-medium text-xs text-white">
                  {currentUser?.full_name || 'Dr. Sunita Rao, MBBS'}
                </div>
                <div className="flex items-center justify-end gap-1">
                  <span className="font-mono text-[9px] bg-[#0051d5] px-1.5 py-0.5 rounded text-white uppercase font-bold">
                    {currentUser?.role === 'DOCTOR' ? 'Specialist Reviewer' : 'Operator / Screener'}
                  </span>
                </div>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#316bf3] text-white font-bold flex items-center justify-center border border-white/30 text-xs shadow-inner">
                {currentUser?.full_name?.charAt(0) || 'S'}
              </div>
            </div>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#131b2e] border border-[#3f465c] rounded-lg shadow-2xl p-2 z-50 text-xs">
                <div className="px-2 py-1 font-semibold text-[#bec6e0] border-b border-white/10 mb-1">
                  Switch Active Persona
                </div>
                {demoUsers.map((u) => (
                  <button
                    key={u.username}
                    onClick={() => {
                      setCurrentUser(u);
                      setShowUserMenu(false);
                    }}
                    className={`w-full text-left p-2 rounded flex flex-col gap-0.5 transition ${
                      currentUser?.username === u.username
                        ? 'bg-[#0051d5] text-white'
                        : 'hover:bg-white/10 text-slate-200'
                    }`}
                  >
                    <div className="font-semibold">{u.full_name}</div>
                    <div className="text-[10px] text-[#bec6e0]">{u.phc_center}</div>
                    <div className="text-[9px] font-mono uppercase opacity-80 mt-0.5">Role: {u.role}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
