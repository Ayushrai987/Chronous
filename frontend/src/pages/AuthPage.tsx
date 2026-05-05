import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

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
    <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="login-card-wrapper z-10 w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-10 flex flex-col items-center bg-[#0a0f25]/90"
        >
          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-1">PROJECT CHRONOS</h1>
          <p className="text-sm text-gray-400 italic mb-8">Predictive Intelligence for Critical Care</p>
          
          <form onSubmit={handleLogin} className="w-full space-y-4">
            <div>
              <input type="email" placeholder="Email Address" defaultValue="demo@chronos.ai" className="w-full" required />
            </div>
            <div>
              <input type="password" placeholder="Password" defaultValue="••••••••" className="w-full" required />
            </div>
            <div className="flex flex-col gap-3">
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center mb-1">Select Access Level</label>
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setRole('Attending Physician')}
                  className={`flex-1 py-4 px-2 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    role === 'Attending Physician' 
                    ? 'bg-blue-500/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'Attending Physician' ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider">Physician</span>
                </button>

                <button 
                  type="button"
                  onClick={() => setRole('ICU Nurse')}
                  className={`flex-1 py-4 px-2 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                    role === 'ICU Nurse' 
                    ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.3)]' 
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${role === 'ICU Nurse' ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-500'}`}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                  </div>
                  <span className="text-[11px] font-bold uppercase tracking-wider">Nursing</span>
                </button>
              </div>
            </div>
            
            <button type="submit" className="w-full py-3 mt-4 bg-blue-500 hover:bg-blue-400 text-white rounded-lg font-semibold transition-colors duration-200">
              Sign In
            </button>
            <p className="text-center text-xs text-gray-500 mt-4">Demo Mode — use any credentials.</p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
