import { NextResponse } from "next/server";

type AnalyticsPayload = {
  event?: string;
  sessionId?: string;
  path?: string;
  timestamp?: string;
  meta?: Record<string, string>;
};

export async function POST(request: Request) {
  const body = (await request.json()) as AnalyticsPayload;

  if (!body.event || !body.sessionId) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  console.info("[lunascope-analytics]", {
    event: body.event,
    sessionId: body.sessionId,
    path: body.path ?? "/",
    timestamp: body.timestamp ?? new Date().toISOString(),
    meta: body.meta ?? {},
  });

  return NextResponse.json({ ok: true }, { status: 202 });
}
