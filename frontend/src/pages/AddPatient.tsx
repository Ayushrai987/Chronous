import { useState } from 'react';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, CheckCircle, ArrowRight, ArrowLeft, X } from 'lucide-react';

export default function AddPatient() {
  const { addPatient } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<any>({ allergies: [], medications: [] });
  const [inputAllergy, setInputAllergy] = useState('');
  const [inputMed, setInputMed] = useState('');
  const [useCsv, setUseCsv] = useState(false);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(s => s + 1);
  };

  const handleAddTag = (e: React.KeyboardEvent, type: 'allergies' | 'medications') => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = type === 'allergies' ? inputAllergy.trim() : inputMed.trim();
      if (val) {
        setFormData({ ...formData, [type]: [...formData[type], val.replace(',', '')] });
        type === 'allergies' ? setInputAllergy('') : setInputMed('');
      }
    }
  };

  const removeTag = (type: 'allergies' | 'medications', index: number) => {
    setFormData({ ...formData, [type]: formData[type].filter((_: any, i: number) => i !== index) });
  };

  const submitPatient = () => {
    addPatient({
      patient_id: `P${Math.floor(1000 + Math.random() * 9000)}`,
      name: formData.name || 'Unknown',
      age: parseInt(formData.age) || 50,
      sex: formData.sex || 'M',
      bed_id: formData.bed || 'ICU-TBD',
      admission_time: new Date().toISOString(),
      diagnosis: formData.diagnosis || 'Unknown',
      allergies: formData.allergies,
      medications: formData.medications,
      status: 'Active',
      baseline_stats: {},
      crash_probability: 0.15,
      sepsis_probability: 0.05,
      risk_tier: 'STABLE',
      top_drivers: [],
      causal_edges: [],
      counterfactual: [],
      intervention_window: 0,
      is_new: true,
      vitals: Array.from({ length: 12 }).map((_, i) => ({
        patient_id: "New",
        timestamp: new Date(Date.now() - (11 - i) * 3600 * 1000).toISOString(),
        heart_rate: parseInt(formData.hr) || 75, 
        map_pressure: parseInt(formData.map) || 85, 
        spo2: parseInt(formData.spo2) || 98, 
        respiratory_rate: parseInt(formData.rr) || 14,
        temperature: parseFloat(formData.temp) || 37, 
        serum_lactate: parseFloat(formData.lac) || 1.1, 
        gcs_score: parseInt(formData.gcs) || 15, 
        urine_output: parseInt(formData.uo) || 60
      }))
    });
    navigate('/app');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-8 h-full flex flex-col overflow-y-auto">
      <div className="mb-8 shrink-0">
        <h2 className="text-3xl font-bold text-white tracking-tight">Admit New Patient</h2>
        <p className="text-sm text-gray-400 mt-1">Connect patient to Chronos AI monitoring</p>
      </div>

      <div className="max-w-3xl w-full mx-auto relative flex-1">
        
        {/* Progress Bar */}
        <div className="flex items-center justify-between mb-8 relative z-10">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-white/10 -z-10 rounded-full"></div>
          <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-500 -z-10 rounded-full transition-all duration-500" style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}></div>
          
          {[1, 2, 3].map(num => (
            <div key={num} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ${step >= num ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-gray-800 text-gray-500 border border-white/10'}`}>
              {num}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form key="step1" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} onSubmit={handleNext} className="glass-card p-8 border border-white/10 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6">Patient Demographics & Clinical Context</h3>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                  <input required type="text" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" onChange={e => setFormData({...formData, name: e.target.value})} value={formData.name || ''} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Age</label>
                    <input required type="number" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" onChange={e => setFormData({...formData, age: e.target.value})} value={formData.age || ''} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Sex</label>
                    <select className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none appearance-none" onChange={e => setFormData({...formData, sex: e.target.value})} value={formData.sex || 'M'}>
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bed Assignment</label>
                  <input required type="text" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none uppercase" onChange={e => setFormData({...formData, bed: e.target.value})} value={formData.bed || ''} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Primary Diagnosis</label>
                  <input required type="text" className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" onChange={e => setFormData({...formData, diagnosis: e.target.value})} value={formData.diagnosis || ''} />
                </div>
              </div>

              {/* Tags */}
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Known Allergies (Press Enter)</label>
                <div className="w-full bg-black/40 border border-white/10 rounded-lg p-2 min-h-[52px] flex flex-wrap gap-2 items-center focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  {formData.allergies.map((a: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 bg-red-500/20 text-red-400 px-2 py-1 rounded text-xs font-bold border border-red-500/30">
                      {a} <button type="button" onClick={() => removeTag('allergies', i)}><X size={12} /></button>
                    </span>
                  ))}
                  <input type="text" value={inputAllergy} onChange={e => setInputAllergy(e.target.value)} onKeyDown={e => handleAddTag(e, 'allergies')} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none px-2 min-w-[120px]" placeholder="Type allergy..." />
                </div>
              </div>
              <div className="mb-6">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Current Medications (Press Enter)</label>
                <div className="w-full bg-black/40 border border-white/10 rounded-lg p-2 min-h-[52px] flex flex-wrap gap-2 items-center focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
                  {formData.medications.map((m: string, i: number) => (
                    <span key={i} className="flex items-center gap-1 bg-blue-500/20 text-blue-400 px-2 py-1 rounded text-xs font-bold border border-blue-500/30">
                      {m} <button type="button" onClick={() => removeTag('medications', i)}><X size={12} /></button>
                    </span>
                  ))}
                  <input type="text" value={inputMed} onChange={e => setInputMed(e.target.value)} onKeyDown={e => handleAddTag(e, 'medications')} className="flex-1 bg-transparent border-none text-white text-sm focus:outline-none px-2 min-w-[120px]" placeholder="Type medication..." />
                </div>
              </div>
              <div className="mb-8">
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Admission Notes</label>
                <textarea className="w-full bg-black/40 border border-white/10 rounded-lg p-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none h-20" onChange={e => setFormData({...formData, notes: e.target.value})} value={formData.notes || ''} placeholder="Add clinical context..."></textarea>
              </div>

              <div className="flex justify-end">
                <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95">
                  Next Step <ArrowRight size={18} />
                </button>
              </div>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form key="step2" initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 20, opacity: 0 }} onSubmit={handleNext} className="glass-card p-8 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-white">Baseline Vitals Initialization</h3>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/10">
                  <button type="button" onClick={() => setUseCsv(false)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${!useCsv ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}>Manual Entry</button>
                  <button type="button" onClick={() => setUseCsv(true)} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-colors ${useCsv ? 'bg-white/20 text-white' : 'text-gray-400 hover:text-white'}`}>CSV Upload</button>
                </div>
              </div>

              {useCsv ? (
                <div className="border-2 border-dashed border-white/20 rounded-xl p-12 flex flex-col items-center justify-center text-center bg-black/20 mb-8 hover:border-blue-500/50 hover:bg-blue-500/5 transition-colors cursor-pointer group">
                  <UploadCloud size={48} className="text-gray-500 group-hover:text-blue-400 mb-4 transition-colors" />
                  <p className="text-white font-bold mb-2">Drop vitals CSV here or click to browse</p>
                  <p className="text-xs text-gray-500">Supports HL7 export formats and standard CSVs</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <VitalInput label="Heart Rate" name="hr" helper="Normal: 60–100 bpm" val={formData.hr} set={(v:any) => setFormData({...formData, hr: v})} />
                  <VitalInput label="MAP" name="map" helper="Normal: 70–100 mmHg" val={formData.map} set={(v:any) => setFormData({...formData, map: v})} />
                  <VitalInput label="SpO2" name="spo2" helper="Normal: 95–100%" val={formData.spo2} set={(v:any) => setFormData({...formData, spo2: v})} />
                  <VitalInput label="Resp Rate" name="rr" helper="Normal: 12–20 rpm" val={formData.rr} set={(v:any) => setFormData({...formData, rr: v})} />
                  <VitalInput label="Temperature" name="temp" helper="Normal: 36.5–37.5 °C" val={formData.temp} set={(v:any) => setFormData({...formData, temp: v})} />
                  <VitalInput label="Lactate" name="lac" helper="Normal: < 2.0 mmol/L" val={formData.lac} set={(v:any) => setFormData({...formData, lac: v})} />
                  <VitalInput label="GCS Score" name="gcs" helper="Normal: 15" val={formData.gcs} set={(v:any) => setFormData({...formData, gcs: v})} />
                  <VitalInput label="Urine Output" name="uo" helper="Normal: > 30 ml/h" val={formData.uo} set={(v:any) => setFormData({...formData, uo: v})} />
                </div>
              )}

              <div className="flex justify-between">
                <button type="button" onClick={() => setStep(1)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg font-bold transition-all active:scale-95">
                  <ArrowLeft size={18} /> Back
                </button>
                <button type="submit" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg transition-all active:scale-95">
                  Review & Confirm <ArrowRight size={18} />
                </button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.div key="step3" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-8 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/10">
                <div className="w-16 h-16 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-bold text-2xl border border-blue-500/30">
                  {formData.name?.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">{formData.name}</h3>
                  <p className="text-gray-400 font-medium">{formData.age}{formData.sex} • Bed: {formData.bed}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8 mb-8">
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Clinical Context</h4>
                  <div className="space-y-3">
                    <div><span className="text-gray-400 text-sm">Diagnosis:</span> <span className="text-white font-bold ml-2">{formData.diagnosis}</span></div>
                    <div><span className="text-gray-400 text-sm">Allergies:</span> <div className="flex gap-1 mt-1">{formData.allergies.length ? formData.allergies.map((a:any) => <span key={a} className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded text-xs font-bold">{a}</span>) : <span className="text-white">None reported</span>}</div></div>
                    <div><span className="text-gray-400 text-sm">Medications:</span> <div className="flex gap-1 mt-1">{formData.medications.length ? formData.medications.map((m:any) => <span key={m} className="bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded text-xs font-bold">{m}</span>) : <span className="text-white">None reported</span>}</div></div>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4">Baseline Vitals Summary</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                    <div className="flex justify-between"><span className="text-gray-400">Heart Rate</span><span className="text-white font-bold">{formData.hr || 75} bpm</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">MAP</span><span className="text-white font-bold">{formData.map || 85} mmHg</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">SpO2</span><span className="text-white font-bold">{formData.spo2 || 98} %</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Resp Rate</span><span className="text-white font-bold">{formData.rr || 14} rpm</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Temp</span><span className="text-white font-bold">{formData.temp || 37} °C</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">Lactate</span><span className="text-white font-bold">{formData.lac || 1.1}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/10">
                <button type="button" onClick={() => setStep(2)} className="flex items-center gap-2 text-gray-400 hover:text-white font-bold transition-colors">
                  <ArrowLeft size={18} /> Edit Details
                </button>
                <button onClick={submitPatient} className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-8 py-3 rounded-lg font-bold shadow-[0_0_20px_rgba(22,163,74,0.3)] transition-all active:scale-95 text-lg">
                  <CheckCircle size={20} /> Confirm Admission
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function VitalInput({ label, helper, name, val, set }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-gray-300 mb-2">{label}</label>
      <input type="number" step="any" className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-white font-mono text-center text-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none" value={val || ''} onChange={e => set(e.target.value)} required />
      <span className="block text-[10px] text-gray-500 mt-1 text-center font-medium">{helper}</span>
    </div>
  );
}
