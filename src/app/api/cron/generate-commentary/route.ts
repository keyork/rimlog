import { NextRequest, NextResponse } from 'next/server';
import { fetchNewsItems } from '@/lib/news/service';
import { generateBulkCommentary, isAIConfigured } from '@/lib/ai/service';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const CRON_SECRET = process.env.CRON_SECRET || '';

export async function POST(request: NextRequest) {
  if (CRON_SECRET) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  if (!isAIConfigured()) {
    return NextResponse.json({ error: 'AI not configured (QWEN_API_KEY missing)' }, { status: 503 });
  }

  try {
    const newsItems = await fetchNewsItems(2);
    
    if (newsItems.length === 0) {
      return NextResponse.json({ message: 'No news items found', generated: 0 });
    }

    const entries = await generateBulkCommentary(newsItems, 3);

    if (entries.length === 0) {
      return NextResponse.json({ message: 'AI generation produced no results', generated: 0 });
    }

    if (isSupabaseConfigured()) {
      const records = entries.map((entry, i) => ({
        id: uuidv4(),
        timescale: entry.timescale,
        display_time: entry.displayTime,
        tag: 'ai_commentary',
        tag_label: entry.tagLabel,
        content: entry.content,
        observer_note: entry.observerNote,
        title: entry.title || null,
        publish_at: new Date().toISOString(),
        is_published: true,
        sort_order: i,
      }));

      const { error } = await supabase!
        .from('log_entries')
        // @ts-expect-error - Supabase type inference issue
        .insert(records);

      if (error) {
        console.error('[Cron] Failed to save to Supabase:', error);
        return NextResponse.json({ error: error.message, generated: entries.length, saved: 0 }, { status: 500 });
      }

      return NextResponse.json({ generated: entries.length, saved: records.length });
    }

    return NextResponse.json({
      generated: entries.length,
      saved: 0,
      message: 'Supabase not configured. Entries generated but not persisted.',
      entries: entries.map((e) => ({
        ...e,
        tag: 'ai_commentary',
      })),
    });
  } catch (err) {
    console.error('[Cron] Generation failed:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    aiConfigured: isAIConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    message: 'POST to this endpoint to trigger AI commentary generation',
  });
}
