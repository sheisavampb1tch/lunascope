const DEFAULT_GAMMA_BASE_URL = "https://gamma-api.polymarket.com";
const DEFAULT_DATA_BASE_URL = "https://data-api.polymarket.com";
const DEFAULT_CLOB_BASE_URL = "https://clob.polymarket.com";

type Primitive = string | number | boolean;

export type PolymarketMarketRecord = {
  id: string;
  question?: string | null;
  conditionId: string;
  slug?: string | null;
  image?: string | null;
  icon?: string | null;
  description?: string | null;
  category?: string | null;
  endDate?: string | null;
  active?: boolean | null;
  acceptingOrders?: boolean | null;
  closed?: boolean | null;
  liquidityNum?: number | null;
  liquidityClob?: number | null;
  volume24hr?: number | null;
  volume1wk?: number | null;
  volumeClob?: number | null;
  bestBid?: number | null;
  bestAsk?: number | null;
  spread?: number | null;
  lastTradePrice?: number | null;
  oneHourPriceChange?: number | null;
  oneDayPriceChange?: number | null;
  oneWeekPriceChange?: number | null;
  clobTokenIds?: string | null;
  outcomes?: string | null;
  outcomePrices?: string | null;
};

type OpenInterestRecord = {
  market: string;
  openInterest: string | number;
};

type PriceHistoryPoint = {
  t?: number;
  p?: number | string;
};

type PriceHistoryResponse = {
  history?: PriceHistoryPoint[];
};

async function fetchJsonWithRetry<T>(url: URL, init: RequestInit, retries = 2, backoffMs = 400) {
  let lastError: unknown = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Polymarket request failed: ${response.status} ${response.statusText}`);
      }

      return (await response.json()) as T;
    } catch (error) {
      lastError = error;

      if (attempt === retries) {
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, backoffMs * (attempt + 1)));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Unknown Polymarket fetch error");
}

function polymarketFetch<T>(path: string, query: Record<string, Primitive | Primitive[] | undefined>, baseUrl: string) {
  const url = new URL(path, baseUrl);

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, String(item));
      }
      continue;
    }
    url.searchParams.set(key, String(value));
  }

  return fetchJsonWithRetry<T>(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "lunascope-backend/0.1",
    },
    next: { revalidate: 15 },
  });
}

export async function listMarkets(params: {
  limit?: number;
  offset?: number;
  order?: string;
  ascending?: boolean;
  closed?: boolean;
}) {
  return polymarketFetch<PolymarketMarketRecord[]>("/markets", {
    limit: params.limit ?? 100,
    offset: params.offset ?? 0,
    order: params.order ?? "volume24hr",
    ascending: params.ascending ?? false,
    closed: params.closed ?? false,
  }, process.env.POLYMARKET_GAMMA_BASE_URL ?? DEFAULT_GAMMA_BASE_URL);
}

export async function listActiveMarkets(limit = 100) {
  const pageSize = Math.min(limit, 100);
  const pages = Math.max(1, Math.ceil(limit / pageSize));
  const all: PolymarketMarketRecord[] = [];

  for (let page = 0; page < pages; page += 1) {
    const batch = await listMarkets({
      limit: pageSize,
      offset: page * pageSize,
      closed: false,
      ascending: false,
      order: "volume24hr",
    });

    all.push(...batch);

    if (batch.length < pageSize) {
      break;
    }
  }

  return all.filter((market) => market.active !== false && market.closed !== true);
}

export async function getOpenInterest(conditionIds: string[]) {
  if (conditionIds.length === 0) return new Map<string, number>();

  const url = new URL("/open-interest", process.env.POLYMARKET_DATA_BASE_URL ?? DEFAULT_DATA_BASE_URL);
  for (const conditionId of conditionIds) {
    url.searchParams.append("market", conditionId);
  }

  const records = await fetchJsonWithRetry<OpenInterestRecord[]>(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "lunascope-backend/0.1",
    },
    next: { revalidate: 15 },
  });
  return new Map(records.map((record) => [record.market, Number(record.openInterest) || 0]));
}

export async function getPriceHistory(tokenId: string, fidelity = 60, interval = "1d") {
  const response = await polymarketFetch<PriceHistoryResponse>(
    "/price-history",
    {
      market: tokenId,
      fidelity,
      interval,
    },
    process.env.POLYMARKET_CLOB_BASE_URL ?? DEFAULT_CLOB_BASE_URL,
  );

  return (response.history ?? [])
    .map((point) => ({
      timestamp: point.t ?? 0,
      price: Number(point.p) || 0,
    }))
    .filter((point) => point.timestamp > 0 && point.price > 0);
}
