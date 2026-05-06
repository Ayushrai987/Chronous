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
  const { patients, alerts, addToast, shadowMode, patientAssessments, submitAssessment } = useStore();
  const { 
    patients, alerts, addToast, shadowMode, patientAssessments, submitAssessment,
    demoModeActive, setDemoModeActive, demoVitals, setDemoVitals, 
    demoProbability, setDemoProbability, demoCountdown, setDemoCountdown,
    updatePatient
  } = useStore();
  const patient = patients.find(p => String(p.patient_id).toLowerCase() === String(id).toLowerCase());
  const assessment = patient ? patientAssessments[patient.patient_id] : null;
  const isDemo = demoModeActive && patient?.patient_id === 'demo-rajesh';

  const [activeTab, setActiveTab] = useState<'Vitals' | 'Labs' | 'Imaging'>('Vitals');
  const [simulationMode, setSimulationMode] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [userAssessment, setUserAssessment] = useState('');
  const [tickCount, setTickCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);
  const [isIntervening, setIsIntervening] = useState(false);

  // DEMO SEQUENCE LOGIC
  useEffect(() => {
    if (isDemo && !isPaused) {
      const interval = setInterval(() => {
        if (isPaused) return;

        setTickCount(prev => prev + 1);

        if (!isIntervening) {
          // DETERIORATION
          setDemoVitals(prev => {
            if (!prev) return null;
            return {
              ...prev,
              heart_rate: Math.min(128, prev.heart_rate + (3 + Math.floor(Math.random() * 3))),
              map_pressure: Math.max(52, prev.map_pressure - (2 + Math.floor(Math.random() * 2))),
              spo2: Math.max(86, prev.spo2 - (0.5 + Math.random() * 0.5)),
              serum_lactate: Math.min(5.8, prev.serum_lactate + 0.2),
              respiratory_rate: Math.min(32, prev.respiratory_rate + 1),
              gcs_score: tickCount % 5 === 0 ? Math.max(8, prev.gcs_score - 1) : prev.gcs_score,
              temperature: tickCount % 3 === 0 ? prev.temperature + 0.1 : prev.temperature,
              urine_output: Math.max(0, prev.urine_output - 3),
              timestamp: new Date().toISOString()
            };
          });
          setDemoProbability(prev => Math.min(0.99, prev + (0.02 + Math.random() * 0.01)));
          setDemoCountdown(prev => Math.max(0, prev - 6));
        } else {
          // RECOVERY
          setDemoVitals(prev => {
            if (!prev) return null;
            return {
              ...prev,
              heart_rate: Math.max(88, prev.heart_rate - 2),
              map_pressure: Math.min(74, prev.map_pressure + 2),
              timestamp: new Date().toISOString()
            };
          });
          setDemoProbability(prev => Math.max(0.3, prev - 0.04));
        }
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isDemo, isPaused, isIntervening, tickCount]);

  // SOUND TRIGGER
  useEffect(() => {
    if (isDemo && demoProbability >= 0.75 && !hasAlerted) {
      setHasAlerted(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (time: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.frequency.value = 880;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
        osc.start(time);
        osc.stop(time + 0.2);
      };

      for (let i = 0; i < 3; i++) {
        const base = audioCtx.currentTime + (i * 0.8);
        playBeep(base);
        playBeep(base + 0.3);
      }

      addToast({ 
        type: 'critical', 
        message: "⚠ ALERT — Rajesh Kumar ICU-01 — Crash probability exceeded 75% — Immediate assessment required." 
      });
    }
  }, [isDemo, demoProbability, hasAlerted]);

  // SOLUTION 2: Signal Quality Engine
  const latestVitals = isDemo && demoVitals ? demoVitals : patient?.vitals[0];
  const signalQuality = useMemo(() => {
    if (!latestVitals) return { score: 100, sensors: {} };
    const sensors: any = {};
    let totalScore = 0;
    
    const check = (key: string, val: number, min: number, max: number, correlatedKey?: string, correlatedVal?: number) => {
      let q = 100;
      let reason = "Nominal";
      if (val < min || val > max) {
        q = 40;
        reason = "Physiological Outlier";
      }
      if (correlatedKey && val === 0 && (correlatedVal || 0) > 0) {
        q = 20;
        reason = `Contradicted by ${correlatedKey}`;
      }
      sensors[key] = { q, reason };
      totalScore += q;
    };

    check('HR', latestVitals.heart_rate, 30, 200);
    check('MAP', latestVitals.map_pressure, 40, 150);
    check('SpO2', latestVitals.spo2, 70, 100, 'HR', latestVitals.heart_rate);
    check('RR', latestVitals.respiratory_rate, 8, 40);
    check('Temp', latestVitals.temperature, 35, 41);
    check('Lac', latestVitals.serum_lactate, 0.5, 15);
    check('GCS', latestVitals.gcs_score, 3, 15);
    check('UO', latestVitals.urine_output, 0, 500);

    return { score: Math.round(totalScore / 8), sensors };
  }, [latestVitals]);

  const currentProb = isDemo ? demoProbability : (patient?.crash_probability || 0);
  const reliabilityMargin = (100 - signalQuality.score) / 5;
  const crashProbDisplay = patient ? `${(currentProb * 100).toFixed(1)}% ± ${reliabilityMargin.toFixed(1)}%` : '0%';

  const isDeceased = patient?.status === 'Deceased';
  const isHardwareFailure = patient?.status === 'Hardware Failure';

  const chartData = useMemo(() => {
    if (!patient) return [];
    let history = (patient.vitals || []).map((v, i) => ({
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

    if (isDemo && demoVitals) {
      history = [...history, {
        time: 12,
        timeLabel: 'LIVE',
        hr: demoVitals.heart_rate,
        map: demoVitals.map_pressure,
        spo2: demoVitals.spo2,
        rr: demoVitals.respiratory_rate,
        temp: demoVitals.temperature,
        lac: demoVitals.serum_lactate,
        gcs: demoVitals.gcs_score,
        uo: demoVitals.urine_output,
        risk: demoProbability * 100
      } as any];
    }

    if (!isDeceased && !isHardwareFailure && !isDemo) {
      const lastPoint = history[history.length - 1];
      for (let i = 1; i <= 6; i++) {
        history.push({
          timeLabel: `+${i}h`,
          hr: simulationMode ? Math.max(75, (lastPoint as any).hr - (i * 3)) : (lastPoint as any).hr,
          map: simulationMode ? Math.min(85, (lastPoint as any).map + (i * 2)) : (lastPoint as any).map,
          spo2: simulationMode ? Math.min(100, (lastPoint as any).spo2 + (i * 0.5)) : (lastPoint as any).spo2,
          risk: simulationMode ? (lastPoint as any).risk - (i * 8) : (lastPoint as any).risk + (i * 2),
          isPrediction: true
        } as any);
      }
    }
    return history;
  }, [patient, simulationMode, isDeceased, isHardwareFailure, isDemo, demoVitals, demoProbability]);

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
  const effectiveTier = isDemo && demoProbability >= 0.75 ? 'CRITICAL' : patient.risk_tier;

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ 
        opacity: 1,
        backgroundColor: isDemo && demoProbability >= 0.75 ? 'rgba(220,38,38,0.04)' : '#0c1117'
      }} 
      className="h-full flex flex-col p-4 sm:p-8 overflow-y-auto transition-colors duration-1000"
    >
      {isDemo && demoProbability >= 0.75 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-500/20 text-amber-500 text-center py-2 px-4 rounded-lg border border-amber-500/30 font-black text-xs uppercase tracking-widest mb-6"
        >
          Trajectory indicates septic shock onset within 1.5 hours — counterfactual intervention available.
        </motion.div>
      )}

      <header className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/10 gap-6 shrink-0 relative">
        <div className="flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="p-3 bg-white/5 hover:bg-white/10 rounded-lg border border-white/10 transition-all text-gray-400 hover:text-white"><ArrowLeft size={24} /></button>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tighter">{patient.name}</h1>
            <p className="text-sm text-[#8899aa] font-bold">{patient.age}Y • {patient.sex} • {patient.bed_id} • {patient.diagnosis}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          {isDemo && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsPaused(!isPaused)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest border border-white/10 transition-all"
              >
                {isPaused ? '▶ Resume Demo' : '⏸ Pause Demo'}
              </button>
              <button 
                onClick={() => {
                  setDemoModeActive(false);
                  setIsIntervening(false);
                  setTickCount(0);
                  setHasAlerted(false);
                }}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest border border-white/10 transition-all"
              >
                🔄 Reset Demo
              </button>
            </div>
          )}
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Risk Tier</span>
            <motion.div 
              animate={{ 
                backgroundColor: `${getTierColor(effectiveTier)}15`, 
                color: getTierColor(effectiveTier), 
                borderColor: `${getTierColor(effectiveTier)}30` 
              }}
              className="px-6 py-2 rounded-xl font-black text-xl border transition-colors duration-500"
            >
              {effectiveTier}
            </motion.div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-6 lg:gap-8 mb-8 shrink-0">
        {/* Main Section: Charts and Vitals - First on Mobile, Right on Desktop */}
        <div className="col-span-12 lg:col-span-8 lg:order-last flex flex-col gap-6">
          <div className="glass-card p-4 sm:p-8 border border-white/5 shadow-2xl flex-1 flex flex-col min-h-[400px]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex bg-white/5 p-1 rounded-lg border border-white/10 w-full sm:w-auto">
                {['Vitals', 'Labs', 'Imaging'].map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab as any)} className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 rounded-md text-[10px] sm:text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>{tab}</button>
                ))}
              </div>
              <button onClick={() => setSimulationMode(!simulationMode)} className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 sm:px-6 py-2 rounded-lg font-bold text-[10px] sm:text-xs transition-all border ${simulationMode ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-white/5 text-gray-400'}`}>
                <FlaskConical size={14} /> {simulationMode ? 'SIMULATION ACTIVE' : 'DIGITAL TWIN SIMULATOR'}
              </button>
            </div>
            <div className="flex-1 w-full min-h-[250px] sm:min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                  <Tooltip contentStyle={{ background: 'rgba(10, 15, 37, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }} />
                  <ReferenceLine x="0h" stroke="white" strokeDasharray="5 5" />
                  <Line type="monotone" dataKey="hr" name="HR" stroke="#ef4444" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="map" name="MAP" stroke="#3b82f6" strokeWidth={3} dot={false} isAnimationActive={false} />
                  <Line type="monotone" dataKey="spo2" name="SpO2" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SOLUTION 2: Signal Quality Panel */}
          <div className="glass-card p-4 sm:p-8 border border-white/5 shadow-2xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em]">Signal Quality & Reliability</h3>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-black text-gray-500 uppercase">Data Reliability</span>
                  <span className={`text-xl font-black ${signalQuality.score > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{signalQuality.score}%</span>
                </div>
                {signalQuality.score < 80 && (
                   <div className="bg-amber-500/20 text-amber-500 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/30">
                     LOW RELIABILITY
                   </div>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {Object.entries(signalQuality.sensors).map(([key, data]: [string, any]) => (
                <div key={key} className="p-3 bg-white/5 rounded-lg border border-white/5">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-black text-gray-300">{key}</span>
                    <span className={`text-[9px] font-bold ${data.q > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{data.q}%</span>
                  </div>
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden mb-2">
                    <div className={`h-full ${data.q > 80 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${data.q}%` }} />
                  </div>
                  <p className="text-[8px] text-gray-500 font-bold uppercase truncate">{data.reason}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar Section: Risk and Intelligence - Second on Mobile, Left on Desktop */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          <div className="glass-card p-4 sm:p-8 border border-white/5 shadow-2xl">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Risk Intelligence</h3>
            <div className="flex items-center justify-around">
              <div className="flex flex-col items-center">
                <ArcGauge 
                  value={currentProb * 100} 
                  color={currentProb >= 0.75 ? '#dc2626' : getTierColor(effectiveTier)} 
                  label="CRASH RISK" 
                />
                <p className="text-[10px] font-bold text-gray-400 mt-2">{crashProbDisplay}</p>
                <p className="text-[8px] text-gray-600 uppercase font-black">Reliability adjusted</p>
              </div>
              <ArcGauge value={(patient.sepsis_probability || 0) * 100} color="#f97316" label="SEPSIS RISK" />
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/5 text-center">
              <p className="text-[9px] text-gray-600 italic font-medium">
                Clinical Decision Support — Physician judgment required.
              </p>
            </div>
          </div>

          {/* Shadow Validation */}
          {shadowMode && (
            <div className="glass-card p-4 sm:p-8 border-l-4 border-indigo-500">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <ShieldCheck size={14} /> Shadow Validation
              </h3>
              {!assessment ? (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300">Enter your clinical assessment to unlock Chronos prediction data.</p>
                  <select 
                    value={userAssessment} 
                    onChange={e => setUserAssessment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                  >
                    <option value="">Select Assessment...</option>
                    <option value="Stable">Stable - No intervention</option>
                    <option value="Watching">Watching - Potential decline</option>
                    <option value="Critical">Critical - Escalating care</option>
                  </select>
                  <button 
                    disabled={!userAssessment}
                    onClick={() => submitAssessment(patient.patient_id, userAssessment)}
                    className="w-full py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs disabled:opacity-50"
                  >
                    SUBMIT INITIAL ASSESSMENT
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Your Assessment</p>
                    <p className="text-sm font-bold text-emerald-400">{assessment}</p>
                  </div>
                  <div className={`p-3 border rounded-lg ${assessment === patient.risk_tier || (assessment === 'Watching' && patient.risk_tier === 'WATCH') ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}>
                    <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Chronos Agreement</p>
                    <p className="text-sm font-bold text-white">
                      {assessment === patient.risk_tier || (assessment === 'Watching' && patient.risk_tier === 'WATCH') ? '✓ AGREE' : '⚠ DISAGREE'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Neural Evidence (SHAP) */}
          <motion.div 
            animate={{ 
              ring: isDemo && currentProb >= 0.85 ? '2px solid rgba(245, 158, 11, 0.4)' : 'none',
              boxShadow: isDemo && currentProb >= 0.85 ? '0 0 20px rgba(245, 158, 11, 0.1)' : 'none'
            }}
            className="glass-card p-4 sm:p-8 border border-white/5 shadow-2xl flex-1 transition-all duration-1000 overflow-hidden relative"
          >
            {isDemo && currentProb >= 0.85 && (
              <div className="absolute top-2 right-4 text-[8px] font-black text-amber-500 animate-pulse uppercase tracking-widest">
                INTERVENTION WINDOW CLOSING
              </div>
            )}
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Neural Evidence (SHAP)</h3>
            <div className="flex flex-col gap-6">
              {patient.top_drivers.map((d, i) => (
                <ShapEvidenceItem key={i} driver={d} isDemo={isDemo} currentProb={currentProb} />
              ))}
            </div>

            {isDemo && (
              <div className="mt-8 pt-6 border-t border-white/10">
                <button 
                  onClick={() => {
                    setIsIntervening(true);
                    addToast({ type: 'success', message: 'Intervention logged — Vitals stabilizing — Crash probability decreasing.' });
                  }}
                  className={`w-full py-3 rounded-lg font-black text-xs uppercase tracking-widest transition-all ${isIntervening ? 'bg-emerald-600 text-white cursor-default' : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'}`}
                >
                  {isIntervening ? '✓ INTERVENTION ACTIVE' : '⚡ Simulate Intervention'}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6 lg:gap-8 mb-20 shrink-0">
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6">
          <div className="glass-card p-4 sm:p-8 border border-white/5 shadow-2xl h-[400px] flex flex-col">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-[0.2em] mb-8">Causal Cascade Reasoning</h3>
            <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-hidden">
              <CausalGraph edges={patient.causal_edges} />
            </div>
          </div>
        </div>
        <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
          <div className="glass-card p-4 sm:p-8 border border-white/5 shadow-2xl flex-1 flex flex-col">
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

function ShapEvidenceItem({ driver, isDemo, currentProb }: { driver: any, isDemo?: boolean, currentProb?: number }) {
  const [expanded, setExpanded] = useState(false);
  
  const evidence: any = {
    'Heart Rate': { find: 'Tachycardia correlates with sympathetic activation during early shock.', guide: 'AHA ACLS Guidelines (2020)', freq: 84 },
    'MAP': { find: 'Mean Arterial Pressure < 65 mmHg is the primary indicator of organ hypoperfusion.', guide: 'Surviving Sepsis Campaign (2021)', freq: 92 },
    'SpO2': { find: 'Hypoxemia drives respiratory failure predictions 2 hours before clinical visible distress.', guide: 'BTS Oxygen Guidelines', freq: 78 },
    'Lactate': { find: 'Hyperlactatemia > 4 mmol/L indicates anaerobic metabolism and tissue hypoxia.', guide: 'Surviving Sepsis Campaign', freq: 95 },
    'GCS': { find: 'Declining neurological state indicates reduced cerebral perfusion.', guide: 'Brain Trauma Foundation', freq: 65 }
  };

  const info = evidence[driver.feature] || { find: 'Statistical correlation with critical deterioration in MIMIC-IV cohort.', guide: 'Clinical Best Practice', freq: 50 };

  return (
    <div className="flex flex-col gap-2">
      <div 
        className="flex justify-between items-center cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => setExpanded(!expanded)}
      >
        <span className="text-sm font-bold text-white flex items-center gap-2">
          {driver.feature} <Info size={12} className="text-blue-400" />
        </span>
        <span className="text-[10px] font-mono text-gray-500">{driver.importance.toFixed(3)}</span>
      </div>
      <motion.div 
        animate={{
          scale: isDemo && driver.feature === 'MAP' && currentProb >= 0.75 ? [1, 1.02, 1] : 1
        }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="h-1.5 bg-white/5 rounded-full overflow-hidden"
      >
        <div 
          className={`h-full transition-all duration-1000 ${driver.feature === 'MAP' && isDemo && currentProb >= 0.75 ? 'bg-red-500' : 'bg-red-500'}`} 
          style={{ width: `${driver.importance * 150}%` }} 
        />
      </motion.div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-blue-500/5 rounded border border-blue-500/10 p-3 mt-1 space-y-2"
          >
            <div>
              <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">MIMIC-IV STATISTICAL FINDING</p>
              <p className="text-[10px] text-gray-300 leading-relaxed">{info.find}</p>
            </div>
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">CLINICAL GUIDELINE</p>
                <p className="text-[9px] text-gray-400 italic">{info.guide}</p>
              </div>
              <div className="text-right">
                <p className="text-[8px] font-black text-blue-400 uppercase mb-0.5">POPULATION FREQ</p>
                <p className="text-[10px] font-bold text-white">{info.freq}%</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
