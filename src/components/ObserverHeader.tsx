'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';

function OscilloscopeWaveform() {
  return (
    <svg width="72" height="18" viewBox="0 0 72 18" className="opacity-50">
      <rect x="0" y="0" width="72" height="18" fill="none" stroke="rgba(34,211,238,0.08)" strokeWidth="0.5" />
      <line x1="0" y1="9" x2="72" y2="9" stroke="rgba(34,211,238,0.04)" strokeWidth="0.5" />
      <path
        d="M0 9 Q4 3 8 9 Q12 15 16 9 Q20 3 24 9 Q28 15 32 9 Q36 5 40 9 Q44 13 48 9 Q52 3 56 9 Q60 15 64 9 Q68 5 72 9"
        fill="none"
        stroke="rgba(34,211,238,0.45)"
        strokeWidth="1"
        className="oscilloscope-path"
      />
    </svg>
  );
}

function StatusLED({ type, label }: { type: 'cyan' | 'amber' | 'green' | 'off'; label: string }) {
  const ledClass = type === 'off' ? 'led-off' : `led-${type}`;
  return (
    <div className="flex items-center gap-1">
      <span className={`block h-[3px] w-[3px] ${ledClass}`} />
      <span className="text-[7px] font-mono text-slate-400/85 leading-none tracking-[0.18em]">{label}</span>
    </div>
  );
}

export default function ObserverHeader({ leftAction }: { leftAction?: ReactNode }) {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [signalStrength, setSignalStrength] = useState(97);
  const [glitching, setGlitching] = useState(false);
  const [signalBars, setSignalBars] = useState<boolean[]>([true, true, true, true, false]);
  const [coords, setCoords] = useState('RA 05h 34m 32s | DEC +27° 08\' 42"');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }));
      setDate(now.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }));
      setSignalStrength(94 + Math.floor(Math.random() * 6));
      setSignalBars(
        Array.from({ length: 5 }, (_, i) => {
          const threshold = Math.random() * 0.6;
          return i < 3 + Math.floor(threshold * 3);
        })
      );
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const updateCoords = () => {
      const s = Math.floor(Math.random() * 60);
      const m = Math.floor(Math.random() * 60);
      setCoords(`RA 05h 34m ${String(s).padStart(2, '0')}s | DEC +27° ${String(m).padStart(2, '0')}' ${String(Math.floor(Math.random() * 60)).padStart(2, '0')}"`);
    };
    updateCoords();
    const interval = setInterval(updateCoords, 4000);
    return () => clearInterval(interval);
  }, []);

  const triggerGlitch = useCallback(() => {
    setGlitching(true);
    const timeout = setTimeout(() => setGlitching(false), 200);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const scheduleGlitch = () => {
      const delay = 30000 + Math.random() * 30000;
      return setTimeout(() => {
        triggerGlitch();
        const id = scheduleGlitch();
        return () => clearTimeout(id);
      }, delay);
    };
    const id = scheduleGlitch();
    return () => clearTimeout(id);
  }, [triggerGlitch]);

  return (
    <header className="relative z-20 overflow-hidden border-b border-cyan-300/12 bg-[linear-gradient(180deg,rgba(7,12,28,0.94),rgba(3,7,18,0.9))] shadow-[0_12px_48px_rgba(0,0,0,0.22)]">
      <div className="header-scan-line" />
      <div
        className={`mx-auto max-w-6xl px-3 py-2 sm:px-5 sm:py-2.5 transition-all duration-100 ${
          glitching ? 'signal-glitch' : ''
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 sm:flex-nowrap">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {leftAction && <div className="flex-shrink-0">{leftAction}</div>}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="block h-[3px] w-[3px] led-green" />
              <span
                className="font-display text-[11px] sm:text-[13px] text-cyan-100/90 tracking-[0.28em]"
              >
                RIMLOG
              </span>
            </div>
            <span className="hidden sm:inline text-slate-500/70 text-[9px] font-mono flex-shrink-0 tracking-[0.2em]">外沿记录层</span>
          </div>

          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <OscilloscopeWaveform />
            <span className="text-[8px] font-mono text-slate-400/80 tracking-[0.18em]">频栅</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="hidden md:flex items-center gap-2.5">
              <StatusLED type="cyan" label="并网" />
              <StatusLED type="amber" label="折噪" />
              <StatusLED type="green" label="驻波" />
              <StatusLED type="off" label="静置" />
            </div>
            <div className="flex items-center gap-1.5">
              <div className="flex items-end gap-[1px]">
                {signalBars.map((active, i) => (
                  <div
                    key={i}
                    className={`w-[2px] transition-all duration-300 ${
                      active ? 'bg-emerald-300/90 shadow-[0_0_8px_rgba(110,231,183,0.35)]' : 'bg-emerald-950/60'
                    }`}
                    style={{ height: `${3 + i * 1.5}px` }}
                  />
                ))}
              </div>
              <span className="text-[8px] sm:text-[9px] font-mono text-emerald-300/90 signal-fluctuate tracking-[0.18em]">
                {signalStrength}%
              </span>
            </div>
          </div>
        </div>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2 text-[8px] sm:flex-nowrap sm:text-[9px] font-mono text-slate-300/72 tracking-[0.16em]">
          <span className="min-w-0 break-words">{date} {time}</span>
          <span className="coordinate-drift hidden min-w-0 break-all text-slate-400/82 sm:inline">
            {coords}
          </span>
          <span className="flex-shrink-0 text-cyan-100/80">轨次 4612 / VEC</span>
        </div>
      </div>
    </header>
  );
}
