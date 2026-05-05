import { motion } from 'framer-motion';
import { useStore } from '../store/useStore';
import { LogOut, User, Bell, Shield, Sliders, Activity, HardDrive, RotateCcw, Terminal, FileText, CheckCircle, Download, ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Settings() {
  const { 
    role, login, thresholds, setThresholds, 
    simulateGradualDeath, simulateHardwareFailure, simulateHardwareRecovery,
    shadowMode, toggleShadowMode,
    integrationStatus, hl7Logs, addHl7Log
  } = useStore();

  useEffect(() => {
    const interval = setInterval(() => {
      const msg = `MSH|^~\\&|CHRONOS|ICU-7|HIS|HOSP-1|${new Date().toISOString()}||ORU^R01|${Math.random().toString(36).substring(7)}|P|2.3\nOBX|1|NM|8867-4^Heart Rate^LN||${Math.round(70 + Math.random() * 30)}|bpm|||||F`;
      addHl7Log(msg);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

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

          {/* SOLUTION 1: Shadow Testing Mode */}
          <div className="glass-card p-6 border-l-2 border-indigo-500/30">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Shield className="text-indigo-400" size={18} />
                <div>
                  <h3 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider">Shadow Testing Protocol</h3>
                  <p className="text-[10px] text-[#8899aa] font-medium">Validates model against clinician judgment without interference.</p>
                </div>
              </div>
              <button 
                onClick={toggleShadowMode}
                className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all ${shadowMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}
              >
                {shadowMode ? 'PROTOCOL ACTIVE' : 'ENABLE SHADOW MODE'}
              </button>
            </div>
            {shadowMode && (
              <div className="p-3 bg-indigo-500/5 rounded border border-indigo-500/10">
                <p className="text-[10px] text-indigo-300 font-bold leading-relaxed">
                  NOTE: In Shadow Mode, risk scores are suppressed until clinician logs an initial assessment. Discrepancies are flagged for the clinical validation audit.
                </p>
              </div>
            )}
          </div>

          {/* SOLUTION 3: Integration Status & Message Log */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Terminal className="text-emerald-400" size={18} />
                <h3 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider">HIS Integration Hub</h3>
              </div>
              <button className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-md border border-emerald-500/20 text-[10px] font-bold hover:bg-emerald-500/20 transition-all">
                <Download size={12} /> Generate Integration Report (PDF)
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {Object.entries(integrationStatus).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between p-2 bg-white/[0.02] rounded border border-white/5">
                  <div className="flex items-center gap-3">
                    <CheckCircle size={14} className={status === 'Simulated' ? 'text-amber-500' : 'text-emerald-500'} />
                    <span className="text-[11px] font-bold text-gray-300">{service}</span>
                  </div>
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded ${status === 'Simulated' ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-400'}`}>
                    {status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-[#080c12] rounded-lg border border-white/5 overflow-hidden">
              <div className="bg-white/5 px-4 py-2 border-b border-white/5 flex items-center justify-between">
                <span className="text-[9px] font-black text-[#8899aa] uppercase">Live HL7 v2 Feed</span>
                <span className="flex items-center gap-1.5 text-[8px] text-emerald-500 font-bold">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> LISTENING
                </span>
              </div>
              <div className="p-4 font-mono text-[10px] space-y-2 h-[150px] overflow-y-auto scrollbar-hide">
                {hl7Logs.map((log) => (
                  <div key={log.id} className="text-[#8899aa] border-b border-white/5 pb-2 last:border-0">
                    <span className="text-emerald-500/70 mr-2">[{log.timestamp}]</span>
                    <span className="text-white/80 whitespace-pre-wrap">{log.msg}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* SOLUTION 5: Compliance Framework & Roadmap */}
          <div className="glass-card p-6 border-l-2 border-blue-500/30">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="text-blue-400" size={18} />
              <h3 className="text-sm font-bold text-[#e2e8f0] uppercase tracking-wider">Regulatory Compliance Framework</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <ComplianceCard 
                title="FDA Status" 
                desc="CDSS Software under FDA 21st Century Cures Act exemption. Displays clinical data for review." 
                icon={CheckCircle}
              />
              <ComplianceCard 
                title="CDSCO India" 
                desc="Class B Software as Medical Device (SaMD). Conformance to Medical Device Rules 2017." 
                icon={CheckCircle}
              />
              <ComplianceCard 
                title="Liability" 
                desc="Clinicians retain full legal responsibility. Chronos is a support tool, not a driver." 
                icon={FileText}
              />
            </div>

            <h4 className="text-[10px] font-black text-[#8899aa] uppercase tracking-widest mb-4">Clinical Validation Roadmap</h4>
            <div className="relative flex flex-col md:flex-row gap-6 md:gap-4">
              <RoadmapStep step="1" title="Algorithmic Validation" status="Completed" desc="MIMIC-IV Cohort Analysis" />
              <RoadmapStep step="2" title="Shadow Testing" status="In Progress" desc="Clinician Discrepancy Audit" />
              <RoadmapStep step="3" title="Prospective Study" status="Planned" desc="Observational ICU Pilot" />
              <RoadmapStep step="4" title="CDSCO Filing" status="Planned" desc="Clinical Evidence Dossier" />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function ComplianceCard({ title, desc, icon: Icon }: any) {
  return (
    <div className="p-4 bg-white/5 rounded-lg border border-white/5 flex flex-col gap-2">
      <div className="flex items-center gap-2 text-blue-400">
        <Icon size={14} />
        <span className="text-xs font-black uppercase">{title}</span>
      </div>
      <p className="text-[10px] text-[#8899aa] leading-relaxed">{desc}</p>
    </div>
  );
}

function RoadmapStep({ step, title, status, desc }: any) {
  const isComplete = status === 'Completed';
  const isInProgress = status === 'In Progress';
  
  return (
    <div className="flex-1 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${isComplete ? 'bg-emerald-500 text-white' : isInProgress ? 'bg-blue-500 text-white' : 'bg-white/10 text-[#8899aa]'}`}>
          {step}
        </div>
        <span className={`text-[10px] font-black px-2 py-0.5 rounded ${isComplete ? 'bg-emerald-500/10 text-emerald-500' : isInProgress ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-[#8899aa]'}`}>
          {status.toUpperCase()}
        </span>
      </div>
      <div className="pl-7">
        <h5 className="text-[11px] font-bold text-white">{title}</h5>
        <p className="text-[9px] text-[#8899aa]">{desc}</p>
      </div>
    </div>
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
