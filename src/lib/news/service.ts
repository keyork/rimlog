import Parser from 'rss-parser';

const rssParser = new Parser({
  timeout: 10000,
  headers: {
    'User-Agent': 'RimLog-Observer/1.0 (Galactic Edge Monitoring Station)',
  },
});

export interface NewsItem {
  title: string;
  content: string;
  source: string;
  link: string;
  pubDate: string;
}

/**
 * RSS feeds for Chinese news sources
 * These are publicly accessible RSS feeds
 */
const RSS_FEEDS: Array<{ url: string; name: string; category: string }> = [
  // 36kr - Tech & Business
  { url: 'https://36kr.com/feed', name: '36氪', category: 'tech' },
  // Zhihu Hot
  { url: 'https://www.zhihu.com/rss', name: '知乎', category: 'general' },
  // Hacker News (for tech-savvy audience)
  { url: 'https://hnrss.org/frontpage', name: 'Hacker News', category: 'tech' },
];

export async function fetchNewsItems(maxPerFeed: number = 3): Promise<NewsItem[]> {
  const allItems: NewsItem[] = [];

  for (const feed of RSS_FEEDS) {
    try {
      const parsed = await rssParser.parseURL(feed.url);
      const items: NewsItem[] = (parsed.items || [])
        .slice(0, maxPerFeed)
        .filter((item) => item.title && item.title.trim().length > 0)
        .map((item) => ({
          title: item.title || '',
          content: stripHtml(item.contentSnippet || item.content || '').slice(0, 500),
          source: feed.name,
          link: item.link || '',
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
        }));
      allItems.push(...items);
    } catch (err) {
      console.warn(`[News] Failed to fetch ${feed.name}:`, err);
    }
  }

  const seen = new Set<string>();
  return allItems
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
    .filter((item) => {
      const key = item.title.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export async function fetchTopNews(): Promise<NewsItem | null> {
  const items = await fetchNewsItems(1);
  return items[0] || null;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}
