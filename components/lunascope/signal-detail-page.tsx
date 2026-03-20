"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRightIcon, SearchIcon, WalletIcon } from "./icons";
import { convictionFromSignal, formatCategoryTag, formatClock, formatCompactNumber, formatHoursUntil, formatPercent, formatSignedPercent, shortenAddress } from "./format";
import { LineChart } from "./line-chart";
import { SignalCard } from "./signal-card";
import { TopChrome } from "./top-chrome";
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
    question: string;
    category: string | null;
    reasons: string[];
    generatedAt: string;
    features: {
      confidence: number;
      liquidityScore: number;
      activityScore: number;
      momentumScore: number;
      spreadScore: number;
      urgencyScore: number;
    };
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

export function SignalDetailPage({ marketId }: { marketId: string }) {
  const [detail, setDetail] = useState<DetailResponse | null>(null);
  const [tickerSignals, setTickerSignals] = useState<LiveSignal[]>([]);
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

    async function loadData(silent = false) {
      if (silent) {
        setRefreshing(true);
      } else {
        setLoading(true);
        setError(null);
      }

      try {
        const [detailResponse, liveSignalsResponse] = await Promise.all([
          fetch(`/api/signals/${marketId}`, { cache: "no-store" }),
          fetch("/api/signals/live?limit=8", { cache: "no-store" }),
        ]);

        const detailJson = (await detailResponse.json()) as DetailResponse & { error?: string; detail?: string };
        const liveSignalsJson = (await liveSignalsResponse.json()) as { signals?: LiveSignal[] };

        if (!detailResponse.ok) {
          throw new Error(detailJson.detail ?? detailJson.error ?? "Failed to load signal details.");
        }

        if (!active) return;

        setDetail(detailJson);
        setTickerSignals(liveSignalsJson.signals ?? []);
      } catch (nextError) {
        if (active) {
          setError(nextError instanceof Error ? nextError.message : "Failed to load signal details.");
        }
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    }

    void loadData();
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

  const tickerItems = (tickerSignals.length > 0 ? tickerSignals : detail?.relatedSignals ?? []).map((signal) => ({
    id: signal.market_id,
    edgeLabel: formatSignedPercent(signal.analysis.edge, 0),
    label: `${signal.title.slice(0, 45)}${signal.title.length > 45 ? "..." : ""}`,
    positive: signal.analysis.edge >= 0,
  }));

  async function handleConnect() {
    try {
      setAuthError(null);
      await connectInjectedWallet();
    } catch {
      return;
    }
  }

  if (loading) {
    return (
      <main className="cosmic-shell">
        <TopChrome
          links={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Signal", href: "#" },
          ]}
          tickerItems={[{ id: "loading", edgeLabel: "+0%", label: "Loading signal detail...", positive: true }]}
          rightSlot={<div className="luna-button-secondary">Loading</div>}
        />
        <div className="luna-page">
          <div className="luna-container grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="h-60 rounded-[14px] border border-white/[0.07] bg-white/[0.02] animate-pulse" />
              <div className="h-80 rounded-[14px] border border-white/[0.07] bg-white/[0.02] animate-pulse" />
            </div>
            <div className="space-y-4">
              <div className="h-64 rounded-[14px] border border-white/[0.07] bg-white/[0.02] animate-pulse" />
              <div className="h-64 rounded-[14px] border border-white/[0.07] bg-white/[0.02] animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !detail || !published) {
    return (
      <main className="cosmic-shell">
        <TopChrome
          links={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Signal", href: "#" },
          ]}
          tickerItems={[{ id: "error", edgeLabel: "+0%", label: "Signal unavailable", positive: true }]}
          rightSlot={<Link href="/dashboard" className="luna-button">Back to dashboard</Link>}
        />
        <div className="luna-page">
          <div className="luna-container flex min-h-[70vh] items-center justify-center">
            <div className="luna-shell max-w-[640px] p-8 text-center">
              <div className="mb-2 text-[11px] font-semibold tracking-[0.07em] text-[#7EB8FF]">SIGNAL UNAVAILABLE</div>
              <h1 className="luna-heading text-[34px]">This market detail could not be loaded.</h1>
              <p className="mx-auto mt-4 max-w-[520px] text-[14px] leading-[1.7] text-white/35">
                {error ?? "The detail endpoint returned an incomplete signal record."}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link href="/dashboard" className="luna-button">Back to dashboard</Link>
                <button className="luna-button-secondary" onClick={() => window.location.reload()}>Retry</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="cosmic-shell">
      <TopChrome
        links={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Signal", href: "#signal" },
          { label: "Context", href: "#context" },
        ]}
        tickerItems={tickerItems.length > 0 ? tickerItems : [{ id: marketId, edgeLabel: formatSignedPercent(published.analysis.edge, 0), label: published.title, positive: published.analysis.edge >= 0 }]}
        rightSlot={(
          <button className="luna-button" onClick={handleConnect}>
            {loadingSession ? "Checking..." : session?.authenticated ? shortenAddress(session.walletAddress) : "Connect wallet"}
          </button>
        )}
      />

      <div className="luna-page">
        <section id="signal" className="luna-container grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div className="luna-shell p-6">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="rounded-[4px] bg-white/[0.05] px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.08em] text-white/35">
                  {formatCategoryTag(detail.market.category)}
                </span>
                <span className="text-[11px] text-white/25">
                  {formatHoursUntil(detail.market.endDate) ? <span className="data-number">{formatHoursUntil(detail.market.endDate)}h to catalyst</span> : "Catalyst active"}
                </span>
                <span className="text-[10px] font-semibold text-[#22d3ee]">
                  {Math.abs(published.analysis.edge) >= 0.18 ? "● HOT" : "● LIVE"}
                </span>
              </div>

              <h1 className="luna-heading max-w-[760px] text-[clamp(28px,3.2vw,42px)] leading-[1.06]">
                {published.title}
              </h1>
              <p className="mt-4 max-w-[760px] text-[14px] leading-[1.75] text-white/38">
                {published.rationale}
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-4">
                {[
                  ["Market", formatPercent(published.analysis.market_price)],
                  ["AI", formatPercent(published.analysis.ai_probability)],
                  ["Edge", formatSignedPercent(published.analysis.edge, 0)],
                  ["Conviction", `${convictionFromSignal(published.signal_score, published.confidence)}`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[10px] border border-white/[0.07] px-4 py-3">
                    <div className="text-[10px] tracking-[0.06em] text-white/25">{label}</div>
                    <div className={`data-number mt-2 text-[20px] font-semibold ${label === "Edge" ? (published.analysis.edge >= 0 ? "text-[#7EB8FF]" : "text-rose-400") : "text-white/82"}`}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="luna-shell p-6">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">PRICE ACTION</div>
                  <h2 className="luna-heading mt-1 text-[24px]">Live YES contract chart.</h2>
                </div>
                <div className="rounded-[8px] border border-white/[0.07] px-4 py-2 text-[12px] text-white/45">
                  <span className="data-number text-white/80">
                    {yesToken?.price != null ? `YES ${formatPercent(yesToken.price)}` : "Live"}
                  </span>
                </div>
              </div>

              <LineChart
                points={detail.history}
                positive={published.analysis.edge >= 0}
                height={300}
              />

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  ["YES price", yesToken?.price != null ? formatPercent(yesToken.price) : "--"],
                  ["NO price", noToken?.price != null ? formatPercent(noToken.price) : "--"],
                  ["Generated", formatClock(detail.signal.generatedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[10px] border border-white/[0.07] px-4 py-3">
                    <div className="text-[10px] tracking-[0.06em] text-white/25">{label}</div>
                    <div className="data-number mt-2 text-[18px] font-semibold text-white/82">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div id="context" className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
              <div className="luna-shell p-6">
                <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">WHY IT EXISTS</div>
                <h2 className="luna-heading mt-1 text-[24px]">Model rationale layers.</h2>
                <div className="mt-5 space-y-2">
                  {detail.signal.reasons.length > 0 ? (
                    detail.signal.reasons.map((reason, index) => (
                      <div key={reason} className="rounded-[12px] border border-white/[0.07] px-4 py-4">
                        <div className="flex gap-3">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#7EB8FF]/10 text-[11px] text-[#7EB8FF]">
                            0{index + 1}
                          </div>
                          <div className="text-[13px] leading-[1.65] text-white/38">{reason}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-[12px] border border-white/[0.07] px-4 py-4 text-[13px] leading-[1.65] text-white/32">
                      The analyst explanation for this market is currently compressed into the main rationale instead of separate bullet layers.
                    </div>
                  )}
                </div>
              </div>

              <div className="luna-shell p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">SOURCE PACK</div>
                    <h2 className="luna-heading mt-1 text-[24px]">News and catalyst context.</h2>
                  </div>
                  <div className="rounded-[8px] border border-white/[0.07] px-3 py-1.5 text-[11px] text-white/30">
                    {detail.signal.research?.usedGroqWebSearch ? "Web search" : "News ingest"}
                  </div>
                </div>

                <div className="mt-4 text-[12px] leading-[1.6] text-white/28">
                  {detail.signal.research?.query ? `Research query: ${detail.signal.research.query}` : "Catalyst context blends market state, news ingest, and analyst scoring."}
                </div>

                <div className="mt-5 space-y-2">
                  {detail.signal.research?.sources?.length ? (
                    detail.signal.research.sources.slice(0, 5).map((source) => (
                      <a
                        key={`${source.url}-${source.title}`}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="premium-card block rounded-[12px] border border-white/[0.07] px-4 py-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <div className="luna-heading text-[13px] leading-[1.45] text-white/82">{source.title}</div>
                            <div className="mt-2 text-[11px] uppercase tracking-[0.06em] text-white/25">
                              {source.source} • {source.kind}
                            </div>
                          </div>
                          <ArrowUpRightIcon className="mt-0.5 h-4 w-4 shrink-0 text-white/25" />
                        </div>
                      </a>
                    ))
                  ) : (
                    <div className="rounded-[12px] border border-white/[0.07] px-4 py-4 text-[13px] leading-[1.65] text-white/32">
                      External sources were not attached to this refresh cycle.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="luna-shell p-6 xl:sticky xl:top-[96px]">
              <div className="rounded-[12px] border border-[#7EB8FF]/12 bg-[#7EB8FF]/[0.03] p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">EXECUTION CARD</div>
                    <div className="luna-heading mt-2 text-[28px]">{published.analysis.side}</div>
                  </div>
                  <div className={`data-number text-[24px] font-semibold ${published.analysis.edge >= 0 ? "text-[#7EB8FF]" : "text-rose-400"}`}>
                    {formatSignedPercent(published.analysis.edge, 0)}
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    ["Market", formatPercent(published.analysis.market_price)],
                    ["AI", formatPercent(published.analysis.ai_probability)],
                    ["Signal score", published.signal_score.toFixed(1)],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between rounded-[10px] border border-white/[0.07] px-4 py-3 text-[13px]">
                      <span className="text-white/35">{label}</span>
                      <span className="data-number text-white/82">{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.06em] text-white/25">
                    <span>Model confidence</span>
                    <span className="data-number">{Math.round(detail.signal.features.confidence * 100)}%</span>
                  </div>
                  <div className="h-[4px] rounded-[2px] bg-white/[0.06]">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.max(12, Math.round(detail.signal.features.confidence * 100))}%` }}
                      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                      className="confidence-bar h-full rounded-[2px] bg-[linear-gradient(135deg,#7EB8FF,#00C4FF)]"
                    />
                  </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <button className="luna-button" disabled={connecting} onClick={handleConnect}>
                    {connecting
                      ? "Waiting..."
                      : session?.authenticated
                        ? shortenAddress(session.walletAddress)
                        : "Connect wallet"}
                  </button>
                  <Link href="/dashboard" className="luna-button-secondary">
                    Back to desk
                  </Link>
                </div>

                <div className="mt-4 flex items-center gap-3 rounded-[10px] border border-white/[0.07] px-4 py-3 text-[12px] text-white/32">
                  <WalletIcon className="h-4 w-4 text-[#7EB8FF]" />
                  {session?.access?.hasAccess
                    ? `Access active on tier ${session.access.tier}.`
                    : "Connect and redeem invite to unlock operator flow."}
                </div>
                {authError ? <div className="mt-3 text-[12px] text-rose-300">{authError}</div> : null}
              </div>

              <div className="mt-4 space-y-2">
                {[
                  ["Liquidity", formatCompactNumber(detail.market.liquidity)],
                  ["24h volume", formatCompactNumber(detail.market.volume24hr)],
                  ["1w volume", formatCompactNumber(detail.market.volume1wk)],
                  ["Open interest", formatCompactNumber(detail.market.openInterest)],
                  ["Spread", detail.market.spread != null ? formatSignedPercent(detail.market.spread, 1) : "--"],
                  ["Best bid / ask", detail.market.bestBid != null && detail.market.bestAsk != null ? `${formatPercent(detail.market.bestBid)} / ${formatPercent(detail.market.bestAsk)}` : "--"],
                ].map(([label, value]) => (
                  <div key={label} className="flex items-center justify-between rounded-[10px] border border-white/[0.07] px-4 py-3 text-[13px]">
                    <span className="text-white/35">{label}</span>
                    <span className="data-number text-white/82">{value}</span>
                  </div>
                ))}
              </div>

              <button className="luna-button-secondary mt-4 w-full" onClick={() => window.location.reload()}>
                {refreshing ? "Refreshing..." : "Refresh detail"}
              </button>
            </div>

            <div className="luna-shell p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">FEATURE DECOMPOSITION</div>
                  <h2 className="luna-heading mt-1 text-[24px]">Signal internals.</h2>
                </div>
                <div className="flex items-center gap-2 rounded-[10px] border border-white/[0.07] px-3 py-2 text-[12px] text-white/30">
                  <SearchIcon className="h-3.5 w-3.5" />
                  Live
                </div>
              </div>

              <div className="space-y-4">
                {[
                  ["Liquidity", detail.signal.features.liquidityScore],
                  ["Activity", detail.signal.features.activityScore],
                  ["Momentum", detail.signal.features.momentumScore],
                  ["Spread", detail.signal.features.spreadScore],
                  ["Urgency", detail.signal.features.urgencyScore],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="mb-2 flex items-center justify-between text-[13px]">
                      <span className="text-white/35">{label}</span>
                      <span className="data-number text-white/82">{Math.round(Number(value) * 100)}%</span>
                    </div>
                    <div className="h-[4px] rounded-[2px] bg-white/[0.06]">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(10, Math.round(Number(value) * 100))}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="h-full rounded-[2px] bg-[linear-gradient(135deg,#7EB8FF,#00C4FF)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="luna-shell p-6">
              <div className="mb-5">
                <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">RELATED FLOW</div>
                <h2 className="luna-heading mt-1 text-[24px]">What else is moving.</h2>
              </div>

              <div className="space-y-2">
                {detail.relatedSignals.length > 0 ? (
                  detail.relatedSignals.map((signal, index) => (
                    <SignalCard
                      key={signal.market_id}
                      title={signal.title}
                      tag="RELATED"
                      marketProbability={signal.analysis.market_price}
                      aiProbability={signal.analysis.ai_probability}
                      edge={signal.analysis.edge}
                      conviction={convictionFromSignal(signal.signal_score, signal.confidence)}
                      rationale={signal.rationale}
                      hot={Math.abs(signal.analysis.edge) >= 0.18 || signal.confidence === "HIGH"}
                      href={`/signals/${signal.market_id}`}
                      index={index}
                    />
                  ))
                ) : (
                  <div className="rounded-[12px] border border-white/[0.07] px-4 py-4 text-[13px] leading-[1.65] text-white/32">
                    No related signals were returned in this refresh cycle.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
