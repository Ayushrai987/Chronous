import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, CheckCircle, ChevronDown, ChevronRight, Activity, Bell, FileText, Search } from 'lucide-react';

export default function AlertHistory() {
  const { alerts, markAlertLogged } = useStore();
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [intervNote, setIntervNote] = useState('');
  const [activeLogTab, setActiveLogTab] = useState<'Alerts' | 'Suppressed'>('Alerts');

  const suppressedLogs = [
    { id: 'S-1', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), patient: 'Liam Wilson', vital: 'Serum Lactate', value: '18.4 mmol/L', reason: 'Single reading spike — Outlier', outcome: 'Stable after 30m' },
    { id: 'S-2', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(), patient: 'Emma Thompson', vital: 'SpO2', value: '42%', reason: 'Hardware Contradiction — HR/RR Nominal', outcome: 'Sensor adjusted by nurse' },
    { id: 'S-3', timestamp: new Date(Date.now() - 1000 * 60 * 200).toISOString(), patient: 'Noah Garcia', vital: 'Heart Rate', value: '0 bpm', reason: 'Single reading dropout', outcome: 'Resolved next reading' },
  ];

  const filteredAlerts = alerts.filter(a => {
    const matchesFilter = filter === 'All' || a.type === filter;
    const matchesSearch = a.patientName.toLowerCase().includes(search.toLowerCase()) || a.bedId.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleExport = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Timestamp,Patient Name,Bed ID,Alert Type,Risk Tier,Probability,Intervened\n"
      + alerts.map(e => `${e.timestamp},${e.patientName},${e.bedId},${e.type},${e.riskTier},${e.score},${e.intervened}`).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "chronos_alert_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const submitLog = (e: React.FormEvent, alertId: string) => {
    e.preventDefault();
    if (!intervNote.trim()) return;
    markAlertLogged(alertId);
    setIntervNote('');
    setExpandedRow(null);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full flex flex-col mesh-gradient-bg gap-8 overflow-hidden">
      <header className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <Bell className="text-red-400" size={24} />
            </div>
            <h2 className="text-4xl font-extrabold text-white tracking-tight">Audit Trail</h2>
          </div>
          <p className="text-gray-400 font-medium ml-12 italic">Comprehensive historical log of all predictive clinical alerts</p>
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 lg:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search history..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all"
            />
          </div>
          <button onClick={handleExport} className="btn-primary flex items-center gap-2">
            <Download size={18} /> Export Data
          </button>
        </div>
      </header>

      <div className="flex items-center justify-between shrink-0">
        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/10 shadow-xl">
          {['All', 'Sepsis Risk', 'Cardiac Risk', 'Hemodynamic'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${filter === f ? 'bg-white/10 text-white shadow-md' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-2 p-1 bg-white/5 rounded-2xl w-fit border border-white/10 shadow-xl">
          {['Alerts', 'Suppressed'].map(t => (
            <button
              key={t}
              onClick={() => setActiveLogTab(t as any)}
              className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${activeLogTab === t ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
            >
              {t === 'Alerts' ? 'Clinical Alerts' : 'Suppression Log'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 glass-card border border-white/10 overflow-hidden flex flex-col shadow-2xl rounded-3xl">
        <div className="overflow-auto flex-1 custom-scrollbar">
          {activeLogTab === 'Alerts' ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-xl">
                <tr>
                  <th className="w-12"></th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Patient Profile</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Classification</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Neural Score</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right pr-8">Clinical Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAlerts.length > 0 ? filteredAlerts.map(alert => {
                  const isExpanded = expandedRow === alert.id;
                  return (
                    <React.Fragment key={alert.id}>
                      <tr className={`hover:bg-white/5 cursor-pointer transition-all ${isExpanded ? 'bg-white/5' : ''}`} onClick={() => setExpandedRow(isExpanded ? null : alert.id)}>
                        <td className="p-5 text-gray-500 text-center">
                          {isExpanded ? <ChevronDown size={18} className="text-blue-400" /> : <ChevronRight size={18} />}
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-bold text-gray-300">{new Date(alert.timestamp).toLocaleTimeString('en-IN', { hour12: true })}</p>
                          <p className="text-[10px] text-gray-500 font-medium">{new Date(alert.timestamp).toLocaleDateString('en-IN')}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-base font-black text-white tracking-tight">{alert.patientName}</p>
                          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{alert.bedId}</p>
                        </td>
                        <td className="p-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border
                            ${alert.type === 'Sepsis Risk' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' : 
                              alert.type === 'Cardiac Risk' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 
                              'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}
                          >
                            <Activity size={12} /> {alert.type}
                          </span>
                        </td>
                        <td className="p-5">
                          <div className="flex items-center gap-3">
                             <div className="flex-1 h-1.5 bg-white/5 rounded-full w-24 overflow-hidden">
                                <div className="h-full bg-blue-500" style={{ width: `${alert.score * 100}%` }}></div>
                             </div>
                             <span className="text-sm font-black text-white">{(alert.score * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                        <td className="p-5 text-right pr-8">
                          {alert.intervened ? (
                            <span className="inline-flex items-center gap-2 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-4 py-1.5 rounded-lg border border-emerald-500/20">
                              <CheckCircle size={14} /> AUDITED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 text-[10px] font-black text-red-400 bg-red-500/10 px-4 py-1.5 rounded-lg border border-red-500/20 animate-pulse">
                              PENDING ACTION
                            </span>
                          )}
                        </td>
                      </tr>
                      
                      {/* Expandable Sub-row */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} className="p-0 border-b border-white/10 bg-black/40">
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                <div className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                                  {/* Vitals Snapshot */}
                                  <div className="glass-card bg-white/5 p-6 border border-white/10">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2"><Activity size={14} /> Physiological Snapshot</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                      <VitalRow label="Heart Rate" value={alert.vitals.heart_rate} color="text-red-400" unit="bpm" />
                                      <VitalRow label="MAP" value={alert.vitals.map_pressure} color="text-blue-400" unit="mmHg" />
                                      <VitalRow label="SpO2" value={alert.vitals.spo2} color="text-emerald-400" unit="%" />
                                      <VitalRow label="Lactate" value={alert.vitals.serum_lactate} color="text-orange-400" unit="mmol/L" />
                                    </div>
                                  </div>
  
                                  {/* SHAP Drivers */}
                                  <div className="glass-card bg-white/5 p-6 border border-white/10">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6 flex items-center gap-2"><FileText size={14} /> Neural Influence</h4>
                                    <div className="space-y-4">
                                      {alert.drivers.map((d: string, i: number) => (
                                        <div key={d} className="space-y-1">
                                          <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-white">{d}</span>
                                            <span className="text-[10px] font-mono text-gray-500">{(0.8 - (i * 0.15)).toFixed(2)}</span>
                                          </div>
                                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500" style={{ width: `${80 - (i * 20)}%` }}></div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
  
                                  {/* Log Action */}
                                  <div className="glass-card bg-white/5 p-6 border border-white/10">
                                    <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-6">Auditor Signature</h4>
                                    {alert.intervened ? (
                                      <div className="flex flex-col items-center justify-center h-24 text-emerald-400 bg-emerald-500/5 rounded-2xl border border-emerald-500/10">
                                        <CheckCircle size={32} className="mb-2" />
                                        <span className="font-black text-xs uppercase tracking-widest">Signature Verified</span>
                                      </div>
                                    ) : (
                                      <form onSubmit={(e) => submitLog(e, alert.id)} className="space-y-4">
                                        <textarea 
                                          required 
                                          value={intervNote} 
                                          onChange={e => setIntervNote(e.target.value)} 
                                          placeholder="Record clinical decision..." 
                                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-white focus:outline-none focus:border-blue-500 min-h-[80px] resize-none" 
                                        />
                                        <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-xs font-black text-white transition-all shadow-xl shadow-blue-900/20 active:scale-95 uppercase tracking-widest">
                                          Submit Audit Signature
                                        </button>
                                      </form>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="p-20 text-center text-gray-600">
                      <Activity size={64} className="mx-auto mb-4 opacity-10" />
                      <p className="text-xl font-bold">No historical alerts found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-white/5 sticky top-0 z-10 backdrop-blur-xl">
                <tr>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Timestamp</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Patient</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Spike / Dropout</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest">Reason Suppressed</th>
                  <th className="p-5 text-[10px] font-black text-gray-500 uppercase tracking-widest text-right pr-8">30m Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {suppressedLogs.map(log => (
                  <tr key={log.id} className="hover:bg-white/5 transition-all">
                    <td className="p-5">
                      <p className="text-sm font-bold text-gray-300">{new Date(log.timestamp).toLocaleTimeString()}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-base font-black text-white">{log.patient}</p>
                    </td>
                    <td className="p-5">
                      <p className="text-xs font-bold text-red-400">{log.vital}: {log.value}</p>
                    </td>
                    <td className="p-5">
                      <span className="text-[10px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
                        {log.reason}
                      </span>
                    </td>
                    <td className="p-5 text-right pr-8">
                      <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{log.outcome}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function VitalRow({ label, value, color, unit }: any) {
  return (
    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
      <p className="text-[9px] font-bold text-gray-500 uppercase mb-1">{label}</p>
      <p className={`text-xl font-black ${color} tracking-tight`}>{value}<span className="text-[10px] ml-1 text-gray-600 font-bold">{unit}</span></p>
    </div>
  );
}
