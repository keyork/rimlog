'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StarField from '@/components/StarField';
import ScanLines from '@/components/ScanLines';
import ObserverHeader from '@/components/ObserverHeader';
import ObserverFooter from '@/components/ObserverFooter';
import TimeScaleTabBar from '@/components/TimeScaleTabBar';
import LogEntryCard from '@/components/LogEntryCard';
import { TimeScale, LogEntry, TIME_SCALES } from '@/lib/types';
import { getLogsByTimescale } from '@/lib/data';

const BOOT_LINES = [
  { text: 'RIMLOG VEC-4612', delay: 0 },
  { text: '校准远端噪声...', delay: 250 },
  { text: '星图并网完成', delay: 550, status: 'ok' },
  { text: '侧向频段稳定', delay: 800, status: 'ok' },
  { text: '载入回波簇...', delay: 1050 },
];

const BOOT_TOTAL_DURATION = 1400;
const BOOT_FADE_DURATION = 400;
type ViewStage = 'boot' | 'cover' | 'main';

function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [visibleLines, setVisibleLines] = useState(0);
  const [fadingOut, setFadingOut] = useState(false);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    BOOT_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines(i + 1), line.delay));
    });

    timers.push(
      setTimeout(() => setFadingOut(true), BOOT_TOTAL_DURATION)
    );
    timers.push(
      setTimeout(() => onComplete(), BOOT_TOTAL_DURATION + BOOT_FADE_DURATION)
    );

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <motion.div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#030712] ${
        fadingOut ? 'boot-fade-out' : ''
      }`}
      style={{ cursor: 'none' }}
    >
      <div className="font-mono text-xs sm:text-sm">
        {BOOT_LINES.map((line, i) => (
          <div
            key={i}
            className={`boot-line flex items-center gap-2 ${
              i < visibleLines ? '' : 'invisible'
            }`}
            style={{ animationDelay: `${line.delay}ms` }}
          >
            <span className="text-cyan-500/40">&gt;</span>
            <span className="text-cyan-400/60">{line.text}</span>
            {line.status === 'ok' && i < visibleLines && (
              <span className="text-emerald-400/60">OK</span>
            )}
          </div>
        ))}
        {visibleLines >= BOOT_LINES.length && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-cyan-500/40">&gt;</span>
            <span className="terminal-cursor" />
          </div>
        )}
      </div>
    </motion.div>
  );
}

function HUDCorners() {
  return (
    <div className="hud-overlay" aria-hidden="true">
      <div className="hud-corner hud-corner--tl" />
      <div className="hud-corner hud-corner--tr" />
      <div className="hud-corner hud-corner--bl" />
      <div className="hud-corner hud-corner--br" />
    </div>
  );
}

function SilentCover({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      onClick={onEnter}
      className="cover-gate fixed inset-0 z-20 flex items-end justify-center bg-transparent pb-10 text-left"
      aria-label="进入主页"
    >
      <div className="cover-gate__hint">
        <span className="cover-gate__dot" />
        <span>切入外沿记录层</span>
      </div>
    </motion.button>
  );
}

function ReturnToCover({ onReturn }: { onReturn: () => void }) {
  return (
    <button
      type="button"
      onClick={onReturn}
      className="return-to-cover"
      aria-label="返回背景主页"
    >
      <span className="return-to-cover__dot" />
      <span>退回静默层</span>
    </button>
  );
}

function InterferenceManager() {
  const [lines, setLines] = useState<{ id: number; key: number }[]>([]);
  const counterRef = useRef(0);

  const spawnLine = useCallback(() => {
    const id = counterRef.current++;
    setLines((prev) => [...prev, { id, key: id }]);
    setTimeout(() => {
      setLines((prev) => prev.filter((l) => l.id !== id));
    }, 200);
  }, []);

  useEffect(() => {
    const schedule = () => {
      const delay = 15000 + Math.random() * 35000;
      return setTimeout(() => {
        spawnLine();
        schedule();
      }, delay);
    };
    const id = schedule();
    return () => clearTimeout(id);
  }, [spawnLine]);

  return (
    <>
      {lines.map((line) => (
        <div
          key={line.key}
          className="interference-line"
          style={{ top: `${10 + Math.random() * 80}%` }}
        />
      ))}
    </>
  );
}

export default function Home() {
  const [activeScale, setActiveScale] = useState<TimeScale>('1d');
  const [apiLogs, setApiLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<ViewStage>('boot');

  const staticLogs = getLogsByTimescale(activeScale);

  const handleBootComplete = useCallback(() => {
    setStage('cover');
  }, []);

  const enterMainView = useCallback(() => {
    setStage('main');
  }, []);

  const returnToCover = useCallback(() => {
    setStage('cover');
  }, []);

  useEffect(() => {
    if (stage !== 'main') return;
    setLoading(true);
    fetch(`/api/logs?scale=${activeScale}`)
      .then((res) => res.json())
      .then((data) => {
        const logs = (data as { data?: LogEntry[] }).data || [];
        setApiLogs(logs);
      })
      .catch(() => setApiLogs([]))
      .finally(() => setLoading(false));
  }, [activeScale, stage]);

  useEffect(() => {
    if (stage !== 'cover') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        enterMainView();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [enterMainView, stage]);

  const allLogs = apiLogs.length > 0 ? apiLogs : staticLogs;
  const showMainUI = stage === 'main';
  const activeScaleLabel = TIME_SCALES.find((scale) => scale.key === activeScale)?.label ?? activeScale;
  const summaryCards = [
    {
      label: '当前频段',
      value: activeScaleLabel,
      hint: '近端采样层',
    },
    {
      label: '回波簇数',
      value: String(allLogs.length).padStart(2, '0'),
      hint: loading ? '正在汇聚' : '信号已入列',
    },
    {
      label: '散布相位',
      value: allLogs.length > 4 ? '离轴漂移' : '近距聚束',
      hint: '非对称列阵',
    },
  ];
  const scatterClasses = [
    'lg:-translate-x-3 lg:rotate-[-1.8deg] lg:mt-2',
    'lg:translate-x-4 lg:rotate-[1.6deg] lg:mt-10',
    'lg:-translate-x-1 lg:rotate-[0.8deg] lg:mt-5',
    'lg:translate-x-2 lg:rotate-[-1deg] lg:mt-14',
    'lg:-translate-x-4 lg:rotate-[1.4deg] lg:mt-8',
    'lg:translate-x-3 lg:rotate-[-1.4deg] lg:mt-3',
  ];

  return (
    <>
      {stage === 'boot' && <BootSequence onComplete={handleBootComplete} />}

      <StarField />
      <div className="deep-space-veil" aria-hidden="true" />
      <div className="signal-bloom signal-bloom--left" aria-hidden="true" />
      <div className="signal-bloom signal-bloom--right" aria-hidden="true" />
      <div className="orbital-overlay" aria-hidden="true" />

      <AnimatePresence>
        {stage === 'cover' && <SilentCover onEnter={enterMainView} />}
      </AnimatePresence>

      {showMainUI && (
        <>
          <ScanLines />
          <div className="monitor-grid-overlay" aria-hidden="true" />
          <HUDCorners />
          <InterferenceManager />
        </>
      )}

      {showMainUI && (
        <div className="page-shell relative z-10 flex min-h-screen flex-col page-fade-in">
          <ObserverHeader leftAction={<ReturnToCover onReturn={returnToCover} />} />

          <main className="flex-1">
            <TimeScaleTabBar activeScale={activeScale} onScaleChange={setActiveScale} />

            <div className="mx-auto max-w-6xl px-3 py-5 sm:px-5 sm:py-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScale}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
                  <section className="noise-overlay relative overflow-hidden border border-cyan-300/12 bg-[linear-gradient(180deg,rgba(5,10,24,0.92),rgba(5,9,18,0.82))] px-4 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.2)] sm:px-5">
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.08),transparent_24%)]" />
                    <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                      <div className="max-w-2xl">
                        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-cyan-100/58">
                          外沿回波阵列
                        </p>
                        <h2 className="mt-2 font-display text-[24px] leading-none tracking-[0.08em] text-slate-50 sm:text-[28px]">
                          静默外沿
                        </h2>
                        <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300/78">
                          首层只保留标题信号。任意片段被触发后，完整记录会在独立视窗中展开。
                        </p>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
                        {summaryCards.map((card) => (
                          <div
                            key={card.label}
                            className="border border-cyan-300/12 bg-slate-950/45 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                          >
                            <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-slate-500/84">
                              {card.label}
                            </div>
                            <div className="mt-2 font-display text-[18px] tracking-[0.14em] text-cyan-50">
                              {card.value}
                            </div>
                            <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-400/70">
                              {card.hint}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>

                  {loading && (
                    <div className="flex items-center justify-center gap-3 py-12">
                      <div className="signal-spinner" />
                      <span className="text-[10px] font-mono text-cyan-500/30 tuning-text">
                        正在汇聚 {activeScaleLabel} 信号簇...
                      </span>
                    </div>
                  )}
                  {allLogs.length > 0 ? (
                    <section className="columns-1 gap-4 md:columns-2 xl:columns-3">
                      {allLogs.map((entry, index) => (
                        <article
                          key={entry.id}
                          className={`group relative mb-5 break-inside-avoid overflow-visible border border-cyan-300/10 bg-[linear-gradient(180deg,rgba(6,10,24,0.72),rgba(3,6,14,0.52))] p-2 shadow-[0_18px_60px_rgba(0,0,0,0.18)] transition-all duration-300 hover:border-cyan-200/18 hover:shadow-[0_28px_90px_rgba(0,0,0,0.24)] ${scatterClasses[index % scatterClasses.length]}`}
                        >
                          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.08),transparent_36%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                          <div className="relative mb-2 flex items-start justify-between gap-3 border border-white/5 bg-slate-950/50 px-3 py-2">
                            <div className="min-w-0">
                              <div className="font-mono text-[9px] uppercase tracking-[0.24em] text-slate-500/84">
                                序列 {String(index + 1).padStart(2, '0')}
                              </div>
                              <div className="mt-1 break-words font-mono text-[10px] uppercase tracking-[0.18em] text-cyan-100/78">
                                {entry.displayTime} / {entry.tagLabel}
                              </div>
                            </div>
                            <div className="shrink-0 border border-cyan-300/12 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.22em] text-cyan-100/72">
                              {activeScaleLabel}
                            </div>
                          </div>
                          <LogEntryCard entry={entry} index={index} />
                        </article>
                      ))}
                    </section>
                  ) : !loading ? (
                    <div className="noise-overlay border border-cyan-300/12 bg-slate-950/60 py-20 text-center shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
                      <div className="mb-4 flex justify-center">
                        <svg
                          width="48"
                          height="16"
                          viewBox="0 0 48 16"
                          className="empty-pulse opacity-30"
                        >
                          <line x1="0" y1="8" x2="12" y2="8" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
                          <line x1="14" y1="6" x2="14" y2="10" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
                          <line x1="16" y1="4" x2="16" y2="12" stroke="rgba(34,211,238,0.3)" strokeWidth="1" />
                          <line x1="18" y1="6" x2="18" y2="10" stroke="rgba(34,211,238,0.2)" strokeWidth="1" />
                          <line x1="20" y1="8" x2="48" y2="8" stroke="rgba(34,211,238,0.15)" strokeWidth="1" />
                        </svg>
                      </div>
                      <p className="font-mono text-sm text-slate-200/85 tracking-[0.18em]">
                        该频段暂无回波
                      </p>
                      <p className="mt-3 text-xs text-slate-400/82">
                        尚未截获新的片段信号。
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          <ObserverFooter />
        </div>
      )}
    </>
  );
}
