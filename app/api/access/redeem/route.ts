import { NextRequest, NextResponse } from "next/server";
import { redeemInviteForWallet } from "@/lib/access/service";
import { buildSession, readSession, setSessionCookie } from "@/lib/wallet/auth";

export async function POST(request: NextRequest) {
  const session = readSession(request);
  if (!session) {
    return NextResponse.json({ error: "Wallet session required." }, { status: 401 });
  }

  const body = (await request.json()) as { inviteCode?: string };
  const inviteCode = body.inviteCode?.trim();

  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  try {
    const result = await redeemInviteForWallet(session.walletAddress, inviteCode);
    const nextSession = await buildSession(session.walletAddress, session.chainId);
    const response = NextResponse.json({
      success: true,
      access: result.access,
      alreadyGranted: result.alreadyGranted,
    });
    setSessionCookie(response, nextSession);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invite redemption failed." },
      { status: 403 },
    );
  }
}
