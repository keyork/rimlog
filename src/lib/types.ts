export type TimeScale = '1d' | '100d' | '1y' | '10y' | '100y' | '1000y';

export type LogTag = 'routine' | 'anomaly' | 'insight' | 'critical' | 'ai_commentary';

export interface LogEntry {
  id: string;
  timescale: TimeScale;
  displayTime: string;
  tag: LogTag;
  tagLabel: string;
  content: string;
  observerNote: string;
  title?: string;
  publishAt: string;
}

export interface TimeScaleConfig {
  key: TimeScale;
  label: string;
  description: string;
  icon: string;
}

export const TIME_SCALES: TimeScaleConfig[] = [
  { key: '1d', label: '单日切片', description: '近端回波', icon: '◧' },
  { key: '100d', label: '百日漂移', description: '中程聚束', icon: '◨' },
  { key: '1y', label: '年环层', description: '恒季折返', icon: '◫' },
  { key: '10y', label: '十年断面', description: '长程偏振', icon: '▣' },
  { key: '100y', label: '百年沉积', description: '结构回响', icon: '▤' },
  { key: '1000y', label: '千年外沿', description: '底噪远播', icon: '✶' },
];

export const TAG_COLORS: Record<LogTag, { bg: string; text: string; border: string }> = {
  routine: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30' },
  anomaly: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
  insight: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  critical: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' },
  ai_commentary: { bg: 'bg-lime-400/10', text: 'text-lime-300', border: 'border-lime-400/30' },
};
