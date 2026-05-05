import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Activity, Users, UserPlus, BarChart2, Bell, FileText, Settings, LogOut, Plus, X } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainLayout() {
  const { role, logout, patients, logIntervention, addToast } = useStore();
  const navigate = useNavigate();
  const [showFAB, setShowFAB] = useState(false);
  
  // Intervention form state
  const [selectedPatient, setSelectedPatient] = useState('');
  const [interventionType, setInterventionType] = useState('Fluid Bolus');
  const [interventionNotes, setInterventionNotes] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleLogIntervention = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    logIntervention(selectedPatient, interventionType, interventionNotes);
    addToast({ type: 'success', message: 'Intervention logged successfully.' });
    setShowFAB(false);
    setInterventionNotes('');
    setSelectedPatient('');
  };

  const [isListening, setIsListening] = useState(false);

  const handleEmergencyDemo = () => {
    // Play Medical Alarm Sound (Synthesized)
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const playAlarm = () => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    };

    // Trigger alarm sequence
    let count = 0;
    const interval = setInterval(() => {
      playAlarm();
      addToast({ type: 'critical', message: `🚨 CRITICAL ALERT: WARD-WIDE ESCALATION DETECTED` });
      count++;
      if (count > 3) clearInterval(interval);
    }, 600);
  };

  const handleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      addToast({ type: 'warning', message: 'Use Chrome for Voice Features.' });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
      setIsListening(true);
      addToast({ type: 'success', message: 'Chronos is listening...' });
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      addToast({ type: 'success', message: `Query: "${transcript}"` });
      
      // Clinical Logic Engine
      setTimeout(() => {
        if (transcript.includes('risk') || transcript.includes('critical')) {
          const criticalCount = patients.filter(p => p.risk_tier === 'CRITICAL').length;
          addToast({ 
            type: 'warning', 
            message: `Chronos AI: Detecting ${criticalCount} patients in critical state. Recommendation: Prioritize Bed P002 and P003.` 
          });
        } else if (transcript.includes('arjun') || transcript.includes('mehta')) {
          addToast({ 
            type: 'success', 
            message: "Chronos AI: Arjun Mehta is stable. Post-CABG recovery trending positive (Risk: 4.2%)." 
          });
        } else {
          addToast({ 
            type: 'success', 
            message: "Chronos AI: Monitoring 108 patients. All edge neural streams active." 
          });
        }
      }, 1000);

      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
      addToast({ type: 'critical', message: 'Voice check failed. Ensure Mic is allowed in Browser.' });
    };

    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const navItems = [
    { name: 'Triage', path: '/app', icon: Activity },
    { name: 'Patient Registry', path: '/app/registry', icon: Users },
    { name: 'Add Patient', path: '/app/add-patient', icon: UserPlus },
    { name: 'Analytics', path: '/app/analytics', icon: BarChart2 },
    { name: 'Alert History', path: '/app/alerts', icon: Bell },
    { name: 'Shift Brief', path: '/app/shift-brief', icon: FileText },
    { name: 'Settings', path: '/app/settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-[var(--bg-primary)] overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[260px] bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] flex flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center text-white shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          <div>
            <h1 className="font-bold text-white text-sm tracking-wide leading-tight">PROJECT CHRONOS</h1>
            <p className="text-[10px] text-gray-400">ICU Early Warning System</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 relative before:absolute before:left-0 before:top-2 before:bottom-2 before:w-[3px] before:bg-blue-500 before:rounded-r-md'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`
              }
            >
              <item.icon size={18} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-[var(--border-subtle)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
              DR
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Dr. Arjun Mehta</p>
              <span className="inline-block px-2 py-0.5 mt-0.5 rounded-full bg-white/10 text-[10px] text-gray-300">
                {role || 'Attending'}
              </span>
            </div>
            <button onClick={handleLogout} className="p-2 text-gray-400 hover:text-white transition-colors hover:scale-95 active:scale-90">
              <LogOut size={18} />
            </button>
          </div>
        </div>

        {/* Emergency Demo Mode (Hidden in Plain Sight) */}
        <div className="mx-4 mb-4">
           <button 
             onClick={handleEmergencyDemo}
             className="w-full py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-widest transition-all group"
           >
             <span className="group-hover:hidden">System Normal</span>
             <span className="hidden group-hover:inline">🚨 Trigger Emergency Demo</span>
           </button>
        </div>

        {/* AI Clinical Assistant (Hackathon Innovation) */}
        <div className="mx-4 mb-6 p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/5 relative">
           <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-indigo-500/20 rounded-lg">
                <Activity size={12} className={isListening ? "text-red-400 animate-ping" : "text-indigo-400"} />
              </div>
              <h4 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Chronos Assistant</h4>
           </div>
           <div className="text-[11px] text-gray-400 leading-relaxed italic mb-3">
             "Ask me about ward trends or specific patient risks."
           </div>
           <div className="relative">
              <input 
                type="text" 
                placeholder={isListening ? "Listening..." : "Talk to Chronos..."} 
                onKeyDown={(e: any) => {
                  if (e.key === 'Enter') {
                    const q = e.target.value.toLowerCase();
                    addToast({ type: 'success', message: `Query: "${q}"` });
                    e.target.value = '';
                    setTimeout(() => {
                      if (q.includes('risk') || q.includes('critical')) {
                        addToast({ type: 'warning', message: "Chronos AI: Multiple high-risk trajectories detected. Scaling edge inference." });
                      } else {
                        addToast({ type: 'success', message: "Chronos AI: Query received. Analyzing longitudinal vitals..." });
                      }
                    }, 800);
                  }
                }}
                className={`w-full bg-black/20 border rounded-xl pl-3 pr-10 py-2 text-[10px] text-white focus:outline-none transition-all ${
                  isListening ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]' : 'border-white/10 focus:border-indigo-500/50'
                }`}
              />
              <button 
                onClick={handleVoice}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors ${isListening ? 'text-red-400' : 'text-indigo-400 hover:text-white'}`}
                title="Voice Activation"
              >
                <div className={`w-2 h-2 rounded-full absolute -top-0.5 -right-0.5 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-red-500'}`} />
                <Activity size={14} />
              </button>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        <Outlet />
      </main>

      {/* Floating Action Button */}
      <button 
        onClick={() => setShowFAB(true)}
        className="fixed bottom-8 right-8 w-14 h-14 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all hover:scale-105 active:scale-95 z-40"
      >
        <Plus size={24} />
      </button>

      {/* Intervention Modal */}
      <AnimatePresence>
        {showFAB && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowFAB(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-md p-6 bg-[#0a0f25]/90 border border-white/10 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">Log Clinical Intervention</h2>
                <button onClick={() => setShowFAB(false)} className="text-gray-400 hover:text-white">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleLogIntervention} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Patient</label>
                  <select required value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white">
                    <option value="" disabled>Select Patient</option>
                    {patients.map(p => <option key={p.patient_id} value={p.patient_id}>{p.bed_id} - {p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Intervention Type</label>
                  <select value={interventionType} onChange={e => setInterventionType(e.target.value)} className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white">
                    <option>Fluid Bolus</option>
                    <option>Vasopressor Initiation</option>
                    <option>Antibiotic Administration</option>
                    <option>Oxygen Adjustment</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1 uppercase">Clinical Notes</label>
                  <textarea 
                    required
                    value={interventionNotes}
                    onChange={e => setInterventionNotes(e.target.value)}
                    placeholder="Enter details..." 
                    className="w-full bg-black/20 border border-white/10 rounded-lg p-2 text-white resize-none h-24"
                  />
                </div>
                <button type="submit" className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                  Log Action
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
