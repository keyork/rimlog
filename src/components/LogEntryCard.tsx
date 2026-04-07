'use client';

import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { LogEntry, LogTag, TIME_SCALES } from '@/lib/types';

interface LogEntryCardProps {
  entry: LogEntry;
  index: number;
  className?: string;
}

interface CardTheme {
  border: string;
  glow: string;
  wave: string;
  topLine: string;
  surfaceTop: string;
  surfaceBottom: string;
  nebulaA: string;
  nebulaB: string;
  accentPanel: string;
  accentText: string;
  mutedText: string;
}

const TAG_LED_COLORS: Record<LogTag, string> = {
  routine: 'rgba(96,165,250,0.85)',
  anomaly: 'rgba(245,158,11,0.85)',
  insight: 'rgba(16,185,129,0.85)',
  critical: 'rgba(248,113,113,0.88)',
  ai_commentary: 'rgba(163,230,53,0.9)',
};

function getSignalQuality(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0;
  }
  return 92 + (Math.abs(hash) % 8);
}

function getHash(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) - hash + input.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateWaveformData(id: string) {
  let hash = getHash(id);

  const points = Array.from({ length: 19 }, (_, index) => {
    hash = ((hash << 5) - hash + index * 17) | 0;
    const noise = Math.abs(hash % 9) - 4;
    const base = index % 2 === 0 ? 9 : 6;
    return Math.max(3, Math.min(15, base + noise));
  });

  return points
    .map((y, index) => `${index === 0 ? 'M' : 'L'}${index * 4} ${y}`)
    .join(' ');
}

const CARD_THEMES: CardTheme[] = [
  {
    border: 'rgba(110,231,183,0.26)',
    glow: 'rgba(16,185,129,0.16)',
    wave: 'rgba(110,231,183,0.88)',
    topLine: 'rgba(209,250,229,0.44)',
    surfaceTop: 'rgba(8,24,24,0.92)',
    surfaceBottom: 'rgba(4,9,18,0.96)',
    nebulaA: 'rgba(16,185,129,0.16)',
    nebulaB: 'rgba(74,222,128,0.08)',
    accentPanel: 'linear-gradient(180deg, rgba(7, 23, 21, 0.94), rgba(3, 8, 16, 0.98))',
    accentText: 'rgba(225, 255, 246, 0.94)',
    mutedText: 'rgba(163, 211, 197, 0.74)',
  },
  {
    border: 'rgba(125,211,252,0.24)',
    glow: 'rgba(14,165,233,0.16)',
    wave: 'rgba(125,211,252,0.9)',
    topLine: 'rgba(224,242,254,0.46)',
    surfaceTop: 'rgba(8,20,30,0.92)',
    surfaceBottom: 'rgba(4,8,18,0.96)',
    nebulaA: 'rgba(14,165,233,0.16)',
    nebulaB: 'rgba(56,189,248,0.08)',
    accentPanel: 'linear-gradient(180deg, rgba(7, 18, 30, 0.94), rgba(3, 8, 17, 0.98))',
    accentText: 'rgba(226, 244, 255, 0.94)',
    mutedText: 'rgba(154, 187, 210, 0.74)',
  },
  {
    border: 'rgba(253,186,116,0.22)',
    glow: 'rgba(249,115,22,0.14)',
    wave: 'rgba(253,186,116,0.88)',
    topLine: 'rgba(255,237,213,0.44)',
    surfaceTop: 'rgba(26,16,10,0.92)',
    surfaceBottom: 'rgba(8,8,16,0.96)',
    nebulaA: 'rgba(249,115,22,0.14)',
    nebulaB: 'rgba(251,191,36,0.08)',
    accentPanel: 'linear-gradient(180deg, rgba(24, 15, 8, 0.94), rgba(7, 7, 14, 0.98))',
    accentText: 'rgba(255, 237, 214, 0.94)',
    mutedText: 'rgba(213, 177, 139, 0.74)',
  },
  {
    border: 'rgba(165,243,252,0.22)',
    glow: 'rgba(6,182,212,0.14)',
    wave: 'rgba(165,243,252,0.88)',
    topLine: 'rgba(236,254,255,0.42)',
    surfaceTop: 'rgba(6,20,24,0.92)',
    surfaceBottom: 'rgba(4,10,18,0.96)',
    nebulaA: 'rgba(6,182,212,0.16)',
    nebulaB: 'rgba(45,212,191,0.08)',
    accentPanel: 'linear-gradient(180deg, rgba(5, 20, 24, 0.94), rgba(3, 10, 17, 0.98))',
    accentText: 'rgba(224, 254, 255, 0.94)',
    mutedText: 'rgba(160, 208, 208, 0.74)',
  },
  {
    border: 'rgba(190,242,100,0.24)',
    glow: 'rgba(132,204,22,0.14)',
    wave: 'rgba(190,242,100,0.9)',
    topLine: 'rgba(236,252,203,0.42)',
    surfaceTop: 'rgba(14,22,8,0.92)',
    surfaceBottom: 'rgba(5,10,16,0.96)',
    nebulaA: 'rgba(132,204,22,0.16)',
    nebulaB: 'rgba(74,222,128,0.08)',
    accentPanel: 'linear-gradient(180deg, rgba(14, 22, 8, 0.94), rgba(5, 10, 16, 0.98))',
    accentText: 'rgba(241, 254, 218, 0.94)',
    mutedText: 'rgba(188, 211, 138, 0.74)',
  },
  {
    border: 'rgba(244,114,182,0.2)',
    glow: 'rgba(236,72,153,0.12)',
    wave: 'rgba(251,207,232,0.86)',
    topLine: 'rgba(252,231,243,0.42)',
    surfaceTop: 'rgba(24,10,20,0.92)',
    surfaceBottom: 'rgba(5,8,16,0.96)',
    nebulaA: 'rgba(236,72,153,0.14)',
    nebulaB: 'rgba(244,114,182,0.07)',
    accentPanel: 'linear-gradient(180deg, rgba(23, 10, 19, 0.94), rgba(5, 8, 16, 0.98))',
    accentText: 'rgba(255, 230, 241, 0.94)',
    mutedText: 'rgba(210, 167, 189, 0.74)',
  },
];

