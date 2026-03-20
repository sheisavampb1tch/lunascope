"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { LockIcon, WalletIcon } from "./icons";
import { convictionFromSignal, formatCategoryTag, formatHoursUntil, formatSignedPercent, shortenAddress } from "./format";
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
  category: string | null;
  endDate: string | null;
};

type SnapshotResponse = {
  meta: {
    marketCount: number;
  };
  markets: SnapshotMarket[];
};

const featureItems = [
  {
    num: "01",
    title: "Live Market Scan",
    desc: "Pulls active Polymarket binary events, prioritises liquidity, and keeps the surface focused on contracts worth tracking.",
  },
  {
    num: "02",
    title: "AI Mispricing Detection",
    desc: "Groq-backed analyst flow compares live market pricing with catalyst context and narrative drift.",
  },
  {
    num: "03",
    title: "Edge Score",
    desc: "The spread between crowd pricing and LunaScope probability is expressed as a single clean number.",
  },
  {
    num: "04",
    title: "Time-to-Catalyst",
    desc: "Every surfaced market carries urgency so operators know which catalysts are near enough to matter.",
  },
  {
    num: "05",
    title: "Conviction Score",
    desc: "Signals stay ranked by conviction, so weak ideas do not pollute the feed or waste attention.",
  },
  {
    num: "06",
    title: "Wallet-Gated Access",
    desc: "Private flow sits behind wallet auth and invite access, not email gates or noisy sign-up walls.",
  },
];

