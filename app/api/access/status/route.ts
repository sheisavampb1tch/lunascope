import { NextRequest, NextResponse } from "next/server";
import { getAccessStatusForWallet } from "@/lib/access/service";
import { readSession } from "@/lib/wallet/auth";

export async function GET(request: NextRequest) {
  const session = readSession(request);
  const access = await getAccessStatusForWallet(session?.walletAddress ?? null);

  return NextResponse.json({
    authenticated: Boolean(session),
    walletAddress: session?.walletAddress ?? null,
    access,
  });
}
