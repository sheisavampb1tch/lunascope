import { createCachedJsonFetcher } from "@/lib/cache";
import { DefaultNeuralScorer, scoreMarkets } from "@/lib/ai/scoring-service";
import { analyzeSignalsWithGroq } from "@/lib/ai/providers/groq";
import { persistSnapshot } from "@/lib/persistence/supabase";
import { normalizeMarket } from "@/lib/markets/normalizer";
import { getOpenInterest, listActiveMarkets } from "@/lib/markets/polymarket-client";
import type { MarketSnapshot, NormalizedMarket } from "@/lib/markets/types";
import { fetchNewsResearch } from "@/lib/research/news";

const DEFAULT_LIMIT = 60;
const CACHE_TTL_SECONDS = 20;
const AI_ANALYST_MARKET_LIMIT = 6;

function buildCacheKey(limit: number) {
  return ["lunascope-polymarket-snapshot", String(limit)];
}

async function enrichMarkets(limit: number) {
  const rawMarkets = await listActiveMarkets(limit);
  let openInterestMap = new Map<string, number>();

  try {
    openInterestMap = await getOpenInterest(rawMarkets.map((market) => market.conditionId));
  } catch {
    openInterestMap = new Map<string, number>();
  }

  return rawMarkets
    .map((market) =>
      normalizeMarket(market, {
        openInterest: openInterestMap.get(market.conditionId) ?? 0,
      }),
    )
    .filter((market): market is NormalizedMarket => market !== null);
}

async function buildSnapshot(limit: number): Promise<MarketSnapshot> {
  const markets = await enrichMarkets(limit);
  const heuristicSignals = scoreMarkets(markets, new DefaultNeuralScorer()).filter((signal) => signal.signal !== "WATCH");
  const shortlistedSignals = heuristicSignals.slice(0, AI_ANALYST_MARKET_LIMIT);
  const research = await Promise.all(shortlistedSignals.map((signal) => fetchNewsResearch(signal)));
  const signals = await analyzeSignalsWithGroq(shortlistedSignals, research);

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

export async function refreshAndPersistMarketSnapshot(limit = DEFAULT_LIMIT) {
  const snapshot = await buildSnapshot(limit);
  const persistence = await persistSnapshot(snapshot);

  return {
    snapshot,
    persistence,
  };
}

export async function getTopSignals(limit = 12) {
  const snapshot = await getCachedMarketSnapshot(Math.max(limit * 4, DEFAULT_LIMIT));
  return snapshot.signals.slice(0, limit);
}
