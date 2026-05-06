import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Activity, Users, UserPlus, BarChart2, Bell, FileText, Settings, LogOut, MessageSquare, X, Send } from 'lucide-react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainLayout() {
  const { role, logout, patients, addToast, codeBluePatient, confirmDeath, cancelCodeBlue } = useStore();
  const navigate = useNavigate();
  const [showAssistant, setShowAssistant] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [assistantQuery, setAssistantQuery] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/');
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

  const handleAssistantSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assistantQuery) return;
    addToast({ type: 'info', message: `Chronos AI: Analyzing query "${assistantQuery}"...` });
    setTimeout(() => {
      addToast({ type: 'success', message: "Chronos AI: Current ward stability is 84%. Critical escalation likely in Bed ICU-B2." });
    }, 1000);
    setAssistantQuery('');
  };

  return (
    <div className="flex h-screen bg-[#0c1117] overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex w-[240px] bg-[#080c12] border-r border-white/5 flex-col shrink-0">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#4f83cc] rounded flex items-center justify-center text-white shrink-0">
            <Activity size={20} />
          </div>
          <div>
            <h1 className="font-bold text-white text-[13px] tracking-[0.1em] leading-tight sidebar-logo">CHRONOS</h1>
            <p className="text-[10px] text-[#8899aa] uppercase font-bold tracking-tighter">Clinical OS</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#4f83cc]/10 text-[#4f83cc] border-r-2 border-[#4f83cc]'
                    : 'text-[#8899aa] hover:text-[#e2e8f0] hover:bg-white/5'
                }`
              }
            >
              <item.icon size={16} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Bottom */}
        <div className="p-4 border-t border-white/5 flex flex-col gap-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>
            <span className="text-[10px] font-bold text-[#8899aa] uppercase tracking-wider">System Healthy</span>
          </div>

          {/* Assistant Toggle */}
          <button 
            onClick={() => setShowAssistant(!showAssistant)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold transition-all ${
              showAssistant ? 'bg-[#4f83cc] text-white' : 'bg-white/5 text-[#8899aa] hover:text-[#e2e8f0]'
            }`}
          >
            <MessageSquare size={16} />
            Chronos Assistant
          </button>

          {/* User */}
          <div className="flex items-center gap-3 px-2 pt-2">
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
              AM
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-white truncate">Dr. Arjun Mehta</p>
              <p className="text-[9px] text-[#8899aa] uppercase font-bold">{role || 'Physician'}</p>
            </div>
            <button onClick={handleLogout} className="text-[#8899aa] hover:text-white">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/60 z-[60] lg:hidden"
            />
            <motion.aside 
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[240px] bg-[#080c12] z-[70] lg:hidden flex flex-col border-r border-white/10"
            >
              <div className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#4f83cc] rounded flex items-center justify-center text-white shrink-0">
                    <Activity size={20} />
                  </div>
                  <div>
                    <h1 className="font-bold text-white text-[13px] tracking-[0.1em] leading-tight sidebar-logo">CHRONOS</h1>
                    <p className="text-[10px] text-[#8899aa] uppercase font-bold tracking-tighter">Clinical OS</p>
                  </div>
                </div>
                <button onClick={() => setShowMobileMenu(false)} className="text-[#8899aa] hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setShowMobileMenu(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold transition-all ${
                        isActive
                          ? 'bg-[#4f83cc]/10 text-[#4f83cc]'
                          : 'text-[#8899aa] hover:text-[#e2e8f0]'
                      }`
                    }
                  >
                    <item.icon size={16} />
                    {item.name}
                  </NavLink>
                ))}
              </nav>

              <div className="p-4 border-t border-white/5 flex flex-col gap-4">
                <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded text-xs font-bold text-red-400 hover:bg-red-500/10">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 overflow-hidden bg-[#0c1117]">
        {/* Mobile Header Toggle */}
        <div className="lg:hidden p-4 border-b border-white/5 flex items-center justify-between bg-[#080c12]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#4f83cc] rounded flex items-center justify-center text-white shrink-0">
              <Activity size={20} />
            </div>
            <h1 className="font-bold text-white text-xs tracking-widest">CHRONOS</h1>
          </div>
          <button 
            onClick={() => setShowMobileMenu(true)}
            className="p-2 text-[#8899aa] hover:text-white bg-white/5 rounded"
          >
            <Activity size={20} />
          </button>
        </div>
        <Outlet />

        {/* SECTION 5: CODE BLUE GLOBAL OVERLAY */}
        <AnimatePresence>
          {codeBluePatient && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-[#0a1628] flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,131,204,0.1),transparent)] animate-pulse" />
              
              <motion.h1 
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
                className="text-8xl font-black text-white tracking-tighter mb-4"
              >
                CODE BLUE
              </motion.h1>
              
              <p className="text-4xl font-bold text-blue-400 mb-12">
                BED {patients.find(p => p.patient_id === codeBluePatient)?.bed_id || 'N/A'} — {patients.find(p => p.patient_id === codeBluePatient)?.name || 'Unknown Patient'}
              </p>

              <div className="w-full max-w-4xl grid grid-cols-2 gap-8 mb-12 text-left">
                <div className="glass-card p-6 border-blue-500/30">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Vital Integrity Status</h3>
                  <div className="space-y-3">
                    <VitalRow label="Heart Rate" value="0" status="FLATLINE" />
                    <VitalRow label="MAP Pressure" value="0" status="FLATLINE" />
                    <VitalRow label="SpO2" value="0" status="FLATLINE" />
                    <VitalRow label="Resp. Rate" value="0" status="FLATLINE" />
                  </div>
                </div>
                <div className="glass-card p-6 border-blue-500/30">
                  <h3 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Escalation Log</h3>
                  <div className="text-[11px] font-mono text-gray-400 space-y-2">
                    <p>[00:00] All-zero vitals detected</p>
                    <p>[00:01] Hardware fault check: PASSED (Multivariate confirmation)</p>
                    <p>[00:02] Consecutive reading confirmation: SUCCESS</p>
                    <p className="text-blue-400 animate-pulse">[00:03] CODE BLUE TRIGGERED — Escalating to Ward Terminals</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-6">
                <button 
                  onClick={() => {
                    const note = prompt("Enter clinical confirmation note:");
                    if (note) confirmDeath(codeBluePatient, note);
                  }}
                  className="px-12 py-4 bg-red-600 hover:bg-red-700 text-white font-black rounded-lg text-xl shadow-2xl transition-all active:scale-95"
                >
                  CONFIRM DEATH
                </button>
                <button 
                  onClick={() => cancelCodeBlue(codeBluePatient)}
                  className="px-12 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-lg text-xl transition-all"
                >
                  FALSE ALARM / RECOVERY
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Assistant Floating Panel */}
        <AnimatePresence>
          {showAssistant && (
            <motion.div 
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="absolute bottom-6 left-6 w-80 bg-[#131920] border border-white/10 rounded-lg shadow-2xl z-50 flex flex-col"
            >
              <div className="p-4 border-b border-white/5 flex justify-between items-center bg-[#4f83cc]/5">
                <div className="flex items-center gap-2">
                  <Activity size={14} className="text-[#4f83cc]" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Chronos Assistant</span>
                </div>
                <button onClick={() => setShowAssistant(false)} className="text-[#8899aa] hover:text-white">
                  <X size={16} />
                </button>
              </div>
              <div className="p-4 h-48 overflow-y-auto flex flex-col gap-3">
                <div className="bg-white/5 p-3 rounded-lg text-[11px] text-[#e2e8f0] max-w-[85%] self-start border border-white/5">
                  "Hello Dr. Mehta. I am monitoring 108 patients. Ask me for a risk summary or specific intervention advice."
                </div>
              </div>
              <form onSubmit={handleAssistantSubmit} className="p-3 border-t border-white/5 flex gap-2">
                <input 
                  type="text" 
                  value={assistantQuery}
                  onChange={e => setAssistantQuery(e.target.value)}
                  placeholder="Type a clinical query..." 
                  className="flex-1 bg-black/20 border border-white/5 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#4f83cc]/50"
                />
                <button type="submit" className="p-1.5 bg-[#4f83cc] text-white rounded hover:bg-[#3d6ba7]">
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function VitalRow({ label, value, status }: { label: string, value: string, status: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/5">
      <span className="text-xs text-gray-400 font-bold uppercase">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-2xl font-black text-white">{value}</span>
        <span className="text-[10px] font-black text-red-500 animate-pulse">{status}</span>
      </div>
    </div>
  );
}
