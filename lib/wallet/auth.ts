import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";
import { getAddress, isAddress, verifyMessage } from "viem";
import { getAccessStatusForWallet } from "@/lib/access/service";
import type { AccessSummary } from "@/lib/access/types";

const NONCE_COOKIE_NAME = "lunascope_wallet_nonce";
const SESSION_COOKIE_NAME = "lunascope_session";
const NONCE_TTL_MINUTES = 10;
const SESSION_TTL_DAYS = 7;

type NoncePayload = {
  walletAddress: string;
  chainId: number;
  nonce: string;
  message: string;
  issuedAt: string;
  expiresAt: string;
};

export type WalletSession = {
  walletAddress: string;
  chainId: number;
  issuedAt: string;
  expiresAt: string;
  access: AccessSummary;
};

function getAuthSecret() {
  const secret = process.env.AUTH_SESSION_SECRET ?? process.env.API_SECRET_KEY;
  if (!secret) {
    throw new Error("AUTH_SESSION_SECRET or API_SECRET_KEY must be configured.");
  }
  return secret;
}

function encodeBase64Url(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decodeBase64Url(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(data: string) {
  return createHmac("sha256", getAuthSecret()).update(data).digest("base64url");
}

function encodeSignedPayload<T>(payload: T) {
  const encoded = encodeBase64Url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

function decodeSignedPayload<T>(token: string | undefined) {
  if (!token) return null;

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature) return null;

  const expected = sign(encoded);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return null;
  }

  try {
    return JSON.parse(decodeBase64Url(encoded)) as T;
  } catch {
    return null;
  }
}

function cookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.set(NONCE_COOKIE_NAME, "", { ...cookieOptions(0), maxAge: 0 });
  response.cookies.set(SESSION_COOKIE_NAME, "", { ...cookieOptions(0), maxAge: 0 });
}

function buildMessage(input: {
  walletAddress: string;
  origin: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
  expiresAt: string;
}) {
  const domain = new URL(input.origin).host;

  return `${domain} wants you to sign in with your Ethereum account:
${input.walletAddress}

Sign in to LunaScope. This request will not trigger a blockchain transaction.

URI: ${input.origin}
Version: 1
Chain ID: ${input.chainId}
Nonce: ${input.nonce}
Issued At: ${input.issuedAt}
Expiration Time: ${input.expiresAt}`;
}

export function createNonceChallenge(input: { walletAddress: string; chainId?: number; origin: string }) {
  if (!isAddress(input.walletAddress)) {
    throw new Error("Wallet address is invalid.");
  }

  const walletAddress = getAddress(input.walletAddress);
  const chainId = input.chainId && input.chainId > 0 ? input.chainId : 1;
  const nonce = randomBytes(16).toString("hex");
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + NONCE_TTL_MINUTES * 60 * 1000).toISOString();
  const message = buildMessage({
    walletAddress,
    origin: input.origin,
    chainId,
    nonce,
    issuedAt,
    expiresAt,
  });

  const payload: NoncePayload = {
    walletAddress: walletAddress.toLowerCase(),
    chainId,
    nonce,
    message,
    issuedAt,
    expiresAt,
  };

  return {
    nonce,
    message,
    expiresAt,
    token: encodeSignedPayload(payload),
  };
}

function readNoncePayload(request: NextRequest) {
  return decodeSignedPayload<NoncePayload>(request.cookies.get(NONCE_COOKIE_NAME)?.value);
}

export function setNonceCookie(response: NextResponse, token: string) {
  response.cookies.set(NONCE_COOKIE_NAME, token, cookieOptions(NONCE_TTL_MINUTES * 60));
}

export async function verifyWalletSignature(input: {
  request: NextRequest;
  walletAddress: string;
  signature: string;
  message: string;
}) {
  if (!isAddress(input.walletAddress)) {
    throw new Error("Wallet address is invalid.");
  }

  const noncePayload = readNoncePayload(input.request);
  if (!noncePayload) {
    throw new Error("Wallet challenge expired. Request a new nonce.");
  }

  if (new Date(noncePayload.expiresAt).getTime() <= Date.now()) {
    throw new Error("Wallet challenge expired. Request a new nonce.");
  }

  if (noncePayload.walletAddress !== input.walletAddress.trim().toLowerCase()) {
    throw new Error("Wallet address does not match the active challenge.");
  }

  if (noncePayload.message !== input.message) {
    throw new Error("Signed message does not match the active challenge.");
  }

  const valid = await verifyMessage({
    address: getAddress(input.walletAddress),
    message: input.message,
    signature: input.signature as `0x${string}`,
  });

  if (!valid) {
    throw new Error("Wallet signature verification failed.");
  }

  return {
    walletAddress: noncePayload.walletAddress,
    chainId: noncePayload.chainId,
  };
}

export function createSessionToken(session: WalletSession) {
  return encodeSignedPayload(session);
}

export function setSessionCookie(response: NextResponse, session: WalletSession) {
  response.cookies.set(SESSION_COOKIE_NAME, createSessionToken(session), cookieOptions(SESSION_TTL_DAYS * 24 * 60 * 60));
}

export function readSession(request: NextRequest) {
  const session = decodeSignedPayload<WalletSession>(request.cookies.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  return session;
}

export async function buildSession(walletAddress: string, chainId: number) {
  const access = await getAccessStatusForWallet(walletAddress);
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

  return {
    walletAddress,
    chainId,
    issuedAt,
    expiresAt,
    access,
  } satisfies WalletSession;
}
