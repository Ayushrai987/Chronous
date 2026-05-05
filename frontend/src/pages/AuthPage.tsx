import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export default function AuthPage() {
  const [role, setRole] = useState('Attending Physician');
  const { login } = useStore();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login(role as any);
    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-[#0c1117] flex items-center justify-center relative overflow-hidden">
      <div className="login-card-wrapper z-10 w-full max-w-sm">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 flex flex-col items-center bg-[#131920]"
        >
          <div className="w-10 h-10 bg-[#4f83cc] rounded flex items-center justify-center text-white mb-4">
            <Activity size={24} />
          </div>
          
          <h1 className="text-xl font-bold text-white mb-1 tracking-wider">PROJECT CHRONOS</h1>
          <p className="text-xs text-[#8899aa] font-bold uppercase tracking-widest mb-8">Clinical Monitoring OS</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div className="space-y-3">
              <input 
                type="email" 
                placeholder="Hospital Email" 
                defaultValue="physician@chronos.ai" 
                className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#4f83cc]/50" 
                required 
              />
              <input 
                type="password" 
                placeholder="Access Pin" 
                defaultValue="••••••••" 
                className="w-full bg-white/5 border border-white/5 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#4f83cc]/50" 
                required 
              />
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-bold text-[#8899aa] uppercase tracking-widest text-center mt-2">Credential Level</label>
              <div className="flex gap-2">
                <button 
                  type="button"
                  onClick={() => setRole('Attending Physician')}
                  className={`flex-1 py-3 px-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    role === 'Attending Physician' 
                    ? 'bg-[#4f83cc]/10 border-[#4f83cc] text-white' 
                    : 'bg-white/5 border-white/5 text-[#8899aa] hover:bg-white/10'
                  }`}
                >
                  <ShieldCheck size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Physician</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setRole('ICU Nurse')}
                  className={`flex-1 py-3 px-2 rounded-lg border transition-all flex items-center justify-center gap-2 ${
                    role === 'ICU Nurse' 
                    ? 'bg-[#4f83cc]/10 border-[#4f83cc] text-white' 
                    : 'bg-white/5 border-white/5 text-[#8899aa] hover:bg-white/10'
                  }`}
                >
                  <HeartPulse size={14} />
                  <span className="text-[10px] font-black uppercase tracking-wider">Nursing</span>
                </button>
              </div>
            </div>
            
            <button type="submit" className="w-full py-2.5 mt-4 bg-[#4f83cc] hover:bg-[#3d6ba7] text-white rounded-lg text-sm font-bold transition-all active:scale-[0.98]">
              Authorized Access
            </button>
            <p className="text-center text-[10px] text-[#6b7280] font-bold uppercase tracking-widest mt-6">
              Edge-Inference Enabled • Zero Data Exit
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
