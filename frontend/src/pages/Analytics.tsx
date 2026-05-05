import { motion } from 'framer-motion';
import { 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { BarChart2, TrendingUp, AlertTriangle, Zap, Activity } from 'lucide-react';

const areaData = [
  { time: '00:00', risk: 15 }, { time: '02:00', risk: 18 }, { time: '04:00', risk: 25 },
  { time: '06:00', risk: 32 }, { time: '08:00', risk: 45 }, { time: '10:00', risk: 42 },
  { time: '12:00', risk: 38 }, { time: '14:00', risk: 55 }, { time: '16:00', risk: 65 },
  { time: '18:00', risk: 58 }, { time: '20:00', risk: 48 }, { time: '22:00', risk: 35 },
];

const barData = [
  { ward: 'ICU-East', alerts: 12 },
  { ward: 'ICU-West', alerts: 8 },
  { ward: 'Step-Down', alerts: 15 },
  { ward: 'Cardiac', alerts: 5 },
];

const pieData = [
  { name: 'Sepsis', value: 45 },
  { name: 'Hemodynamic', value: 30 },
  { name: 'Respiratory', value: 15 },
  { name: 'Neurological', value: 10 },
];

const interventionData = [
  { time: '00:00', windows: 2 }, { time: '04:00', windows: 5 }, { time: '08:00', windows: 3 },
  { time: '12:00', windows: 8 }, { time: '16:00', windows: 12 }, { time: '20:00', windows: 6 },
];

const COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];

export default function Analytics() {
  const customTooltip = { background: 'rgba(10, 15, 37, 0.95)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', color: '#fff', padding: '12px' };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full overflow-y-auto mesh-gradient-bg flex flex-col gap-8">
      <header className="shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-500/20 rounded-lg">
            <BarChart2 className="text-blue-400" size={24} />
          </div>
          <h2 className="text-4xl font-extrabold text-white tracking-tight">Population Intelligence</h2>
        </div>
        <p className="text-gray-400 font-medium ml-12 italic">Real-time aggregate predictive analytics across all ICU units</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 shrink-0">
        <StatCard title="Active Monitoring" value="1,248" icon={Activity} color="text-blue-400" />
        <StatCard title="Mean Risk Index" value="34%" icon={TrendingUp} color="text-yellow-400" />
        <StatCard title="Critical Alerts" value="18" icon={AlertTriangle} color="text-red-400" />
        <StatCard title="Rescue Windows" value="5" icon={Zap} color="text-emerald-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-20 shrink-0">
        {/* Risk Trend */}
        <div className="glass-card p-8 border border-white/5 shadow-2xl h-[400px]">
          <h3 className="text-[10px] font-bold text-gray-500 mb-8 uppercase tracking-[0.2em]">Average Ward Risk Trajectory (24h)</h3>
          <ResponsiveContainer width="100%" height="80%">
            <AreaChart data={areaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltip} />
              <Area type="monotone" dataKey="risk" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.1} strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Alert Distribution */}
        <div className="glass-card p-8 border border-white/5 shadow-2xl h-[400px]">
          <h3 className="text-[10px] font-bold text-gray-500 mb-8 uppercase tracking-[0.2em]">Predictive Alerts by Unit</h3>
          <ResponsiveContainer width="100%" height="80%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="ward" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltip} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="alerts" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Composition */}
        <div className="glass-card p-8 border border-white/5 shadow-2xl h-[400px]">
          <h3 className="text-[10px] font-bold text-gray-500 mb-8 uppercase tracking-[0.2em]">Primary Risk Drivers Breakdown</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={120} paddingAngle={8} dataKey="value" stroke="rgba(0,0,0,0)">
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={customTooltip} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '10px', color: '#9ca3af', fontWeight: 'bold', paddingTop: '20px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Active Intervention Windows */}
        <div className="glass-card p-8 border border-white/5 shadow-2xl h-[400px]">
          <h3 className="text-[10px] font-bold text-gray-500 mb-8 uppercase tracking-[0.2em]">Active Intervention Windows</h3>
          <ResponsiveContainer width="100%" height="80%">
            <LineChart data={interventionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} tickMargin={10} />
              <YAxis stroke="rgba(255,255,255,0.2)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={customTooltip} />
              <Line type="monotone" dataKey="windows" stroke="#10b981" strokeWidth={4} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 8, fill: '#10b981' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color }: any) {
  return (
    <div className="glass-card p-8 border border-white/5 shadow-2xl flex items-center gap-6 group hover:bg-white/5 transition-all">
      <div className={`p-4 rounded-2xl bg-white/5 ${color} transition-transform group-hover:scale-110`}>
        <Icon size={24} />
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{title}</h4>
        <span className={`text-3xl font-black text-white tracking-tighter`}>{value}</span>
      </div>
    </div>
  );
}
