"use client";

import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { BellIcon, SearchIcon, WalletIcon, SparkIcon, MarketIcon, PulseIcon } from "./icons";
import {
  convictionFromSignal,
  formatCategoryTag,
  formatCompactNumber,
  formatHoursUntil,
  formatPercent,
  formatSignedPercent,
  shortenAddress,
} from "./format";
import { getPolymarketMarketUrl } from "./polymarket-links";
import { TopChrome } from "./top-chrome";
import { useWalletAuth } from "./use-wallet-auth";

/* ─── Types ─── */
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

type SnapshotResponse = {
  meta: { fetchedAt: string; marketCount: number };
  markets: SnapshotMarket[];
  signals: { marketId: string; question: string; publishedSignal?: LiveSignal }[];
};

type Tab = "signals" | "markets";

/* ─── Skeleton card ─── */
function SkeletonCard() {
  return (
    <div className="luna-shell p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start gap-2">
        <div className="skeleton h-5 w-20 rounded-[5px]" />
        <div className="skeleton h-6 w-14 rounded-[6px]" />
      </div>
      <div className="skeleton h-4 w-full rounded-[4px]" />
      <div className="skeleton h-4 w-4/5 rounded-[4px]" />
      <div className="skeleton h-3 w-full rounded-[4px] mt-1" />
      <div className="flex justify-between mt-2">
        <div className="skeleton h-3 w-24 rounded-[4px]" />
        <div className="skeleton h-3 w-16 rounded-[4px]" />
      </div>
    </div>
  );
}

