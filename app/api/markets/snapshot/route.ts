import { NextResponse } from "next/server";
import { getCachedMarketSnapshot } from "@/lib/markets/snapshot-service";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 60;
  const clampedLimit = Math.min(Math.max(limit, 1), 150);

  try {
    const snapshot = await getCachedMarketSnapshot(clampedLimit);
    return NextResponse.json(snapshot, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=20, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to fetch Polymarket snapshot.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
