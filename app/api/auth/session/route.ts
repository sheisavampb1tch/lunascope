import { NextRequest, NextResponse } from "next/server";
import { buildSession, clearAuthCookies, readSession, setSessionCookie } from "@/lib/wallet/auth";

export async function GET(request: NextRequest) {
  const session = readSession(request);
  if (!session) {
    return NextResponse.json({
      authenticated: false,
      walletAddress: null,
      access: {
        walletAddress: null,
        hasAccess: false,
        tier: null,
        status: null,
        sourceCode: null,
        grantedAt: null,
      },
    });
  }

  const nextSession = await buildSession(session.walletAddress, session.chainId);
  const response = NextResponse.json({
    authenticated: true,
    walletAddress: nextSession.walletAddress,
    access: nextSession.access,
  });
  setSessionCookie(response, nextSession);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearAuthCookies(response);
  return response;
}
