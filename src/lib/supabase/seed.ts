import { LOG_ENTRIES } from '../data';
import { LogEntryRow } from './database.types';

export const SEED_DATA: LogEntryRow[] = LOG_ENTRIES.map(entry => ({
  id: entry.id,
  timescale: entry.timescale,
  display_time: entry.displayTime,
  tag: entry.tag,
  tag_label: entry.tagLabel,
  content: entry.content,
  observer_note: entry.observerNote,
  title: entry.title || null,
  publish_at: entry.publishAt,
  is_published: true,
  sort_order: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}));
