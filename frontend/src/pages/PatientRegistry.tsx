import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Search, Filter, Download, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTierColor } from '../api';

export default function PatientRegistry() {
  const { patients } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = patients.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.bed_id.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'All') return true;
    if (filter === 'Active') return p.status === 'Active';
    if (filter === 'Deceased') return p.status === 'Deceased';
    if (filter === 'Hardware Fault') return p.status === 'Hardware Failure';
    if (filter === 'Discharged') return p.status === 'Discharged';
    if (filter === 'Transferred') return p.status === 'Transferred';
    return p.risk_tier === filter;
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 h-full flex flex-col bg-[#0c1117]">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-[#e2e8f0]">Patient Registry</h2>
          <p className="text-[#8899aa] text-sm">Comprehensive ICU patient database</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-1.5 bg-[#131920] border border-white/5 rounded-md text-xs text-[#e2e8f0] font-bold hover:bg-white/5 transition-colors">
            <Filter size={14} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-1.5 bg-[#131920] border border-white/5 rounded-md text-xs text-[#e2e8f0] font-bold hover:bg-white/5 transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4 shrink-0">
        <div className="flex flex-wrap gap-1 bg-[#131920] p-1 rounded-lg border border-white/5">
          {['All', 'Active', 'CRITICAL', 'HIGH', 'WATCH', 'STABLE', 'Deceased', 'Hardware Fault', 'Discharged', 'Transferred'].map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-md text-[10px] font-bold transition-all ${filter === s ? 'bg-[#4f83cc] text-white shadow-lg' : 'text-[#8899aa] hover:text-[#e2e8f0] hover:bg-white/5'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8899aa]" size={14} />
          <input
            type="text"
            placeholder="Search registry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#131920] border border-white/5 rounded-md text-xs text-[#e2e8f0] focus:outline-none focus:border-[#4f83cc]/50 transition-all placeholder-[#8899aa]"
          />
        </div>
      </div>

      <div className="flex-1 glass-card border border-white/5 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1 custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8899aa]">
              <Search size={48} className="mb-4 opacity-20" />
              <p className="text-sm font-bold">No patients found</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#131920] sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-[10px] font-bold text-[#8899aa] uppercase tracking-wider pl-6 border-b border-white/5">Patient Details</th>
                  <th className="p-4 text-[10px] font-bold text-[#8899aa] uppercase tracking-wider border-b border-white/5">Status</th>
                  <th className="p-4 text-[10px] font-bold text-[#8899aa] uppercase tracking-wider border-b border-white/5">Diagnosis</th>
                  <th className="p-4 text-[10px] font-bold text-[#8899aa] uppercase tracking-wider border-b border-white/5">Admission</th>
                  <th className="p-4 text-[10px] font-bold text-[#8899aa] uppercase tracking-wider text-right pr-6 border-b border-white/5">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const tierColor = getTierColor(p.risk_tier);
                  const isDeceased = p.status === 'Deceased';
                  const isHardwareFault = p.status === 'Hardware Failure';

                  return (
                    <tr 
                      key={p.patient_id} 
                      onClick={() => navigate(`/app/patient/${p.patient_id}`)}
                      className="hover:bg-[#1a2230] cursor-pointer transition-colors group"
                    >
                      <td className="p-4 pl-6 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-[1px]" style={{ backgroundColor: tierColor }}></div>
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/5 ${isDeceased ? 'bg-red-950/20 text-red-500' : 'bg-blue-950/20 text-blue-400'}`}>
                            {isDeceased ? '💀' : p.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-[#e2e8f0] text-sm group-hover:text-[#4f83cc] transition-colors">
                              {p.name} {isDeceased && <span className="text-[10px] text-red-500 font-black ml-1">(DECEASED)</span>}
                            </p>
                            <p className="text-[10px] text-[#8899aa]">{p.bed_id} • {p.age}{p.sex}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`status-badge ${isDeceased ? 'CRITICAL' : isHardwareFault ? 'WATCH' : p.risk_tier}`}>
                          {p.status === 'Active' ? p.risk_tier : p.status}
                        </span>
                        {isHardwareFault && (
                          <span className="ml-3 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase rounded border border-amber-500/20">
                            2 sensors offline — patient alive and stable
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs text-[#8899aa] truncate max-w-[200px]" title={p.diagnosis}>{p.diagnosis}</td>
                      <td className="p-4 text-xs text-[#8899aa] font-medium">
                        {new Date(p.admission_time).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right pr-6">
                        <button className="p-1.5 text-[#8899aa] hover:text-[#4f83cc] transition-colors">
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
