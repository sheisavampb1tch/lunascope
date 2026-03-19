import { NextResponse } from "next/server";
import { getCachedMarketSnapshot, refreshAndPersistMarketSnapshot } from "@/lib/markets/snapshot-service";

function getSecret(request: Request) {
  return request.headers.get("x-api-key") ?? request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? null;
}

function getLimit(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit")) || 60;
  return Math.min(Math.max(limit, 1), 150);
}

export async function GET(request: Request) {
  const clampedLimit = getLimit(request);

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

export async function POST(request: Request) {
  const secret = getSecret(request);
  if (!process.env.API_SECRET_KEY || secret !== process.env.API_SECRET_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clampedLimit = getLimit(request);

  try {
    const result = await refreshAndPersistMarketSnapshot(clampedLimit);
    return NextResponse.json(
      {
        meta: result.snapshot.meta,
        persistence: result.persistence,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to refresh and persist snapshot.",
        detail: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 502 },
    );
  }
}
