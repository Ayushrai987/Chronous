import { Patient, getTierColor, VITAL_COLORS } from '../api'
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts'
import { motion } from 'framer-motion'

interface PatientCardProps {
  patient: Patient
  onClick: () => void
}

export default function PatientCard({ patient, onClick }: PatientCardProps) {
  const tierColor = getTierColor(patient.risk_tier)
  const prob = (patient.crash_probability * 100).toFixed(1)
  
  const sparkData = (patient.vitals || []).slice(-12).map((v, i) => ({
    idx: i,
    hr: v.heart_rate,
    map: v.map_pressure,
    spo2: v.spo2
  }))

  const isCritical = patient.risk_tier === 'CRITICAL';

  return (
    <div
      className={`patient-card glass-card tier-${patient.risk_tier} p-6 relative group cursor-pointer hover:scale-[1.02] transition-all duration-300 ${isCritical ? 'animate-[pulse-critical-border_2s_infinite]' : ''}`}
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: tierColor,
      }}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {patient.is_new && (
        <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/50 animate-pulse">
          NEW
        </span>
      )}

      {/* Top row: Name, Bed, Risk Badge */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-3">
            <h4 className="text-xl font-bold text-white tracking-wide">{patient.name}</h4>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#10b98115] border border-[#10b98130] text-[9px] font-black text-[#10b981] uppercase tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              ABHA Verified
            </div>
          </div>
          <p className="text-[10px] font-mono text-gray-500 mt-0.5 tracking-wider">
            ABHA: {patient.abha_id ? `${patient.abha_id.substring(0, 5)}XX-XXXX-XXXX` : 'Generating...'}
          </p>
          <p className="text-xs text-gray-400 mt-1 font-medium">
            {patient.bed_id} • Age: {patient.age} • {patient.sex} • <span className="text-gray-300">{patient.diagnosis}</span>
          </p>
        </div>
        <span className={`risk-badge ${patient.risk_tier}`}>
          {patient.risk_tier}
        </span>
      </div>

      {/* Probability + Sepsis + 3 Sparklines */}
      <div className="flex items-center gap-4 mb-5 bg-black/20 rounded-xl p-3 border border-white/5">
        {/* Risk Score */}
        <div className="flex flex-col items-start w-16 shrink-0">
           <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Crash</span>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-bold tabular-nums tracking-tighter" style={{ color: tierColor }}>
              {prob}
            </span>
            <span className="text-xs text-gray-500 font-bold">%</span>
          </div>
        </div>

        {/* 3 Sparklines */}
        <div className="flex-1 flex flex-col gap-1 pl-4 border-l border-white/10">
          <div className="h-4 flex items-center justify-between">
            <span className="text-[9px] font-bold text-red-400 w-6">HR</span>
            <div className="flex-1 h-full ml-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <YAxis domain={['dataMin - 10', 'dataMax + 10']} hide />
                  <Line type="monotone" dataKey="hr" stroke={VITAL_COLORS.heart_rate} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="h-4 flex items-center justify-between">
            <span className="text-[9px] font-bold text-blue-400 w-6">MAP</span>
            <div className="flex-1 h-full ml-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <YAxis domain={['dataMin - 5', 'dataMax + 5']} hide />
                  <Line type="monotone" dataKey="map" stroke={VITAL_COLORS.map_pressure} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="h-4 flex items-center justify-between">
            <span className="text-[9px] font-bold text-green-400 w-6">SpO2</span>
            <div className="flex-1 h-full ml-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sparkData}>
                  <YAxis domain={[80, 100]} hide />
                  <Line type="monotone" dataKey="spo2" stroke={VITAL_COLORS.spo2} strokeWidth={1.5} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Driver chips + Countdown */}
      <div className="flex items-center gap-2 flex-wrap min-h-[28px]">
        {(patient.top_drivers || []).slice(0, 2).map((d, i) => (
          <span key={i} className={`driver-chip ${d.direction} font-bold tracking-wide`}>
            {d.trend === 'rising' ? '↑' : d.trend === 'falling' ? '↓' : '→'} {d.feature}
          </span>
        ))}
        
        {patient.intervention_window > 0 && patient.crash_probability >= 0.25 && (
          <span className="countdown-chip ml-auto flex items-center gap-1 font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded text-xs shadow-[0_0_10px_rgba(251,191,36,0.1)]">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            {patient.intervention_window.toFixed(1)}h
          </span>
        )}
      </div>

      {/* Hover details text */}
      <div className="absolute bottom-4 right-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <span className="text-xs text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-blue-500/30">
          View Details <span className="text-lg leading-none transform translate-y-[-1px]">→</span>
        </span>
      </div>
    </div>
  )
}
