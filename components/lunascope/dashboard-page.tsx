"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BellIcon,
  ChevronRightIcon,
  DashboardIcon,
  LockIcon,
  LogoMark,
  MarketIcon,
  PulseIcon,
  SearchIcon,
  SparkIcon,
  WalletIcon,
} from "./icons";
import { formatCompactNumber, formatPercent, formatSignedPercent, shortenAddress } from "./format";
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

type SnapshotMarket = {
  id: string;
  question: string;
  category: string | null;
  liquidity: number;
  volume24hr: number;
  marketProbability: number;
  spread: number | null;
  openInterest: number;
};

type SnapshotSignal = {
  marketId: string;
  question: string;
  category: string | null;
  generatedAt: string;
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

const sidebarGroups = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: DashboardIcon, active: true },
      { label: "Signals", icon: PulseIcon },
      { label: "Markets", icon: MarketIcon },
    ],
  },
  {
    title: "Access",
    items: [
      { label: "Wallet", icon: WalletIcon },
      { label: "Invites", icon: LockIcon },
      { label: "Analyst", icon: SparkIcon },
    ],
  },
];

export function DashboardPage() {
  const [signals, setSignals] = useState<LiveSignal[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [inviteCode, setInviteCode] = useState("");
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
    const interval = setInterval(() => {
      void refreshData(true);
    }, 60_000);

    return () => clearInterval(interval);
  }, []);

  const marketById = useMemo(() => {
    const map = new Map<string, SnapshotMarket>();
    for (const market of snapshot?.markets ?? []) {
      map.set(market.id, market);
    }
    return map;
  }, [snapshot]);

  const filteredSignals = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    if (!query) return signals;
    return signals.filter((signal) => signal.title.toLowerCase().includes(query));
  }, [signals, deferredSearch]);

  const topSignal = filteredSignals[0] ?? signals[0];
  const avgEdge = signals.length > 0 ? signals.reduce((sum, signal) => sum + Math.abs(signal.analysis.edge), 0) / signals.length : 0;
  const averageSignalScore = signals.length > 0 ? signals.reduce((sum, signal) => sum + signal.signal_score, 0) / signals.length : 0;
  const categoryCount = new Set((snapshot?.markets ?? []).map((market) => market.category).filter(Boolean)).size;

  async function handleConnect() {
    try {
      await connectInjectedWallet();
    } catch {
      return;
    }
  }

  async function handleRedeem() {
    try {
      await redeemInvite(inviteCode);
      setInviteCode("");
    } catch {
      return;
    }
  }

  return (
    <main className="cosmic-shell min-h-screen overflow-hidden">
      <div className="luna-grid-mask absolute inset-0" />
      <div className="absolute inset-x-0 top-0 h-[340px] bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.22),transparent_46%)]" />

      <div className="mx-auto max-w-[1500px] px-4 py-4 md:px-6">
        <div className="grid gap-4 xl:grid-cols-[290px_minmax(0,1fr)]">
          <aside className="luna-shell sticky top-4 hidden h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[34px] xl:flex">
            <div className="border-b border-white/6 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <LogoMark className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">Lunascope</p>
                  <p className="text-sm text-slate-500">AI Edge Terminal</p>
                </div>
              </div>
              <div className="mt-10">
                <p className="text-[2.45rem] font-semibold leading-[1] tracking-[-0.06em] text-white">
                  {session?.authenticated ? `Welcome back` : "Live signal desk"}
                </p>
                <p className="mt-4 text-sm leading-7 text-slate-400">
                  {session?.authenticated
                    ? `Session active for ${shortenAddress(session.walletAddress)}`
                    : "Binary event intelligence in one quieter, sharper command surface."}
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              {sidebarGroups.map((group) => (
                <div key={group.title} className="mb-8">
                  <p className="px-3 text-xs uppercase tracking-[0.26em] text-slate-500">{group.title}</p>
                  <div className="mt-3 space-y-2">
                    {group.items.map((item) => (
                      <button
                        key={item.label}
                        className={`flex w-full items-center justify-between rounded-[22px] px-4 py-3 text-left text-sm transition-all duration-300 ${
                          item.active
                            ? "border border-white/10 bg-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                            : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-4.5 w-4.5" />
                          {item.label}
                        </span>
                        {item.active ? <span className="h-2 w-2 rounded-full bg-cyan-300" /> : null}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-white/6 p-5">
              <div className="rounded-[26px] border border-white/8 bg-[linear-gradient(180deg,rgba(99,102,241,0.18),rgba(6,11,21,0.2))] p-5">
                <p className="text-sm font-medium text-white">Premium access</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Unlock faster alerts, richer analyst flow, and wallet-gated operator tools.
                </p>
                <button onClick={session?.authenticated ? logout : handleConnect} className="luna-button mt-5 w-full justify-center px-4 py-3 text-sm">
                  {session?.authenticated ? "Logout" : "Connect wallet"}
                </button>
              </div>
            </div>
          </aside>

          <div className="space-y-4">
            <header className="luna-shell flex flex-wrap items-center justify-between gap-4 rounded-[30px] px-5 py-4">
              <div className="flex min-w-[260px] flex-1 items-center gap-3 rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                <SearchIcon className="h-4 w-4 text-slate-500" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search signals and markets..."
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => void refreshData(true)} className="luna-button-secondary px-4 py-2 text-sm">
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
                <button className="flex h-11 w-11 items-center justify-center rounded-full border border-white/8 bg-white/[0.03] text-slate-300">
                  <BellIcon className="h-4 w-4" />
                </button>
                <button onClick={session?.authenticated ? logout : handleConnect} className="luna-button px-4 py-2 text-sm">
                  {loadingSession ? "Checking..." : session?.authenticated ? shortenAddress(session.walletAddress) : "Connect wallet"}
                </button>
              </div>
            </header>

            <div className="grid gap-4 lg:grid-cols-[1.18fr_0.82fr]">
              <FadeIn className="luna-shell rounded-[34px] p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-cyan-200/80">AI Signal Radar</p>
                    <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-5xl">
                      Live operator dashboard for binary market edge.
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-8 text-slate-300">
                      Real signals now flow from the backend into the UI. This terminal is no longer placeholder shell work; it is a real-time skin over LunaScope&apos;s live market engine.
                    </p>
                  </div>
                  <div className="rounded-full border border-emerald-400/18 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
                    {snapshot?.meta?.fetchedAt ? `Updated ${new Date(snapshot.meta.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : "Live"}
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="rounded-[30px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_52%),linear-gradient(180deg,rgba(10,15,27,0.98),rgba(7,10,19,0.96))] p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-slate-400">Top live signal</p>
                        <h2 className="mt-3 max-w-2xl text-2xl font-medium leading-tight text-white">
                          {topSignal?.title ?? "Loading live AI analyst signal"}
                        </h2>
                      </div>
                      <div className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                        {topSignal ? `${topSignal.signal_score.toFixed(1)}/10` : "Live"}
                      </div>
                    </div>

                    <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">
                      {topSignal?.rationale ?? "The top analyst rationale appears here as soon as the backend returns live signals."}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <Link
                        href={topSignal ? `/signals/${topSignal.market_id}` : "/dashboard"}
                        className="luna-button inline-flex items-center gap-2 px-5 py-3 text-sm"
                      >
                        Open signal
                        <ChevronRightIcon className="h-4 w-4" />
                      </Link>
                      <div className="rounded-full border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
                        {topSignal ? `${topSignal.analysis.side} bias at ${formatPercent(topSignal.analysis.ai_probability)}` : "Waiting for signal"}
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    {[
                      ["Live signals", String(signals.length), "AI-screened ideas"],
                      ["Average edge", formatSignedPercent(avgEdge, 1), "vs market price"],
                      ["Tracked markets", String(snapshot?.meta.marketCount ?? 0), "binary contracts only"],
                      ["Categories", String(categoryCount), "macro, crypto, politics"],
                    ].map(([label, value, note]) => (
                      <motion.div key={label} whileHover={{ y: -4 }} className="premium-card rounded-[26px] border border-white/6 bg-white/[0.03] p-5">
                        <p className="text-sm text-slate-400">{label}</p>
                        <p className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-white">{value}</p>
                        <p className="mt-2 text-sm text-slate-500">{note}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </FadeIn>

              <FadeIn delay={0.08} className="space-y-4">
                <div className="luna-shell rounded-[30px] p-5">
                  <div className="flex items-center gap-3">
                    <WalletIcon className="h-5 w-5 text-cyan-200" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {session?.authenticated ? shortenAddress(session.walletAddress) : "Guest session"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {session?.access?.hasAccess ? `Tier ${session.access.tier} active` : "Connect wallet and redeem invite to unlock gated modules."}
                      </p>
                    </div>
                  </div>

                  {!session?.access?.hasAccess ? (
                    <div className="mt-5 space-y-3">
                      <input
                        value={inviteCode}
                        onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                        placeholder="LUNA-ALPHA"
                        className="w-full rounded-[18px] border border-white/8 bg-slate-950/60 px-4 py-3 text-sm tracking-[0.22em] text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/28"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleConnect} disabled={connecting} className="luna-button flex-1 justify-center px-4 py-3 text-sm disabled:opacity-70">
                          {connecting ? "Signing..." : "Connect"}
                        </button>
                        <button onClick={handleRedeem} disabled={!session?.authenticated || redeeming} className="luna-button-secondary flex-1 justify-center px-4 py-3 text-sm disabled:opacity-60">
                          {redeeming ? "Applying..." : "Redeem"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-5 rounded-[20px] border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                      Premium access is live on this wallet.
                    </div>
                  )}

                  {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
                </div>

                <div className="luna-shell rounded-[30px] p-5">
                  <p className="text-sm text-slate-400">Session intelligence</p>
                  <div className="mt-5 space-y-3">
                    {[
                      ["Average signal score", averageSignalScore ? averageSignalScore.toFixed(1) : "--"],
                      ["Top confidence", topSignal?.confidence ?? "--"],
                      ["Lead side", topSignal?.analysis.side ?? "--"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between rounded-[18px] bg-white/[0.03] px-4 py-3 text-sm">
                        <span className="text-slate-400">{label}</span>
                        <span className="text-white">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </FadeIn>
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.12fr_0.88fr]">
              <FadeIn className="luna-shell rounded-[34px] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-400">Live analyst signals</p>
                    <h2 className="mt-2 text-2xl font-medium text-white">What LunaScope would trade right now</h2>
                  </div>
                  <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs uppercase tracking-[0.22em] text-slate-400">
                    {filteredSignals.length} visible
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {loading
                    ? Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="h-28 animate-pulse rounded-[24px] bg-white/[0.03]" />
                      ))
                    : filteredSignals.map((signal) => {
                        const market = marketById.get(signal.market_id);
                        return (
                          <Link
                            key={signal.market_id}
                            href={`/signals/${signal.market_id}`}
                            className="premium-card block rounded-[26px] border border-white/6 bg-white/[0.03] px-5 py-5 transition-all duration-300 hover:border-cyan-300/18"
                          >
                            <div className="flex flex-wrap items-start justify-between gap-4">
                              <div className="max-w-3xl">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="rounded-full border border-cyan-300/18 bg-cyan-300/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100">
                                    {signal.analysis.side}
                                  </span>
                                  <span className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
                                    {signal.confidence}
                                  </span>
                                  <span className="text-xs text-slate-500">{market?.category ?? "General"}</span>
                                </div>
                                <p className="mt-4 text-lg font-medium leading-7 text-white">{signal.title}</p>
                                <p className="mt-3 line-clamp-2 text-sm leading-7 text-slate-400">{signal.rationale}</p>
                              </div>
                              <div className="min-w-[180px] rounded-[22px] border border-white/6 bg-slate-950/45 px-4 py-3">
                                <div className="flex items-center justify-between text-sm text-slate-400">
                                  <span>Market</span>
                                  <span>{formatPercent(signal.analysis.market_price)}</span>
                                </div>
                                <div className="mt-2 flex items-center justify-between text-sm text-slate-400">
                                  <span>AI</span>
                                  <span>{formatPercent(signal.analysis.ai_probability)}</span>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                  <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Edge</span>
                                  <span className="text-lg font-medium text-cyan-200">{formatSignedPercent(signal.analysis.edge, 1)}</span>
                                </div>
                                <div className="mt-2 text-xs text-slate-500">Score {signal.signal_score.toFixed(1)} / 10</div>
                              </div>
                            </div>
                          </Link>
                        );
                      })}
                </div>
              </FadeIn>

              <div className="space-y-4">
                <FadeIn delay={0.08} className="luna-shell rounded-[34px] p-6">
                  <p className="text-sm text-slate-400">Market overview</p>
                  <h2 className="mt-2 text-2xl font-medium text-white">Highest-liquidity binary contracts</h2>
                  <div className="mt-6 space-y-3">
                    {(snapshot?.markets ?? [])
                      .slice()
                      .sort((left, right) => right.volume24hr - left.volume24hr)
                      .slice(0, 6)
                      .map((market) => (
                        <div key={market.id} className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="line-clamp-2 text-sm font-medium text-white">{market.question}</p>
                              <p className="mt-2 text-xs text-slate-500">{market.category ?? "General"} • {formatCompactNumber(market.openInterest)} OI</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-white">{formatPercent(market.marketProbability)}</p>
                              <p className="mt-2 text-xs text-slate-500">{formatCompactNumber(market.volume24hr)} 24h vol</p>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </FadeIn>

                <FadeIn delay={0.12} className="luna-shell rounded-[34px] p-6">
                  <p className="text-sm text-slate-400">Operator tape</p>
                  <h2 className="mt-2 text-2xl font-medium text-white">Fresh rationale highlights</h2>
                  <div className="mt-6 space-y-3">
                    {(snapshot?.signals ?? []).slice(0, 4).map((item) => (
                      <div key={item.marketId} className="rounded-[22px] border border-white/6 bg-white/[0.03] px-4 py-4">
                        <p className="text-sm font-medium text-white">{item.question}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                          {item.publishedSignal?.rationale ?? "Analyst rationale is being refreshed."}
                        </p>
                      </div>
                    ))}
                  </div>
                </FadeIn>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
