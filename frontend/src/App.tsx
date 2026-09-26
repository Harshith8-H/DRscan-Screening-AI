import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewScreening } from './pages/NewScreening';
import { ExplainabilityStation } from './pages/ExplainabilityStation';
import { PendingDoctorReviews } from './pages/PendingDoctorReviews';
import { PatientHistoryProgression } from './pages/PatientHistoryProgression';
import { DistrictRuralDeployment } from './pages/DistrictRuralDeployment';
import { ClinicalReports } from './pages/ClinicalReports';
import { SystemDiagnostics } from './pages/SystemDiagnostics';
import { User } from './types';
import { api } from './services/api';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [activeScreeningId, setActiveScreeningId] = useState<string | null>(null);
  const [historyPatientId, setHistoryPatientId] = useState<number | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [syncCount, setSyncCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [pendingReviewsCount, setPendingReviewsCount] = useState<number>(0);

  useEffect(() => {
    // Attempt default login as Doctor Specialist
    api.login('dr.priya', 'doctor123')
      .then((data) => setCurrentUser(data.user))
      .catch(() => {
        // Fallback user
        setCurrentUser({
          id: 2,
          username: 'dr.priya',
          email: 'dr.priya@telehealth.gov.in',
          full_name: 'Dr. Priya Sharma, MS (Ophthalmology)',
          role: 'DOCTOR',
          medical_council_id: 'MCI-OPHTH-88421',
          phc_center: 'District Civil Hospital Eye Department'
        });
      });

    // Check pending reviews & sync status
    refreshCounters();
  }, []);

  const refreshCounters = () => {
    api.getPendingReviews()
      .then((list) => setPendingReviewsCount(list.length))
      .catch(console.error);

    api.getSyncStatus()
      .then((status) => setSyncCount(status.pending_offline_sync_count || 0))
      .catch(console.error);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.triggerSync();
      await refreshCounters();
    } catch (e) {
      console.error('Sync failed', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleSelectScreening = (screeningId: string) => {
    setActiveScreeningId(screeningId);
    setCurrentTab('ai-clinical-screening-and-explainability');
  };

  const handleScreeningCompleted = (screeningId: string) => {
    setActiveScreeningId(screeningId);
    setCurrentTab('ai-clinical-screening-and-explainability');
    refreshCounters();
  };

  const handleNavigateToHistory = (patientId: number) => {
    setHistoryPatientId(patientId);
    setCurrentTab('patient-history-and-progression');
  };

  // Tab alias normalizer
  const normalizedTab = (() => {
    if (currentTab === 'analysis') return 'ai-clinical-screening-and-explainability';
    if (currentTab === 'history') return 'patient-history-and-progression';
    if (currentTab === 'doctor-review') return 'pending-doctor-reviews';
    if (currentTab === 'simulation') return 'district-rural-deployment';
    return currentTab;
  })();

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#131b2e] flex flex-col font-sans selection:bg-[#0051d5] selection:text-white">
      {/* Top Application Bar */}
      <Header
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
        isOfflineMode={isOfflineMode}
        setIsOfflineMode={setIsOfflineMode}
        syncCount={syncCount}
        onSync={handleSync}
        syncing={syncing}
      />

      <div className="flex flex-1 pt-14">
        {/* Left Clinical PACS Sidebar */}
        <Sidebar
          currentTab={normalizedTab}
          setCurrentTab={setCurrentTab}
          pendingReviewsCount={pendingReviewsCount}
        />

        {/* Main Clinical Canvas */}
        <main className="pl-64 flex-1 overflow-x-hidden min-h-[calc(100vh-3.5rem)]">
          <div className="p-6 lg:p-8 max-w-[1680px] mx-auto">
            {normalizedTab === 'dashboard' && (
              <Dashboard
                onSelectScreening={handleSelectScreening}
                onNavigateTab={setCurrentTab}
                isOfflineMode={isOfflineMode}
                onSync={handleSync}
                syncing={syncing}
              />
            )}

            {normalizedTab === 'new-screening' && (
              <NewScreening
                onScreeningCompleted={handleScreeningCompleted}
                isOfflineMode={isOfflineMode}
              />
            )}

            {normalizedTab === 'ai-clinical-screening-and-explainability' && (
              <ExplainabilityStation
                screeningId={activeScreeningId}
                onBack={() => setCurrentTab('dashboard')}
                onNavigateToHistory={handleNavigateToHistory}
              />
            )}

            {normalizedTab === 'pending-doctor-reviews' && (
              <PendingDoctorReviews onSelectScreening={handleSelectScreening} />
            )}

            {normalizedTab === 'patient-history-and-progression' && (
              <PatientHistoryProgression
                initialPatientId={historyPatientId}
                onSelectScreening={handleSelectScreening}
              />
            )}

            {normalizedTab === 'district-rural-deployment' && (
              <DistrictRuralDeployment />
            )}

            {normalizedTab === 'clinical-reports' && (
              <ClinicalReports onSelectScreening={handleSelectScreening} />
            )}

            {normalizedTab === 'system-diagnostics' && (
              <SystemDiagnostics />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