function getCardTheme(id: string) {
  return CARD_THEMES[getHash(id) % CARD_THEMES.length];
}

export default function LogEntryCard({ entry, index, className = '' }: LogEntryCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const ledColor = TAG_LED_COLORS[entry.tag];

  const signalQuality = useMemo(() => getSignalQuality(entry.id), [entry.id]);
  const waveformData = useMemo(() => generateWaveformData(entry.id), [entry.id]);
  const theme = useMemo(() => getCardTheme(entry.id), [entry.id]);
  const title = entry.title || `${entry.displayTime} / ${entry.tagLabel}`;
  const scaleLabel = TIME_SCALES.find((scale) => scale.key === entry.timescale)?.label ?? entry.timescale;
  const coverHeightClass = [
    'min-h-[220px] sm:min-h-[240px]',
    'min-h-[250px] sm:min-h-[280px]',
    'min-h-[236px] sm:min-h-[264px]',
  ][index % 3];
  const shardTiltClass = [
    'lg:-rotate-[1.8deg]',
    'lg:rotate-[1.4deg]',
    'lg:-rotate-[0.9deg]',
    'lg:rotate-[2.1deg]',
  ][index % 4];

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: index * 0.04, ease: 'easeOut' }}
        className={`group transmission-frame relative overflow-hidden border px-4 py-4 text-left transition-all duration-300 sm:px-5 sm:py-5 ${className}`}
        style={{
          borderColor: theme.border,
          background: `linear-gradient(180deg, ${theme.surfaceTop}, ${theme.surfaceBottom})`,
          boxShadow: `0 24px 80px rgba(0,0,0,0.28), 0 0 30px ${theme.glow}`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-95"
          style={{
            background: `radial-gradient(circle at top right, ${theme.nebulaA}, transparent 34%), radial-gradient(circle at bottom left, ${theme.nebulaB}, transparent 30%)`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent"
          style={{ backgroundImage: `linear-gradient(90deg, transparent, ${theme.topLine}, transparent)` }}
        />
        <div className="readout-scan-line" />

        <div className="relative flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[9px] font-mono uppercase tracking-[0.22em] text-slate-400/78">
                <span>{scaleLabel}</span>
                <span className="text-slate-500/70">/</span>
                <span>{entry.displayTime}</span>
                <span className="text-slate-500/70">/</span>
                <span>序列 {String(index + 1).padStart(2, '0')}</span>
              </div>
            </div>

            <div className="hidden shrink-0 items-center gap-3 sm:flex">
              <svg width="76" height="18" viewBox="0 0 76 18" className="opacity-85">
                <rect x="0.5" y="0.5" width="75" height="17" fill="rgba(4,10,22,0.4)" stroke={theme.border} />
                <path
                  d={waveformData}
                  fill="none"
                  stroke={theme.wave}
                  strokeWidth="1.1"
                  className="waveform-path"
                />
              </svg>
              <div className="text-right font-mono text-[9px] uppercase tracking-[0.18em] text-slate-300/75">
                <div className="integrity-pulse" style={{ color: theme.wave }}>相位 {signalQuality}%</div>
                <div className="mt-1 text-slate-500/80">链路稳定</div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className={`signal-shard signal-shard--cover flex flex-col justify-between px-3 py-4 text-left transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-cyan-200/30 ${coverHeightClass} ${shardTiltClass}`}
            style={{
              background: theme.accentPanel,
              borderColor: theme.border,
              color: theme.accentText,
              boxShadow: `0 20px 40px rgba(3,7,18,0.28), 0 8px 16px rgba(3,7,18,0.18), 0 0 0 1px ${theme.border}`,
            }}
          >
            <span
              className="mb-3 inline-flex w-fit items-center gap-2 border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.2em]"
              style={{
                borderColor: `${ledColor.replace('0.85', '0.26').replace('0.88', '0.28').replace('0.9', '0.3')}`,
                color: theme.accentText,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <span className="instrument-label-dot" style={{ background: ledColor, boxShadow: `0 0 8px ${ledColor}` }} />
              {entry.tagLabel}
            </span>
            <h3 className="break-words text-balance font-display text-[20px] leading-tight tracking-[0.03em] sm:text-[24px]">
              {title}
            </h3>
            <div className="mt-6 flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.18em]">
              <span style={{ color: theme.mutedText }}>展开片段</span>
              <span
                className="border px-2 py-1"
                style={{ borderColor: theme.border, color: theme.mutedText, backgroundColor: 'rgba(255,255,255,0.05)' }}
              >
                主段
              </span>
            </div>
          </button>
        </div>
      </motion.article>

      {hasMounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6"
            >
              <button
                type="button"
                aria-label="关闭详情"
                className="absolute inset-0 bg-[rgba(2,6,16,0.82)] backdrop-blur-md"
                onClick={() => setIsOpen(false)}
              />

              <motion.div
                initial={{ opacity: 0, y: 28, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 18, scale: 0.985 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
                className="record-modal-shell relative z-[121] max-h-[88vh] w-full max-w-3xl overflow-hidden border border-cyan-200/14 bg-[linear-gradient(180deg,rgba(8,14,30,0.96),rgba(4,8,18,0.98))] shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
                style={{
                  background: theme.accentPanel,
                  borderColor: theme.border,
                  boxShadow: `0 40px 120px rgba(0,0,0,0.45), 0 0 36px ${theme.glow}`,
                }}
                onClick={(event) => event.stopPropagation()}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at top right, ${theme.nebulaA}, transparent 32%), radial-gradient(circle at bottom left, ${theme.nebulaB}, transparent 28%)`,
                  }}
                />
                <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/45 to-transparent" />

                <div className="relative flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-7" style={{ borderColor: theme.border }}>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: theme.mutedText }}>
                      <span>{entry.displayTime}</span>
                      <span>/</span>
                      <span>{scaleLabel}</span>
                    </div>
                    <div
                      className="mt-2 inline-flex items-center gap-2 border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.2em]"
                      style={{ borderColor: theme.border, color: theme.accentText, backgroundColor: 'rgba(255,255,255,0.05)' }}
                    >
                      <span className="instrument-label-dot" style={{ background: ledColor, boxShadow: `0 0 8px ${ledColor}` }} />
                      {entry.tagLabel}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="shrink-0 border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.18em] transition-all duration-200"
                    style={{ borderColor: theme.border, color: theme.mutedText, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  >
                    退离
                  </button>
                </div>

                <div className="relative max-h-[calc(88vh-92px)] overflow-y-auto px-5 py-5 sm:px-7 sm:py-7">
                  <div className="record-modal-grid">
                    <div className="record-modal-rail">
                      <div className="record-modal-orbit" />
                      <div className="record-modal-line" />
                    </div>

                    <div className="min-w-0">
                      <h3 className="break-words font-display text-[26px] leading-[1.1] tracking-[0.03em] sm:text-[34px]" style={{ color: theme.accentText }}>
                        {title}
                      </h3>
                      <p className="mt-6 break-words text-[15px] leading-8 sm:text-[16px]" style={{ color: theme.accentText }}>
                        {entry.content}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
