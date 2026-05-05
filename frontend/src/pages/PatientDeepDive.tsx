import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, Line, ComposedChart, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceArea, ReferenceLine 
} from 'recharts';
import { 
  ArrowLeft, Clock, Activity, AlertTriangle, ShieldCheck, 
  Skull, HardDrive, Info, Send, Zap, FlaskConical, FileText
} from 'lucide-react';
import ArcGauge from '../components/ArcGauge';
import CausalGraph from '../components/CausalGraph';
import { VITAL_COLORS, getTierColor } from '../api';

export default function PatientDeepDive() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { patients, alerts, addToast } = useStore();
  const patient = patients.find(p => String(p.patient_id).toLowerCase() === String(id).toLowerCase());

  const [activeTab, setActiveTab] = useState<'Vitals' | 'Labs' | 'Imaging'>('Vitals');
  const [simulationMode, setSimulationMode] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [manualNote, setManualNote] = useState('');

  const isDeceased = patient?.status === 'Deceased';
  const isHardwareFailure = patient?.status === 'Hardware Failure';

  const chartData = useMemo(() => {
    if (!patient) return [];
    const data = (patient.vitals || []).map((v, i) => ({
      time: i,
      timeLabel: `${-11 + i}h`,
      hr: v.heart_rate,
      map: v.map_pressure,
      spo2: v.spo2,
      rr: v.respiratory_rate,
      temp: v.temperature,
      lac: v.serum_lactate,
      gcs: v.gcs_score,
      uo: v.urine_output,
      risk: (patient.crash_probability * 100) - (Math.random() * 10)
    }));

    if (!isDeceased && !isHardwareFailure) {
      const lastPoint = data[data.length - 1];
      for (let i = 1; i <= 6; i++) {
        data.push({
          timeLabel: `+${i}h`,
          hr: simulationMode ? Math.max(75, lastPoint.hr - (i * 3)) : lastPoint.hr,
          map: simulationMode ? Math.min(85, lastPoint.map + (i * 2)) : lastPoint.map,
          spo2: simulationMode ? Math.min(100, lastPoint.spo2 + (i * 0.5)) : lastPoint.spo2,
          risk: simulationMode ? lastPoint.risk - (i * 8) : lastPoint.risk + (i * 2),
          isPrediction: true
        } as any);
      }
    }
    return data;
  }, [patient, simulationMode, isDeceased, isHardwareFailure]);

  if (!patient) return (
    <div className="h-full flex flex-col items-center justify-center text-gray-400">
      <Activity size={64} className="mb-4 opacity-20" />
      <h2 className="text-2xl font-bold uppercase tracking-widest">Patient Intel Not Found</h2>
      <button onClick={() => navigate('/app')} className="mt-4 text-blue-400 hover:underline">Return to Triage Command</button>
    </div>
  );

  // DECEASED VIEW
  if (isDeceased) {
    return (
      <div className="h-full flex flex-col bg-[#0c1117] overflow-y-auto">
        <div className="bg-red-950/80 border-b border-red-500/30 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <Skull size={24} className="text-red-500" />
            <span className="text-lg font-black text-white uppercase tracking-widest">PATIENT DECEASED — Historical Record Only</span>
          </div>
          <div className="flex items-center gap-2 text-red-400 font-bold">
            <Clock size={16} />
            <span>Time of Death: {new Date(patient.admission_time).toLocaleString()}</span>
          </div>
        </div>

        <div className="p-8 flex-1 flex flex-col gap-8">
          <header className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-gray-400 hover:text-white">
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-4xl font-black text-white">{patient.name}</h1>
              <p className="text-sm text-[#8899aa] font-bold">{patient.age}Y • {patient.sex} • {patient.bed_id} • {patient.diagnosis}</p>
              <p className="text-[10px] text-gray-500 mt-1 uppercase tracking-widest">Admission: {new Date(patient.admission_time).toLocaleDateString()} • Attending: Dr. Arjun Mehta</p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 flex flex-col min-h-[400px]">
                <h3 className="text-sm font-bold text-[#e2e8f0] mb-6 uppercase tracking-wider">Vital Deterioration Timeline</h3>
                <div className="flex-1 w-full h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: '#131920', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                      <ReferenceArea x1={10} x2={11} fill="rgba(220, 38, 38, 0.1)" />
                      <ReferenceLine x={4} stroke="#d97706" strokeDasharray="5 5" label={{ value: 'Chronos High Risk Alert', position: 'top', fill: '#d97706', fontSize: 10, fontWeight: 'bold' }} />
                      <ReferenceLine x={10} stroke="#f97316" strokeDasharray="5 5" label={{ value: 'CODE BLUE Triggered', position: 'top', fill: '#f97316', fontSize: 10, fontWeight: 'bold' }} />
                      <ReferenceLine x={11} stroke="#dc2626" strokeDasharray="5 5" label={{ value: 'Death Confirmed', position: 'top', fill: '#dc2626', fontSize: 10, fontWeight: 'bold' }} />
                      {['hr', 'map', 'spo2', 'rr', 'temp', 'lac', 'gcs', 'uo'].map((key) => (
                        <Line key={key} type="monotone" dataKey={key} stroke={(VITAL_COLORS as any)[key === 'hr' ? 'heart_rate' : key === 'map' ? 'map_pressure' : key === 'rr' ? 'respiratory_rate' : key === 'temp' ? 'temperature' : key === 'lac' ? 'serum_lactate' : key === 'gcs' ? 'gcs_score' : 'urine_output']} strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-sm font-bold text-[#e2e8f0] mb-6 uppercase tracking-wider">Chronos Prediction Accuracy</h3>
                <div className="grid grid-cols-3 gap-4">
                  <AccuracyBox time="6H BEFORE" value="38%" />
                  <AccuracyBox time="2H BEFORE" value="88%" />
                  <AccuracyBox time="30M BEFORE" value="99%" />
                </div>
                <p className="text-[10px] text-[#8899aa] mt-4 font-bold">Chronos issued HIGH RISK alert at {new Date(new Date(patient.admission_time).getTime() + 4*3600*1000).toLocaleTimeString()} — 6.8 hours before death.</p>
              </div>
            </div>
            <div className="flex flex-col gap-6">
              <div className="glass-card p-6 flex-1">
                <h3 className="text-sm font-bold text-[#e2e8f0] mb-6 uppercase tracking-wider">Death Confirmation Audit Log</h3>
                <div className="space-y-4">
                  <TimelineEntry time="04:00" type="amber" label="Vital decline detected" />
                  <TimelineEntry time="04:15" type="amber" label="Chronos prediction escalated to Critical" />
                  <TimelineEntry time="10:00" type="red" label="CODE BLUE triggered by all-zero protocol" />
                  <TimelineEntry time="10:01" type="red" label="Nurse alerted" />
                  <TimelineEntry time="10:04" type="red" label="Dr. Arjun Mehta confirmed death via dashboard" />
                  <TimelineEntry time="10:05" type="gray" label="Time of death logged" />
                </div>
                <div className="mt-8 p-3 bg-white/5 border border-white/5 rounded text-[10px] text-[#8899aa] font-bold uppercase text-center">READ-ONLY AUDIT TRAIL</div>
              </div>
              <div className="glass-card p-6 bg-[#0a1628]/40 border-red-500/10">
                <h3 className="text-sm font-bold text-[#e2e8f0] mb-6 uppercase tracking-wider">Post-Event Analysis</h3>
                <div className="grid grid-cols-2 gap-y-4 gap-x-8">
                  <AnalysisItem label="First Deterioration" value="Serum Lactate (04:00)" />
                  <AnalysisItem label="Rate of MAP Decline" value="5.8 mmHg/hr" />
                  <AnalysisItem label="Prediction Lead Time" value="6.8 Hours" />
                  <AnalysisItem label="Intervention Window" value="Partial / Refractory" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // HARDWARE FAILURE VIEW
  if (isHardwareFailure) {
    return (
      <div className="h-full flex flex-col bg-[#0c1117] overflow-y-auto">
        <div className="bg-amber-900/80 border-b border-amber-500/30 p-4 shrink-0">
          <div className="flex items-center gap-4">
            <AlertTriangle size={24} className="text-amber-500 animate-pulse" />
            <span className="text-sm font-black text-white uppercase tracking-widest">HARDWARE FAULT DETECTED — HR Monitor and MAP Transducer offline — Biomedical engineering notified — Manual check required.</span>
          </div>
        </div>
        <div className="p-8 flex flex-col gap-8 flex-1">
          <header className="flex items-center gap-6">
            <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-gray-400 hover:text-white"><ArrowLeft size={24} /></button>
            <div>
              <h1 className="text-4xl font-black text-white">{patient.name}</h1>
              <p className="text-sm text-[#8899aa] font-bold">{patient.age}Y • {patient.sex} • {patient.bed_id} • {patient.diagnosis}</p>
            </div>
          </header>
          <div className="glass-card p-6 min-h-[350px] flex flex-col">
            <h3 className="text-sm font-bold text-[#e2e8f0] mb-6 uppercase tracking-wider">Physiological Signal Integrity</h3>
            <div className="flex-1 h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <Tooltip contentStyle={{ background: '#131920', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  {['hr', 'map'].map(key => <Line key={key} type="monotone" dataKey={key} stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} />)}
                  {['spo2', 'rr', 'temp', 'lac', 'gcs', 'uo'].map(key => <Line key={key} type="monotone" dataKey={key} stroke={(VITAL_COLORS as any)[key === 'spo2' ? 'spo2' : key === 'rr' ? 'respiratory_rate' : key === 'temp' ? 'temperature' : key === 'lac' ? 'serum_lactate' : key === 'gcs' ? 'gcs_score' : 'urine_output']} strokeWidth={2} dot={false} />)}
                  <ReferenceLine x={9} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Sensor Offline', position: 'top', fill: '#f59e0b', fontSize: 10, fontWeight: 'bold' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card p-6">
              <h3 className="text-[10px] font-bold text-[#8899aa] uppercase mb-4">Offline Sensors</h3>
              <div className="space-y-2">
                <SensorStatusRow label="HR Monitor" status="OFFLINE" type="red" />
                <SensorStatusRow label="MAP Transducer" status="OFFLINE" type="red" />
              </div>
            </div>
            <div className="glass-card p-6">
              <h3 className="text-[10px] font-bold text-[#8899aa] uppercase mb-4">Functioning Sensors</h3>
              <div className="grid grid-cols-2 gap-2">
                <SensorStatusRow label="SpO2" status="97%" type="green" />
                <SensorStatusRow label="RR" status="17" type="green" />
                <SensorStatusRow label="Temp" status="37.1" type="green" />
                <SensorStatusRow label="Lactate" status="1.2" type="green" />
              </div>
            </div>
            <div className="glass-card p-6 bg-amber-500/5 border-amber-500/20">
              <h3 className="text-[10px] font-bold text-amber-500 uppercase mb-4">System Assessment</h3>
              <div className="space-y-2 text-[11px] font-bold">
                <div className="flex justify-between"><span className="text-[#8899aa]">Death Protocol:</span><span className="text-emerald-500">NOT TRIGGERED</span></div>
                <p className="text-[9px] text-[#8899aa] italic">Reason: 6 of 8 sensors nominal.</p>
              </div>
            </div>
          </div>
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-[#e2e8f0] mb-6 uppercase tracking-wider">Manual Verification Log</h3>
            <div className="flex gap-4">
              <textarea value={manualNote} onChange={e => setManualNote(e.target.value)} placeholder="Enter result of manual check..." className="flex-1 bg-white/5 border border-white/10 rounded-lg p-3 text-sm text-white h-24" />
              <button onClick={() => { addToast({ type: 'success', message: 'Manual verification logged.' }); setManualNote(''); }} className="px-6 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-sm transition-all">Submit Manual Reading</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ACTIVE PATIENT VIEW
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col bg-[#0c1117] p-8 overflow-y-auto">
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-6 shrink-0">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-gray-400 hover:text-white"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter">{patient.name}</h1>
            <p className="text-sm text-[#8899aa] font-bold">{patient.age}Y • {patient.sex} • {patient.bed_id} • {patient.diagnosis}</p>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Risk Tier</span>
          <div className="px-6 py-2 rounded-xl font-black text-xl border" style={{ backgroundColor: `${getTierColor(patient.risk_tier)}15`, color: getTierColor(patient.risk_tier), borderColor: `${getTierColor(patient.risk_tier)}30` }}>
            {patient.risk_tier}
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8 mb-8 shrink-0">
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-8 border border-white/5 shadow-2xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Risk Intelligence</h3>
            <div className="flex items-center justify-around">
              <ArcGauge value={(patient.crash_probability || 0) * 100} color={getTierColor(patient.risk_tier)} label="CRASH RISK" />
              <ArcGauge value={(patient.sepsis_probability || 0) * 100} color="#f97316" label="SEPSIS RISK" />
            </div>
          </div>
          <div className="glass-card p-8 border border-white/5 shadow-2xl flex-1">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Neural Evidence (SHAP)</h3>
            <div className="flex flex-col gap-5">
              {patient.top_drivers.map((d, i) => (
                <div key={i} className="flex flex-col gap-2">
                  <div className="flex justify-between items-center"><span className="text-sm font-bold text-white">{d.feature}</span><span className="text-[10px] font-mono text-gray-500">{d.importance.toFixed(3)}</span></div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden"><div className={`h-full bg-red-500`} style={{ width: `${d.importance * 150}%` }} /></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card p-8 border border-white/5 shadow-2xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-8">
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                {['Vitals', 'Labs', 'Imaging'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-2 rounded-md text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{tab}</button>
                ))}
              </div>
              <button onClick={() => setSimulationMode(!simulationMode)} className={`flex items-center gap-2 px-6 py-2 rounded-lg font-bold text-xs transition-all border ${simulationMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-400'}`}>
                <FlaskConical size={14} /> {simulationMode ? 'SIMULATION ACTIVE' : 'DIGITAL TWIN SIMULATOR'}
              </button>
            </div>
            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <Tooltip contentStyle={{ background: 'rgba(10, 15, 37, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                  <ReferenceLine x="0h" stroke="white" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="hr" name="HR" stroke="#ef4444" strokeWidth={3} dot={false} strokeDasharray={simulationMode ? "5 5" : "0"} />
                  <Line type="monotone" dataKey="map" name="MAP" stroke="#3b82f6" strokeWidth={3} dot={false} strokeDasharray={simulationMode ? "5 5" : "0"} />
                  <Line type="monotone" dataKey="spo2" name="SpO2" stroke="#10b981" strokeWidth={3} dot={false} strokeDasharray={simulationMode ? "5 5" : "0"} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8 mb-20 shrink-0">
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className="glass-card p-8 border border-white/5 shadow-2xl h-[400px] flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Causal Cascade Reasoning</h3>
            <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden">
              <CausalGraph edges={patient.causal_edges} />
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-8 border border-white/5 shadow-2xl flex-1 flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Clinical Observations</h3>
            <div className="flex-1 overflow-y-auto mb-6 pr-2 space-y-4">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10 italic text-sm text-gray-400">"{patient.clinical_notes}"</div>
            </div>
            <div className="relative">
              <textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Record observation..." className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white h-24" />
              <button className="absolute bottom-4 right-4 p-2 bg-blue-600 text-white rounded-lg"><Send size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function AccuracyBox({ time, value }: any) {
  return (
    <div className="bg-white/5 border border-white/10 p-4 rounded-lg flex flex-col items-center">
      <span className="text-[10px] font-bold text-[#8899aa] mb-1">{time}</span>
      <span className="text-2xl font-black text-white">{value}</span>
    </div>
  );
}

function TimelineEntry({ time, type, label }: any) {
  const dotColor = type === 'amber' ? 'bg-amber-500' : type === 'red' ? 'bg-red-500' : 'bg-gray-600';
  return (
    <div className="flex items-center gap-4">
      <span className="text-[10px] font-mono text-gray-500 w-10">{time}</span>
      <div className={`w-2 h-2 rounded-full ${dotColor}`}></div>
      <span className="text-xs text-[#e2e8f0] font-medium">{label}</span>
    </div>
  );
}

function AnalysisItem({ label, value }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-[#8899aa] uppercase">{label}</span>
      <span className="text-sm font-bold text-white">{value}</span>
    </div>
  );
}

function SensorStatusRow({ label, status, type }: any) {
  const colorClass = type === 'red' ? 'bg-red-500/20 text-red-500 border-red-500/30' : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
  return (
    <div className="flex justify-between items-center bg-white/5 p-2 rounded-md border border-white/5">
      <span className="text-[10px] font-bold text-[#8899aa]">{label}</span>
      <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${colorClass}`}>{status}</span>
    </div>
  );
}
