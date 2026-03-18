import { NextResponse } from "next/server";
import { labelWallet, verifyInviteCode } from "@/lib/access";

export async function POST(request: Request) {
  const body = (await request.json()) as { wallet?: string; inviteCode?: string };
  const wallet = body.wallet?.trim();
  const inviteCode = body.inviteCode?.trim();

  if (!wallet) {
    return NextResponse.json({ error: "Select a wallet before continuing." }, { status: 400 });
  }

  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required for early access." }, { status: 400 });
  }

  if (!verifyInviteCode(inviteCode)) {
    return NextResponse.json({ error: "Invite code not recognized." }, { status: 403 });
  }

  return NextResponse.json({
    granted: true,
    walletLabel: labelWallet(wallet),
  });
}
