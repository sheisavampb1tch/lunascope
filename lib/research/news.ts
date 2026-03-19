import type { ResearchPack, ResearchSource } from "@/lib/markets/types";
import type { NeuralSignal } from "@/lib/markets/types";

const GOOGLE_NEWS_RSS = "https://news.google.com/rss/search";

function decodeXml(value: string) {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match ? decodeXml(match[1].trim()) : null;
}

function extractSource(block: string) {
  const match = block.match(/<source[^>]*>([\s\S]*?)<\/source>/i);
  return match ? decodeXml(match[1].trim()) : "Unknown";
}

function parseRssItems(xml: string) {
  const items = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
  return items
    .map((item) => {
      const title = extractTag(item, "title");
      const url = extractTag(item, "link");

      if (!title || !url) {
        return null;
      }

      const source: ResearchSource = {
        title,
        url,
        source: extractSource(item),
        publishedAt: extractTag(item, "pubDate"),
        kind: "news",
      };

      return source;
    })
    .filter((item): item is ResearchSource => item !== null);
}

function buildQuery(signal: NeuralSignal) {
  const category = signal.category ? `${signal.category} ` : "";
  return `${category}${signal.question}`;
}

export async function fetchNewsResearch(signal: NeuralSignal, limit = 4): Promise<ResearchPack> {
  const query = buildQuery(signal);
  const url = new URL(GOOGLE_NEWS_RSS);
  url.searchParams.set("q", query);
  url.searchParams.set("hl", "en-US");
  url.searchParams.set("gl", "US");
  url.searchParams.set("ceid", "US:en");

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/rss+xml, application/xml, text/xml",
        "User-Agent": "lunascope-backend/0.1",
      },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      throw new Error(`News RSS failed: ${response.status}`);
    }

    const xml = await response.text();
    const sources = parseRssItems(xml).slice(0, limit);

    return {
      query: signal.market.question,
      usedGroqWebSearch: false,
      sources,
    };
  } catch {
    return {
      query: signal.market.question,
      usedGroqWebSearch: false,
      sources: [],
    };
  }
}
