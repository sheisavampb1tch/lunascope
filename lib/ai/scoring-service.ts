import type {
  NeuralOverlay,
  NeuralScorer,
  NeuralScoringInput,
  NeuralSignal,
  NormalizedMarket,
  OutcomeSide,
} from "@/lib/markets/types";

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalize(value: number, min: number, max: number) {
  if (max <= min) return 0;
  return clamp((value - min) / (max - min), 0, 1);
}

function daysUntil(endDate: string | null) {
  if (!endDate) return null;
  const ms = new Date(endDate).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  return ms / (1000 * 60 * 60 * 24);
}

function deriveModelProbability(market: NormalizedMarket, overlay?: NeuralOverlay) {
  if (typeof overlay?.modelProbability === "number") {
    return clamp(overlay.modelProbability, 0.01, 0.99);
  }

  const momentum1h = (market.oneHourPriceChange ?? 0) / 100;
  const momentum1d = (market.oneDayPriceChange ?? 0) / 100;
  const volumeLiquidityRatio = market.liquidity > 0 ? market.volume24hr / market.liquidity : 0;
  const activityDirection = Math.sign(momentum1h + momentum1d) || 1;
  const activityStrength = clamp(volumeLiquidityRatio / 1.2, 0, 1);
  const spreadPenalty = clamp((market.spread ?? 0.08) / 0.12, 0, 1);
  const urgencyDays = daysUntil(market.endDate);
  const urgencyBoost = urgencyDays === null ? 0 : clamp((7 - urgencyDays) / 7, 0, 1);
  const externalOverlay =
    (overlay?.sentimentScore ?? 0) * 0.06 +
    (overlay?.smartMoneyScore ?? 0) * 0.08 +
    (overlay?.catalystScore ?? 0) * 0.05;

  const drift =
    momentum1h * 0.22 +
    momentum1d * 0.18 +
    activityDirection * activityStrength * 0.08 +
    urgencyBoost * Math.sign(momentum1d || momentum1h || 1) * 0.04 -
    spreadPenalty * 0.03 +
    externalOverlay;

  return clamp(market.marketProbability + drift, 0.01, 0.99);
}

function buildReasons(market: NormalizedMarket, side: OutcomeSide, edge: number, confidence: number) {
  const reasons: string[] = [];

  reasons.push(`${side === "YES" ? "Yes" : "No"} edge estimated at ${(Math.abs(edge) * 100).toFixed(1)} pts.`);

  if (market.liquidity >= 100_000) {
    reasons.push("Liquidity is strong enough for cleaner execution.");
  }

  if ((market.oneHourPriceChange ?? 0) > 2 || (market.oneDayPriceChange ?? 0) > 5) {
    reasons.push("Momentum is accelerating in the same direction as the signal.");
  }

  if ((market.spread ?? 0.1) <= 0.03) {
    reasons.push("Order book spread is tight, reducing slippage risk.");
  }

  if (confidence >= 0.72) {
    reasons.push("Composite confidence cleared premium signal threshold.");
  }

  return reasons;
}

export class DefaultNeuralScorer implements NeuralScorer {
  readonly id = "lunascope-default-v1";

  score(input: NeuralScoringInput): NeuralSignal {
    const market = input.market;
    const modelProbability = deriveModelProbability(market, input.overlay);
    const edge = modelProbability - market.marketProbability;
    const absoluteEdge = Math.abs(edge);
    const liquidityScore = normalize(Math.log10(market.liquidity + 1), 3, 6);
    const activityScore = normalize(Math.log10(market.volume24hr + market.openInterest + 1), 3, 6);
    const momentumScore = normalize(Math.abs((market.oneHourPriceChange ?? 0) * 0.6 + (market.oneDayPriceChange ?? 0) * 0.4), 1, 15);
    const spreadScore = 1 - normalize(market.spread ?? 0.08, 0.01, 0.12);
    const urgency = daysUntil(market.endDate);
    const urgencyScore = urgency === null ? 0.45 : clamp((14 - urgency) / 14, 0, 1);
    const confidence = clamp(
      liquidityScore * 0.26 +
        activityScore * 0.22 +
        momentumScore * 0.18 +
        spreadScore * 0.16 +
        urgencyScore * 0.1 +
        normalize(absoluteEdge, 0.015, 0.12) * 0.08,
      0,
      1,
    );

    let signal: NeuralSignal["signal"] = "WATCH";
    let side: OutcomeSide = "YES";

    if (edge >= 0.035) {
      signal = "BUY_YES";
      side = "YES";
    } else if (edge <= -0.035) {
      signal = "BUY_NO";
      side = "NO";
    }

    const priority = clamp(absoluteEdge * 100 * confidence, 0, 100);

    return {
      marketId: market.id,
      conditionId: market.conditionId,
      slug: market.slug,
      question: market.question,
      category: market.category,
      side,
      signal,
      priority,
      features: {
        marketProbability: market.marketProbability,
        modelProbability,
        edge,
        absoluteEdge,
        confidence,
        liquidityScore,
        activityScore,
        momentumScore,
        spreadScore,
        urgencyScore,
      },
      market,
      reasons: buildReasons(market, side, edge, confidence),
      scorer: this.id,
      generatedAt: new Date().toISOString(),
    };
  }
}

export function scoreMarkets(markets: NormalizedMarket[], scorer: NeuralScorer = new DefaultNeuralScorer()) {
  return markets
    .map((market) => scorer.score({ market }))
    .sort((left, right) => right.priority - left.priority);
}
