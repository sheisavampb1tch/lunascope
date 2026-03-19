"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRightIcon, ChevronRightIcon, LogoMark, SearchIcon, SparkIcon, WalletIcon } from "./icons";
import { formatClock, formatCompactNumber, formatPercent, formatSignedPercent, shortenAddress } from "./format";
import { LineChart } from "./line-chart";
import { FadeIn } from "./motion";
import { useWalletAuth } from "./use-wallet-auth";

type LiveSignal = {
  market_id: string;
  title: string;
  analysis: {
    market_price: number;
    ai_probability: number;
    edge: number;
    side: "YES" | "NO";
  };
  rationale: string;
  signal_score: number;
  confidence: "LOW" | "MEDIUM" | "HIGH";
};

type DetailResponse = {
  meta: {
    generatedAt: string;
    source: string;
  };
  signal: {
    marketId: string;
    question: string;
    category: string | null;
    reasons: string[];
    generatedAt: string;
    research?: {
      query: string;
      usedGroqWebSearch: boolean;
      sources: Array<{
        title: string;
        url: string;
        source: string;
        publishedAt: string | null;
        kind: "news" | "social";
      }>;
    };
    publishedSignal?: LiveSignal;
    features: {
      marketProbability: number;
      modelProbability: number;
      edge: number;
      confidence: number;
      liquidityScore: number;
      activityScore: number;
      momentumScore: number;
      spreadScore: number;
      urgencyScore: number;
    };
  };
  market: {
    id: string;
    question: string;
    category: string | null;
    endDate: string | null;
    liquidity: number;
    volume24hr: number;
    volume1wk: number;
    openInterest: number;
    bestBid: number | null;
    bestAsk: number | null;
    spread: number | null;
    lastTradePrice: number | null;
    marketProbability: number;
    tokens: Array<{
      id: string;
      side: "YES" | "NO";
      label: string;
      price: number | null;
    }>;
  };
  history: Array<{ timestamp: number; price: number }>;
  relatedSignals: LiveSignal[];
};

function confidenceTone(value: "LOW" | "MEDIUM" | "HIGH" | undefined) {
  if (value === "HIGH") return "text-emerald-200 border-emerald-400/18 bg-emerald-400/10";
  if (value === "MEDIUM") return "text-amber-200 border-amber-300/18 bg-amber-300/10";
  return "text-slate-300 border-white/8 bg-white/[0.03]";
}

function confidenceWidth(value: number | undefined) {
  const safe = Math.max(0.12, Math.min(value ?? 0.5, 1));
  return `${Math.round(safe * 100)}%`;
}

