"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowUpRightIcon, ChevronRightIcon, LockIcon, LogoMark, SearchIcon, SparkIcon, WalletIcon } from "./icons";
import { formatPercent, formatSignedPercent, shortenAddress } from "./format";
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

const signalSections = [
  {
    title: "AI Mispricing Engine",
    copy: "Binary Polymarket contracts are scored for narrative lag, liquidity quality, and directional edge before they hit the dashboard.",
  },
  {
    title: "Catalyst Analyst",
    copy: "News-backed AI rationale turns raw pricing dislocation into a trader-grade explanation you can actually act on.",
  },
  {
    title: "Wallet-Gated Alpha",
    copy: "Access is tied to real wallet identity and invite logic, so premium flow stays curated while the product scales.",
  },
];

export function LandingPage() {
  const [signals, setSignals] = useState<LiveSignal[]>([]);
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

    async function loadSignals() {
      try {
        const response = await fetch("/api/signals/live?limit=4", { cache: "no-store" });
        const json = (await response.json()) as { signals?: LiveSignal[] };
        if (active) {
          setSignals(json.signals ?? []);
        }
      } finally {
        if (active) {
          setLoadingSignals(false);
        }
      }
    }

    void loadSignals();
    return () => {
      active = false;
    };
  }, []);

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
      setGateOpen(false);
    } catch {
      return;
    }
  }

  const topSignal = signals[0];

  return (
    <main className="cosmic-shell relative overflow-hidden">
      <div className="luna-grid-mask absolute inset-0" />
      <div className="beam absolute left-[10%] top-[120px] h-[480px] w-[120px] rotate-[28deg] rounded-full bg-cyan-300/35 blur-[110px]" />
      <div className="beam absolute right-[14%] top-[120px] h-[520px] w-[140px] -rotate-[28deg] rounded-full bg-indigo-300/40 blur-[120px]" />
      <div className="beam absolute left-1/2 top-[420px] h-[360px] w-[220px] -translate-x-1/2 rounded-full bg-cyan-400/12 blur-[150px]" />

      <div className="mx-auto max-w-7xl px-6 pb-20 pt-6 md:px-8">
        <motion.header
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          className="luna-shell sticky top-4 z-30 flex items-center justify-between gap-6 rounded-full px-5 py-3"
        >
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/8 text-cyan-200">
              <LogoMark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.34em] text-slate-500">Lunascope</p>
              <p className="text-sm text-slate-100">AI Edge for Polymarket</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
            <a href="#product" className="transition-colors duration-300 hover:text-white">Product</a>
            <a href="#dashboard" className="transition-colors duration-300 hover:text-white">Dashboard</a>
            <a href="#access" className="transition-colors duration-300 hover:text-white">Access</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="luna-button-secondary px-4 py-2 text-sm">
              Live terminal
            </Link>
            <button onClick={() => setGateOpen(true)} className="luna-button px-4 py-2 text-sm">
              Connect wallet
            </button>
          </div>
        </motion.header>

        <section className="relative pt-16 md:pt-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1.08fr_0.92fr]">
            <FadeIn className="max-w-3xl">
              <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-300/18 bg-cyan-300/8 px-4 py-2 text-sm text-cyan-100">
                <span className="live-pulse inline-flex h-2 w-2 rounded-full bg-cyan-300" />
                Live binary market intelligence, refreshed every 5 minutes
              </div>

              <h1 className="max-w-4xl text-[3.4rem] font-semibold leading-[0.96] tracking-[-0.06em] text-white md:text-[5.5rem]">
                Institutional-grade
                <span className="block text-gradient">signal flow for Polymarket.</span>
              </h1>

              <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                Lunascope turns binary event markets into a luxury intelligence terminal: real-time mispricing detection, AI-backed rationale, and private wallet-gated access for serious operators.
              </p>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <Link href="/dashboard" className="luna-button flex items-center gap-2 px-6 py-3">
                  Open dashboard
                  <ChevronRightIcon className="h-4 w-4" />
                </Link>
                <button onClick={() => setGateOpen(true)} className="luna-button-secondary px-6 py-3">
                  Unlock private access
                </button>
              </div>

              <div className="mt-14 grid gap-4 md:grid-cols-3">
                {[
                  ["Binary-only engine", "No noisy multi-outcome markets"],
                  ["AI analyst active", "Groq-powered rationale on live signals"],
                  ["Wallet-ready backend", "Session + invite access already live"],
                ].map(([title, copy], index) => (
                  <motion.div
                    key={title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.4 }}
                    transition={{ duration: 0.55, delay: index * 0.08 }}
                    className="luna-surface premium-card rounded-[28px] p-5"
                  >
                    <p className="text-base font-medium text-white">{title}</p>
                    <p className="mt-3 text-sm leading-6 text-slate-400">{copy}</p>
                  </motion.div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.12}>
              <div id="dashboard" className="luna-shell relative overflow-hidden rounded-[34px] p-4 md:p-5">
                <div className="absolute inset-x-14 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
                <div className="absolute left-12 top-16 h-40 w-40 rounded-full bg-cyan-400/12 blur-[90px]" />
                <div className="rounded-[30px] border border-white/8 bg-[linear-gradient(180deg,rgba(6,9,18,0.98),rgba(7,10,19,0.92))] p-5">
                  <div className="flex items-center justify-between border-b border-white/6 pb-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Private operator terminal</p>
                      <h2 className="mt-2 text-xl font-medium text-white">Signal command deck</h2>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs text-slate-300">
                      <SearchIcon className="h-3.5 w-3.5" />
                      Search markets
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-white/6 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.18),transparent_58%),linear-gradient(180deg,rgba(10,15,27,0.98),rgba(6,10,18,0.96))] p-5">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-slate-400">Lead signal</p>
                            <h3 className="mt-3 text-2xl font-medium leading-tight text-white">
                              {topSignal?.title ?? "Loading live AI signal flow"}
                            </h3>
                          </div>
                          <div className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
                            {topSignal ? `${topSignal.signal_score.toFixed(1)}/10` : "Live"}
                          </div>
                        </div>
                        <p className="mt-5 text-sm leading-7 text-slate-300">
                          {topSignal?.rationale ?? "Fresh analyst rationale appears here as soon as the backend returns a live signal."}
                        </p>
                        <div className="mt-6 grid gap-3 md:grid-cols-3">
                          {[
                            ["Market", topSignal ? formatPercent(topSignal.analysis.market_price) : "--"],
                            ["AI probability", topSignal ? formatPercent(topSignal.analysis.ai_probability) : "--"],
                            ["Edge", topSignal ? formatSignedPercent(topSignal.analysis.edge, 1) : "--"],
                          ].map(([label, value]) => (
                            <div key={label} className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-3">
                              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">{label}</p>
                              <p className="mt-2 text-lg font-medium text-white">{value}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        {(loadingSignals ? Array.from({ length: 3 }) : signals.slice(0, 3)).map((signal, index) => {
                          const isLiveSignal =
                            signal !== null &&
                            typeof signal === "object" &&
                            "market_id" in signal;
                          const liveSignal = isLiveSignal ? (signal as LiveSignal) : null;

                          return (
                            <div
                              key={liveSignal ? liveSignal.market_id : `signal-skeleton-${index}`}
                              className="premium-card rounded-[24px] border border-white/6 bg-white/[0.03] p-4"
                            >
                              {liveSignal ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] uppercase tracking-[0.22em] text-slate-400">
                                      {liveSignal.analysis.side}
                                    </span>
                                    <span className="text-xs text-cyan-200">{liveSignal.confidence}</span>
                                  </div>
                                  <p className="mt-4 line-clamp-2 text-sm font-medium leading-6 text-white">{liveSignal.title}</p>
                                  <p className="mt-4 text-xs text-slate-500">Signal score</p>
                                  <p className="mt-1 text-2xl font-semibold tracking-[-0.05em] text-white">{liveSignal.signal_score.toFixed(1)}</p>
                                </>
                              ) : (
                                <div className="h-[124px] animate-pulse rounded-[20px] bg-white/[0.03]" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
                        <p className="text-sm text-slate-400">Access status</p>
                        <p className="mt-4 text-2xl font-medium text-white">
                          {loadingSession ? "Checking session" : session?.authenticated ? shortenAddress(session.walletAddress) : "Guest mode"}
                        </p>
                        <p className="mt-2 text-sm text-slate-400">
                          {session?.access?.hasAccess ? `Tier ${session.access.tier}` : "Connect wallet and redeem invite to unlock premium flows."}
                        </p>
                        <button onClick={() => setGateOpen(true)} className="luna-button mt-6 w-full justify-center px-4 py-3 text-sm">
                          {session?.authenticated ? "Manage access" : "Connect wallet"}
                        </button>
                      </div>

                      <div className="rounded-[28px] border border-white/6 bg-white/[0.03] p-5">
                        <div className="flex items-center gap-3 text-sm text-slate-300">
                          <SparkIcon className="h-4 w-4 text-cyan-200" />
                          Analyst workflow
                        </div>
                        <div className="mt-5 space-y-4">
                          {[
                            "Polymarket binary markets are normalized and scored.",
                            "Groq analyst produces rationale and directional conviction.",
                            "Signals are persisted and delivered to the terminal layer.",
                          ].map((item, index) => (
                            <div key={item} className="flex gap-3">
                              <div className="mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-[11px] text-cyan-100">
                                0{index + 1}
                              </div>
                              <p className="text-sm leading-6 text-slate-400">{item}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </FadeIn>
          </div>
        </section>

        <section id="product" className="grid gap-5 py-20 md:grid-cols-3">
          {signalSections.map((section, index) => (
            <FadeIn key={section.title} delay={index * 0.08} className="luna-surface premium-card rounded-[30px] p-8">
              <div className="mb-8 inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-cyan-300/16 bg-cyan-300/10 text-cyan-200">
                <SparkIcon className="h-5 w-5" />
              </div>
              <h3 className="text-2xl font-medium tracking-[-0.04em] text-white">{section.title}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">{section.copy}</p>
            </FadeIn>
          ))}
        </section>

        <section id="access" className="grid gap-8 border-t border-white/6 py-16 lg:grid-cols-[0.86fr_1.14fr]">
          <FadeIn>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-200/80">Private access</p>
            <h2 className="mt-4 max-w-xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
              Same LunaScope signal core, wrapped in a calmer and cleaner operator shell.
            </h2>
          </FadeIn>

          <FadeIn delay={0.12} className="grid gap-4 md:grid-cols-2">
            {[
              ["Unified system", "Buttons, typography, spacing, and dark glass surfaces all follow one Lunascope visual language."],
              ["Real data first", "Signal cards and dashboard surfaces are now designed to map directly to the APIs already running in production."],
              ["On-demand detail", "Each signal can expand into a richer view with price history and analyst rationale instead of dead-end UI stubs."],
              ["Wallet-ready shell", "The front-end redesign now sits on top of the real auth and access backend instead of a fake gate."],
            ].map(([title, copy]) => (
              <div key={title} className="luna-surface rounded-[28px] p-6">
                <p className="text-lg font-medium text-white">{title}</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">{copy}</p>
              </div>
            ))}
          </FadeIn>
        </section>
      </div>

      <AnimatePresence>
        {gateOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,14,0.74)] p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="luna-shell w-full max-w-xl rounded-[34px] p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Access terminal</p>
                  <h3 className="mt-3 text-3xl font-medium tracking-[-0.05em] text-white">Connect your wallet and unlock private signals</h3>
                </div>
                <button onClick={() => setGateOpen(false)} className="luna-button-secondary px-3 py-2 text-sm">
                  Close
                </button>
              </div>

              <div className="mt-8 space-y-6">
                <div className="luna-surface rounded-[28px] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                      <WalletIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {session?.authenticated ? shortenAddress(session.walletAddress) : "Injected wallet sign-in"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Supports MetaMask and Rabby in the current browser.
                      </p>
                    </div>
                  </div>

                  <button onClick={handleConnect} disabled={connecting} className="luna-button mt-5 w-full justify-center px-4 py-3 text-sm disabled:opacity-70">
                    {connecting ? "Waiting for signature..." : session?.authenticated ? "Wallet connected" : "Connect injected wallet"}
                  </button>
                </div>

                <div className="luna-surface rounded-[28px] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-slate-200">
                      <LockIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Redeem invite code</p>
                      <p className="mt-1 text-xs text-slate-500">Attach private access to your wallet session.</p>
                    </div>
                  </div>

                  <input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="LUNA-ALPHA"
                    className="mt-5 w-full rounded-[20px] border border-white/8 bg-slate-950/60 px-5 py-4 text-sm tracking-[0.24em] text-white outline-none transition-colors duration-300 placeholder:text-slate-600 focus:border-cyan-300/28"
                  />
                  <button onClick={handleRedeem} disabled={!session?.authenticated || redeeming} className="luna-button mt-4 w-full justify-center px-4 py-3 text-sm disabled:opacity-60">
                    {redeeming ? "Redeeming..." : "Redeem and continue"}
                  </button>
                </div>

                {session?.access?.hasAccess ? (
                  <div className="rounded-[24px] border border-emerald-400/18 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                    Access active on tier {session.access.tier}. You can enter the live dashboard now.
                  </div>
                ) : null}

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-500">Wallet auth backend is live. Provider UX will keep improving in the redesign.</div>
                  <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-cyan-200 transition-colors duration-300 hover:text-cyan-100">
                    Open dashboard
                    <ArrowUpRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