export function LandingPage() {
  const [signals, setSignals] = useState<LiveSignal[]>([]);
  const [snapshot, setSnapshot] = useState<SnapshotResponse | null>(null);
  const [loadingSignals, setLoadingSignals] = useState(true);
  const [gateOpen, setGateOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const {
    session,
    loadingSession,
    connecting,
    redeeming,
    error,
    setError,
    connectInjectedWallet,
    redeemInvite,
  } = useWalletAuth();

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [signalsResponse, snapshotResponse] = await Promise.all([
          fetch("/api/signals/live?limit=6", { cache: "no-store" }),
          fetch("/api/markets/snapshot?limit=40", { cache: "no-store" }),
        ]);

        const signalsJson = (await signalsResponse.json()) as { signals?: LiveSignal[] };
        const snapshotJson = (await snapshotResponse.json()) as SnapshotResponse;

        if (!active) return;

        setSignals(signalsJson.signals ?? []);
        setSnapshot(snapshotJson);
      } finally {
        if (active) {
          setLoadingSignals(false);
        }
      }
    }

    void loadData();
    return () => {
      active = false;
    };
  }, []);

  const marketMap = useMemo(() => {
    const map = new Map<string, SnapshotMarket>();
    for (const market of snapshot?.markets ?? []) {
      map.set(market.id, market);
    }
    return map;
  }, [snapshot]);

  const averageEdge = signals.length
    ? Math.round((signals.reduce((sum, signal) => sum + Math.abs(signal.analysis.edge), 0) / signals.length) * 100)
    : 0;

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
          label: "Loading live signal flow...",
          edgeLabel: "+0%",
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
      setGateOpen(false);
    } catch {
      return;
    }
  }

  return (
    <main className="cosmic-shell">
      <TopChrome
        links={[
          { label: "Signals", href: "#signals" },
          { label: "How it works", href: "#how" },
          { label: "Access", href: "#access" },
        ]}
        tickerItems={tickerItems}
        rightSlot={(
          <button className="luna-button" onClick={() => setGateOpen(true)}>
            {session?.authenticated ? "Manage access" : "Connect wallet"}
          </button>
        )}
      />

      <div className="luna-page">
        <section id="signals" className="luna-container grid gap-12 py-[72px] md:grid-cols-[1fr_420px] md:gap-20 md:py-20">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="mb-5 inline-flex items-center gap-2 rounded-[20px] border border-[#7EB8FF]/15 bg-[#7EB8FF]/[0.07] px-3 py-1.5 text-[11px] font-semibold tracking-[0.06em] text-[#7EB8FF]"
            >
              <span className="live-dot" />
              LIVE · REFRESHED EVERY 5 MINUTES
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="luna-heading mb-4 text-[clamp(34px,4vw,52px)] leading-[1.04]"
            >
              Find the edge
              <br />
              <span className="text-white/30">before the</span>
              <br />
              market does.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-8 max-w-[430px] text-[15px] leading-[1.65] text-white/40"
            >
              LunaScope scans Polymarket around the clock. When the crowd misprices an event, you see the spread, the rationale, and the catalyst urgency in one cleaner terminal.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="mb-12 flex flex-wrap gap-3"
            >
              <button className="luna-button" onClick={() => setGateOpen(true)}>
                {session?.access?.hasAccess ? "Operator access active" : "Connect wallet"}
              </button>
              <Link href="/dashboard" className="luna-button-secondary">
                View live desk
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="grid gap-6 border-t border-[#7EB8FF]/10 pt-8 sm:grid-cols-3"
            >
              {[
                { val: `${snapshot?.meta.marketCount ?? 0}+`, label: "Markets scanned" },
                { val: averageEdge ? `avg ${averageEdge}%` : "avg --", label: "Edge identified" },
                { val: "5 min", label: "Refresh cycle" },
              ].map((item) => (
                <div key={item.label}>
                  <div className="data-number text-[22px] font-semibold text-[#7EB8FF]">{item.val}</div>
                  <div className="mt-1 text-[12px] text-white/30">{item.label}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-[0.07em] text-white/30">SIGNAL FEED</span>
              <span className="flex items-center gap-1.5 text-[11px] font-semibold text-[#7EB8FF]">
                <span className="live-dot" />
                LIVE
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {loadingSignals
                ? Array.from({ length: 2 }).map((_, index) => (
                    <div key={`landing-skeleton-${index}`} className="h-[172px] rounded-[12px] border border-white/[0.07] bg-white/[0.02] animate-pulse" />
                  ))
                : signals.slice(0, 2).map((signal, index) => {
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

              <div className="flex items-center justify-center gap-2 rounded-[12px] border border-[#7EB8FF]/10 bg-[#7EB8FF]/[0.02] px-4 py-5 text-[12px] font-medium text-white/30">
                <LockIcon className="h-4 w-4 text-white/25" />
                {Math.max(signals.length - 2, 4)} more signals · Connect wallet to unlock
              </div>
            </div>
          </div>
        </section>

        <hr className="luna-divider" />

        <section id="how" className="luna-section">
          <div className="luna-section-label">HOW IT WORKS</div>
          <h2 className="luna-section-title mb-12">
            Three layers.
            <br />
            One terminal.
          </h2>

          <div className="grid gap-px overflow-hidden rounded-[14px] bg-[#7EB8FF]/[0.06] md:grid-cols-3">
            {featureItems.map((item) => (
              <div key={item.num} className="premium-card bg-[#0c0c0e] px-6 py-7">
                <div className="mb-3 text-[11px] font-bold tracking-[0.06em] text-[#7EB8FF]/70">{item.num}</div>
                <div className="luna-heading mb-2 text-[14px]">{item.title}</div>
                <div className="text-[13px] leading-[1.6] text-white/35">{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="luna-divider" />

        <section id="access" className="luna-section pb-4">
          <div className="luna-section-label">ACCESS</div>
          <h2 className="luna-section-title mb-8">
            Two tiers.
            <br />
            One edge.
          </h2>
        </section>

        <section className="luna-container grid gap-3 pb-24 md:grid-cols-2">
          <div className="luna-shell premium-card p-8">
            <div className="mb-4 text-[11px] font-bold tracking-[0.08em] text-white/30">GUEST</div>
            <div className="luna-heading text-[36px]">Free</div>
            <div className="mb-6 text-[13px] text-white/30">No wallet required</div>
            <div className="mb-8 flex flex-col gap-2.5">
              {["Top 2 signals preview", "Edge score visible", "Market name & tag"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-[13px] text-white/60">
                  <span className="text-white/40">✓</span>
                  {item}
                </div>
              ))}
              {["AI rationale locked", "Conviction score locked", "Time-to-catalyst locked"].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-[13px] text-white/20">
                  <span className="text-white/15">✗</span>
                  {item}
                </div>
              ))}
            </div>
            <Link href="/dashboard" className="luna-button-secondary w-full">
              View signals
            </Link>
          </div>

          <div
            className="luna-shell p-8"
            style={{
              borderColor: "rgba(126,184,255,0.2)",
              background: "rgba(126,184,255,0.03)",
              animation: "borderGlow 4s ease-in-out infinite",
            }}
          >
            <div className="mb-4 text-[11px] font-bold tracking-[0.08em] text-white/30">OPERATOR</div>
            <div
              className="luna-heading text-[36px]"
              style={{
                background: "linear-gradient(135deg, #7EB8FF, #00C4FF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Private
            </div>
            <div className="mb-6 text-[13px] text-white/30">
              {session?.access?.hasAccess ? `Wallet unlocked on tier ${session.access.tier}` : "Invite-only · Wallet-gated"}
            </div>
            <div className="mb-8 flex flex-col gap-2.5">
              {[
                "All signals unlocked",
                "Full AI rationale",
                "Conviction score",
                "Time-to-catalyst timer",
                "5-min refresh cycle",
                "Priority new signals",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5 text-[13px] text-white/60">
                  <span className="text-[#7EB8FF]">✓</span>
                  {item}
                </div>
              ))}
            </div>
            <button className="luna-button w-full" onClick={() => setGateOpen(true)}>
              {session?.authenticated ? "Manage access" : "Connect wallet"}
            </button>
          </div>
        </section>

        <hr className="luna-divider" />

        <footer className="luna-container flex flex-col gap-3 py-6 text-[12px] text-white/20 md:flex-row md:items-center md:justify-between">
          <span>© 2026 LunaScope</span>
          <span className="text-[#7EB8FF]/60">Not financial advice.</span>
          <span>See what moves the market first.</span>
        </footer>
      </div>

      <AnimatePresence>
        {gateOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/65 px-5 py-10 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-[460px] rounded-[14px] border border-[#7EB8FF]/12 bg-[#0c0c0e] p-6 shadow-[0_0_40px_rgba(126,184,255,0.08)]"
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 text-[11px] font-semibold tracking-[0.07em] text-[#7EB8FF]">PRIVATE ACCESS</div>
                  <h3 className="luna-heading text-[26px] leading-[1.05]">
                    Connect your wallet and unlock operator flow.
                  </h3>
                </div>
                <button className="luna-button-secondary px-3 py-2" onClick={() => setGateOpen(false)}>
                  Close
                </button>
              </div>

              <div className="space-y-3">
                <div className="rounded-[12px] border border-white/[0.07] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#7EB8FF]/10 text-[#7EB8FF]">
                      <WalletIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white/85">
                        {session?.authenticated ? shortenAddress(session.walletAddress) : "Injected wallet sign-in"}
                      </div>
                      <div className="text-[12px] text-white/30">MetaMask and Rabby supported in-browser.</div>
                    </div>
                  </div>
                  <button className="luna-button w-full" disabled={connecting} onClick={handleConnect}>
                    {connecting ? "Waiting for signature..." : session?.authenticated ? "Wallet connected" : "Connect wallet"}
                  </button>
                </div>

                <div className="rounded-[12px] border border-white/[0.07] p-4">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-white/[0.04] text-white/70">
                      <LockIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-[13px] font-medium text-white/85">Redeem invite code</div>
                      <div className="text-[12px] text-white/30">Attach private access to your wallet session.</div>
                    </div>
                  </div>

                  <input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="LUNA-ALPHA"
                    className="mb-3 w-full rounded-[8px] border border-[#7EB8FF]/12 bg-white/[0.02] px-4 py-3 text-[13px] text-white outline-none placeholder:text-white/20 focus:border-[#7EB8FF]/35"
                  />
                  <button className="luna-button-secondary w-full" disabled={!session?.authenticated || redeeming} onClick={handleRedeem}>
                    {redeeming ? "Redeeming..." : "Redeem invite"}
                  </button>
                </div>

                {session?.access?.hasAccess ? (
                  <div className="rounded-[12px] border border-[#7EB8FF]/12 bg-[#7EB8FF]/[0.03] px-4 py-3 text-[12px] text-white/55">
                    Access active on <span className="text-white/80">tier {session.access.tier}</span>.
                  </div>
                ) : null}
                {error ? <div className="text-[12px] text-rose-300">{error}</div> : null}
                {loadingSession ? <div className="text-[12px] text-white/25">Checking session...</div> : null}
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
