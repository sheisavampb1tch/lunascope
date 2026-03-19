import {
  getInviteCodeRecord,
  getWalletAccessRecord,
  incrementInviteCodeRedemption,
  normalizeInviteCode,
  normalizeWalletAddress,
  upsertWalletAccessRecord,
} from "@/lib/access/repository";
import type { AccessSummary, AccessTier, InviteCodeRecord, WalletAccessRecord } from "@/lib/access/types";

const tierRank: Record<AccessTier, number> = {
  FREE: 0,
  ALPHA: 1,
  PRO: 2,
  ADMIN: 3,
};

function toAccessSummary(access: WalletAccessRecord | null): AccessSummary {
  return {
    walletAddress: access?.walletAddress ?? null,
    hasAccess: access?.status === "ACTIVE",
    tier: access?.tier ?? null,
    status: access?.status ?? null,
    sourceCode: access?.sourceCode ?? null,
    grantedAt: access?.grantedAt ?? null,
  };
}

function assertInviteIsRedeemable(invite: InviteCodeRecord | null): asserts invite is InviteCodeRecord {
  if (!invite) {
    throw new Error("Invite code not recognized.");
  }

  if (invite.status !== "ACTIVE") {
    throw new Error("Invite code is not active.");
  }

  if (invite.expiresAt && new Date(invite.expiresAt).getTime() <= Date.now()) {
    throw new Error("Invite code has expired.");
  }

  if (invite.maxRedemptions !== null && invite.redeemedCount >= invite.maxRedemptions) {
    throw new Error("Invite code redemption limit reached.");
  }
}

export async function getWalletAccessSummary(walletAddress: string) {
  const access = await getWalletAccessRecord(walletAddress);
  return toAccessSummary(access);
}

export async function redeemInviteForWallet(walletAddress: string, inviteCode: string) {
  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const normalizedCode = normalizeInviteCode(inviteCode);
  const invite = await getInviteCodeRecord(normalizedCode);
  assertInviteIsRedeemable(invite);
  const activeInvite = invite;

  const existingAccess = await getWalletAccessRecord(normalizedWallet);
  if (
    existingAccess &&
    existingAccess.status === "ACTIVE" &&
    tierRank[existingAccess.tier] >= tierRank[activeInvite.tier]
  ) {
    return {
      access: toAccessSummary(existingAccess),
      alreadyGranted: true,
    };
  }

  const updatedAccess = await upsertWalletAccessRecord({
    walletAddress: normalizedWallet,
    tier: activeInvite.tier,
    status: "ACTIVE",
    sourceCode: normalizedCode,
  });

  if (!activeInvite.isFallback) {
    await incrementInviteCodeRedemption(normalizedCode, activeInvite.redeemedCount);
  }

  return {
    access: toAccessSummary(updatedAccess),
    alreadyGranted: false,
  };
}

export async function getAccessStatusForWallet(walletAddress: string | null) {
  if (!walletAddress) {
    return toAccessSummary(null);
  }

  return getWalletAccessSummary(walletAddress);
}