function formatDate(value: string | null) {
  if (!value) return "Open-ended";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SignalDetailPage({ marketId }: { marketId: string }) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const {
    session,
    loadingSession,
    connecting,
    error: authError,
    setError: setAuthError,
    connectInjectedWallet,
  } = useWalletAuth();

  useEffect(() => {
    let active = true;

    async function loadDetail(silent = false) {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const response = await fetch(`/api/signals/${marketId}`, { cache: "no-store" });
        const json = (await response.json()) as DetailResponse & { error?: string; detail?: string };

        if (!response.ok) {
          throw new Error(json.detail ?? json.error ?? "Failed to load signal.");
        }

        if (active) {
          setDetail(json);
        }
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load signal.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadDetail();
    return () => {
      active = false;
    };
  }, [marketId]);

  const published = detail?.signal.publishedSignal;
  const yesToken = useMemo(
    () => detail?.market.tokens.find((token) => token.side === "YES") ?? null,
    [detail],
  );
  const noToken = useMemo(
    () => detail?.market.tokens.find((token) => token.side === "NO") ?? null,
    [detail],
  );

  async function handleConnect() {
    setAuthError(null);
    try {
      await connectInjectedWallet();
    } catch {
      return;
    }
  }

  if (loading) {
    return (
      <main className="cosmic-shell min-h-screen overflow-hidden">
        <div className="luna-grid-mask absolute inset-0" />
        <div className="mx-auto max-w-[1500px] px-4 py-5 md:px-6">
          <div className="grid gap-4 xl:grid-cols-[1.12fr_0.88fr]">
            <div className="space-y-4">
              <div className="luna-shell h-24 animate-pulse rounded-[30px]" />
              <div className="luna-shell h-[420px] animate-pulse rounded-[34px]" />
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="luna-shell h-64 animate-pulse rounded-[30px]" />
                <div className="luna-shell h-64 animate-pulse rounded-[30px]" />
              </div>
            </div>
            <div className="space-y-4">
              <div className="luna-shell h-72 animate-pulse rounded-[34px]" />
              <div className="luna-shell h-56 animate-pulse rounded-[34px]" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !detail || !published) {
    return (
      <main className="cosmic-shell min-h-screen overflow-hidden">
        <div className="luna-grid-mask absolute inset-0" />
        <div className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
          <div className="luna-shell w-full rounded-[34px] p-8 text-center">
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Signal unavailable</p>
            <h1 className="luna-heading mt-4 text-4xl text-white">This market detail could not be loaded.</h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-slate-400">
              {error ?? "The signal is missing or the detail endpoint returned an incomplete record."}
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Link href="/dashboard" className="luna-button px-5 py-3 text-sm">
                Back to dashboard
              </Link>
              <button
                onClick={() => window.location.reload()}
                className="luna-button-secondary px-5 py-3 text-sm"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cosmic-shell min-h-screen overflow-hidden">
      <div className="luna-grid-mask absolute inset-0" />
      <div className="beam absolute left-[8%] top-[120px] h-[420px] w-[120px] rotate-[26deg] rounded-full bg-cyan-300/26 blur-[120px]" />
      <div className="beam absolute right-[10%] top-[140px] h-[520px] w-[140px] -rotate-[20deg] rounded-full bg-indigo-300/30 blur-[130px]" />

      <div className="mx-auto max-w-[1500px] px-4 py-4 md:px-6">
        <header className="luna-shell mb-4 flex flex-wrap items-center justify-between gap-4 rounded-[30px] px-5 py-4">
          <div className="flex min-w-[280px] items-center gap-3">
            <Link href="/dashboard" className="luna-button-secondary px-4 py-2 text-sm">
              <span className="rotate-180">
                <ChevronRightIcon className="h-4 w-4" />
              </span>
              Dashboard
            </Link>
            <div className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
              <SearchIcon className="h-4 w-4 text-slate-500" />
              Signal detail view
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                <LogoMark className="h-4 w-4" />
              </div>
              <div className="hidden sm:block">
                <p className="text-xs uppercase tracking-[0.28em] text-slate-500">Lunascope</p>
                <p className="text-sm text-white">Signal terminal</p>
              </div>
            </Link>
            <button onClick={handleConnect} className="luna-button px-4 py-2 text-sm">
              {loadingSession ? "Checking..." : session?.authenticated ? shortenAddress(session.walletAddress) : "Connect wallet"}
            </button>
          </div>
        </header>

        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <FadeIn className="luna-shell rounded-[34px] p-6 md:p-7">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-4xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-cyan-100">
                      {published.analysis.side} bias
                    </span>
                    <span className={`rounded-full border px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] ${confidenceTone(published.confidence)}`}>
                      {published.confidence} confidence
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.2em] text-slate-400">
                      {detail.market.category ?? "General"}
                    </span>
                  </div>

                  <h1 className="luna-heading mt-5 max-w-4xl text-4xl leading-[1.02] text-white md:text-5xl">
                    {published.title}
                  </h1>
                  <p className="mt-5 max-w-3xl text-base leading-8 text-slate-300">
                    {published.rationale}
                  </p>
                </div>

                <div className="rounded-[26px] border border-white/8 bg-white/[0.03] px-5 py-4 text-right">
                  <p className="text-xs uppercase tracking-[0.26em] text-slate-500">Signal score</p>
                  <p className="data-number mt-3 text-4xl font-semibold text-white">
                    {published.signal_score.toFixed(1)}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    Generated {formatClock(detail.signal.generatedAt)}
                  </p>
                </div>
              </div>

              <div className="mt-8 grid gap-3 md:grid-cols-4">
                {[
                  ["Market price", formatPercent(published.analysis.market_price)],
                  ["AI probability", formatPercent(published.analysis.ai_probability)],
                  ["Edge", formatSignedPercent(published.analysis.edge, 1)],
                  ["Resolution", formatDate(detail.market.endDate)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[24px] border border-white/6 bg-white/[0.03] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
                    <p className="data-number mt-3 text-lg font-medium leading-7 text-white">{value}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.06} className="luna-shell rounded-[34px] p-6 md:p-7">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-400">Price action</p>
                  <h2 className="luna-heading mt-2 text-2xl text-white">Live YES token chart from Polymarket</h2>
                </div>
                <div className="data-number rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-sm text-slate-300">
                  {yesToken?.price !== null && yesToken?.price !== undefined
                    ? `YES ${formatPercent(yesToken.price)}`
                    : "Live contract"}
                </div>
              </div>

              <div className="mt-6">
                <LineChart
                  points={detail.history}
                  positive={published.analysis.edge >= 0}
                  height={320}
                />
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-3">
                {[
                  ["YES price", yesToken?.price != null ? formatPercent(yesToken.price) : "--"],
                  ["NO price", noToken?.price != null ? formatPercent(noToken.price) : "--"],
                  ["Last trade", detail.market.lastTradePrice != null ? formatPercent(detail.market.lastTradePrice) : "--"],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
                    <p className="data-number mt-3 text-lg font-medium text-white">{value}</p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <div className="grid gap-4 lg:grid-cols-[0.94fr_1.06fr]">
              <FadeIn delay={0.1} className="luna-shell rounded-[34px] p-6">
                <p className="text-sm text-slate-400">Why the model likes this trade</p>
                <h2 className="luna-heading mt-2 text-2xl text-white">Rationale layers</h2>
                <div className="mt-6 space-y-3">
                  {detail.signal.reasons.length > 0 ? (
                    detail.signal.reasons.map((reason, index) => (
                      <div key={reason} className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-[11px] text-cyan-100">
                            0{index + 1}
                          </div>
                          <p className="text-sm leading-7 text-slate-300">{reason}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-400">
                      The analyst did not return explicit bullet reasons for this market yet.
                    </div>
                  )}
                </div>
              </FadeIn>

              <FadeIn delay={0.14} className="luna-shell rounded-[34px] p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-slate-400">News and catalyst context</p>
                    <h2 className="luna-heading mt-2 text-2xl text-white">Source pack</h2>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs text-slate-400">
                    {detail.signal.research?.usedGroqWebSearch ? "Web search active" : "News ingest active"}
                  </div>
                </div>

                <p className="mt-4 text-sm leading-7 text-slate-400">
                  {detail.signal.research?.query
                    ? `Research query: ${detail.signal.research.query}`
                    : "Signal context currently blends market state with live news ingest."}
                </p>

                <div className="mt-6 space-y-3">
                  {detail.signal.research?.sources?.length ? (
                    detail.signal.research.sources.slice(0, 5).map((source) => (
                      <a
                        key={`${source.url}-${source.title}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="premium-card block rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="max-w-xl">
                            <p className="text-sm font-medium leading-6 text-white">{source.title}</p>
                            <p className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                              {source.source} • {source.kind}
                            </p>
                          </div>
                          <ArrowUpRightIcon className="mt-1 h-4 w-4 text-slate-500" />
                        </div>
                        <p className="mt-3 text-xs text-slate-500">
                          {source.publishedAt ? formatDate(source.publishedAt) : "Publication time unavailable"}
                        </p>
                      </a>
                    ))
                  ) : (
                    <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4 text-sm leading-7 text-slate-400">
                      External source links were not attached to this signal refresh yet.
                    </div>
                  )}
                </div>
              </FadeIn>
            </div>
          </div>

          <div className="space-y-4">
            <FadeIn delay={0.08} className="luna-shell rounded-[34px] p-6 xl:sticky xl:top-4">
              <div className="rounded-[28px] border border-cyan-300/14 bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.16),transparent_56%),linear-gradient(180deg,rgba(9,14,24,0.98),rgba(6,10,18,0.96))] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.26em] text-slate-500">AI execution card</p>
                    <p className="luna-heading mt-3 text-3xl text-white">{published.analysis.side}</p>
                  </div>
                  <div className={`rounded-full border px-3 py-1 text-xs uppercase tracking-[0.2em] ${confidenceTone(published.confidence)}`}>
                    {published.confidence}
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {[
                    ["Market", formatPercent(published.analysis.market_price)],
                    ["AI", formatPercent(published.analysis.ai_probability)],
                    ["Edge", formatSignedPercent(published.analysis.edge, 1)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-[18px] bg-white/[0.03] px-4 py-3 text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="data-number text-white">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-500">
                    <span>Model confidence</span>
                    <span className="data-number">{Math.round(detail.signal.features.confidence * 100)}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: confidenceWidth(detail.signal.features.confidence) }}
                      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                      className="confidence-bar h-full rounded-full bg-[linear-gradient(90deg,rgba(0,229,255,0.85),rgba(99,102,241,0.82))]"
                    />
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <button onClick={handleConnect} disabled={connecting} className="luna-button justify-center px-4 py-3 text-sm disabled:opacity-70">
                    {connecting
                      ? "Waiting for signature..."
                      : session?.authenticated
                        ? shortenAddress(session.walletAddress)
                        : "Connect wallet"}
                  </button>
                  <Link href="/dashboard" className="luna-button-secondary justify-center px-4 py-3 text-sm">
                    Back to desk
                  </Link>
                </div>

                <div className="mt-4 rounded-[18px] border border-white/6 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                  {session?.access?.hasAccess
                    ? `Access active on tier ${session.access.tier}.`
                    : "Connect and redeem invite to unlock the full premium signal layer."}
                </div>
                {authError ? <p className="mt-3 text-sm text-rose-300">{authError}</p> : null}
              </div>

              <div className="mt-5 space-y-3">
                {[
                  ["Liquidity", formatCompactNumber(detail.market.liquidity)],
                  ["24h volume", formatCompactNumber(detail.market.volume24hr)],
                  ["1w volume", formatCompactNumber(detail.market.volume1wk)],
                  ["Open interest", formatCompactNumber(detail.market.openInterest)],
                  ["Spread", detail.market.spread != null ? formatSignedPercent(detail.market.spread, 2) : "--"],
                  ["Best bid / ask", detail.market.bestBid != null && detail.market.bestAsk != null ? `${formatPercent(detail.market.bestBid)} / ${formatPercent(detail.market.bestAsk)}` : "--"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-[18px] bg-white/[0.03] px-4 py-3 text-sm">
                    <span className="text-slate-400">{label}</span>
                    <span className="data-number text-white">{value}</span>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.12} className="luna-shell rounded-[34px] p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">Feature decomposition</p>
                  <h2 className="luna-heading mt-2 text-2xl text-white">Signal internals</h2>
                </div>
                <button
                  onClick={() => {
                    setRefreshing(true);
                    window.location.reload();
                  }}
                  className="luna-button-secondary px-4 py-2 text-sm"
                >
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              <div className="mt-6 space-y-4">
                {[
                  ["Liquidity", detail.signal.features.liquidityScore],
                  ["Activity", detail.signal.features.activityScore],
                  ["Momentum", detail.signal.features.momentumScore],
                  ["Spread", detail.signal.features.spreadScore],
                  ["Urgency", detail.signal.features.urgencyScore],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="text-slate-400">{label}</span>
                      <span className="data-number text-white">{Math.round(Number(value) * 100)}%</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.05]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(10, Math.round(Number(value) * 100))}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-full bg-[linear-gradient(90deg,rgba(99,102,241,0.82),rgba(0,229,255,0.82))]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.16} className="luna-shell rounded-[34px] p-6">
              <div className="flex items-center gap-3">
                <SparkIcon className="h-5 w-5 text-cyan-200" />
                <div>
                  <p className="text-sm text-slate-400">Related signal flow</p>
                  <h2 className="luna-heading mt-1 text-2xl text-white">What else is moving</h2>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {detail.relatedSignals.length > 0 ? (
                  detail.relatedSignals.map((signal) => (
                    <Link
                      key={signal.market_id}
                      href={`/signals/${signal.market_id}`}
                      className="premium-card block rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="max-w-[18rem]">
                          <p className="luna-heading line-clamp-2 text-sm leading-6 text-white">{signal.title}</p>
                          <p className="mt-2 text-xs text-slate-500">
                            {signal.analysis.side} • {signal.confidence}
                          </p>
                        </div>
                        <span className="data-number text-sm text-cyan-200">{signal.signal_score.toFixed(1)}</span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
                    No related signals were returned in this refresh cycle.
                  </div>
                )}
              </div>
            </FadeIn>
          </div>
        </div>
      </div>
    </main>
  );
}
