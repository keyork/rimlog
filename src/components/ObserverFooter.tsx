'use client';

import { useState, useEffect } from 'react';

export default function ObserverFooter() {
  const [coords, setCoords] = useState('RA 05h 34m 32s');
  const [connBars, setConnBars] = useState<number[]>([3, 5, 7, 8, 6, 4, 7]);

  useEffect(() => {
    const update = () => {
      const s = Math.floor(Math.random() * 60);
      const m = Math.floor(Math.random() * 60);
      setCoords(`RA 05h 34m ${String(s).padStart(2, '0')}s | DEC +27° ${String(m).padStart(2, '0')}'`);
      setConnBars(Array.from({ length: 7 }, () => 2 + Math.floor(Math.random() * 7)));
    };
    update();
    const interval = setInterval(update, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <footer className="relative z-20 border-t border-cyan-300/10 bg-[linear-gradient(180deg,rgba(4,8,20,0.88),rgba(2,5,14,0.96))]">
      <div className="absolute inset-0 footer-starfield pointer-events-none" />
      <div className="relative mx-auto max-w-6xl px-3 py-2 sm:px-5">
        <div className="flex items-center justify-between gap-3 text-[8px] sm:text-[9px] font-mono text-slate-300/80 tracking-[0.18em]">
          <span className="coordinate-drift hidden max-w-[220px] break-all tabular-nums text-slate-400/82 sm:inline">
            {coords}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="block h-1 w-1 bg-emerald-300/80 shadow-[0_0_8px_rgba(110,231,183,0.45)] animate-pulse" />
            <span className="tracking-wider">链路悬停</span>
            <svg width="20" height="6" viewBox="0 0 20 6" className="opacity-80">
              <path
                d="M0 3 Q2.5 0.5 5 3 Q7.5 5.5 10 3 Q12.5 0.5 15 3 Q17.5 5.5 20 3"
                fill="none"
                stroke="rgba(125,211,252,0.85)"
                strokeWidth="0.6"
                className="waveform-path"
              />
            </svg>
          </div>

          <div className="flex items-center gap-[2px]">
            {connBars.map((h, i) => (
              <div
                key={i}
                className={`conn-bar ${h > 4 ? 'conn-bar--active' : ''}`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
