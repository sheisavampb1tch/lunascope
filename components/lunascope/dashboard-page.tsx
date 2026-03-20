"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BellIcon, DashboardIcon, LockIcon, MarketIcon, PulseIcon, SearchIcon, WalletIcon } from "./icons";
import { convictionFromSignal, formatCategoryTag, formatCompactNumber, formatHoursUntil, formatPercent, formatSignedPercent, shortenAddress } from "./format";
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

const sidebarGroups = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", icon: DashboardIcon },
      { label: "Signals", icon: PulseIcon },
      { label: "Markets", icon: MarketIcon },
    ],
  },
  {
    title: "Access",
    items: [
      { label: "Wallet", icon: WalletIcon },
      { label: "Invites", icon: LockIcon },
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

  const marketMap = useMemo(() => {
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
  const averageEdge = signals.length
    ? signals.reduce((sum, signal) => sum + Math.abs(signal.analysis.edge), 0) / signals.length
    : 0;
  const categories = new Set((snapshot?.markets ?? []).map((market) => market.category).filter(Boolean)).size;

  const tickerItems = signals.length > 0
    ? signals.map((signal) => ({
        id: signal.market_id,
        edgeLabel: formatSignedPercent(signal.analysis.edge, 0),
        label: `${signal.title.slice(0, 45)}${signal.title.length > 45 ? "..." : ""}`,
        positive: signal.analysis.edge >= 0,
      }))
    : [
        {
          id: "loading",
          edgeLabel: "+0%",
          label: "Loading dashboard feed...",
          positive: true,
        },
      ];

  async function handleConnect() {
    try {
      setError(null);
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
    <main className="cosmic-shell">
      <TopChrome
        links={[
          { label: "Overview", href: "#overview" },
          { label: "Signals", href: "#signals" },
          { label: "Markets", href: "#markets" },
        ]}
        tickerItems={tickerItems}
        rightSlot={(
          <button className="luna-button" onClick={session?.authenticated ? logout : handleConnect}>
            {loadingSession ? "Checking..." : session?.authenticated ? shortenAddress(session.walletAddress) : "Connect wallet"}
          </button>
        )}
      />

      <div className="luna-page">
        <section className="luna-container grid gap-4 xl:grid-cols-[260px_1fr]">
          <aside className="luna-shell h-fit p-5 xl:sticky xl:top-[96px]">
            <div className="mb-8">
              <div className="mb-2 text-[11px] font-semibold tracking-[0.07em] text-[#7EB8FF]">OPERATOR DESK</div>
              <h1 className="luna-heading text-[28px] leading-[1.02]">
                {session?.authenticated ? "Welcome back." : "Live market desk."}
              </h1>
              <p className="mt-3 text-[13px] leading-[1.6] text-white/35">
                Binary market intelligence surfaced in one strict operator terminal.
              </p>
            </div>

            <div className="space-y-6">
              {sidebarGroups.map((group) => (
                <div key={group.title}>
                  <div className="mb-3 text-[11px] font-semibold tracking-[0.07em] text-white/25">{group.title}</div>
                  <div className="space-y-2">
                    {group.items.map((item, index) => (
                      <div
                        key={item.label}
                        className={`flex items-center justify-between rounded-[10px] border px-4 py-3 text-[13px] ${
                          index === 0 && group.title === "Overview"
                            ? "border-[#7EB8FF]/20 bg-[#7EB8FF]/[0.03] text-white/85"
                            : "border-white/[0.07] text-white/45"
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </span>
                        {index === 0 && group.title === "Overview" ? <span className="h-1.5 w-1.5 rounded-full bg-[#7EB8FF]" /> : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[12px] border border-[#7EB8FF]/12 bg-[#7EB8FF]/[0.03] p-4">
              <div className="mb-1 text-[13px] font-medium text-white/85">Premium access</div>
              <div className="text-[12px] leading-[1.5] text-white/35">
                Wallet-gated operator tools, priority signal flow, and full rationale unlock.
              </div>
              <button className="luna-button mt-4 w-full" onClick={session?.authenticated ? logout : handleConnect}>
                {session?.authenticated ? "Logout" : "Connect wallet"}
              </button>
            </div>
          </aside>

          <div className="space-y-4">
            <section id="overview" className="luna-shell p-5">
              <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-2 text-[11px] font-semibold tracking-[0.07em] text-[#7EB8FF]">LIVE TERMINAL</div>
                  <h2 className="luna-heading text-[30px] leading-[1.04]">
                    Strict signal flow for live
                    <br />
                    Polymarket mispricing.
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex min-w-[280px] items-center gap-2 rounded-[10px] border border-white/[0.07] px-4 py-3 text-[13px] text-white/35">
                    <SearchIcon className="h-4 w-4 text-white/20" />
                    <input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search signals and markets..."
                      className="w-full bg-transparent text-[13px] text-white/80 outline-none placeholder:text-white/20"
                    />
                  </div>

                  <button className="luna-button-secondary" onClick={() => void refreshData(true)}>
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                  <div className="flex h-[40px] w-[40px] items-center justify-center rounded-[10px] border border-white/[0.07] text-white/35">
                    <BellIcon className="h-4 w-4" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                <div className="rounded-[12px] border border-white/[0.07] p-5">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">FEATURED SIGNAL</div>
                    <div className="data-number text-[11px] text-[#7EB8FF]">
                      {snapshot?.meta.fetchedAt ? new Date(snapshot.meta.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : "LIVE"}
                    </div>
                  </div>

                  <div className="mb-4 max-w-[520px]">
                    <div className="luna-heading text-[22px] leading-[1.22] text-white/92">
                      {topSignal?.title ?? "Loading live signal flow"}
                    </div>
                    <p className="mt-3 text-[13px] leading-[1.7] text-white/35">
                      {topSignal?.rationale ?? "Signal rationale will appear here as soon as the live analyst feed returns."}
                    </p>
                  </div>

                  <div className="mb-5 flex flex-wrap gap-3">
                    <Link href={topSignal ? `/signals/${topSignal.market_id}` : "#signals"} className="luna-button">
                      Open signal
                    </Link>
                    <div className="rounded-[8px] border border-white/[0.07] px-4 py-2 text-[12px] text-white/45">
                      <span className="data-number text-white/80">
                        {topSignal ? `${topSignal.analysis.side} ${formatPercent(topSignal.analysis.ai_probability)}` : "Waiting..."}
                      </span>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {[
                      ["Market", topSignal ? formatPercent(topSignal.analysis.market_price) : "--"],
                      ["AI", topSignal ? formatPercent(topSignal.analysis.ai_probability) : "--"],
                      ["Edge", topSignal ? formatSignedPercent(topSignal.analysis.edge, 0) : "--"],
                    ].map(([label, value]) => (
                      <div key={label} className="rounded-[10px] border border-white/[0.07] px-4 py-3">
                        <div className="text-[10px] tracking-[0.06em] text-white/25">{label}</div>
                        <div className={`data-number mt-2 text-[20px] font-semibold ${label === "Edge" ? "text-[#7EB8FF]" : "text-white/80"}`}>
                          {value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    ["Live signals", String(signals.length), "AI-screened ideas"],
                    ["Average edge", formatSignedPercent(averageEdge, 0), "vs market pricing"],
                    ["Tracked markets", String(snapshot?.meta.marketCount ?? 0), "binary contracts only"],
                    ["Categories", String(categories), "macro, crypto, politics"],
                  ].map(([label, value, note]) => (
                    <div key={label} className="luna-surface premium-card p-5">
                      <div className="text-[12px] text-white/35">{label}</div>
                      <div className="data-number mt-4 text-[34px] font-semibold text-white/90">{value}</div>
                      <div className="mt-2 text-[12px] text-white/25">{note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
              <div id="signals" className="luna-shell p-5">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">SIGNALS</div>
                    <h2 className="luna-heading mt-1 text-[24px]">What LunaScope would trade right now.</h2>
                  </div>
                  <div className="data-number text-[11px] text-white/30">{filteredSignals.length} visible</div>
                </div>

                <div className="flex flex-col gap-2">
                  {loading
                    ? Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-[172px] rounded-[12px] border border-white/[0.07] bg-white/[0.02] animate-pulse" />
                      ))
                    : filteredSignals.map((signal, index) => {
                        const market = marketMap.get(signal.market_id);
                        return (
                          <SignalCard
                            key={signal.market_id}
                            title={signal.title}
                            tag={formatCategoryTag(market?.category)}
                            marketProbability={signal.analysis.market_price}
                            aiProbability={signal.analysis.ai_probability}
                            edge={signal.analysis.edge}
                            conviction={convictionFromSignal(signal.signal_score, signal.confidence)}
                            rationale={signal.rationale}
                            catalystLabel={market?.category ?? "Polymarket"}
                            hoursToCatalyst={formatHoursUntil(market?.endDate)}
                            hot={Math.abs(signal.analysis.edge) >= 0.18 || signal.confidence === "HIGH"}
                            href={`/signals/${signal.market_id}`}
                            index={index}
                          />
                        );
                      })}
                </div>
              </div>

              <div className="space-y-4">
                <div className="luna-shell p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <WalletIcon className="h-4 w-4 text-[#7EB8FF]" />
                    <div>
                      <div className="text-[13px] font-medium text-white/85">
                        {session?.authenticated ? shortenAddress(session.walletAddress) : "Guest session"}
                      </div>
                      <div className="text-[12px] text-white/30">
                        {session?.access?.hasAccess ? `Tier ${session.access.tier} active` : "Connect and redeem invite to unlock operator mode."}
                      </div>
                    </div>
                  </div>

                  {!session?.access?.hasAccess ? (
                    <div className="space-y-3">
                      <input
                        value={inviteCode}
                        onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                        placeholder="LUNA-ALPHA"
                        className="w-full rounded-[8px] border border-[#7EB8FF]/12 bg-white/[0.02] px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/20 focus:border-[#7EB8FF]/35"
                      />
                      <div className="flex gap-2">
                        <button className="luna-button flex-1" disabled={connecting} onClick={handleConnect}>
                          {connecting ? "Signing..." : "Connect"}
                        </button>
                        <button className="luna-button-secondary flex-1" disabled={!session?.authenticated || redeeming} onClick={handleRedeem}>
                          {redeeming ? "Applying..." : "Redeem"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[10px] border border-[#7EB8FF]/12 bg-[#7EB8FF]/[0.03] px-4 py-3 text-[12px] text-white/55">
                      Premium access is live on this wallet.
                    </div>
                  )}

                  {error ? <div className="mt-3 text-[12px] text-rose-300">{error}</div> : null}
                </div>

                <div id="markets" className="luna-shell p-5">
                  <div className="mb-5">
                    <div className="text-[11px] font-semibold tracking-[0.07em] text-white/25">MARKET OVERVIEW</div>
                    <h2 className="luna-heading mt-1 text-[24px]">Highest-liquidity binary contracts.</h2>
                  </div>

                  <div className="space-y-2">
                    {(snapshot?.markets ?? [])
                      .slice()
                      .sort((left, right) => right.volume24hr - left.volume24hr)
                      .slice(0, 5)
                      .map((market) => (
                        <div key={market.id} className="premium-card rounded-[12px] border border-white/[0.07] px-4 py-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="luna-heading text-[14px] leading-[1.45] text-white/85">{market.question}</div>
                              <div className="mt-2 text-[12px] text-white/25">
                                {market.category ?? "General"} • <span className="data-number">{formatCompactNumber(market.openInterest)}</span> OI
                              </div>
                            </div>
                            <div className="shrink-0 text-right">
                              <div className="data-number text-[18px] font-semibold text-white/80">{formatPercent(market.marketProbability)}</div>
                              <div className="mt-2 text-[11px] text-white/25">
                                <span className="data-number">{formatCompactNumber(market.volume24hr)}</span> 24h vol
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="luna-shell p-5">
                  <div className="mb-4 text-[11px] font-semibold tracking-[0.07em] text-white/25">OPERATOR TAPE</div>
                  <div className="space-y-3">
                    {(snapshot?.signals ?? []).slice(0, 4).map((item) => (
                      <div key={item.marketId} className="rounded-[12px] border border-white/[0.07] px-4 py-4">
                        <div className="luna-heading text-[13px] leading-[1.45] text-white/82">{item.question}</div>
                        <div className="mt-2 text-[12px] leading-[1.6] text-white/30">
                          {item.publishedSignal?.rationale ?? "Rationale refresh in progress."}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}
