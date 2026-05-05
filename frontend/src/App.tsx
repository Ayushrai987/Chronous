import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import { fetchPatients } from './api';
import AuthPage from './pages/AuthPage';
import MainLayout from './layouts/MainLayout';
import TriageRadar from './pages/TriageRadar';
import PatientDeepDive from './pages/PatientDeepDive';
import PatientRegistry from './pages/PatientRegistry';
import AddPatient from './pages/AddPatient';
import Analytics from './pages/Analytics';
import AlertHistory from './pages/AlertHistory';
import ShiftBrief from './pages/ShiftBrief';
import Settings from './pages/Settings';

export default function App() {
  const { role, toasts, patients, setPatients, addToast } = useStore();

  useEffect(() => {
    const syncData = async () => {
      try {
        const data = await fetchPatients();
        if (data.patients) {
          // Detect risk escalations for notifications
          data.patients.forEach(p => {
            const prevPatient = patients.find(prev => prev.patient_id === p.patient_id);
            if (prevPatient && p.risk_tier !== prevPatient.risk_tier) {
              const tiers = ['STABLE', 'WATCH', 'HIGH', 'CRITICAL'];
              if (tiers.indexOf(p.risk_tier) > tiers.indexOf(prevPatient.risk_tier)) {
                addToast({ 
                  type: p.risk_tier === 'CRITICAL' ? 'critical' : 'warning', 
                  message: `⚠ ALERT: Bed ${p.bed_id} escalated to ${p.risk_tier} risk.` 
                });
              }
            }
          });
          setPatients(data.patients);
        }
      } catch (error) {
        console.error("Backend Sync Error:", error);
      }
    };

    syncData();
    const interval = setInterval(syncData, 5000);
    return () => clearInterval(interval);
  }, [setPatients, addToast]); // Removed 'patients' dependency to prevent infinite loop

  return (
    <BrowserRouter>
      {/* High-Fidelity Alert Overlay */}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none max-w-sm">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto p-4 rounded-lg shadow-2xl flex items-center gap-4 backdrop-blur-2xl border transition-all animate-in fade-in slide-in-from-right-4 duration-500 ${
            t.type === 'critical' ? 'bg-[#dc2626]/20 border-[#dc2626]/40 text-white' :
            t.type === 'warning' ? 'bg-[#d97706]/20 border-[#d97706]/40 text-white' :
            'bg-[#16a34a]/20 border-[#16a34a]/40 text-white'
          }`}>
            <div className={`w-2 h-2 rounded-full shrink-0 ${
               t.type === 'critical' ? 'bg-[#dc2626] animate-pulse' :
               t.type === 'warning' ? 'bg-[#d97706]' :
               'bg-[#16a34a]'
            }`} />
            <span className="font-bold text-xs tracking-tight">{t.message}</span>
          </div>
        ))}
      </div>

      <Routes>
        <Route path="/" element={!role ? <AuthPage /> : <Navigate to="/app" />} />
        <Route path="/app" element={role ? <MainLayout /> : <Navigate to="/" />}>
          <Route index element={<TriageRadar />} />
          <Route path="patient/:id" element={<PatientDeepDive />} />
          <Route path="registry" element={<PatientRegistry />} />
          <Route path="add-patient" element={<AddPatient />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="alerts" element={<AlertHistory />} />
          <Route path="shift-brief" element={<ShiftBrief />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/triage" element={<Navigate to="/app" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
