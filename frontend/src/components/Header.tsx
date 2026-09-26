import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { api, getApiOrigin, setApiOrigin } from '../services/api';

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
  const [showBackendModal, setShowBackendModal] = useState(false);
  const [apiUrl, setApiUrlState] = useState(getApiOrigin());
  const [backendStatus, setBackendStatus] = useState<'checking' | 'connected' | 'offline'>('checking');
  const [statusMessage, setStatusMessage] = useState('');

  const checkConnection = async () => {
    setBackendStatus('checking');
    const result = await api.testConnection();
    if (result.ok) {
      setBackendStatus('connected');
      setStatusMessage(result.message);
    } else {
      setBackendStatus('offline');
      setStatusMessage(result.message);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveApiUrl = async () => {
    setApiOrigin(apiUrl);
    await checkConnection();
    setShowBackendModal(false);
  };

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
            <span className="font-mono text-[10px] text-[#bec6e0]">MATLAB XAI-PACS v2.4</span>
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
        <div className="flex items-center gap-3">
          {/* MATLAB Backend Tunnel Indicator */}
          <div
            onClick={() => setShowBackendModal(true)}
            className={`cursor-pointer flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs transition ${
              backendStatus === 'connected'
                ? 'bg-[#002114] border-[#069669]/40 text-[#85f8c4] hover:border-[#069669]'
                : backendStatus === 'checking'
                ? 'bg-amber-950/40 border-amber-500/30 text-amber-300'
                : 'bg-[#ffdad6]/20 border-[#ba1a1a]/40 text-[#ffdad6] hover:border-[#ba1a1a]'
            }`}
            title="Click to view/change MATLAB Backend Server URL"
          >
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                backendStatus === 'connected'
                  ? 'bg-[#069669] animate-pulse'
                  : backendStatus === 'checking'
                  ? 'bg-amber-400 animate-spin'
                  : 'bg-[#ffdad6]'
              }`}
            ></span>
            <span className="font-mono text-[11px]">
              {backendStatus === 'connected'
                ? 'MATLAB Engine: Live'
                : backendStatus === 'checking'
                ? 'Checking Backend...'
                : 'MATLAB Offline (Configure)'}
            </span>
          </div>

          {/* Connectivity Status Pill */}
          {!isOfflineMode ? (
            <div
              onClick={() => setIsOfflineMode(true)}
              className="hidden md:flex cursor-pointer items-center gap-1.5 bg-[#002114] px-2.5 py-1 rounded border border-[#069669]/30 text-xs hover:border-[#069669] transition"
              title="Click to simulate Rural Offline Mode"
            >
              <span className="inline-block w-2 h-2 rounded-full bg-[#069669]"></span>
              <span className="font-mono text-[11px] text-[#85f8c4]">
                Online
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

      {/* Backend Configuration Modal */}
      {showBackendModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-[#131b2e] border border-[#334155] rounded-xl max-w-md w-full p-5 shadow-2xl text-xs space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="font-bold text-sm text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#0051d5]">memory</span>
                <span>MATLAB AI Backend Configuration</span>
              </div>
              <button
                onClick={() => setShowBackendModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-slate-300 font-semibold block">
                Backend HTTPS Tunnel / Origin URL
              </label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrlState(e.target.value)}
                placeholder="https://drscan-matlab-backend.loca.lt"
                className="w-full bg-[#090d16] border border-[#334155] rounded px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#0051d5]"
              />
              <p className="text-[11px] text-slate-400">
                Default: <span className="font-mono text-slate-300">https://drscan-matlab-backend.loca.lt</span> (Local MATLAB via secure tunnel) or <span className="font-mono text-slate-300">http://localhost:8000</span>.
              </p>
            </div>

            <div className="p-3 bg-[#090d16] rounded border border-[#334155] space-y-1">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-slate-400">Connection Status:</span>
                <span
                  className={
                    backendStatus === 'connected'
                      ? 'text-emerald-400 font-bold'
                      : backendStatus === 'checking'
                      ? 'text-amber-300'
                      : 'text-rose-400 font-bold'
                  }
                >
                  {backendStatus === 'connected' ? 'CONNECTED' : backendStatus === 'checking' ? 'TESTING...' : 'DISCONNECTED'}
                </span>
              </div>
              {statusMessage && (
                <div className="text-[10px] text-slate-400">{statusMessage}</div>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 pt-2">
              <button
                type="button"
                onClick={checkConnection}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded font-medium"
              >
                Test Connection
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setApiUrlState('https://drscan-matlab-backend.loca.lt');
                  }}
                  className="px-2.5 py-1.5 bg-transparent text-slate-400 hover:text-white rounded"
                >
                  Reset Default
                </button>
                <button
                  type="button"
                  onClick={handleSaveApiUrl}
                  className="px-4 py-1.5 bg-[#0051d5] hover:bg-[#316bf3] text-white rounded font-semibold shadow-md"
                >
                  Save &amp; Connect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
