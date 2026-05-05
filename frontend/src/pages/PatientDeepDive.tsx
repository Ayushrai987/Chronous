import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AreaChart, Area, Line, ComposedChart, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine 
} from 'recharts';
import { 
  ArrowLeft, Clock, Info, Activity, Zap, 
  FlaskConical, ShieldCheck, FileText, Send
} from 'lucide-react';
import ArcGauge from '../components/ArcGauge';
import CausalGraph from '../components/CausalGraph';
import { VITAL_COLORS, getTierColor } from '../api';

export default function PatientDeepDive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, alerts, role } = useStore();
  const patient = patients.find(p => String(p.patient_id).toLowerCase() === String(id).toLowerCase());

  const [activeTab, setActiveTab] = useState<'Vitals' | 'Labs' | 'Imaging'>('Vitals');

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500 animate-pulse">
        <Activity size={48} className="mb-4 opacity-20" />
        <h2 className="text-xl font-black uppercase tracking-[0.3em]">Synchronizing Patient Intel...</h2>
        <p className="text-xs mt-2 italic">Fetching real-time neural data from Edge Server</p>
      </div>
    );
  }

  const [emulatorVitals, setEmulatorVitals] = useState({
    hr: patient.vitals?.[0]?.heart_rate || 85,
    map: patient.vitals?.[0]?.map_pressure || 75,
    spo2: patient.vitals?.[0]?.spo2 || 98
  });

  const handleEmulatorChange = async (key: string, val: number) => {
    const newVitals = { ...emulatorVitals, [key]: val };
    setEmulatorVitals(newVitals);
    
    // In a real demo, this simulates the Bedside Monitor sending data to the Edge Server
    addToast({ type: 'success', message: `Bedside Monitor: ${key.toUpperCase()} adjusted to ${val}` });
  };
  const [simulationMode, setSimulationMode] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  if (!patient) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <Activity size={64} className="mb-4 opacity-20" />
      <h2 className="text-2xl font-bold">Patient Not Found</h2>
      <button onClick={() => navigate('/app')} className="mt-4 text-blue-400 hover:underline">Return to Command Center</button>
    </div>
  );

  const daysInICU = Math.floor((Date.now() - new Date(patient.admission_time).getTime()) / (1000 * 3600 * 24));
  const tierColor = getTierColor(patient.risk_tier);
  
  const vitalsChartData = useMemo(() => {
    const data = [...(patient.vitals || [])].map((v, i) => {
      const hoursFromNow = -11 + i;
      return {
        time: hoursFromNow <= 0 ? `${hoursFromNow}h` : `+${hoursFromNow}h`,
        hourNum: hoursFromNow,
        hr: v.heart_rate,
        map: v.map_pressure,
        spo2: v.spo2,
        rr: v.respiratory_rate,
        lactate: v.serum_lactate,
        risk: (patient.crash_probability * 100) - (Math.random() * 10) // Mock risk trend
      };
    });
    
    const lastPoint = data[data.length - 1];
    
    // Add 6h Prediction Horizon
    for (let i = 1; i <= 6; i++) {
      const isSimulated = simulationMode && i > 0;
      data.push({
        time: `+${i}h`,
        hourNum: i,
        // If simulation mode is on, vitals "improve"
        hr: isSimulated ? Math.max(75, lastPoint.hr - (i * 3)) : lastPoint.hr, 
        map: isSimulated ? Math.min(85, lastPoint.map + (i * 2)) : lastPoint.map,
        spo2: isSimulated ? Math.min(100, lastPoint.spo2 + (i * 0.5)) : lastPoint.spo2,
        rr: lastPoint.rr,
        lactate: isSimulated ? Math.max(1.0, lastPoint.lactate - (i * 0.2)) : lastPoint.lactate,
        risk: isSimulated ? lastPoint.risk - (i * 8) : lastPoint.risk + (i * 2), // Risk drops in sim
        isPrediction: true
      } as any);
    }
    return data;
  }, [patient, simulationMode]);

  const patientAlerts = (alerts || []).filter(a => a.patientId === patient.patient_id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col mesh-gradient-bg p-8 overflow-y-auto overflow-x-hidden">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-6 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-gray-400 hover:text-white group">
            <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex items-baseline gap-4 mb-1">
              <h1 className="text-5xl font-black text-white tracking-tighter">{patient.name}</h1>
              <span className="text-2xl font-medium text-gray-500 italic">Age: {patient.age} • {patient.sex === 'M' ? 'Male' : 'Female'}</span>
            </div>
            <div className="flex items-center gap-4 mb-4">
               <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ayushman Bharat Verified</span>
               </div>
               <span className="text-xs font-mono text-gray-500 tracking-wider">
                 ABHA ID: {patient.abha_id ? `${patient.abha_id.substring(0, 5)}XX-XXXX-XXXX` : 'Pending Sync...'}
               </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="px-4 py-1 bg-blue-600/20 text-blue-400 font-black rounded-lg text-xs border border-blue-500/30">{patient.bed_id}</span>
              <span className="px-4 py-1 bg-white/5 text-gray-400 font-bold rounded-lg text-xs border border-white/10">{patient.diagnosis}</span>
              <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full border border-white/5">
                <Clock size={12} /> Day {daysInICU} in ICU
              </span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end mr-4">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Status Tier</span>
            <div 
              className="px-6 py-2 rounded-2xl font-black text-xl tracking-wider border shadow-2xl transition-all"
              style={{ 
                backgroundColor: `${tierColor}15`, 
                color: tierColor, 
                borderColor: `${tierColor}30`,
                boxShadow: `0 0 40px ${tierColor}15`
              }}
            >
              {patient.risk_tier}
            </div>
          </div>
          <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-gray-400 hover:text-white" title="Model Lineage & Audit Trail">
            <ShieldCheck size={24} />
          </button>
          <button className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 transition-all text-gray-400 hover:text-white" title="Export Clinical Summary">
            <FileText size={24} />
          </button>
        </div>
      </header>

      {/* 🔴 LIVE BEDSIDE MONITOR EMULATOR - Hackathon Demo Controller */}
      <div className="mb-8 p-6 glass-card border-emerald-500/20 bg-emerald-500/5 shadow-[0_0_50px_rgba(16,185,129,0.05)]">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-emerald-400 animate-pulse" />
            <h3 className="text-xs font-black text-gray-300 uppercase tracking-widest">Bedside Monitor Hardware Emulator</h3>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[9px] text-emerald-400 font-black uppercase">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" /> Live Device Link
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 px-4">
          {/* HR Control */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">HR (bpm)</span>
              <span className="text-xl font-black text-red-500 tabular-nums">{emulatorVitals.hr}</span>
            </div>
            <input 
              type="range" min="40" max="180" step="1"
              value={emulatorVitals.hr}
              onChange={(e) => handleEmulatorChange('hr', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* MAP Control */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">MAP (mmHg)</span>
              <span className="text-xl font-black text-blue-500 tabular-nums">{emulatorVitals.map}</span>
            </div>
            <input 
              type="range" min="30" max="140" step="1"
              value={emulatorVitals.map}
              onChange={(e) => handleEmulatorChange('map', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* SpO2 Control */}
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em]">SpO2 (%)</span>
              <span className="text-xl font-black text-emerald-500 tabular-nums">{emulatorVitals.spo2}%</span>
            </div>
            <input 
              type="range" min="60" max="100" step="1"
              value={emulatorVitals.spo2}
              onChange={(e) => handleEmulatorChange('spo2', parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-8 shrink-0">
        {/* RISK MATRIX */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-8 border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><Zap size={120} /></div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Risk Intelligence</h3>
            <div className="flex items-center justify-around relative z-10">
              <ArcGauge value={(patient.crash_probability || 0) * 100} color={tierColor} label="CRASH RISK" />
              <div className="w-px h-16 bg-white/10"></div>
              <ArcGauge value={(patient.sepsis_probability || 0) * 100} color="#f97316" label="SEPSIS RISK" />
            </div>
          </div>

          <div className="glass-card p-8 border border-white/5 shadow-2xl flex-1">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Neural Evidence (SHAP)</h3>
              <Info size={16} className="text-gray-600 cursor-help" />
            </div>
            <div className="flex flex-col gap-5">
              {(patient.top_drivers || []).length > 0 ? (
                patient.top_drivers.map((d, i) => (
                  <div key={i} className="flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-white">{d.feature}</span>
                      <span className="text-[10px] font-mono text-gray-500">{(d.importance).toFixed(3)}</span>
                    </div>
                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(10, d.importance * 150)}%` }}
                        className={`h-full rounded-full ${d.direction === 'risk-increasing' ? 'bg-red-500' : 'bg-blue-500'}`}
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 italic mt-1 leading-tight">{d.label}</p>
                  </div>
                ))
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-gray-600 italic text-sm text-center">
                  <ShieldCheck size={32} className="mb-2 opacity-20" />
                  No acute risk drivers detected. Baseline stable.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PHYSIOLOGICAL TRAJECTORY */}
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-8 border border-white/5 shadow-2xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                {(['Vitals', 'Labs', 'Imaging'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                      activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSimulationMode(!simulationMode)}
                  className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-xs transition-all border ${
                    simulationMode 
                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                    : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
                  }`}
                >
                  <FlaskConical size={14} />
                  {simulationMode ? 'SIMULATION ACTIVE' : 'DIGITAL TWIN SIMULATOR'}
                </button>
              </div>
            </div>

            <div className="flex-1 w-full min-h-0">
              {activeTab === 'Vitals' ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <ComposedChart data={vitalsChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={tierColor} stopOpacity={0.1}/>
                        <stop offset="95%" stopColor={tierColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} tickMargin={15} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ background: 'rgba(10, 15, 37, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', backdropFilter: 'blur(10px)' }}
                      itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                    />
                    <ReferenceArea x1="0h" x2="+6h" fill="rgba(255,255,255,0.02)" />
                    <ReferenceLine x="0h" stroke="white" strokeDasharray="5 5" label={{ value: 'NOW', position: 'insideTopRight', fill: 'white', fontSize: 10, fontWeight: 'bold' }} />
                    
                    <Area type="monotone" dataKey="risk" stroke={tierColor} fillOpacity={1} fill="url(#colorRisk)" strokeWidth={3} />
                    <Line type="monotone" dataKey="map" name="MAP" stroke="#3b82f6" strokeWidth={3} dot={false} strokeDasharray={simulationMode ? "5 5" : "0"} />
                    <Line type="monotone" dataKey="hr" name="HR" stroke="#ef4444" strokeWidth={3} dot={false} strokeDasharray={simulationMode ? "5 5" : "0"} />
                    <Line type="monotone" dataKey="spo2" name="SpO2" stroke="#10b981" strokeWidth={3} dot={false} strokeDasharray={simulationMode ? "5 5" : "0"} />
                  </ComposedChart>
                </ResponsiveContainer>
              ) : activeTab === 'Labs' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6 p-4 overflow-y-auto">
                   <LabMetric label="Serum Lactate" value={patient.vitals[0]?.serum_lactate} unit="mmol/L" trend="rising" color="text-red-400" />
                   <LabMetric label="WBC Count" value="14.2" unit="10³/µL" trend="rising" color="text-orange-400" />
                   <LabMetric label="Creatinine" value="1.4" unit="mg/dL" trend="stable" color="text-yellow-400" />
                   <LabMetric label="Bilirubin" value="0.9" unit="mg/dL" trend="falling" color="text-emerald-400" />
                   <LabMetric label="Platelets" value="210" unit="10³/µL" trend="stable" color="text-blue-400" />
                   <LabMetric label="Procalcitonin" value="2.4" unit="ng/mL" trend="rising" color="text-red-400" />
                </div>
              ) : (
                <div className="h-full flex flex-col gap-6 p-4">
                  <div className="flex-1 rounded-2xl overflow-hidden border border-white/10 bg-black/40 relative group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute top-4 left-4 bg-black/60 px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold text-gray-300">
                      CHEST X-RAY • AP VIEW • 2H AGO
                    </div>
                    {/* Simulated X-ray content */}
                    <div className="w-full h-full flex items-center justify-center">
                       <div className="w-64 h-80 border-2 border-white/5 rounded-full blur-3xl bg-blue-500/10" />
                       <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-[80%] h-[80%] grid grid-cols-2 gap-4 opacity-20">
                             <div className="border-4 border-dashed border-white/20 rounded-t-full" />
                             <div className="border-4 border-dashed border-white/20 rounded-t-full" />
                          </div>
                          {/* AI Annotation */}
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }} 
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="absolute top-1/3 right-1/3 w-20 h-20 border-2 border-red-500/50 rounded-xl bg-red-500/10 flex items-center justify-center"
                          >
                            <span className="text-[8px] font-bold text-red-400 uppercase text-center leading-tight">Infiltration<br/>Detected</span>
                          </motion.div>
                       </div>
                    </div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl border border-white/5 text-[11px] text-gray-400 leading-relaxed">
                    <span className="font-bold text-blue-400 uppercase mr-2">AI Impression:</span>
                    Increased opacification in the right lower lobe correlates with falling SpO2 and rising temperature. Clinical picture suggests early-stage aspiration pneumonia.
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-8 flex justify-between items-center bg-black/20 p-4 rounded-2xl border border-white/5">
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> MAP</div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-red-500"></div> HR</div>
                 <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> SpO2</div>
              </div>
              <p className="text-[10px] text-gray-500 italic">Historical data (12h) • Neural projection (6h)</p>
            </div>
          </div>
        </div>
      </div>

      {/* LOWER GRID: CAUSAL & TIMELINE */}
      <div className="grid grid-cols-12 gap-8 mb-20 shrink-0">
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
           <div className="glass-card p-8 border border-white/5 shadow-2xl h-[400px] flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Causal Cascade Reasoning</h3>
                <div className="flex gap-4">
                   <span className="flex items-center gap-2 text-[10px] font-bold text-red-400"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div> Active Driver</span>
                   <span className="flex items-center gap-2 text-[10px] font-bold text-gray-500"><div className="w-2 h-2 rounded-full bg-gray-600"></div> Latent</span>
                </div>
              </div>
              <div className="flex-1 bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                <CausalGraph edges={patient.causal_edges} />
              </div>
           </div>
        </div>

        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-8 border border-white/5 shadow-2xl flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Clinical Observations</h3>
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4">
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 bg-purple-500/20 text-purple-400 text-[8px] font-black uppercase tracking-widest rounded-bl-lg">NLP Entity Detected</div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-white">Chronos NLP Engine</span>
                  <span className="text-[10px] text-gray-500">Just Now</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed italic">"Detected: <span className="text-purple-400 font-bold underline">Gram-negative septicemia</span>. Escalating sepsis risk profile based on combined multimodal data."</p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-bold text-white">System AI</span>
                  <span className="text-[10px] text-gray-500">12:30 PM</span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed italic">"Risk tier elevated to {patient.risk_tier} based on persistent hypotension and rising serum lactate. Causal path: Hemodynamic Collapse."</p>
              </div>
              {/* Mock history */}
            </div>
            <div className="relative">
               <textarea 
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Record intervention or clinical observation..."
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-blue-500 min-h-[100px] resize-none"
               />
               <button className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all">
                  <Send size={18} />
               </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function LabMetric({ label, value, unit, trend, color }: any) {
  return (
    <div className="bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-all">
      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-end gap-2">
        <span className={`text-xl font-black ${color || 'text-white'}`}>{value}</span>
        <span className="text-[10px] font-bold text-gray-500 mb-1">{unit}</span>
      </div>
      <div className={`mt-2 text-[10px] font-bold flex items-center gap-1 ${
        trend === 'rising' ? 'text-red-400' : trend === 'falling' ? 'text-emerald-400' : 'text-gray-500'
      }`}>
        {trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→'} {trend.toUpperCase()}
      </div>
    </div>
  );
}
