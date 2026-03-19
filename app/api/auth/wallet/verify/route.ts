import { NextRequest, NextResponse } from "next/server";
import { buildSession, clearAuthCookies, setSessionCookie, verifyWalletSignature } from "@/lib/wallet/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    walletAddress?: string;
    signature?: string;
    message?: string;
  };

  if (!body.walletAddress || !body.signature || !body.message) {
    return NextResponse.json(
      { error: "walletAddress, signature, and message are required." },
      { status: 400 },
    );
  }

  try {
    const verified = await verifyWalletSignature({
      request,
      walletAddress: body.walletAddress,
      signature: body.signature,
      message: body.message,
    });

    const session = await buildSession(verified.walletAddress, verified.chainId);
    const response = NextResponse.json({
      success: true,
      authenticated: true,
      walletAddress: session.walletAddress,
      access: session.access,
    });

    clearAuthCookies(response);
    setSessionCookie(response, session);
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Wallet verification failed." },
      { status: 401 },
    );
  }
}
