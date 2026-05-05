import { TopDriver } from '../api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ShapChartProps {
  drivers: TopDriver[]
}

export default function ShapChart({ drivers }: ShapChartProps) {
  if (!drivers || drivers.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-[var(--text-muted)] text-sm">
        No SHAP attributions available
      </div>
    )
  }

  const chartData = drivers.map(d => ({
    feature: d.feature,
    importance: d.importance,
    direction: d.direction,
    label: d.label,
    trend: d.trend,
    color: d.direction === 'risk-increasing' ? '#ef4444' : '#3b82f6',
  }))

  return (
    <div>
      {/* Bar chart */}
      <div className="h-40 mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 10, left: 80, bottom: 0 }}
          >
            <XAxis
              type="number"
              tick={{ fill: 'var(--text-muted)', fontSize: 10 }}
              axisLine={{ stroke: 'var(--border-subtle)' }}
            />
            <YAxis
              type="category"
              dataKey="feature"
              tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={75}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-primary)',
              }}
              formatter={(value: number) => [value.toFixed(4), 'Attribution']}
            />
            <Bar dataKey="importance" radius={[0, 4, 4, 0]} maxBarSize={20}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Driver labels */}
      <div className="space-y-2">
        {drivers.map((d, i) => (
          <div key={i} className="flex items-start gap-3 p-2.5 rounded-lg" style={{
            background: d.direction === 'risk-increasing' ? 'rgba(239, 68, 68, 0.06)' : 'rgba(59, 130, 246, 0.06)',
          }}>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-bold px-1.5 py-0.5 rounded" style={{
                background: d.direction === 'risk-increasing' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                color: d.direction === 'risk-increasing' ? '#fca5a5' : '#93c5fd',
              }}>
                #{d.rank}
              </span>
              <span className="text-sm">
                {d.trend === 'rising' ? '📈' : d.trend === 'falling' ? '📉' : '➡️'}
              </span>
            </div>
            <div>
              <p className="text-xs text-[var(--text-primary)] font-medium">{d.label}</p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Attribution: {d.importance.toFixed(4)} • {d.direction}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
