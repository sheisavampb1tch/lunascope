"use client";

import { useEffect, useState } from "react";

type AccessSummary = {
  walletAddress: string | null;
  hasAccess: boolean;
  tier: string | null;
  status: string | null;
  sourceCode: string | null;
  grantedAt: string | null;
};

type SessionResponse = {
  authenticated: boolean;
  walletAddress: string | null;
  access: AccessSummary;
};

declare global {
  interface Window {
    ethereum?: {
      request(args: { method: string; params?: unknown[] }): Promise<unknown>;
    };
  }
}

export function useWalletAuth() {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refreshSession() {
    setLoadingSession(true);
    try {
      const response = await fetch("/api/auth/session", { credentials: "include" });
      const json = (await response.json()) as SessionResponse;
      setSession(json);
    } finally {
      setLoadingSession(false);
    }
  }

  useEffect(() => {
    void refreshSession();
  }, []);

  async function connectInjectedWallet() {
    if (!window.ethereum) {
      throw new Error("Injected wallet not found. Use Rabby or MetaMask in this browser.");
    }

    setConnecting(true);
    setError(null);

    try {
      const accounts = (await window.ethereum.request({
        method: "eth_requestAccounts",
      })) as string[];

      const walletAddress = accounts?.[0];
      if (!walletAddress) {
        throw new Error("Wallet connection was cancelled.");
      }

      const chainIdHex = (await window.ethereum.request({
        method: "eth_chainId",
      })) as string;

      const chainId = Number.parseInt(chainIdHex, 16) || 1;

      const nonceResponse = await fetch("/api/auth/wallet/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ walletAddress, chainId }),
      });

      const nonceJson = (await nonceResponse.json()) as { message?: string; error?: string };
      if (!nonceResponse.ok || !nonceJson.message) {
        throw new Error(nonceJson.error ?? "Failed to create wallet challenge.");
      }

      const signature = (await window.ethereum.request({
        method: "personal_sign",
        params: [nonceJson.message, walletAddress],
      })) as string;

      const verifyResponse = await fetch("/api/auth/wallet/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          walletAddress,
          message: nonceJson.message,
          signature,
        }),
      });

      const verifyJson = (await verifyResponse.json()) as SessionResponse & { error?: string };
      if (!verifyResponse.ok) {
        throw new Error(verifyJson.error ?? "Wallet verification failed.");
      }

      setSession(verifyJson);
      return verifyJson;
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Wallet connection failed.";
      setError(message);
      throw nextError;
    } finally {
      setConnecting(false);
    }
  }

  async function redeemInvite(inviteCode: string) {
    setRedeeming(true);
    setError(null);

    try {
      const response = await fetch("/api/access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ inviteCode }),
      });

      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Invite redemption failed.");
      }

      await refreshSession();
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Invite redemption failed.";
      setError(message);
      throw nextError;
    } finally {
      setRedeeming(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });

    setSession({
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

  return {
    session,
    loadingSession,
    connecting,
    redeeming,
    error,
    setError,
    connectInjectedWallet,
    redeemInvite,
    refreshSession,
    logout,
  };
}
