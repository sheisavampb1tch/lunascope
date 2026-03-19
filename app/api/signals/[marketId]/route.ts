import { NextResponse } from "next/server";
import { getPriceHistory } from "@/lib/markets/polymarket-client";
import { getCachedMarketSnapshot } from "@/lib/markets/snapshot-service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ marketId: string }> },
) {
  const { marketId } = await context.params;

  try {
    const snapshot = await getCachedMarketSnapshot(80);
    const signal = snapshot.signals.find((item) => item.marketId === marketId);
    const market = snapshot.markets.find((item) => item.id === marketId);

    if (!signal || !market) {
      return NextResponse.json({ error: "Signal not found." }, { status: 404 });
    }

    const yesToken = market.tokens.find((token) => token.side === "YES");
    const history = yesToken?.id ? await getPriceHistory(yesToken.id, 120, "1d") : [];

    return NextResponse.json(
      {
        meta: {
          generatedAt: new Date().toISOString(),
          source: "polymarket",
        },
        signal,
        market,
        history,
        relatedSignals: snapshot.signals
          .filter((item) => item.marketId !== marketId)
          .slice(0, 4)
          .map((item) => item.publishedSignal ?? null)
          .filter(Boolean),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to load signal details.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
