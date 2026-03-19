export type AccessTier = "FREE" | "ALPHA" | "PRO" | "ADMIN";
export type AccessStatus = "PENDING" | "ACTIVE" | "REVOKED";

export type InviteCodeRecord = {
  code: string;
  tier: AccessTier;
  maxRedemptions: number | null;
  redeemedCount: number;
  expiresAt: string | null;
  status: AccessStatus;
  isFallback?: boolean;
};

export type WalletAccessRecord = {
  walletAddress: string;
  tier: AccessTier;
  status: AccessStatus;
  grantedAt: string;
  updatedAt: string;
  sourceCode: string | null;
};

export type AccessSummary = {
  walletAddress: string | null;
  hasAccess: boolean;
  tier: AccessTier | null;
  status: AccessStatus | null;
  sourceCode: string | null;
  grantedAt: string | null;
};
