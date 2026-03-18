import { createCachedJsonFetcher } from "@/lib/cache";
import { DefaultNeuralScorer, scoreMarkets } from "@/lib/ai/scoring-service";
import { normalizeMarket } from "@/lib/markets/normalizer";
import { getOpenInterest, getPriceHistory, listActiveMarkets } from "@/lib/markets/polymarket-client";
import type { MarketSnapshot, NormalizedMarket } from "@/lib/markets/types";

const DEFAULT_LIMIT = 60;
const HISTORY_MARKET_COUNT = 8;
const CACHE_TTL_SECONDS = 20;

function buildCacheKey(limit: number) {
  return ["lunascope-polymarket-snapshot", String(limit)];
}

async function enrichMarkets(limit: number) {
  const rawMarkets = await listActiveMarkets(limit);
  const openInterestMap = await getOpenInterest(rawMarkets.map((market) => market.conditionId));

  const normalized = rawMarkets
    .map((market) =>
      normalizeMarket(market, {
        openInterest: openInterestMap.get(market.conditionId) ?? 0,
      }),
    )
    .filter((market): market is NormalizedMarket => market !== null);

  const candidatesForHistory = normalized
    .slice()
    .sort((left, right) => right.volume24hr - left.volume24hr)
    .slice(0, HISTORY_MARKET_COUNT);

  await Promise.all(
    candidatesForHistory.map(async (market) => {
      const yesToken = market.tokens.find((token) => token.side === "YES");
      if (!yesToken?.id) return;

      try {
        const history = await getPriceHistory(yesToken.id, 60, "1d");
        market.history = {
          interval: "1d",
          points: history,
        };
      } catch {
        market.history = null;
      }
    }),
  );

  return normalized;
}

async function buildSnapshot(limit: number): Promise<MarketSnapshot> {
  const markets = await enrichMarkets(limit);
  const signals = scoreMarkets(markets, new DefaultNeuralScorer()).filter((signal) => signal.signal !== "WATCH");

  return {
    meta: {
      source: "polymarket",
      fetchedAt: new Date().toISOString(),
      marketCount: markets.length,
      signalCount: signals.length,
      cacheTtlSeconds: CACHE_TTL_SECONDS,
    },
    markets,
    signals,
  };
}

export function getCachedMarketSnapshot(limit = DEFAULT_LIMIT) {
  return createCachedJsonFetcher(buildCacheKey(limit), () => buildSnapshot(limit), CACHE_TTL_SECONDS, ["markets", "signals"])();
}

export async function getTopSignals(limit = 12) {
  const snapshot = await getCachedMarketSnapshot(Math.max(limit * 4, DEFAULT_LIMIT));
  return snapshot.signals.slice(0, limit);
}
