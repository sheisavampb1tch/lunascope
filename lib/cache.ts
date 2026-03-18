import { unstable_cache } from "next/cache";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export function createCachedJsonFetcher<T extends JsonValue>(
  keyParts: string[],
  fetcher: () => Promise<T>,
  revalidate = 30,
  tags: string[] = [],
) {
  return unstable_cache(fetcher, keyParts, {
    revalidate,
    tags,
  });
}

export const getPolymarketSnapshot = createCachedJsonFetcher(
  ["lunascope-polymarket-snapshot"],
  async () => {
    return {
      status: "placeholder",
      message: "Replace with Polymarket + AI aggregator fetcher before production launch.",
      cachedAt: new Date().toISOString(),
    };
  },
  20,
  ["markets", "signals"],
);
