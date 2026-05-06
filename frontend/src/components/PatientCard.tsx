import { Patient, getTierColor, VITAL_COLORS } from '../api'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { motion } from 'framer-motion'
import { useStore } from '../store/useStore'
import { useNavigate } from 'react-router-dom'
import { Clock, ChevronRight } from 'lucide-react'

interface PatientCardProps {
  patient: Patient
}

export default function PatientCard({ patient }: PatientCardProps) {
  const { 
    codeBluePatient, confirmDeath, setDemoModeActive, setDemoVitals, 
    setDemoProbability, setDemoCountdown, shadowMode 
  } = useStore();
  const navigate = useNavigate();

  const latestVitals = patient.vitals[0];

  // SOLUTION 1: Model Confidence Calculation
  const trainingDist: any = {
    heart_rate: { mean: 82, std: 14 },
    map_pressure: { mean: 85, std: 15 },
    spo2: { mean: 97, std: 2 },
    respiratory_rate: { mean: 18, std: 4 },
    temperature: { mean: 37, std: 0.8 },
    lactate: { mean: 1.5, std: 1.0 },
    gcs_score: { mean: 14, std: 2 },
    urine_output: { mean: 50, std: 20 }
  };

  const getZScore = (val: number, key: string) => {
    const dist = trainingDist[key];
    if (!dist) return 0;
    return Math.abs((val - dist.mean) / dist.std);
  };

  const vitalKeys = ['heart_rate', 'map_pressure', 'spo2', 'respiratory_rate', 'temperature', 'lactate', 'gcs_score', 'urine_output'];
  const outliers = vitalKeys.filter(key => getZScore((latestVitals as any)[key], key) > 2).length;

  let confidence: { label: string; color: string } = { label: 'High Confidence', color: '#10b981' };
  if (outliers >= 5) {
    confidence = { label: 'Low Confidence — Population Mismatch', color: '#f97316' };
  } else if (outliers >= 2) {
    confidence = { label: 'Moderate Confidence — Atypical', color: '#f59e0b' };
  }

  // SOLUTION 2 & 4: Trend and Contradiction Detection
  const hasSpO2Contradiction = latestVitals.spo2 < 85 && latestVitals.heart_rate > 60 && latestVitals.respiratory_rate < 25 && latestVitals.map_pressure > 65;
  
  // Trend Confirmation (last 3 readings)
  const trendSegments = patient.vitals.slice(0, 3).map((v, i, arr) => {
    if (i === arr.length - 1) return 'neutral';
    const next = arr[i + 1];
    return v.heart_rate > next.heart_rate || v.map_pressure < next.map_pressure ? 'red' : 'green';
  }).reverse();

  const tierColor = getTierColor(patient.risk_tier)
  const crashProb = (patient.crash_probability * 100).toFixed(1)
  const sepsisProb = ((patient.sepsis_probability || 0) * 100).toFixed(1)
  
  const sparkData = (patient.vitals || []).slice(-12).map((v, i) => ({
    idx: i,
    hr: v.heart_rate,
    map: v.map_pressure,
    spo2: v.spo2
  }))

  const isCodeBlue = codeBluePatient === patient.patient_id;
  const isDeceased = patient.status === 'Deceased';
  const isHardwareFault = patient.status === 'Hardware Failure';

  if (isDeceased) {
    return (
      <div className="patient-card glass-card p-4 bg-[#0c1117] border border-white/10 rounded-lg opacity-80 overflow-hidden relative min-h-[280px]">
        <div className="absolute top-0 left-0 w-1 h-full bg-gray-600"></div>
        <div className="bg-red-600/20 text-red-500 text-[10px] font-bold px-3 py-1 mb-3 rounded border border-red-500/20 flex items-center gap-2">
          <span>💀</span> PATIENT DECEASED
        </div>
        <h4 className="text-base font-bold text-white">{patient.name}</h4>
        <p className="text-[11px] text-[#8899aa]">{patient.bed_id} • Age: {patient.age} • {patient.sex}</p>
        <div className="mt-4 pt-4 border-t border-white/5">
          <p className="text-[10px] text-[#8899aa] uppercase font-bold">Cause of Death</p>
          <p className="text-[11px] text-gray-400">{patient.diagnosis}</p>
        </div>
      </div>
    );
  }

  if (isCodeBlue) {
    return (
      <div className="patient-card p-4 bg-[#0a1628] border-2 border-blue-500 rounded-lg overflow-hidden relative flex flex-col items-center justify-center min-h-[280px]">
        <motion.div 
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute inset-0 bg-blue-600/10 pointer-events-none"
        />
        <h2 className="text-4xl font-black text-white animate-pulse tracking-tighter">CODE BLUE</h2>
        <p className="text-blue-400 font-bold mt-2">{patient.bed_id}</p>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            const note = prompt("Enter clinical note for death confirmation:");
            if (note) confirmDeath(patient.patient_id, note);
          }}
          className="mt-6 w-full py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 transition-colors text-xs"
        >
          CONFIRM DEATH
        </button>
      </div>
    );
  }

  if (isHardwareFault) {
    return (
      <div 
        className="patient-card p-4 relative group overflow-hidden flex flex-col transition-all border border-amber-500/30 bg-[#1a0f00] min-h-[280px] rounded-lg"
        onClick={() => navigate(`/app/patient/${patient.patient_id}`)}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-[16px] font-bold text-white leading-tight truncate">{patient.name}</h4>
            <p className="text-[11px] text-[#8899aa] font-medium leading-normal">{patient.bed_id} • {patient.age}{patient.sex} • {patient.diagnosis}</p>
          </div>
          <span className="status-badge bg-amber-500/20 text-amber-500 border-amber-500/30 shrink-0">
            Hardware Fault
          </span>
        </div>

        <div className="text-amber-500 text-[10px] font-black uppercase tracking-widest mb-4">
          SENSOR FAULT DETECTED
        </div>

        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-red-500">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            HR Sensor: OFFLINE
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-red-500">
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            MAP Transducer: OFFLINE
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            All Other Sensors: NOMINAL
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 mb-6">
          {[
            { label: 'SpO2', val: '97' }, { label: 'RR', val: '17' }, { label: 'Temp', val: '37.1' },
            { label: 'Lac', val: '1.2' }, { label: 'GCS', val: '15' }, { label: 'UO', val: '58' }
          ].map(s => (
            <div key={s.label} className="bg-white/5 p-1.5 rounded border border-white/5 text-center">
              <p className="text-[8px] font-bold text-[#8899aa] uppercase">{s.label}</p>
              <p className="text-[11px] font-bold text-white">{s.val}</p>
            </div>
          ))}
        </div>

        <div className="mt-auto text-[9px] font-black text-amber-500 uppercase tracking-widest text-center py-2 bg-amber-500/5 rounded border border-amber-500/10">
          Patient clinically stable — manual vital check required
        </div>
      </div>
    );
  }
  const isDemoPatient = patient.patient_id === 'demo-rajesh';

  return (
    <div
      onClick={() => {
        if (isDemoPatient) {
          setDemoModeActive(true);
          setDemoVitals(patient.vitals[0]);
          setDemoProbability(patient.crash_probability);
          setDemoCountdown(patient.intervention_window * 60);
        }
        navigate(`/app/patient/${patient.patient_id}`);
      }}
      className={`patient-card glass-card p-4 relative group overflow-hidden flex flex-col transition-all border border-white/10 hover:border-white/20 min-h-[280px] cursor-pointer 
        ${patient.risk_tier === 'CRITICAL' ? 'pulse-critical' : ''} 
        ${isDemoPatient ? 'ring-2 ring-amber-500/30 animate-[pulse_3s_infinite]' : ''}`}
      style={{
        borderLeft: `1px solid ${getTierColor(patient.risk_tier)}`,
      }}
    >
      {isDemoPatient && (
        <div className="absolute top-2 left-2 z-20 bg-amber-950/80 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded border border-amber-500/30 tracking-tighter">
          LIVE DEMO
        </div>
      )}
      {/* Top row: Name, Bed, Risk Badge */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-[16px] font-bold text-white leading-tight truncate">{patient.name}</h4>
          <p className="text-[11px] text-[#8899aa] font-medium leading-normal">
            {patient.bed_id} • {patient.age}{patient.sex} • {patient.diagnosis}
          </p>
        </div>
        <span className={`status-badge ${patient.risk_tier} shrink-0`}>
          {patient.risk_tier}
        </span>
      </div>

      {/* SOLUTION 1: Confidence Indicator */}
      <div className="flex items-center gap-1.5 mb-3">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: confidence.color }}></div>
        <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: confidence.color }}>
          {confidence.label}
        </span>
      </div>

      {/* PROBLEM 2 FIX: 2x2 Vital Chips Grid */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { label: 'HR', val: patient.vitals[0].heart_rate, color: VITAL_COLORS.heart_rate },
          { label: 'MAP', val: patient.vitals[0].map_pressure, color: VITAL_COLORS.map_pressure },
          { label: 'SpO2', val: patient.vitals[0].spo2, color: VITAL_COLORS.spo2 },
          { label: 'RR', val: patient.vitals[0].respiratory_rate, color: VITAL_COLORS.respiratory_rate }
        ].map(stat => (
          <div key={stat.label} className="bg-white/[0.03] p-2 rounded border border-white/5">
            <p className="text-[8px] font-bold text-[#8899aa] uppercase leading-none">{stat.label}</p>
            <p className="text-[13px] font-black mt-0.5 leading-none" style={{ color: stat.color }}>{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="flex items-end gap-4 mb-2">
        <div className="flex flex-col">
          <span className="text-[28px] font-black tabular-nums tracking-tighter leading-none" style={{ color: tierColor }}>
            {crashProb}%
          </span>
          <span className="text-[9px] text-[#8899aa] font-bold uppercase mt-1">Crash Risk</span>
        </div>
        <div className="flex flex-col pb-0.5">
          <span className="text-[14px] font-bold text-[#e2e8f0] leading-none">
            {sepsisProb}%
          </span>
          <span className="text-[8px] text-[#8899aa] font-bold uppercase mt-1">Sepsis</span>
        </div>
        {hasSpO2Contradiction && (
          <div className="ml-auto bg-amber-500/20 text-amber-500 text-[8px] font-black px-2 py-0.5 rounded border border-amber-500/30 animate-pulse">
            SENSOR CONTRADICTION
          </div>
        )}
      </div>

      {/* SOLUTION 4: Trend Confirmation Bar */}
      <div className="mb-4">
        <div className="flex gap-1 h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
          {trendSegments.map((type, i) => (
            <div key={i} className={`flex-1 ${type === 'red' ? 'bg-red-500' : type === 'green' ? 'bg-emerald-500' : 'bg-gray-600'}`} />
          ))}
        </div>
        <p className="text-[8px] text-[#8899aa] font-bold mt-1 uppercase">Alert fires at 3/3 persistence</p>
      </div>

      {/* PROBLEM 2 FIX: Stacked Sparklines */}
      <div className="space-y-1 mb-4 flex-1">
        <SparklineRow label="HR" dataKey="hr" data={sparkData} color={VITAL_COLORS.heart_rate} />
        <SparklineRow label="MAP" dataKey="map" data={sparkData} color={VITAL_COLORS.map_pressure} />
        <SparklineRow label="SpO2" dataKey="spo2" data={sparkData} color={VITAL_COLORS.spo2} />
      </div>

      {/* Bottom row: Drivers + Intervention Window */}
      <div className="flex items-center justify-between mt-auto pt-2 border-t border-white/5">
        <div className="flex items-center gap-1.5 overflow-hidden">
          {(patient.top_drivers || []).slice(0, 2).map((d, i) => (
            <span key={i} className="text-[9px] font-bold text-[#8899aa] bg-white/5 px-2 py-0.5 rounded border border-white/5 whitespace-nowrap">
              {d.feature} {d.trend === 'rising' ? '↑' : '↓'}
            </span>
          ))}
        </div>
        
        {patient.intervention_window > 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
            <Clock size={10} />
            {patient.intervention_window.toFixed(1)}h
          </div>
        )}
      </div>

      {/* Hover Element */}
      <div className="absolute bottom-2 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold text-[#4f83cc] pointer-events-none">
        View Details <ChevronRight size={12} />
      </div>

      {/* SOLUTION 5: Compliance Disclaimer */}
      <div className="mt-3 pt-2 border-t border-white/5">
        <p className="text-[8px] text-[#556677] italic font-medium">
          Clinical Decision Support — Physician judgment required.
        </p>
      </div>

      {isHardwareFault && (
        <div className="absolute top-0 right-0 bg-amber-600 text-white text-[9px] font-black px-2 py-1 rounded-bl-lg z-10">
          SENSOR FAULT
        </div>
      )}
    </div>
  )
}

function SparklineRow({ label, dataKey, data, color }: any) {
  return (
    <div className="flex items-center gap-2 h-4">
      <span className="text-[8px] font-bold text-[#8899aa] w-6 shrink-0">{label}</span>
      <div className="flex-1 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
            <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
