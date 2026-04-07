import { NextResponse } from 'next/server';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { getLogsByTimescale } from '@/lib/data';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scale = searchParams.get('scale') as TimeScale;
  const limit = parseInt(searchParams.get('limit') || '50');
  const before = searchParams.get('before');

  if (!scale) {
    return NextResponse.json({ error: 'Missing scale parameter' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    const logs = getLogsByTimescale(scale);
    return NextResponse.json({ data: logs.slice(0, limit), next_cursor: null });
  }

  let query = supabase!
    .from('log_entries')
    .select('*')
    .eq('timescale', scale)
    .eq('is_published', true)
    .order('publish_at', { ascending: false })
    .limit(limit);

  if (before) {
    query = query.lt('publish_at', before);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const logs = data.map(transformSupabaseRow);
  const nextCursor = logs.length === limit ? logs[logs.length - 1]?.publishAt : null;

  return NextResponse.json({ data: logs, next_cursor: nextCursor });
}
