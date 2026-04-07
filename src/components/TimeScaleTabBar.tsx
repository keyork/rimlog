'use client';

import { motion } from 'framer-motion';
import { TimeScale, TIME_SCALES, TimeScaleConfig } from '@/lib/types';

interface TimeScaleTabBarProps {
  activeScale: TimeScale;
  onScaleChange: (scale: TimeScale) => void;
}

function SpectrumBars() {
  return (
    <div className="flex items-end gap-[2px] h-[18px]">
      {[1, 2, 3, 4, 5, 6, 7].map((n) => (
        <div
          key={n}
          className={`w-[3px] bg-cyan-300/90 shadow-[0_0_10px_rgba(103,232,249,0.26)] spec-bar-${n}`}
          style={{ minHeight: '2px' }}
        />
      ))}
    </div>
  );
}

function FlatLine() {
  return (
    <svg width="48" height="18" viewBox="0 0 48 18" className="opacity-40">
      <line x1="0" y1="9" x2="48" y2="9" stroke="rgba(148,163,184,0.5)" strokeWidth="1" />
    </svg>
  );
}

export default function TimeScaleTabBar({ activeScale, onScaleChange }: TimeScaleTabBarProps) {
  return (
    <div className="equipment-tick-top relative z-20 border-b border-cyan-300/10 bg-[linear-gradient(180deg,rgba(7,13,30,0.88),rgba(4,8,20,0.78))] shadow-[0_20px_60px_rgba(0,0,0,0.14)]">
      <div className="mx-auto max-w-6xl px-2 sm:px-5">
        <nav
          className="flex gap-0 overflow-x-auto scrollbar-hide"
          role="tablist"
        >
          {TIME_SCALES.map((scale: TimeScaleConfig, index: number) => {
            const isActive = activeScale === scale.key;
            return (
              <button
                key={scale.key}
                role="tab"
                aria-selected={isActive}
                onClick={() => onScaleChange(scale.key)}
                className={`relative flex-shrink-0 flex flex-col items-center gap-0.5 px-2 py-2 sm:px-3 sm:py-2.5 transition-all duration-300 ${
                  isActive
                    ? 'text-cyan-100'
                    : 'text-slate-400/78 hover:text-slate-100'
                }`}
                style={{ cursor: 'crosshair' }}
              >
                {isActive && (
                  <motion.div
                    layoutId="freqActiveBg"
                    className="absolute inset-0 bg-[linear-gradient(180deg,rgba(34,211,238,0.12),rgba(34,211,238,0.02))]"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                {isActive && (
                  <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-200/60 to-transparent" />
                )}

                <span className="relative text-[7px] sm:text-[8px] font-mono text-slate-500/85 tracking-[0.2em]">
                  频段 {String(index + 1).padStart(2, '0')}
                </span>

                <span className="relative flex items-center gap-1 text-[10px] sm:text-xs font-mono uppercase tracking-[0.16em]">
                  <span className={`text-[8px] sm:text-[10px] ${isActive ? 'opacity-90' : 'opacity-55'}`}>{scale.icon}</span>
                  <span>{scale.label}</span>
                </span>

                <div className="relative h-[18px] flex items-center justify-center">
                  {isActive ? <SpectrumBars /> : <FlatLine />}
                </div>

                <span className="relative text-[7px] sm:text-[8px] font-mono text-slate-500/75 tabular-nums">
                  层级 {String(index + 1).padStart(2, '0')}
                </span>

                <span className={`relative hidden text-[8px] font-mono tracking-[0.16em] sm:block ${isActive ? 'text-slate-200/88' : 'text-slate-500/70'}`}>
                  {scale.description}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="freqIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-300/95"
                    style={{ boxShadow: '0 0 12px rgba(34,211,238,0.42)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      <div className="mx-auto flex max-w-6xl items-center justify-between px-3 py-1.5 sm:px-5">
        <div className="flex items-center gap-1.5">
          <span className="text-[7px] sm:text-[8px] font-mono text-slate-400/80 tracking-[0.18em]">折跃层</span>
          <div className="flex items-end gap-[1px]">
            {[3, 5, 7, 9, 11].map((h, i) => (
              <div
                key={i}
                className={`signal-bar ${i < 4 ? 'signal-bar--active' : ''}`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
          <span className="text-[7px] sm:text-[8px] font-mono text-cyan-100/80 tracking-[0.18em]">
            {TIME_SCALES.find((scale) => scale.key === activeScale)?.label ?? activeScale}
          </span>
        </div>
        <span className="text-[7px] sm:text-[8px] font-mono text-slate-400/80 tracking-[0.2em]">
          链路已锁定
        </span>
      </div>
    </div>
  );
}
