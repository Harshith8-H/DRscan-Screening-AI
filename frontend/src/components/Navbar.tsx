import React, { useState, useEffect } from 'react';
import {
  Eye,
  Activity,
  FileCheck2,
  History,
  Cpu,
  Wifi,
  WifiOff,
  RefreshCw,
  UserCheck,
  ChevronDown
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  currentUser,
  setCurrentUser,
  isOfflineMode,
  setIsOfflineMode
}) => {
  const [demoUsers, setDemoUsers] = useState<User[]>([]);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    api.getDemoUsers().then(setDemoUsers).catch(() => {});
    checkSync();
  }, []);

  const checkSync = async () => {
    try {
      const st = await api.getSyncStatus();
      setSyncCount(st.pending_offline_sync_count);
    } catch {}
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await api.syncOfflineBatch();
      setSyncCount(0);
      alert(res.message);
    } catch (err: any) {
      alert(err.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="bg-slate-950/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div
            className="flex items-center space-x-3 cursor-pointer"
            onClick={() => setCurrentTab('dashboard')}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950">
              <Eye className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-white tracking-tight">DRscan</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded-full">
                  SIH26038
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Explainable AI for Diabetic Retinopathy Triage
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex space-x-1">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
                currentTab === 'dashboard'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setCurrentTab('new-screening')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
                currentTab === 'new-screening'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Eye className="w-4 h-4" />
              <span>New Screening</span>
            </button>

            <button
              onClick={() => setCurrentTab('doctor-review')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
                currentTab === 'doctor-review'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Doctor Review</span>
            </button>

            <button
              onClick={() => setCurrentTab('history')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
                currentTab === 'history'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Patient History</span>
            </button>

            <button
              onClick={() => setCurrentTab('simulation')}
              className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
                currentTab === 'simulation'
                  ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>Simulink Capacity</span>
            </button>
          </nav>

          {/* Right Controls: Connectivity Mode & User Profile */}
          <div className="flex items-center space-x-3">
            {/* Rural Connectivity Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
              <button
                onClick={() => setIsOfflineMode(false)}
                title="Connected to District Hospital Cloud"
                className={`px-2 py-1 rounded flex items-center space-x-1 font-medium transition ${
                  !isOfflineMode ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Online</span>
              </button>
              <button
                onClick={() => setIsOfflineMode(true)}
                title="Rural Offline PHC Mode - Local queuing enabled"
                className={`px-2 py-1 rounded flex items-center space-x-1 font-medium transition ${
                  isOfflineMode ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-slate-400'
                }`}
              >
                <WifiOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rural Offline</span>
              </button>
            </div>

            {/* Sync Button if offline items exist */}
            {syncCount > 0 && (
              <button
                onClick={handleSync}
                disabled={syncing}
                className="px-2.5 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>Sync ({syncCount})</span>
              </button>
            )}

            {/* Active User Switcher */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg text-xs transition"
              >
                <div className="w-6 h-6 rounded-full bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                  {currentUser?.full_name?.charAt(0) || 'U'}
                </div>
                <div className="text-left hidden lg:block">
                  <div className="font-semibold text-slate-200 truncate max-w-[130px]">
                    {currentUser?.full_name || 'Loading...'}
                  </div>
                  <div className="text-[10px] text-teal-400 uppercase font-mono">{currentUser?.role}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-2 z-50 text-xs">
                  <div className="px-2 py-1.5 font-semibold text-slate-400 border-b border-slate-800 mb-1">
                    Switch Active Persona
                  </div>
                  {demoUsers.map((u) => (
                    <button
                      key={u.username}
                      onClick={() => {
                        setCurrentUser(u);
                        setShowUserMenu(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg flex items-start space-x-2 transition ${
                        currentUser?.username === u.username
                          ? 'bg-teal-500/15 text-teal-300'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <UserCheck className="w-4 h-4 mt-0.5 text-teal-400" />
                      <div>
                        <div className="font-semibold">{u.full_name}</div>
                        <div className="text-[11px] text-slate-400">{u.phc_center}</div>
                        <div className="text-[10px] text-teal-400/80 font-mono mt-0.5">Role: {u.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
