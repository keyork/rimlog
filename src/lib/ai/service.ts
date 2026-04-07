import OpenAI from 'openai';
import { normalizeEntryCopy } from '@/lib/copy';

const AI_BASE_URL = process.env.QWEN_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1';
const AI_API_KEY = process.env.QWEN_API_KEY || '';
const AI_MODEL = process.env.QWEN_MODEL || 'qwen-plus';

export const isAIConfigured = () => !!AI_API_KEY;

function getOpenAIClient() {
  return new OpenAI({
    apiKey: AI_API_KEY,
    baseURL: AI_BASE_URL,
  });
}

export interface AIGeneratedEntry {
  displayTime: string;
  tagLabel: string;
  title: string;
  content: string;
  observerNote: string;
  timescale: string;
}

export async function generateCommentary(
  newsTitle: string,
  newsContent: string,
  newsSource: string
): Promise<AIGeneratedEntry | null> {
  if (!isAIConfigured()) {
    console.warn('[AI] QWEN_API_KEY not configured, skipping AI generation');
    return null;
  }

  const client = getOpenAIClient();
  const { VEC_SYSTEM_PROMPT, VEC_COMMENTARY_PROMPT } = await import('./prompt');

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: VEC_SYSTEM_PROMPT },
        { role: 'user', content: VEC_COMMENTARY_PROMPT(newsTitle, newsContent, newsSource) },
      ],
      temperature: 0.85,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[AI] Empty response from QWEN');
      return null;
    }

    const parsed = JSON.parse(content) as AIGeneratedEntry;

    if (!parsed.content || !parsed.observerNote || !parsed.timescale) {
      console.error('[AI] Missing required fields in response:', parsed);
      return null;
    }

    console.log(`[AI] Generated commentary for: "${newsTitle}"`);
    return normalizeEntryCopy(parsed);
  } catch (err) {
    console.error('[AI] Failed to generate commentary:', err);
    return null;
  }
}

export async function generateBulkCommentary(
  newsItems: Array<{ title: string; content: string; source: string }>,
  maxItems: number = 3
): Promise<AIGeneratedEntry[]> {
  const results: AIGeneratedEntry[] = [];
  const items = newsItems.slice(0, maxItems);

  for (const item of items) {
    const entry = await generateCommentary(item.title, item.content, item.source);
    if (entry) {
      results.push(entry);
    }
    // Small delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  return results;
}

export async function generateFreeformEntry(
  topicKeyword: string,
  topicDescription: string
): Promise<AIGeneratedEntry | null> {
  if (!isAIConfigured()) {
    console.warn('[AI] QWEN_API_KEY not configured, skipping freeform generation');
    return null;
  }

  const client = getOpenAIClient();
  const { VEC_SYSTEM_PROMPT, VEC_FREEFORM_PROMPT } = await import('./prompt');

  try {
    const response = await client.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: VEC_SYSTEM_PROMPT },
        { role: 'user', content: VEC_FREEFORM_PROMPT(topicKeyword, topicDescription) },
      ],
      temperature: 0.9,
      max_tokens: 1000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('[AI] Empty response from QWEN for freeform topic:', topicKeyword);
      return null;
    }

    const parsed = JSON.parse(content) as AIGeneratedEntry;

    if (!parsed.content || !parsed.observerNote || !parsed.timescale) {
      console.error('[AI] Missing required fields in freeform response:', parsed);
      return null;
    }

    console.log(`[AI] Generated freeform entry for topic: "${topicKeyword}"`);
    return normalizeEntryCopy(parsed);
  } catch (err) {
    console.error('[AI] Failed to generate freeform entry for topic "${topicKeyword}":', err);
    return null;
  }
}
