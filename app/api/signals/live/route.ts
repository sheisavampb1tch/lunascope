import { NextResponse } from "next/server";
import { getTopSignals } from "@/lib/markets/snapshot-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 12;
  const clampedLimit = Math.min(Math.max(limit, 1), 50);

  try {
    const signals = await getTopSignals(clampedLimit);
    return NextResponse.json(
      {
        meta: {
          generatedAt: new Date().toISOString(),
          signalCount: signals.length,
          source: "polymarket",
          scorer: signals[0]?.scorer ?? "lunascope-default-v1",
        },
        signals,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "s-maxage=20, stale-while-revalidate=60",
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch live signals.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
