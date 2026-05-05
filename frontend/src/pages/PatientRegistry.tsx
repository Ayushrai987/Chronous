import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowRight, Download, Trash2, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getTierColor } from '../api';

export default function PatientRegistry() {
  const { patients, updatePatient } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Active');

  const filtered = patients.filter(p => {
    if (statusFilter !== 'All' && p.status !== statusFilter) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.bed_id.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const handleDischarge = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    updatePatient(id, { status: 'Discharged' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-8 shrink-0">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Patient Registry</h2>
          <p className="text-sm text-gray-400 mt-1">Comprehensive ICU patient database</p>
        </div>
        <div className="flex gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium transition-colors border border-white/10 shadow-lg active:scale-95">
            <Filter size={16} /> Filter
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white font-medium transition-colors border border-white/10 shadow-lg active:scale-95">
            <Download size={16} /> Export CSV
          </button>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 shrink-0 bg-white/5 p-2 rounded-lg border border-white/10 shadow-xl">
        <div className="flex gap-1">
          {['Active', 'Discharged', 'All'].map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-all ${statusFilter === s ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search registry..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-lg text-sm text-white w-72 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-gray-600"
          />
        </div>
      </div>

      <div className="flex-1 glass-card border border-white/10 overflow-hidden flex flex-col shadow-2xl">
        <div className="overflow-auto flex-1">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-lg font-bold text-gray-400">No patients found</p>
              <p className="text-sm">Try adjusting your filters.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-black/40 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest pl-6 border-b border-white/10">Patient Details</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10">Admission Date</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10">Assigned Nurse</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10">Diagnosis</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10">Risk Tier</th>
                  <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-widest text-right pr-6 border-b border-white/10">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map(p => {
                  const tierColor = getTierColor(p.risk_tier);
                  return (
                    <tr 
                      key={p.patient_id} 
                      onClick={() => navigate(`/app/patient/${p.patient_id}`)}
                      className="hover:bg-white/5 cursor-pointer transition-colors group relative"
                    >
                      <td className="p-5 pl-6 relative">
                        <div className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: tierColor }}></div>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] group-hover:scale-105 transition-transform">
                            {p.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-bold text-white text-base tracking-wide group-hover:text-blue-400 transition-colors">{p.name}</p>
                            <p className="text-xs text-gray-500 font-medium">{p.bed_id} • {p.age}{p.sex}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-5 text-sm text-gray-300 font-medium">
                        {new Date(p.admission_time).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-sm text-gray-300 font-medium">
                        {p.assigned_nurse || 'Unassigned'}
                      </td>
                      <td className="p-5 text-sm text-gray-400 truncate max-w-[200px]" title={p.diagnosis}>{p.diagnosis}</td>
                      <td className="p-5">
                        <span className={`risk-badge ${p.risk_tier}`}>{p.risk_tier}</span>
                      </td>
                      <td className="p-5 text-right pr-6">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); navigate(`/app/patient/${p.patient_id}`); }}
                            className="p-2 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 rounded-md transition-colors shadow-sm"
                            title="View Deep Dive"
                          >
                            <Eye size={18} />
                          </button>
                          {p.status !== 'Discharged' && (
                            <button 
                              onClick={(e) => handleDischarge(e, p.patient_id)}
                              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shadow-sm"
                              title="Discharge Patient"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
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
