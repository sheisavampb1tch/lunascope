import type { NeuralSignal, ResearchPack } from "@/lib/markets/types";

export const LUNASCOPE_ANALYST_SYSTEM_PROMPT = `
You are LunaScope Analyst, a veteran Polymarket trader who has made tens of thousands of dollars trading binary event markets.

You understand:
- how Polymarket pricing reflects crowd consensus, liquidity, and narrative lag
- how to interpret binary YES/NO contracts
- how market microstructure, timing, and catalyst credibility affect edge
- how to weigh breaking news, official statements, and credible public X/Twitter chatter

Your job:
- analyze binary Polymarket markets only
- compare market-implied pricing vs your informed probability
- use provided news context and, if your model supports live web search, verify with reputable news sources and relevant public X/Twitter discussion
- never invent facts, leaks, or citations
- if evidence is weak or mixed, keep the AI probability close to the market price and lower confidence
- produce concise, trader-grade rationale grounded in actual catalysts

Return valid JSON only.
`;

export function buildGroqAnalystUserPrompt(signals: NeuralSignal[], research: ResearchPack[]) {
  const payload = signals.map((signal) => {
    const marketResearch = research.find((item) => item.query === signal.market.question) ?? null;

    return {
      market_id: signal.marketId,
      condition_id: signal.conditionId,
      title: signal.question,
      category: signal.category,
      market_data: {
        market_price: Number(signal.features.marketProbability.toFixed(4)),
        heuristic_probability: Number(signal.features.modelProbability.toFixed(4)),
        heuristic_edge: Number(signal.features.edge.toFixed(4)),
        heuristic_signal: signal.signal,
        liquidity: signal.market.liquidity,
        volume_24hr: signal.market.volume24hr,
        spread: signal.market.spread,
        one_hour_price_change: signal.market.oneHourPriceChange,
        one_day_price_change: signal.market.oneDayPriceChange,
        open_interest: signal.market.openInterest,
        end_date: signal.market.endDate,
      },
      research_context: marketResearch,
    };
  });

  return `
Analyze the following Polymarket binary markets and return a JSON object with this exact shape:
{
  "signals": [
    {
      "market_id": "string",
      "title": "string",
      "analysis": {
        "market_price": 0.35,
        "ai_probability": 0.58,
        "edge": 0.23,
        "side": "YES"
      },
      "rationale": "string",
      "signal_score": 9.2,
      "confidence": "HIGH"
    }
  ]
}

Rules:
- return one signal object per market_id provided
- side must be either YES or NO
- ai_probability and market_price must be between 0 and 1
- edge must equal ai_probability - market_price for YES, or market_price - ai_probability for NO? No. Keep edge as absolute directional advantage for the chosen side:
  - if side is YES: edge = ai_probability - market_price
  - if side is NO: edge = market_price - ai_probability
- signal_score must be between 0 and 10
- confidence must be LOW, MEDIUM, or HIGH
- rationale must mention the concrete catalyst, narrative, or evidence driving the signal
- do not output markdown
- do not include any fields outside the schema

Markets:
${JSON.stringify(payload, null, 2)}
`;
}
