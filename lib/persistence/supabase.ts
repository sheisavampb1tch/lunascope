import type { MarketSnapshot, NeuralSignal, NormalizedMarket, PublishedAnalystSignal } from "@/lib/markets/types";

const SIGNAL_DEDUPE_WINDOW_MINUTES = 15;

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

function getHeaders(serviceRoleKey: string, extra: HeadersInit = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
    ...extra,
  };
}

function getSignalWindow(date = new Date()) {
  const windowMs = SIGNAL_DEDUPE_WINDOW_MINUTES * 60 * 1000;
  return new Date(Math.floor(date.getTime() / windowMs) * windowMs).toISOString();
}

function marketRow(market: NormalizedMarket) {
  return {
    condition_id: market.conditionId,
    market_id: market.id,
    question: market.question,
    slug: market.slug,
    category: market.category,
    end_date: market.endDate,
    market_probability: market.marketProbability,
    probability_source: market.marketProbabilitySource,
    liquidity: market.liquidity,
    liquidity_clob: market.liquidityClob,
    volume_24hr: market.volume24hr,
    volume_1wk: market.volume1wk,
    volume_clob: market.volumeClob,
    open_interest: market.openInterest,
    best_bid: market.bestBid,
    best_ask: market.bestAsk,
    spread: market.spread,
    last_trade_price: market.lastTradePrice,
    active: market.active,
    accepting_orders: market.acceptingOrders,
    payload: market,
    updated_at: new Date().toISOString(),
  };
}

function signalRow(signal: NeuralSignal) {
  return {
    condition_id: signal.conditionId,
    market_id: signal.marketId,
    signal: signal.signal,
    side: signal.side,
    priority: signal.publishedSignal ? signal.publishedSignal.signal_score * 10 : signal.priority,
    confidence: signal.features.confidence,
    edge: signal.features.edge,
    absolute_edge: signal.features.absoluteEdge,
    scorer: signal.scorer,
    signal_window: getSignalWindow(new Date(signal.generatedAt)),
    question: signal.question,
    category: signal.category,
    reasons: signal.reasons,
    payload: signal,
    created_at: signal.generatedAt,
  };
}

async function supabaseFetch(path: string, init: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${detail}`);
  }

  if (response.status === 204) {
    return null;
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text);
}

async function loadRecentSignalConditionIds(conditionIds: string[]) {
  const config = getSupabaseConfig();
  if (!config || conditionIds.length === 0) {
    return new Set<string>();
  }

  const since = new Date(Date.now() - SIGNAL_DEDUPE_WINDOW_MINUTES * 60 * 1000).toISOString();
  const encodedIds = conditionIds.join(",");
  const path = `/rest/v1/signals?select=condition_id&created_at=gte.${encodeURIComponent(since)}&condition_id=in.(${encodeURIComponent(encodedIds)})`;

  const rows = (await supabaseFetch(path, {
    method: "GET",
    headers: getHeaders(config.serviceRoleKey, {
      Accept: "application/json",
    }),
  })) as Array<{ condition_id: string }> | null;

  return new Set((rows ?? []).map((row) => row.condition_id));
}

export async function loadLatestSignals(limit = 12) {
  const config = getSupabaseConfig();
  if (!config) {
    return [] as PublishedAnalystSignal[];
  }

  const rows = (await supabaseFetch(`/rest/v1/signals?select=payload,created_at&order=created_at.desc&limit=${limit}`, {
    method: "GET",
    headers: getHeaders(config.serviceRoleKey, {
      Accept: "application/json",
    }),
  })) as Array<{ payload?: { publishedSignal?: PublishedAnalystSignal } }> | null;

  return (rows ?? [])
    .map((row) => row.payload?.publishedSignal)
    .filter((signal): signal is PublishedAnalystSignal => Boolean(signal));
}

export async function persistSnapshot(snapshot: MarketSnapshot) {
  const config = getSupabaseConfig();
  if (!config) {
    return {
      enabled: false,
      storedMarkets: 0,
      storedSignals: 0,
      skippedSignals: 0,
    };
  }

  const marketPayload = snapshot.markets.map(marketRow);
  const recentConditionIds = await loadRecentSignalConditionIds(snapshot.signals.map((signal) => signal.conditionId));
  const signalsToInsert = snapshot.signals
    .filter((signal) => !recentConditionIds.has(signal.conditionId))
    .map(signalRow);

  if (marketPayload.length > 0) {
    await supabaseFetch("/rest/v1/market_snapshots?on_conflict=condition_id", {
      method: "POST",
      headers: getHeaders(config.serviceRoleKey, {
        Prefer: "resolution=merge-duplicates,return=minimal",
      }),
      body: JSON.stringify(marketPayload),
    });
  }

  if (signalsToInsert.length > 0) {
    await supabaseFetch("/rest/v1/signals?on_conflict=condition_id,signal_window", {
      method: "POST",
      headers: getHeaders(config.serviceRoleKey, {
        Prefer: "resolution=ignore-duplicates,return=minimal",
      }),
      body: JSON.stringify(signalsToInsert),
    });
  }

  return {
    enabled: true,
    storedMarkets: marketPayload.length,
    storedSignals: signalsToInsert.length,
    skippedSignals: snapshot.signals.length - signalsToInsert.length,
  };
}
