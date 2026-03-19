import { buildGroqAnalystUserPrompt, LUNASCOPE_ANALYST_SYSTEM_PROMPT } from "@/lib/ai/prompt";
import type { AnalystConfidence, NeuralSignal, PublishedAnalystSignal, ResearchPack } from "@/lib/markets/types";

type GroqResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizeConfidence(value: unknown): AnalystConfidence {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (normalized === "HIGH" || normalized === "MEDIUM" || normalized === "LOW") {
    return normalized;
  }
  return "MEDIUM";
}

function supportsGroqWebSearch(model: string) {
  const normalized = model.toLowerCase();
  return normalized.includes("compound");
}

function fallbackPublishedSignal(signal: NeuralSignal, research?: ResearchPack): PublishedAnalystSignal {
  const side = signal.side;
  const marketPrice = Number(signal.features.marketProbability.toFixed(4));
  const aiProbability = Number(signal.features.modelProbability.toFixed(4));
  const edge = Number(Math.abs(aiProbability - marketPrice).toFixed(4));
  const signalScore = Number(clamp(signal.priority / 10, 0, 10).toFixed(1));
  const confidence: AnalystConfidence =
    signal.features.confidence >= 0.75 ? "HIGH" : signal.features.confidence >= 0.5 ? "MEDIUM" : "LOW";

  const headline =
    research?.sources[0]?.title ??
    "Market microstructure and recent probability drift support a measured directional edge.";

  return {
    market_id: signal.marketId,
    title: signal.question,
    analysis: {
      market_price: marketPrice,
      ai_probability: aiProbability,
      edge,
      side,
    },
    rationale: headline,
    signal_score: signalScore,
    confidence,
  };
}

function parseSignals(content: string | null | undefined) {
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as { signals?: PublishedAnalystSignal[] };
    return Array.isArray(parsed.signals) ? parsed.signals : null;
  } catch {
    return null;
  }
}

function validatePublishedSignal(signal: PublishedAnalystSignal | undefined | null) {
  if (!signal) return null;
  if (!signal.market_id || !signal.title || !signal.rationale) return null;

  const side = signal.analysis?.side === "NO" ? "NO" : "YES";
  const marketPrice = clamp(Number(signal.analysis?.market_price) || 0, 0, 1);
  const aiProbability = clamp(Number(signal.analysis?.ai_probability) || 0, 0, 1);
  const edge = Number(Math.abs(Number(signal.analysis?.edge) || Math.abs(aiProbability - marketPrice)).toFixed(4));

  return {
    market_id: signal.market_id,
    title: signal.title,
    analysis: {
      market_price: Number(marketPrice.toFixed(4)),
      ai_probability: Number(aiProbability.toFixed(4)),
      edge,
      side,
    },
    rationale: signal.rationale.trim(),
    signal_score: Number(clamp(Number(signal.signal_score) || 0, 0, 10).toFixed(1)),
    confidence: normalizeConfidence(signal.confidence),
  } satisfies PublishedAnalystSignal;
}

export async function analyzeSignalsWithGroq(signals: NeuralSignal[], research: ResearchPack[]) {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL;

  if (!apiKey || !model || signals.length === 0) {
    return signals.map((signal) => ({
      ...signal,
      research: research.find((item) => item.query === signal.market.question),
      publishedSignal: fallbackPublishedSignal(signal, research.find((item) => item.query === signal.market.question)),
    }));
  }

  const supportsSearch = supportsGroqWebSearch(model);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_completion_tokens: 1800,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${LUNASCOPE_ANALYST_SYSTEM_PROMPT}

${supportsSearch ? "If your current model supports live web search, check recent reputable news coverage and relevant public X/Twitter discussion before finalizing probabilities." : "Live web search may be unavailable. Use provided market and news context only, and do not claim that you checked X/Twitter directly unless you truly did."}`,
        },
        {
          role: "user",
          content: buildGroqAnalystUserPrompt(signals, research),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq request failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as GroqResponse;
  const content = json.choices?.[0]?.message?.content;
  const parsedSignals = parseSignals(content);

  return signals.map((signal) => {
    const researchPack = research.find((item) => item.query === signal.market.question);
    const fromModel = validatePublishedSignal(parsedSignals?.find((item) => item.market_id === signal.marketId));

    return {
      ...signal,
      research: researchPack
        ? {
            ...researchPack,
            usedGroqWebSearch: supportsSearch,
          }
        : undefined,
      publishedSignal: fromModel ?? fallbackPublishedSignal(signal, researchPack),
    };
  });
}
