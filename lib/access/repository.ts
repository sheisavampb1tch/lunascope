import type { AccessStatus, AccessTier, InviteCodeRecord, WalletAccessRecord } from "@/lib/access/types";

const FALLBACK_CODES = ["LUNA-ALPHA", "EDGE-01", "POLY-VIP"];

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return { url, serviceRoleKey };
}

function getHeaders(serviceRoleKey: string, extra: HeadersInit = {}) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

async function supabaseFetch(path: string, init: RequestInit) {
  const config = getSupabaseConfig();
  if (!config) return null;

  const response = await fetch(`${config.url}${path}`, init);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${detail}`);
  }

  const text = await response.text();
  if (!text.trim()) {
    return null;
  }

  return JSON.parse(text);
}

export function normalizeInviteCode(code: string) {
  return code.trim().toUpperCase();
}

export function normalizeWalletAddress(address: string) {
  return address.trim().toLowerCase();
}

export function getFallbackInviteCodes() {
  const envCodes = process.env.LUNASCOPE_INVITE_CODES
    ?.split(",")
    .map(normalizeInviteCode)
    .filter(Boolean);

  return envCodes && envCodes.length > 0 ? envCodes : FALLBACK_CODES;
}

export function getFallbackInviteRecord(code: string): InviteCodeRecord | null {
  const normalized = normalizeInviteCode(code);
  if (!getFallbackInviteCodes().includes(normalized)) {
    return null;
  }

  return {
    code: normalized,
    tier: "ALPHA",
    maxRedemptions: null,
    redeemedCount: 0,
    expiresAt: null,
    status: "ACTIVE",
    isFallback: true,
  };
}

type InviteCodeRow = {
  code: string;
  tier: AccessTier;
  max_redemptions: number | null;
  redeemed_count: number | null;
  expires_at: string | null;
  status: AccessStatus;
};

type WalletAccessRow = {
  wallet_address: string;
  tier: AccessTier;
  status: AccessStatus;
  granted_at: string;
  updated_at: string;
  source_code: string | null;
};

function mapInviteCode(row: InviteCodeRow): InviteCodeRecord {
  return {
    code: row.code,
    tier: row.tier,
    maxRedemptions: row.max_redemptions,
    redeemedCount: row.redeemed_count ?? 0,
    expiresAt: row.expires_at,
    status: row.status,
  };
}

function mapWalletAccess(row: WalletAccessRow): WalletAccessRecord {
  return {
    walletAddress: row.wallet_address,
    tier: row.tier,
    status: row.status,
    grantedAt: row.granted_at,
    updatedAt: row.updated_at,
    sourceCode: row.source_code,
  };
}

export async function getInviteCodeRecord(code: string) {
  const config = getSupabaseConfig();
  const normalizedCode = normalizeInviteCode(code);

  if (!config) {
    return getFallbackInviteRecord(normalizedCode);
  }

  const rows = (await supabaseFetch(
    `/rest/v1/invite_codes?select=code,tier,max_redemptions,redeemed_count,expires_at,status&code=eq.${encodeURIComponent(normalizedCode)}&limit=1`,
    {
      method: "GET",
      headers: getHeaders(config.serviceRoleKey, {
        Accept: "application/json",
      }),
    },
  )) as InviteCodeRow[] | null;

  if (rows && rows.length > 0) {
    return mapInviteCode(rows[0]);
  }

  return getFallbackInviteRecord(normalizedCode);
}

export async function getWalletAccessRecord(walletAddress: string) {
  const config = getSupabaseConfig();
  if (!config) {
    return null;
  }

  const normalizedWallet = normalizeWalletAddress(walletAddress);
  const rows = (await supabaseFetch(
    `/rest/v1/wallet_access?select=wallet_address,tier,status,granted_at,updated_at,source_code&wallet_address=eq.${encodeURIComponent(normalizedWallet)}&limit=1`,
    {
      method: "GET",
      headers: getHeaders(config.serviceRoleKey, {
        Accept: "application/json",
      }),
    },
  )) as WalletAccessRow[] | null;

  return rows && rows.length > 0 ? mapWalletAccess(rows[0]) : null;
}

export async function upsertWalletAccessRecord(input: {
  walletAddress: string;
  tier: AccessTier;
  status: AccessStatus;
  sourceCode: string | null;
}) {
  const config = getSupabaseConfig();
  if (!config) {
    const now = new Date().toISOString();
    return {
      walletAddress: normalizeWalletAddress(input.walletAddress),
      tier: input.tier,
      status: input.status,
      grantedAt: now,
      updatedAt: now,
      sourceCode: input.sourceCode,
    } satisfies WalletAccessRecord;
  }

  const now = new Date().toISOString();
  const rows = (await supabaseFetch("/rest/v1/wallet_access?on_conflict=wallet_address", {
    method: "POST",
    headers: getHeaders(config.serviceRoleKey, {
      Prefer: "resolution=merge-duplicates,return=representation",
    }),
    body: JSON.stringify([
      {
        wallet_address: normalizeWalletAddress(input.walletAddress),
        tier: input.tier,
        status: input.status,
        source_code: input.sourceCode,
        granted_at: now,
        updated_at: now,
      },
    ]),
  })) as WalletAccessRow[] | null;

  if (!rows || rows.length === 0) {
    throw new Error("Failed to upsert wallet access record.");
  }

  return mapWalletAccess(rows[0]);
}

export async function incrementInviteCodeRedemption(code: string, currentCount: number) {
  const config = getSupabaseConfig();
  if (!config) return;

  await supabaseFetch(`/rest/v1/invite_codes?code=eq.${encodeURIComponent(normalizeInviteCode(code))}`, {
    method: "PATCH",
    headers: getHeaders(config.serviceRoleKey, {
      Prefer: "return=minimal",
    }),
    body: JSON.stringify({
      redeemed_count: currentCount + 1,
      updated_at: new Date().toISOString(),
    }),
  });
}
