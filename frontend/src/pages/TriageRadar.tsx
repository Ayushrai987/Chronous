import { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Clock
} from 'lucide-react';
import PatientCard from '../components/PatientCard';

export default function TriageRadar() {
  const navigate = useNavigate();
  const { patients } = useStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');

  const stats = useMemo(() => {
    const active = patients.filter(p => p.status === 'Active');
    return {
      total: active.length,
      critical: active.filter(p => p.risk_tier === 'CRITICAL').length,
      high: active.filter(p => p.risk_tier === 'HIGH').length,
      avgRisk: active.length > 0 ? Math.round((active.reduce((acc, p) => acc + p.crash_probability, 0) / active.length) * 100) : 0
    };
  }, [patients]);

  const filteredPatients = patients
    .filter(p => {
      // Problem 1 fix: Default filter All shows everything matching search
      const matchesFilter = filter === 'All' || p.status === filter || p.risk_tier === filter;
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.bed_id.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    })
    .sort((a, b) => b.crash_probability - a.crash_probability);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }}
      className="h-full flex flex-col p-6 gap-6 overflow-hidden bg-[#0c1117]"
    >
      {/* HEADER COMMAND BAR */}
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-[#e2e8f0]">Triage Command</h2>
          <p className="text-[#8899aa] text-sm font-medium">
            REAL-TIME CLINICAL MONITORING • {stats.total} ACTIVE BEDS
          </p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8899aa]" size={16} />
            <input 
              type="text" 
              placeholder="Search beds or names..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#131920] border border-white/5 rounded-lg text-sm text-[#e2e8f0] placeholder-[#8899aa] focus:outline-none focus:border-[#4f83cc]/50 transition-all"
            />
          </div>
          <div className="flex bg-[#131920] p-1 rounded-lg border border-white/5">
            {['All', 'Active', 'CRITICAL', 'HIGH'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                  filter === f 
                    ? 'bg-[#4f83cc] text-white shadow-lg' 
                    : 'text-[#8899aa] hover:text-[#e2e8f0] hover:bg-white/5'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* PROBLEM 4 FIX: Compact Stats Bar */}
      <div className="flex flex-row items-center gap-8 px-6 py-4 bg-[#131920] border border-white/5 rounded-lg max-h-[70px] overflow-hidden shrink-0">
        <StatItem title="Total Census" value={stats.total} color="bg-[#4f83cc]" />
        <StatItem title="Critical" value={stats.critical} color="bg-[#dc2626]" />
        <StatItem title="High Risk" value={stats.high} color="bg-[#d97706]" />
        <StatItem title="Avg Risk" value={`${stats.avgRisk}%`} color="bg-[#ca8a04]" />
      </div>

      {/* PROBLEM 3 FIX: Responsive Grid Layout */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          <motion.div 
            layout
            className="grid gap-4"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))'
            }}
          >
            {filteredPatients.map((patient) => (
              <motion.div
                key={patient.patient_id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onClick={() => navigate(`/app/patient/${patient.patient_id}`)}
                className="cursor-pointer"
              >
                <PatientCard patient={patient} />
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* BOTTOM ACTION BAR */}
      <div className="shrink-0 flex justify-between items-center px-5 py-3 bg-[#131920] border border-white/5 rounded-lg">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-[#16a34a]"></div>
            SYSTEM STATUS: OPERATIONAL
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
            Model: Chronos-LSTM v2.4
          </div>
          <div className="flex items-center gap-2 text-[11px] font-bold text-[#6b7280] uppercase tracking-wider">
            <Clock size={12} />
            Next Inference in 4m
          </div>
        </div>
        <button 
          onClick={() => navigate('/app/add-patient')}
          className="px-4 py-1.5 bg-[#4f83cc] hover:bg-[#3d6ba7] text-white rounded-md text-xs font-bold transition-all"
        >
          Add Patient
        </button>
      </div>
    </motion.div>
  );
}

function StatItem({ title, value, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-2 h-2 rounded-full ${color}`}></div>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-bold text-white leading-none">{value}</span>
        <span className="text-[10px] font-bold text-[#8899aa] uppercase tracking-wider">{title}</span>
      </div>
    </div>
  );
}
