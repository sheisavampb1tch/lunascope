import type { NormalizedMarket, OutcomeSide } from "@/lib/markets/types";
import type { PolymarketMarketRecord } from "@/lib/markets/polymarket-client";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function parseJsonArrayString(value?: string | null) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function asNumber(value: unknown) {
  return typeof value === "number" ? value : Number(value) || 0;
}

function normalizeOutcomeLabel(value: unknown) {
  return String(value ?? "").trim().toUpperCase();
}

function isBinaryYesNo(outcomes: unknown[]) {
  if (outcomes.length !== 2) return false;

  const labels = outcomes.map(normalizeOutcomeLabel).sort();
  return labels[0] === "NO" && labels[1] === "YES";
}

function buildTokens(tokenIds: unknown[], prices: unknown[], outcomes: unknown[]) {
  return tokenIds.slice(0, 2).map((id, index) => ({
    id: String(id),
    side: (normalizeOutcomeLabel(outcomes[index]) === "NO" ? "NO" : "YES") as OutcomeSide,
    label: String(outcomes[index] ?? ""),
    price: prices[index] === undefined ? null : clamp(asNumber(prices[index]), 0, 1),
  }));
}

function deriveMarketProbability(
  tokens: Array<{ side: OutcomeSide; price: number | null }>,
  bestBid?: number | null,
  bestAsk?: number | null,
  lastTradePrice?: number | null,
) {
  if (
    typeof bestBid === "number" &&
    typeof bestAsk === "number" &&
    bestBid > 0 &&
    bestAsk > 0 &&
    bestAsk - bestBid <= 0.1
  ) {
    return {
      value: clamp((bestBid + bestAsk) / 2, 0.01, 0.99),
      source: "orderbook" as const,
    };
  }

  if (typeof lastTradePrice === "number" && lastTradePrice > 0) {
    return {
      value: clamp(lastTradePrice, 0.01, 0.99),
      source: "lastTrade" as const,
    };
  }

  const yes = tokens.find((token) => token.side === "YES");
  if (yes?.price !== null && yes?.price !== undefined) {
    return {
      value: clamp(yes.price, 0.01, 0.99),
      source: "outcomePrice" as const,
    };
  }

  return {
    value: 0.5,
    source: "fallback" as const,
  };
}

export function normalizeMarket(
  market: PolymarketMarketRecord,
  context: {
    openInterest?: number;
    history?: Array<{ timestamp: number; price: number }>;
  } = {},
): NormalizedMarket | null {
  if (!market.id || !market.conditionId || !market.question) {
    return null;
  }

  const tokenIds = parseJsonArrayString(market.clobTokenIds);
  const outcomes = parseJsonArrayString(market.outcomes);
  const outcomePrices = parseJsonArrayString(market.outcomePrices);

  if (!isBinaryYesNo(outcomes) || tokenIds.length !== 2) {
    return null;
  }

  const tokens = buildTokens(tokenIds, outcomePrices, outcomes);
  const probability = deriveMarketProbability(tokens, market.bestBid, market.bestAsk, market.lastTradePrice);

  return {
    id: market.id,
    conditionId: market.conditionId,
    slug: market.slug ?? null,
    question: market.question,
    description: market.description ?? null,
    category: market.category ?? null,
    endDate: market.endDate ?? null,
    active: market.active !== false,
    closed: market.closed === true,
    acceptingOrders: market.acceptingOrders !== false,
    image: market.image ?? null,
    icon: market.icon ?? null,
    liquidity: asNumber(market.liquidityNum),
    liquidityClob: asNumber(market.liquidityClob),
    volume24hr: asNumber(market.volume24hr),
    volume1wk: asNumber(market.volume1wk),
    volumeClob: asNumber(market.volumeClob),
    openInterest: context.openInterest ?? 0,
    bestBid: market.bestBid ?? null,
    bestAsk: market.bestAsk ?? null,
    lastTradePrice: market.lastTradePrice ?? null,
    spread: typeof market.spread === "number" ? market.spread : null,
    oneHourPriceChange: typeof market.oneHourPriceChange === "number" ? market.oneHourPriceChange : null,
    oneDayPriceChange: typeof market.oneDayPriceChange === "number" ? market.oneDayPriceChange : null,
    oneWeekPriceChange: typeof market.oneWeekPriceChange === "number" ? market.oneWeekPriceChange : null,
    tokens,
    marketProbability: probability.value,
    marketProbabilitySource: probability.source,
    history: context.history
      ? {
          interval: "1d",
          points: context.history,
        }
      : null,
  };
}
