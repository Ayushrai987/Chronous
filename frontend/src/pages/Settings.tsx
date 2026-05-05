import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { LogOut, User, Bell, Shield, Sliders, Activity, HardDrive, RotateCcw } from 'lucide-react';

export default function Settings() {
  const { role, login, thresholds, setThresholds, simulateGradualDeath, simulateHardwareFailure, simulateHardwareRecovery } = useStore();

  const handleLogout = () => {
    login(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-full overflow-y-auto bg-[#0c1117] flex flex-col gap-6">
      <header className="shrink-0">
        <h2 className="text-2xl font-bold text-[#e2e8f0]">System Configuration</h2>
        <p className="text-[#8899aa] text-sm">Manage your local Chronos Clinical OS environment</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="glass-card p-6 flex flex-col items-center">
          <div className="w-20 h-20 bg-blue-500/10 text-[#4f83cc] rounded-full flex items-center justify-center font-bold text-3xl border border-blue-500/20 mb-4">
            AM
          </div>
          <h3 className="text-lg font-bold text-[#e2e8f0]">Dr. Arjun Mehta</h3>
          <p className="text-[10px] font-bold text-[#4f83cc] uppercase tracking-wider mt-1">{role || 'Attending Physician'}</p>
          
          <div className="w-full mt-6 space-y-2">
            <SettingsButton icon={User} label="Clinical Identity" />
            <SettingsButton icon={Bell} label="Escalation Protocols" />
            <SettingsButton icon={Shield} label="Access Control" />
          </div>

          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 mt-8 p-3 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-lg text-xs font-bold border border-red-500/10 transition-all">
            <LogOut size={14} /> Sign Out
          </button>
        </div>

        {/* Settings Groups */}
        <div className="col-span-1 lg:col-span-2 space-y-6">
          
          {/* Thresholds */}
          <div className="glass-card p-6">
            <div className="flex items-center gap-3 mb-6">
              <Sliders className="text-[#4f83cc]" size={18} />
              <h3 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider">Neural Risk Thresholds</h3>
            </div>

            <div className="space-y-6">
              <ThresholdSlider 
                label="Critical Threshold" 
                value={thresholds.critical} 
                color="bg-[#dc2626]" 
                onChange={(v: number) => setThresholds({ ...thresholds, critical: v })} 
              />
              <ThresholdSlider 
                label="High Risk Threshold" 
                value={thresholds.high} 
                color="bg-[#d97706]" 
                onChange={(v: number) => setThresholds({ ...thresholds, high: v })} 
              />
              <ThresholdSlider 
                label="Watch Threshold" 
                value={thresholds.watch} 
                color="bg-[#ca8a04]" 
                onChange={(v: number) => setThresholds({ ...thresholds, watch: v })} 
              />
            </div>
          </div>

          {/* SECTION 7: DEMO SIMULATOR BUTTONS */}
          <div className="glass-card p-6 border-l-2 border-amber-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Activity className="text-amber-500" size={18} />
              <h3 className="text-sm font-bold text-amber-500 uppercase tracking-wider">Clinical Scenario Simulator</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => simulateGradualDeath('P-1000')}
                className="flex flex-col items-start p-4 bg-white/5 hover:bg-red-500/10 border border-white/5 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-2 mb-2 text-red-400">
                  <Activity size={16} className="animate-pulse" />
                  <span className="text-xs font-bold uppercase">Simulate Gradual Death</span>
                </div>
                <p className="text-[10px] text-[#8899aa] text-left">Targets Bed ICU-B2. Triggers realistic multi-vital decline over 4 minutes, culminating in Code Blue.</p>
              </button>

              <button 
                onClick={() => simulateHardwareFailure('P-1002')}
                className="flex flex-col items-start p-4 bg-white/5 hover:bg-amber-500/10 border border-white/5 rounded-lg transition-all group"
              >
                <div className="flex items-center gap-2 mb-2 text-amber-400">
                  <HardDrive size={16} />
                  <span className="text-xs font-bold uppercase">Simulate Hardware Failure</span>
                </div>
                <p className="text-[10px] text-[#8899aa] text-left">Targets Bed ICU-D3. Drops HR/MAP to zero while keeping other vitals normal to test sensor validation.</p>
              </button>

              <button 
                onClick={() => simulateHardwareRecovery('P-1002')}
                className="flex flex-col items-start p-4 bg-white/5 hover:bg-emerald-500/10 border border-white/5 rounded-lg transition-all col-span-1 md:col-span-2"
              >
                <div className="flex items-center gap-2 mb-2 text-emerald-400">
                  <RotateCcw size={16} />
                  <span className="text-xs font-bold uppercase">Simulate Hardware Recovery</span>
                </div>
                <p className="text-[10px] text-[#8899aa] text-left">Restores failed sensors on Bed ICU-D3 to nominal states.</p>
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
    <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-transparent hover:border-white/5 group">
      <div className="flex items-center gap-3 text-[#8899aa] group-hover:text-white">
        <Icon size={14} /> <span className="text-xs font-bold">{label}</span>
      </div>
    </button>
  );
}

function ThresholdSlider({ label, value, color, onChange }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs font-bold text-[#8899aa] uppercase">{label}</span>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${color} text-white`}>{value}%</span>
      </div>
      <input 
        type="range" 
        min="10" 
        max="90" 
        value={value} 
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#4f83cc]"
      />
    </div>
  );
}
