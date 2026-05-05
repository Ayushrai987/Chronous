import { VitalReading, VITAL_KEYS, VITAL_LABELS, VITAL_COLORS } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceArea,
} from 'recharts'
import { useState } from 'react'

interface VitalsChartProps {
  vitals: VitalReading[]
}

export default function VitalsChart({ vitals }: VitalsChartProps) {
  const [activeVitals, setActiveVitals] = useState<Set<string>>(
    new Set(['heart_rate', 'map_pressure', 'spo2', 'serum_lactate'])
  )

  const toggleVital = (key: string) => {
    setActiveVitals(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Format data for Recharts
  const chartData = vitals.map((v, i) => ({
    hour: `H-${vitals.length - i}`,
    timeLabel: new Date(v.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    heart_rate: Math.round(v.heart_rate * 10) / 10,
    map_pressure: Math.round(v.map_pressure * 10) / 10,
    spo2: Math.round(v.spo2 * 10) / 10,
    respiratory_rate: Math.round(v.respiratory_rate * 10) / 10,
    temperature: Math.round(v.temperature * 10) / 10,
    serum_lactate: Math.round(v.serum_lactate * 100) / 100,
    gcs_score: Math.round(v.gcs_score),
    urine_output: Math.round(v.urine_output * 10) / 10,
  }))

  // Prediction horizon zone (last 2-6 hours zone indicator)
  const horizonStart = Math.max(0, chartData.length - 6)

  return (
    <div>
      {/* Vital toggle buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {VITAL_KEYS.map(key => (
          <button
            key={key}
            onClick={() => toggleVital(key)}
            className="text-[11px] px-2.5 py-1 rounded-md font-medium transition-all"
            style={{
              background: activeVitals.has(key) ? `${VITAL_COLORS[key]}20` : 'transparent',
              color: activeVitals.has(key) ? VITAL_COLORS[key] : 'var(--text-muted)',
              border: `1px solid ${activeVitals.has(key) ? `${VITAL_COLORS[key]}40` : 'var(--border-subtle)'}`,
            }}
          >
            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{
              background: activeVitals.has(key) ? VITAL_COLORS[key] : 'var(--text-muted)',
            }} />
            {VITAL_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
            <XAxis
              dataKey="timeLabel"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border-subtle)' }}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border-subtle)' }}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
            />

            {/* Prediction horizon zone */}
            {chartData.length >= 6 && (
              <ReferenceArea
                x1={chartData[horizonStart]?.timeLabel}
                x2={chartData[chartData.length - 1]?.timeLabel}
                fill="rgba(139, 92, 246, 0.06)"
                stroke="rgba(139, 92, 246, 0.15)"
                strokeDasharray="4 4"
                label={{ value: "Prediction Horizon", fill: "var(--accent-purple)", fontSize: 10, position: "insideTopRight" }}
              />
            )}

            {VITAL_KEYS.map(key =>
              activeVitals.has(key) ? (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={VITAL_COLORS[key]}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: VITAL_COLORS[key] }}
                  name={VITAL_LABELS[key]}
                />
              ) : null
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
