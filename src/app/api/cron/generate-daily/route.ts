import { NextRequest, NextResponse } from 'next/server';
import { generateFreeformEntry, isAIConfigured } from '@/lib/ai/service';
import { pickRandomTopics } from '@/lib/ai/topics';
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
    const freeformTopics = pickRandomTopics(3);
    const entries: Array<{
      displayTime: string;
      tagLabel: string;
      title: string;
      content: string;
      observerNote: string;
      timescale: string;
      topic: string;
    }> = [];

    // Generate 2-3 freeform daily entries (1d timescale)
    const dailyCount = Math.random() > 0.5 ? 3 : 2;
    for (let i = 0; i < dailyCount; i++) {
      const topic = freeformTopics[i];
      const entry = await generateFreeformEntry(topic.keyword, topic.description);
      if (entry) {
        entries.push({ ...entry, topic: topic.keyword });
      }
      // Small delay to avoid rate limiting
      if (i < dailyCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    // Optionally generate 1 entry at 100d timescale
    if (freeformTopics.length > dailyCount && Math.random() > 0.4) {
      const topic = freeformTopics[dailyCount];
      const entry = await generateFreeformEntry(topic.keyword, topic.description);
      if (entry) {
        entries.push({ ...entry, timescale: '100d', topic: topic.keyword });
      }
    }

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
        console.error('[Cron/Daily] Failed to save to Supabase:', error);
        return NextResponse.json({ error: error.message, generated: entries.length, saved: 0 }, { status: 500 });
      }

      console.log(`[Cron/Daily] Saved ${records.length} freeform entries to Supabase`);
      return NextResponse.json({ generated: entries.length, saved: records.length });
    }

    return NextResponse.json({
      generated: entries.length,
      saved: 0,
      message: 'Supabase not configured. Entries generated but not persisted.',
      entries: entries.map((e) => ({
        displayTime: e.displayTime,
        tagLabel: e.tagLabel,
        title: e.title,
        content: e.content,
        observerNote: e.observerNote,
        timescale: e.timescale,
        topic: e.topic,
        tag: 'ai_commentary',
      })),
    });
  } catch (err) {
    console.error('[Cron/Daily] Generation failed:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    aiConfigured: isAIConfigured(),
    supabaseConfigured: isSupabaseConfigured(),
    message: 'POST to this endpoint to trigger freeform daily observation generation',
  });
}
