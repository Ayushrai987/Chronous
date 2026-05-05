import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, Search, Filter, ChevronRight, 
  AlertCircle, TrendingDown, Clock, ShieldCheck, Zap
} from 'lucide-react';
import PatientCard from '../components/PatientCard';

export default function TriageRadar() {
  const navigate = useNavigate();
  const { patients, demoMode } = useStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    return {
      total: patients.length,
      critical: patients.filter(p => p.risk_tier === 'CRITICAL').length,
      high: patients.filter(p => p.risk_tier === 'HIGH').length,
      avgRisk: Math.round((patients.reduce((acc, p) => acc + p.crash_probability, 0) / patients.length) * 100)
    };
  }, [patients]);

  const filteredPatients = patients
    .filter(p => {
      const matchesFilter = 
        filter === 'All' || 
        (filter === 'High Risk' && (p.risk_tier === 'CRITICAL' || p.risk_tier === 'HIGH')) ||
        (filter === 'Watch' && p.risk_tier === 'WATCH');
      
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.bed_id.toLowerCase().includes(search.toLowerCase());
      
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => b.crash_probability - a.crash_probability);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="h-full flex flex-col mesh-gradient-bg p-8 gap-8 overflow-hidden"
    >
      {/* HEADER COMMAND BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Activity className="text-blue-400" size={24} />
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Triage Command</h2>
          </div>
          <p className="text-gray-400 font-medium ml-12">
            {demoMode ? 'LIVE SIMULATION ACTIVE' : 'REAL-TIME CLINICAL MONITORING'} • {patients.length} BEDS
          </p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search patients..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
            {['All', 'High Risk', 'Watch'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${
                  filter === f 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* KPI RIBBON */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 shrink-0">
        <StatCard title="Total Census" value={stats.total} icon={Users} color="text-blue-400" border="border-blue-500/30" />
        <StatCard title="Critical/High" value={stats.critical + stats.high} icon={AlertCircle} color="text-red-400" border="border-red-500/30" />
        <StatCard title="System Avg Risk" value={`${stats.avgRisk}%`} icon={TrendingDown} color="text-yellow-400" border="border-yellow-500/30" />
        <StatCard title="Uptime Status" value="Healthy" icon={ShieldCheck} color="text-emerald-400" border="border-emerald-500/30" />
      </div>

      {/* PATIENT GRID */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
          >
            {filteredPatients.map((patient) => (
              <motion.div
                key={patient.patient_id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -5 }}
                className="cursor-pointer"
                onClick={() => navigate(`/app/patient/${patient.patient_id}`)}
              >
                <PatientCard patient={patient} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
        
        {filteredPatients.length === 0 && (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500">
            <Search size={48} className="mb-4 opacity-20" />
            <p className="text-xl font-medium">No patients found matching your criteria</p>
          </div>
        )}
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="shrink-0 flex justify-between items-center px-6 py-4 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-xl">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
            Model: Chronos-LSTM v2.4
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
            <Clock size={14} />
            Next Inference in 4m 12s
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-purple-400 bg-purple-500/10 px-3 py-1 rounded-lg border border-purple-500/30">
            <Zap size={12} />
            Resource Optimizer: Peak Load Expected in 2h
          </div>
        </div>
        <button 
          onClick={() => navigate('/app/add-patient')}
          className="btn-primary flex items-center gap-2"
        >
          Admmit New Patient
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({ title, value, icon: Icon, color, border }: any) {
  return (
    <div className={`glass-card p-6 border-l-4 ${border} flex items-center gap-6`}>
      <div className={`p-4 rounded-2xl bg-white/5 ${color}`}>
        <Icon size={28} />
      </div>
      <div>
        <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-1">{title}</h3>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
