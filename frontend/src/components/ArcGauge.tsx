import { useEffect, useState } from 'react';

export default function ArcGauge({ value, max = 100, color, label, animate = true }: any) {
  const [current, setCurrent] = useState(animate ? 0 : value);

  useEffect(() => {
    if (!animate) return;
    const duration = 1200;
    const fps = 60;
    const steps = duration / (1000 / fps);
    const inc = value / steps;
    let val = 0;
    
    const timer = setInterval(() => {
      val += inc;
      if (val >= value) {
        setCurrent(value);
        clearInterval(timer);
      } else {
        setCurrent(val);
      }
    }, 1000 / fps);
    
    return () => clearInterval(timer);
  }, [value, animate]);

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (current / max) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        {/* Background track */}
        <svg className="w-full h-full transform -rotate-90">
          <circle 
            cx="48" cy="48" r={radius} 
            stroke="rgba(255,255,255,0.1)" strokeWidth="8" fill="transparent" 
          />
          {/* Animated progress */}
          <circle 
            cx="48" cy="48" r={radius} 
            stroke={color} strokeWidth="8" fill="transparent" 
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-75"
            style={{ filter: `drop-shadow(0 0 4px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white tabular-nums tracking-tighter">
            {Math.round(current)}%
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs font-bold text-gray-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}
