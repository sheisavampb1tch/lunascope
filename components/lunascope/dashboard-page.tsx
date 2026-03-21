"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BellIcon, SearchIcon, WalletIcon } from "./icons";
import { convictionFromSignal, formatCategoryTag, formatCompactNumber, formatHoursUntil, formatPercent, formatSignedPercent, shortenAddress } from "./format";
import { getPolymarketMarketUrl } from "./polymarket-links";
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

type SnapshotMarket = {
  id: string;
  slug: string | null;
  question: string;
  category: string | null;
  endDate: string | null;
  liquidity: number;
  volume24hr: number;
  marketProbability: number;
  openInterest: number;
};

type SnapshotSignal = {
  marketId: string;
  question: string;
  publishedSignal?: LiveSignal;
};

type SnapshotResponse = {
  meta: {
    fetchedAt: string;
    marketCount: number;
  };
  markets: SnapshotMarket[];
  signals: SnapshotSignal[];
};

type Tab = "signals" | "markets";

export function DashboardPage() {
  const [signals, setSignals] = useState<LiveSignal[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("signals");
  const deferredSearch = useDeferredValue(search);
  const {
    session,
    loadingSession,
    connecting,
    redeeming,
    error,
    setError,
    connectInjectedWallet,
    redeemInvite,
    logout,
  } = useWalletAuth();

  async function refreshData(silent = false) {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const [signalsResponse, snapshotResponse] = await Promise.all([
        fetch("/api/signals/live?limit=12", { cache: "no-store" }),
        fetch("/api/markets/snapshot?limit=60", { cache: "no-store" }),
      ]);
      const signalsJson = (await signalsResponse.json()) as { signals?: LiveSignal[] };
      const snapshotJson = (await snapshotResponse.json()) as SnapshotResponse;
      setSignals(signalsJson.signals ?? []);
      setSnapshot(snapshotJson);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void refreshData();
    const interval = setInterval(() => void refreshData(true), 60_000);
    return () => clearInterval(interval);
  }, []);

  const marketMap = useMemo(() => {
    const map = new Map<string, SnapshotMarket>();
    for (const market of snapshot?.markets ?? []) map.set(market.id, market);
    return map;
  }, [snapshot]);

  const filteredSignals = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return signals;
    return signals.filter((s) => s.title.toLowerCase().includes(query));
  }, [signals, deferredSearch]);

  const topSignal = filteredSignals[0] ?? signals[0];
  const topSignalMarket = topSignal ? marketMap.get(topSignal.market_id) : null;
  const averageEdge = signals.length
    ? signals.reduce((sum, s) => sum + Math.abs(s.analysis.edge), 0) / signals.length
    : 0;

  const tickerItems = signals.length > 0
    ? signals.map((s) => ({
        id: s.market_id,
        edgeLabel: formatSignedPercent(s.analysis.edge, 0),
        label: `${s.title.slice(0, 45)}${s.title.length > 45 ? "..." : ""}`,
        positive: s.analysis.edge >= 0,
      }))
    : [{ id: "loading", edgeLabel: "+0%", label: "Loading feed...", positive: true }];

  async function handleConnect() {
    try { setError(null); await connectInjectedWallet(); } catch { return; }
  }
  async function handleRedeem() {
    try { await redeemInvite(inviteCode); setInviteCode(""); } catch { return; }
  }

  return (
    <main className="cosmic-shell">
      <TopChrome
        links={[
          { label: "Overview", href: "#overview" },
          { label: "Signals", href: "#signals" },
          { label: "Markets", href: "#markets" },
        ]}
        tickerItems={tickerItems}
        rightSlot={
          <button className="luna-button" onClick={session?.authenticated ? logout : handleConnect}>
            {loadingSession ? "Checking..." : session?.authenticated ? shortenAddress(session.walletAddress) : "Wallet (optional)"}
          </button>
        }
      />

      <div className="luna-page">
        <div className="luna-container space-y-6 py-8">

          {/* ── STATS ROW ── */}
          <section id="overview" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Live signals", value: String(signals.length), note: "AI-screened" },
              { label: "Avg edge", value: formatSignedPercent(averageEdge, 0), note: "vs market price" },
              { label: "Markets tracked", value: String(snapshot?.meta.marketCount ?? 0), note: "binary contracts" },
              { label: "Last refresh", value: snapshot?.meta.fetchedAt ? new Date(snapshot.meta.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "—", note: "auto every 60s" },
            ].map(({ label, value, note }) => (
              <div key={label} className="luna-shell p-5">
                <div className="text-[11px] font-semibold tracking-[0.07em] text-white/30">{label}</div>
                <div className="data-number mt-3 text-[30px] font-semibold text-white/90 leading-none">{value}</div>
                <div className="mt-2 text-[12px] text-white/25">{note}</div>
              </div>
            ))}
          </section>

          {/* ── FEATURED SIGNAL ── */}
          {topSignal && (
            <section className="luna-shell p-6">
              <div className="mb-1 text-[11px] font-semibold tracking-[0.07em] text-[#7EB8FF]">FEATURED SIGNAL</div>
              <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
                <div>
                  <h2 className="luna-heading mt-2 text-[clamp(22px,2.5vw,32px)] leading-[1.12] text-white/92">
                    {topSignal.title}
                  </h2>
                  <p className="mt-3 text-[13px] leading-[1.7] text-white/40 max-w-[600px]">
                    {topSignal.rationale}
                  </p>
                  <div className="mt-5 flex flex-wrap gap-3">
                    <a href={getPolymarketMarketUrl(topSignalMarket?.slug)} target="_blank" rel="noreferrer" className="luna-button">
                      Trade on Polymarket →
                    </a>
                    <Link href={`/signals/${topSignal.market_id}`} className="luna-button-secondary">
                      View details
                    </Link>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 lg:grid-cols-1 lg:grid-rows-3 self-start">
                  {[
                    ["Market", formatPercent(topSignal.analysis.market_price)],
                    ["AI Model", formatPercent(topSignal.analysis.ai_probability)],
                    ["Edge", formatSignedPercent(topSignal.analysis.edge, 0)],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-[10px] border border-white/[0.07] px-4 py-3">
                      <div className="text-[10px] tracking-[0.06em] text-white/25">{label}</div>
                      <div className={`data-number mt-2 text-[22px] font-semibold ${label === "Edge" ? "text-[#7EB8FF]" : "text-white/80"}`}>
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── TABS ── */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-[10px] border border-white/[0.07] p-1">
              {(["signals", "markets"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`rounded-[8px] px-5 py-2 text-[13px] font-medium capitalize transition-all ${
                    activeTab === tab
                      ? "bg-[#7EB8FF]/10 text-[#7EB8FF] border border-[#7EB8FF]/20"
                      : "text-white/40 hover:text-white/70"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-[10px] border border-white/[0.07] px-4 py-2.5 text-[13px]">
                <SearchIcon className="h-4 w-4 text-white/20" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-40 bg-transparent text-[13px] text-white/80 outline-none placeholder:text-white/20"
                />
              </div>
              <button
                className="luna-button-secondary px-4 py-2.5 text-[13px]"
                onClick={() => void refreshData(true)}
              >
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </div>

          {/* ── SIGNALS GRID ── */}
          {activeTab === "signals" && (
            <section id="signals">
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="h-[220px] rounded-[14px] border border-white/[0.07] bg-white/[0.02] animate-pulse" />
                    ))
                  : filteredSignals.map((signal, index) => {
                      const market = marketMap.get(signal.market_id);
                      const isPos = signal.analysis.edge >= 0;
                      return (
                        <div
                          key={signal.market_id}
                          className="luna-shell p-5 flex flex-col gap-3 hover:border-[#7EB8FF]/20 transition-colors cursor-default"
                          style={{ animation: `fadeUp 0.3s ease ${index * 0.04}s both` }}
                        >
                          {/* card header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex flex-wrap gap-1.5">
                              <span className="rounded-[5px] bg-white/[0.05] px-2 py-0.5 text-[10px] font-semibold tracking-[0.07em] text-white/35">
                                {formatCategoryTag(market?.category)}
                              </span>
                              {(Math.abs(signal.analysis.edge) >= 0.18 || signal.confidence === "HIGH") && (
                                <span className="rounded-[5px] bg-[#7EB8FF]/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.07em] text-[#7EB8FF]">
                                  HOT
                                </span>
                              )}
                            </div>
                            <div className={`data-number text-[20px] font-bold leading-none ${isPos ? "text-[#7EB8FF]" : "text-rose-400"}`}>
                              {formatSignedPercent(signal.analysis.edge, 0)}
                            </div>
                          </div>

                          {/* title */}
                          <div className="luna-heading text-[14px] leading-[1.45] text-white/88 flex-1">
                            {signal.title}
                          </div>

                          {/* rationale */}
                          <p className="text-[12px] leading-[1.6] text-white/35 line-clamp-2">
                            {signal.rationale}
                          </p>

                          {/* bar */}
                          <div>
                            <div className="relative h-[3px] rounded-full bg-white/[0.06]">
                              <div
                                className="absolute left-0 top-0 h-full rounded-full bg-white/20"
                                style={{ width: `${signal.analysis.market_price * 100}%` }}
                              />
                              <div
                                className={`absolute left-0 top-0 h-full rounded-full opacity-70 ${isPos ? "bg-[#7EB8FF]" : "bg-rose-400"}`}
                                style={{ width: `${signal.analysis.ai_probability * 100}%` }}
                              />
                            </div>
                            <div className="mt-1.5 flex justify-between text-[10px] text-white/30">
                              <span>Market {formatPercent(signal.analysis.market_price)}</span>
                              <span className={isPos ? "text-[#7EB8FF]" : "text-rose-400"}>
                                AI {formatPercent(signal.analysis.ai_probability)}
                              </span>
                            </div>
                          </div>

                          {/* footer */}
                          <div className="flex items-center justify-between pt-1 border-t border-white/[0.05]">
                            <div className="flex items-center gap-3 text-[11px] text-white/25">
                              <span>{formatHoursUntil(market?.endDate)}</span>
                              <span className="data-number">CONV {convictionFromSignal(signal.signal_score, signal.confidence)}</span>
                            </div>
                            <a
                              href={getPolymarketMarketUrl(market?.slug)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] font-semibold text-[#7EB8FF] hover:opacity-70 transition-opacity"
                            >
                              Trade →
                            </a>
                          </div>
                        </div>
                      );
                    })}
              </div>
            </section>
          )}

          {/* ── MARKETS TAB ── */}
          {activeTab === "markets" && (
            <section id="markets" className="space-y-2">
              {(snapshot?.markets ?? [])
                .slice()
                .sort((a, b) => b.volume24hr - a.volume24hr)
                .map((market) => (
                  <div key={market.id} className="luna-shell px-5 py-4 flex items-center justify-between gap-4 hover:border-[#7EB8FF]/15 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="luna-heading text-[14px] leading-[1.45] text-white/85 truncate">{market.question}</div>
                      <div className="mt-1 text-[12px] text-white/25">
                        {market.category ?? "General"} · <span className="data-number">{formatCompactNumber(market.openInterest)}</span> OI
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <div className="data-number text-[18px] font-semibold text-white/85">{formatPercent(market.marketProbability)}</div>
                      <div className="mt-1 text-[11px] text-white/25">
                        <span className="data-number">{formatCompactNumber(market.volume24hr)}</span> 24h vol
                      </div>
                    </div>
                  </div>
                ))}
            </section>
          )}

          {/* ── WALLET PANEL ── */}
          <section className="luna-shell p-5 max-w-[480px]">
            <div className="mb-4 flex items-center gap-3">
              <WalletIcon className="h-4 w-4 text-[#7EB8FF]" />
              <div>
                <div className="text-[13px] font-medium text-white/85">
                  {session?.authenticated ? shortenAddress(session.walletAddress) : "Guest session"}
                </div>
                <div className="text-[12px] text-white/30">
                  {session?.access?.hasAccess
                    ? `Tier ${session.access.tier} active`
                    : "Signals open. Wallet optional for future features."}
                </div>
              </div>
            </div>

            {!session?.access?.hasAccess ? (
              <div className="space-y-3">
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="LUNA-ALPHA"
                  className="w-full rounded-[8px] border border-[#7EB8FF]/12 bg-white/[0.02] px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/20 focus:border-[#7EB8FF]/35"
                />
                <div className="flex gap-2">
                  <button className="luna-button flex-1" disabled={connecting} onClick={handleConnect}>
                    {connecting ? "Signing..." : "Connect wallet"}
                  </button>
                  <button className="luna-button-secondary flex-1" disabled={!session?.authenticated || redeeming} onClick={handleRedeem}>
                    {redeeming ? "Applying..." : "Redeem invite"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-[10px] border border-[#7EB8FF]/12 bg-[#7EB8FF]/[0.03] px-4 py-3 text-[12px] text-white/55">
                Wallet layer active on this session.
              </div>
            )}
            {error && <div className="mt-3 text-[12px] text-rose-300">{error}</div>}
          </section>

        </div>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </main>
  );
}