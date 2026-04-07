import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { getTodayLogs } from '@/lib/data';
import { normalizeEntryCopy } from '@/lib/copy';
import { LogEntry, TimeScale, LogTag } from '@/lib/types';
import { LogEntryRow } from '@/lib/supabase/database.types';

function transformSupabaseRow(row: LogEntryRow): LogEntry {
  return normalizeEntryCopy({
    id: row.id,
    timescale: row.timescale as TimeScale,
    displayTime: row.display_time,
    tag: row.tag as LogTag,
    tagLabel: row.tag_label,
    content: row.content,
    observerNote: row.observer_note,
    title: row.title ?? undefined,
    publishAt: row.publish_at,
  });
}

export async function GET() {
  if (!isSupabaseConfigured()) {
    const logs = getTodayLogs();
    return NextResponse.json({ data: logs });
  }

  const now = new Date().toISOString();
  
  const { data, error } = await supabase!
    .from('log_entries')
    .select('*')
    .eq('timescale', '1d')
    .eq('is_published', true)
    .lte('publish_at', now)
    .order('publish_at', { ascending: true });

  if (error) {
    return NextResponse.json({ error: (error as { message: string }).message }, { status: 500 });
  }

  const logs = data.map(transformSupabaseRow);
  return NextResponse.json({ data: logs });
}
