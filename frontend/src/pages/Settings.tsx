import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { LogOut, User, Bell, Shield, Database, Sliders, Info } from 'lucide-react';

export default function Settings() {
  const { role, login, demoMode, toggleDemoMode, thresholds, setThresholds } = useStore();

  const handleLogout = () => {
    login(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full overflow-y-auto mesh-gradient-bg">
      <div className="mb-10">
        <h2 className="text-4xl font-black text-white tracking-tighter">System Configuration</h2>
        <p className="text-gray-400 font-medium mt-1">Manage your local Chronos Clinical OS environment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="glass-card p-8 border border-white/10 shadow-2xl col-span-1 h-fit">
          <div className="flex flex-col items-center mb-8 border-b border-white/5 pb-8">
            <div className="w-28 h-28 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-5xl border border-blue-500/30 mb-4 shadow-[0_0_30px_rgba(59,130,246,0.25)]">
              AM
            </div>
            <h3 className="text-2xl font-bold text-white">Dr. Arjun Mehta</h3>
            <p className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mt-2">{role || 'Attending Physician'}</p>
          </div>
          
          <div className="space-y-3">
            <SettingsButton icon={User} label="Clinical Identity" />
            <SettingsButton icon={Bell} label="Escalation Protocols" />
            <SettingsButton icon={Shield} label="Access Control" />
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 mt-10 p-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-2xl font-bold border border-red-500/20 transition-all active:scale-95">
            <LogOut size={18} /> Sign Out of Instance
          </button>
        </div>

        {/* Settings Groups */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* INNOVATION: DYNAMIC THRESHOLDS */}
          <div className="glass-card p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Sliders className="text-purple-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Neural Risk Thresholds</h3>
                  <p className="text-xs text-gray-500 font-medium">Fine-tune AI sensitivity to reduce alarm fatigue</p>
                </div>
              </div>
              <Info size={18} className="text-gray-600 cursor-help" />
            </div>

            <div className="space-y-8">
              <ThresholdSlider 
                label="Critical Threshold" 
                value={thresholds.critical} 
                color="bg-red-500" 
                onChange={(v) => setThresholds({ ...thresholds, critical: v })} 
              />
              <ThresholdSlider 
                label="High Risk Threshold" 
                value={thresholds.high} 
                color="bg-orange-500" 
                onChange={(v) => setThresholds({ ...thresholds, high: v })} 
              />
              <ThresholdSlider 
                label="Watch Threshold" 
                value={thresholds.watch} 
                color="bg-yellow-500" 
                onChange={(v) => setThresholds({ ...thresholds, watch: v })} 
              />
            </div>
          </div>

          {/* Data Integration */}
          <div className="glass-card p-8 border border-white/10 shadow-2xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Database className="text-blue-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">Pipeline Integration</h3>
            </div>
            <div className="space-y-4">
              <StatusRow label="Hospital EHR Feed" status="Connected" statusColor="text-emerald-400" bgColor="bg-emerald-400/10" dot />
              <StatusRow label="Local Inference Engine" status="Running" statusColor="text-blue-400" bgColor="bg-blue-400/10" />
            </div>
          </div>

          {/* Simulation Toggle */}
          <div className="glass-card p-8 border-2 border-amber-500/20 bg-amber-500/5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-amber-400 mb-1">Clinical Simulation Mode</h4>
                <p className="text-xs text-amber-400/60 max-w-md font-medium">Enables stochastic vital sign drift to demonstrate risk tier transitions across the patient census.</p>
              </div>
              <button 
                onClick={toggleDemoMode}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-all focus:outline-none ${demoMode ? 'bg-amber-500' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-all shadow-lg ${demoMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function SettingsButton({ icon: Icon, label }: any) {
  return (
    <button className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-transparent hover:border-white/10 group">
      <div className="flex items-center gap-4 text-gray-400 group-hover:text-white">
        <Icon size={20} /> <span className="text-sm font-bold tracking-wide">{label}</span>
      </div>
    </button>
  );
}

function ThresholdSlider({ label, value, color, onChange }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-sm font-bold text-gray-300">{label}</span>
        <span className={`text-sm font-black px-3 py-1 rounded-lg ${color} text-white`}>{value}%</span>
      </div>
      <input 
        type="range" 
        min="10" 
        max="90" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  );
}

function StatusRow({ label, status, statusColor, bgColor, dot }: any) {
  return (
    <div className="flex items-center justify-between bg-black/20 p-5 rounded-2xl border border-white/5">
      <span className="text-sm font-bold text-gray-300">{label}</span>
      <span className={`px-4 py-1.5 ${bgColor} ${statusColor} font-black text-[10px] uppercase tracking-widest rounded-lg border border-current/20 flex items-center gap-2`}>
        {dot && <div className={`w-1.5 h-1.5 rounded-full ${statusColor.replace('text', 'bg')} animate-pulse`}></div>}
        {status}
      </span>
    </div>
  );
}