/* ─── Signal card (inline in dashboard) ─── */
function DashSignalCard({
  signal,
  market,
  index,
}: {
  signal: LiveSignal;
  market: SnapshotMarket | undefined;
  index: number;
}) {
  const isPos = signal.analysis.edge >= 0;
  const edgeColor = isPos ? "var(--accent)" : "var(--danger)";
  const edgePct = formatSignedPercent(signal.analysis.edge, 0);
  const conviction = convictionFromSignal(signal.signal_score, signal.confidence);
  const isHot = Math.abs(signal.analysis.edge) >= 0.18 || signal.confidence === "HIGH";
  const hours = formatHoursUntil(market?.endDate);
  const tradeUrl = getPolymarketMarketUrl(market?.slug);

  return (
    <div
      className="luna-shell premium-card flex flex-col gap-3 p-5 cursor-default"
      style={{ animation: `up 0.4s ease ${index * 0.05}s both` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="luna-badge luna-badge-default">
            {formatCategoryTag(market?.category)}
          </span>
          {isHot && <span className="luna-badge luna-badge-hot">🔥 Hot</span>}
          {signal.confidence === "HIGH" && (
            <span className="luna-badge luna-badge-accent">High conv.</span>
          )}
        </div>
        <div
          className="data-number shrink-0 text-[22px] font-bold leading-none"
          style={{ color: edgeColor }}
        >
          {edgePct}
        </div>
      </div>

      {/* Title */}
      <div className="luna-heading text-[13.5px] leading-[1.45] text-white/88 line-clamp-2">
        {signal.title}
      </div>

      {/* Rationale */}
      <p className="text-[12px] leading-[1.6] text-white/35 line-clamp-2">
        {signal.rationale}
      </p>

      {/* Probability bar */}
      <div>
        <div className="prob-bar">
          <div
            className="prob-bar-market"
            style={{ width: `${signal.analysis.market_price * 100}%` }}
          />
          <div
            className="prob-bar-ai confidence-bar"
            style={{
              width: `${signal.analysis.ai_probability * 100}%`,
              background: edgeColor,
            }}
          />
        </div>
        <div className="mt-1.5 flex justify-between">
          <span className="data-number text-[10px] text-white/30">
            Market {formatPercent(signal.analysis.market_price)}
          </span>
          <span className="data-number text-[10px]" style={{ color: edgeColor }}>
            AI {formatPercent(signal.analysis.ai_probability)}
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-white/[0.05]">
        <div className="flex items-center gap-3 text-[11px] text-white/28">
          {hours && (
            <span className="data-number">
              {hours}h to resolve
            </span>
          )}
          <span className="data-number">CONV {conviction}</span>
        </div>
        <a
          href={tradeUrl}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] font-semibold transition-opacity hover:opacity-70"
          style={{ color: "var(--accent)" }}
        >
          Trade →
        </a>
      </div>
    </div>
  );
}

/* ─── Market row ─── */
function MarketRow({ market }: { market: SnapshotMarket }) {
  return (
    <div className="luna-shell premium-card px-5 py-4 flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="luna-heading text-[13.5px] leading-[1.4] text-white/85 truncate">
          {market.question}
        </div>
        <div className="mt-1 flex items-center gap-2 text-[11px] text-white/28">
          <span className="luna-badge luna-badge-default" style={{ padding: '1px 5px' }}>
            {formatCategoryTag(market.category)}
          </span>
          <span className="data-number">{formatCompactNumber(market.openInterest)} OI</span>
          <span className="text-white/15">·</span>
          <span className="data-number">{formatCompactNumber(market.volume24hr)} 24h vol</span>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="data-number text-[20px] font-bold text-white/88">
          {formatPercent(market.marketProbability)}
        </div>
        <div className="mt-0.5 text-[10px] text-white/25">probability</div>
      </div>
    </div>
  );
}

/* ─── Main component ─── */
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
    silent ? setRefreshing(true) : setLoading(true);
    try {
      const [signalsRes, snapshotRes] = await Promise.all([
        fetch("/api/signals/live?limit=12", { cache: "no-store" }),
        fetch("/api/markets/snapshot?limit=60",  { cache: "no-store" }),
      ]);
      const signalsJson = (await signalsRes.json()) as { signals?: LiveSignal[] };
      const snapshotJson = (await snapshotRes.json()) as SnapshotResponse;
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
    const m = new Map<string, SnapshotMarket>();
    for (const market of snapshot?.markets ?? []) m.set(market.id, market);
    return m;
  }, [snapshot]);

  const filteredSignals = useMemo(() => {
    const q = deferredSearch.trim().toLowerCase();
    if (!q) return signals;
    return signals.filter((s) => s.title.toLowerCase().includes(q));
  }, [signals, deferredSearch]);

  const topSignal    = filteredSignals[0] ?? signals[0];
  const topMarket    = topSignal ? marketMap.get(topSignal.market_id) : null;
  const averageEdge  = signals.length
    ? signals.reduce((s, x) => s + Math.abs(x.analysis.edge), 0) / signals.length
    : 0;
  const highConvCount = signals.filter((s) => s.confidence === "HIGH").length;

  const tickerItems = signals.length > 0
    ? signals.map((s) => ({
        id: s.market_id,
        edgeLabel: formatSignedPercent(s.analysis.edge, 0),
        label: `${s.title.slice(0, 48)}${s.title.length > 48 ? "…" : ""}`,
        positive: s.analysis.edge >= 0,
      }))
    : [{ id: "loading", edgeLabel: "+0%", label: "Loading signals…", positive: true }];

  async function handleConnect() {
    try { setError(null); await connectInjectedWallet(); } catch { /* handled */ }
  }
  async function handleRedeem() {
    try { await redeemInvite(inviteCode); setInviteCode(""); } catch { /* handled */ }
  }

  const lastRefresh = snapshot?.meta.fetchedAt
    ? new Date(snapshot.meta.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    : "—";

  return (
    <main className="cosmic-shell">
      <TopChrome
        links={[
          { label: "Overview", href: "#overview" },
          { label: "Signals",  href: "#signals"  },
          { label: "Markets",  href: "#markets"  },
        ]}
        tickerItems={tickerItems}
        rightSlot={
          <button
            className="luna-button-secondary"
            style={{ fontSize: 13, padding: '7px 16px' }}
            onClick={session?.authenticated ? logout : handleConnect}
          >
            <WalletIcon style={{ width: 14, height: 14 }} />
            {loadingSession
              ? "Checking…"
              : session?.authenticated
                ? shortenAddress(session.walletAddress)
                : "Wallet optional"}
          </button>
        }
      />

      <div className="luna-page">
        <div className="luna-container" style={{ paddingBlock: '28px 64px' }}>

          {/* ── STATS ROW ── */}
          <section
            id="overview"
            className="stats-grid"
            style={{ marginBottom: 24 }}
          >
            {[
              {
                icon: <PulseIcon style={{ width: 16, height: 16, color: 'var(--accent)' }} />,
                label: "Live signals",
                value: loading ? "—" : String(signals.length),
                note: "AI-screened",
                accent: true,
              },
              {
                icon: <SparkIcon style={{ width: 16, height: 16, color: 'var(--accent)' }} />,
                label: "Avg edge",
                value: loading ? "—" : formatSignedPercent(averageEdge, 0),
                note: "vs market price",
              },
              {
                icon: <MarketIcon style={{ width: 16, height: 16, color: 'var(--accent)' }} />,
                label: "Markets tracked",
                value: loading ? "—" : String(snapshot?.meta.marketCount ?? 0),
                note: "binary contracts",
              },
              {
                icon: <BellIcon style={{ width: 16, height: 16, color: 'var(--accent)' }} />,
                label: "High conviction",
                value: loading ? "—" : String(highConvCount),
                note: `Last refresh ${lastRefresh}`,
              },
            ].map(({ icon, label, value, note, accent }) => (
              <div
                key={label}
                className={accent ? "luna-shell-accent" : "luna-shell"}
                style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="luna-stat-label">{label}</span>
                  {icon}
                </div>
                <div className="luna-stat-value data-number">{value}</div>
                <div className="luna-stat-note">{note}</div>
              </div>
            ))}
          </section>

          {/* ── FEATURED SIGNAL ── */}
          {topSignal && !loading && (
            <section className="luna-shell-accent" style={{ padding: '24px 28px', marginBottom: 24, animation: 'up 0.4s ease both', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div className="live-dot" />
                <span className="luna-label">Top Signal</span>
                {(Math.abs(topSignal.analysis.edge) >= 0.18 || topSignal.confidence === "HIGH") && (
                  <span className="luna-badge luna-badge-hot" style={{ marginLeft: 4 }}>🔥 Hot</span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) auto', gap: 28, alignItems: 'start' }}>
                <div>
                  <h2 className="luna-heading" style={{ fontSize: 'clamp(18px, 2vw, 26px)', lineHeight: 1.2, color: 'rgba(255,255,255,0.92)', marginBottom: 10 }}>
                    {topSignal.title}
                  </h2>
                  <p style={{ fontSize: 13, lineHeight: 1.7, color: 'rgba(255,255,255,0.42)', maxWidth: 600, marginBottom: 18 }}>
                    {topSignal.rationale}
                  </p>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <a
                      href={getPolymarketMarketUrl(topMarket?.slug)}
                      target="_blank"
                      rel="noreferrer"
                      className="luna-button"
                      style={{ fontSize: 13, padding: '9px 20px' }}
                    >
                      Trade on Polymarket →
                    </a>
                    <Link
                      href={`/signals/${topSignal.market_id}`}
                      className="luna-button-secondary"
                      style={{ fontSize: 13, padding: '9px 18px' }}
                    >
                      Deep dive
                    </Link>
                  </div>
                </div>

                {/* Mini stats */}
                <div style={{ display: 'grid', gap: 8 }}>
                  {[
                    { label: "MARKET", value: formatPercent(topSignal.analysis.market_price), color: 'rgba(255,255,255,0.65)' },
                    { label: "AI MODEL", value: formatPercent(topSignal.analysis.ai_probability), color: 'var(--accent)' },
                    { label: "EDGE", value: formatSignedPercent(topSignal.analysis.edge, 0), color: topSignal.analysis.edge >= 0 ? 'var(--accent)' : 'var(--danger)' },
                  ].map(({ label, value, color }) => (
                    <div
                      key={label}
                      className="luna-surface"
                      style={{ padding: '12px 18px', minWidth: 140 }}
                    >
                      <div style={{ fontSize: 10, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.28)', marginBottom: 4 }}>{label}</div>
                      <div className="data-number" style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* ── TOOLBAR (tabs + search) ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 12, flexWrap: 'wrap' }}>
            <div className="luna-tabs">
              {(["signals", "markets"] as Tab[]).map((tab) => (
                <button
                  key={tab}
                  className={`luna-tab${activeTab === tab ? " active" : ""}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === "signals" ? `Signals${signals.length ? ` (${filteredSignals.length})` : ""}` : "Markets"}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div
                className="luna-surface"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 9 }}
              >
                <SearchIcon style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.22)' }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search markets…"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.8)',
                    width: 180,
                  }}
                />
              </div>
              <button
                className="luna-button-ghost"
                style={{ fontSize: 12, padding: '8px 14px' }}
                onClick={() => void refreshData(true)}
                disabled={refreshing}
              >
                {refreshing ? (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div className="live-dot" style={{ width: 5, height: 5 }} />
                    Refreshing…
                  </span>
                ) : "↻ Refresh"}
              </button>
            </div>
          </div>

          {/* ── SIGNALS GRID ── */}
          {activeTab === "signals" && (
            <section id="signals">
              {loading ? (
                <div className="signals-grid">
                  {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
                </div>
              ) : filteredSignals.length === 0 ? (
                <div className="luna-shell" style={{ padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🔭</div>
                  <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>
                    {search ? "No signals match your search." : "No signals loaded yet. Refresh to scan markets."}
                  </div>
                </div>
              ) : (
                <div className="signals-grid">
                  {filteredSignals.map((signal, i) => (
                    <DashSignalCard
                      key={signal.market_id}
                      signal={signal}
                      market={marketMap.get(signal.market_id)}
                      index={i}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── MARKETS LIST ── */}
          {activeTab === "markets" && (
            <section id="markets" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="luna-shell" style={{ height: 72 }} />
                ))
              ) : (
                [...(snapshot?.markets ?? [])]
                  .sort((a, b) => b.volume24hr - a.volume24hr)
                  .map((market) => <MarketRow key={market.id} market={market} />)
              )}
            </section>
          )}

          {/* ── WALLET PANEL ── */}
          <section
            className="luna-shell"
            style={{ padding: '20px 22px', maxWidth: 480, marginTop: 40 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <WalletIcon style={{ width: 16, height: 16, color: 'var(--accent)' }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.82)' }}>
                  {session?.authenticated ? shortenAddress(session.walletAddress) : "Guest session"}
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                  {session?.access?.hasAccess
                    ? `Tier ${session.access.tier} · full access`
                    : "Signals open. Wallet optional for operator features."}
                </div>
              </div>
              {session?.access?.hasAccess && (
                <span className="luna-badge luna-badge-accent" style={{ marginLeft: 'auto' }}>Active</span>
              )}
            </div>

            {!session?.access?.hasAccess ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  placeholder="LUNA-ALPHA-XXXX"
                  className="luna-input"
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    className="luna-button"
                    style={{ flex: 1, fontSize: 13, padding: '9px 16px' }}
                    disabled={connecting}
                    onClick={handleConnect}
                  >
                    {connecting ? "Signing…" : "Connect wallet"}
                  </button>
                  <button
                    className="luna-button-secondary"
                    style={{ flex: 1, fontSize: 13, padding: '9px 16px' }}
                    disabled={!session?.authenticated || redeeming}
                    onClick={handleRedeem}
                  >
                    {redeeming ? "Applying…" : "Redeem invite"}
                  </button>
                </div>
              </div>
            ) : (
              <div
                className="luna-surface"
                style={{ padding: '12px 16px', fontSize: 12, color: 'rgba(255,255,255,0.5)' }}
              >
                Wallet layer active. Operator features unlocked.
              </div>
            )}
            {error && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--danger)' }}>{error}</div>
            )}
          </section>

        </div>
      </div>

      {/* Dashboard responsive layout */}
      <style>{`
        .stats-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(4, 1fr);
        }
        .signals-grid {
          display: grid;
          gap: 12px;
          grid-template-columns: repeat(3, 1fr);
        }
        @media (max-width: 1100px) {
          .stats-grid { grid-template-columns: repeat(2, 1fr); }
          .signals-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .stats-grid { grid-template-columns: 1fr 1fr; }
          .signals-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 520px) {
          .stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </main>
  );
}