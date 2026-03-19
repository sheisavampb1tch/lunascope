import { NextRequest, NextResponse } from "next/server";
import { createNonceChallenge, setNonceCookie } from "@/lib/wallet/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { walletAddress?: string; chainId?: number };
  const walletAddress = body.walletAddress?.trim();

  if (!walletAddress) {
    return NextResponse.json({ error: "Wallet address is required." }, { status: 400 });
  }

  try {
    const origin = new URL(request.url).origin;
    const challenge = createNonceChallenge({
      walletAddress,
      chainId: body.chainId,
      origin,
    });

    const response = NextResponse.json({
      walletAddress,
      nonce: challenge.nonce,
      message: challenge.message,
      expiresAt: challenge.expiresAt,
    });

    setNonceCookie(response, challenge.token);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create wallet challenge." },
      { status: 400 },
    );
  }
}
