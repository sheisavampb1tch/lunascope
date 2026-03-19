export type OutcomeSide = "YES" | "NO";

export type MarketToken = {
  id: string;
  side: OutcomeSide;
  label: string;
  price: number | null;
};

export type NormalizedMarket = {
  id: string;
  conditionId: string;
  slug: string | null;
  question: string;
  description: string | null;
  category: string | null;
  endDate: string | null;
  active: boolean;
  closed: boolean;
  acceptingOrders: boolean;
  image: string | null;
  icon: string | null;
  liquidity: number;
  liquidityClob: number;
  volume24hr: number;
  volume1wk: number;
  volumeClob: number;
  openInterest: number;
  bestBid: number | null;
  bestAsk: number | null;
  lastTradePrice: number | null;
  spread: number | null;
  oneHourPriceChange: number | null;
  oneDayPriceChange: number | null;
  oneWeekPriceChange: number | null;
  tokens: MarketToken[];
  marketProbability: number;
  marketProbabilitySource: "outcomePrice" | "orderbook" | "lastTrade" | "fallback";
  history: {
    interval: string;
    points: Array<{ timestamp: number; price: number }>;
  } | null;
};

export type NeuralSignalFeatures = {
  marketProbability: number;
  modelProbability: number;
  edge: number;
  absoluteEdge: number;
  confidence: number;
  liquidityScore: number;
  activityScore: number;
  momentumScore: number;
  spreadScore: number;
  urgencyScore: number;
};

export type NeuralSignal = {
  marketId: string;
  conditionId: string;
  slug: string | null;
  question: string;
  category: string | null;
  side: OutcomeSide;
  signal: "BUY_YES" | "BUY_NO" | "WATCH";
  priority: number;
  features: NeuralSignalFeatures;
  market: NormalizedMarket;
  reasons: string[];
  scorer: string;
  generatedAt: string;
};

export type SnapshotMeta = {
  source: "polymarket";
  fetchedAt: string;
  marketCount: number;
  signalCount: number;
  cacheTtlSeconds: number;
};

export type MarketSnapshot = {
  meta: SnapshotMeta;
  markets: NormalizedMarket[];
  signals: NeuralSignal[];
};

export type NeuralOverlay = {
  modelProbability?: number;
  sentimentScore?: number;
  smartMoneyScore?: number;
  catalystScore?: number;
};

export type NeuralScoringInput = {
  market: NormalizedMarket;
  overlay?: NeuralOverlay;
};

export interface NeuralScorer {
  readonly id: string;
  score(input: NeuralScoringInput): NeuralSignal;
}
