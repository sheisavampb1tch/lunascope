"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { FadeIn, ScaleIn } from "./motion";

const heroStats = [
  { label: "Signal windows monitored", value: "24/7", note: "Macro, elections, crypto catalysts" },
  { label: "Median mispricing spread", value: "6.4 pts", note: "Across current high-liquidity events" },
  { label: "Premium access", value: "Invite-only", note: "Curated onboarding for early operators" },
];

const featureCards = [
  {
    title: "Mispricing detection",
    copy: "AI models flag contracts where implied probability lags narrative and order-flow reality.",
  },
  {
    title: "Copy-trading signals",
    copy: "Mirror conviction from high-signal wallets with cleaner timing, sizing cues, and execution context.",
  },
  {
    title: "Non-custodial control",
    copy: "Lunascope never holds funds. Intelligence is unlocked first, wallet action stays in your hands.",
  },
];

const marketRows = [
  { market: "US recession by Q4 2026", probability: "36%", model: "47%", edge: "+11 pts", status: "High edge" },
  { market: "ETH ETF inflows beat January", probability: "58%", model: "64%", edge: "+6 pts", status: "Active" },
  { market: "Fed cut before September", probability: "42%", model: "39%", edge: "-3 pts", status: "Watch" },
];

const workflow = [
  "Watch liquidity and event velocity in real time",
  "Score dislocations with AI confidence and catalyst timing",
  "Unlock only the highest-conviction edges behind wallet access",
];

const walletOptions = [
  { id: "rabby", label: "Rabby", note: "Best for active traders" },
  { id: "metamask", label: "MetaMask", note: "Browser wallet" },
  { id: "walletconnect", label: "WalletConnect", note: "Mobile handoff" },
];

type AccessState = {
  granted: boolean;
  walletLabel: string | null;
};

function getSessionId() {
  if (typeof window === "undefined") return "server";
  const existing = window.localStorage.getItem("lunascope_session");
  if (existing) return existing;
  const next = crypto.randomUUID();
  window.localStorage.setItem("lunascope_session", next);
  return next;
}

async function track(event: string, meta: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    event,
    sessionId: getSessionId(),
    path: window.location.pathname,
    meta,
    timestamp: new Date().toISOString(),
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/analytics", payload);
    return;
  }

  await fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
    keepalive: true,
  });
}

export function LandingPage() {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessState>({ granted: false, walletLabel: null });

  useEffect(() => {
    const raw = window.localStorage.getItem("lunascope_access");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as AccessState;
      if (parsed.granted) {
        setAccess(parsed);
      }
    } catch {
      window.localStorage.removeItem("lunascope_access");
    }
  }, []);

  const gateLabel = useMemo(() => {
    if (access.granted) return `Access granted${access.walletLabel ? ` via ${access.walletLabel}` : ""}`;
    return "Locked AI edge preview";
  }, [access]);

  async function openGate() {
    setModalOpen(true);
    setError(null);
    await track("gate_opened");
  }

  async function verifyAccess() {
    if (!selectedWallet) {
      setError("Choose a wallet to continue.");
      return;
    }

    setPending(true);
    setError(null);

    await track("wallet_connect_clicked", { wallet: selectedWallet });

    try {
      const response = await fetch("/api/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wallet: selectedWallet,
          inviteCode,
        }),
      });

      const result = (await response.json()) as { granted?: boolean; walletLabel?: string; error?: string };
      if (!response.ok || !result.granted) {
        setError(result.error ?? "Access was not granted.");
        await track("invite_rejected", { wallet: selectedWallet });
        return;
      }

      const nextAccess: AccessState = { granted: true, walletLabel: result.walletLabel ?? selectedWallet };
      window.localStorage.setItem("lunascope_access", JSON.stringify(nextAccess));
      setAccess(nextAccess);
      setModalOpen(false);
      await track("access_granted", { wallet: selectedWallet });
      router.push("/dashboard");
    } catch {
      setError("Access check failed. Please try again.");
      await track("access_error", { wallet: selectedWallet });
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="cosmic-shell relative overflow-hidden">
      <div className="grid-lines absolute inset-x-0 top-0 h-[760px] opacity-30" />
      <div className="absolute left-1/2 top-[-160px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-cyan-400/7 blur-[160px]" />
      <div className="absolute right-[8%] top-[160px] h-[280px] w-[280px] rounded-full bg-indigo-500/10 blur-[150px]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-6 md:px-8">
        <ScaleIn>
          <header className="glass-panel glow-ring sticky top-4 z-30 flex items-center justify-between rounded-full px-5 py-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/28 bg-white/5 shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <motion.div
                  animate={{ scale: [1, 1.18, 1], opacity: [0.9, 1, 0.9] }}
                  transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3.2, ease: "easeInOut" }}
                  className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(0,229,255,0.85)]"
                />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Lunascope</p>
                <p className="text-sm text-slate-200">AI Edge for Polymarket</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a href="#product" className="transition-colors duration-300 hover:text-white">Product</a>
              <a href="#signals" className="transition-colors duration-300 hover:text-white">Signals</a>
              <a href="#dashboard-preview" className="transition-colors duration-300 hover:text-white">Preview</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition-all duration-300 hover:border-cyan-300/28 hover:bg-white/5"
              >
                Dashboard
              </Link>
              <button
                onClick={openGate}
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_26px_rgba(0,229,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(0,229,255,0.28)]"
              >
                Connect wallet
              </button>
            </div>
          </header>
        </ScaleIn>

        <section className="relative grid flex-1 items-start gap-16 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <FadeIn className="max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-sm text-cyan-100">
              <span className="live-pulse h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]" />
              Real-time probability intelligence for operators who move early
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.055em] text-white md:text-7xl">
              See the signal
              <span className="text-gradient block">before consensus catches up.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Lunascope is a premium non-custodial intelligence layer for Polymarket. It spots mispriced event contracts, tracks smart wallets, and turns noise into calm, high-conviction execution.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={openGate}
                className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-slate-950 shadow-[0_0_30px_rgba(0,229,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(0,229,255,0.24)]"
              >
                Unlock AI Edge
              </button>
              <button
                onClick={async () => {
                  await track("view_only_clicked");
                  document.getElementById("dashboard-preview")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                className="rounded-full border border-white/10 bg-white/4 px-6 py-3 text-sm text-slate-200 transition-all duration-300 hover:border-cyan-300/20 hover:bg-white/8"
              >
                View locked preview
              </button>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {heroStats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, transition: { duration: 0.25 } }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.7, delay: 0.12 * index }}
                  className="glass-panel premium-card rounded-3xl p-5"
                >
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.note}</p>
                </motion.div>
              ))}
            </div>
          </FadeIn>

          <ScaleIn delay={0.15}>
            <div id="dashboard-preview" className="glass-panel relative overflow-hidden rounded-[36px] border border-white/10 p-4 md:p-5">
              <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
              <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-400/8 blur-3xl" />

              <div className="rounded-[30px] border border-white/8 bg-[rgba(4,9,19,0.94)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between border-b border-white/6 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live edge monitor</p>
                    <h2 className="mt-2 text-lg font-medium text-white">Polymarket command center</h2>
                  </div>
                  <motion.div
                    animate={{ boxShadow: ["0 0 0 rgba(0,229,255,0.14)", "0 0 18px rgba(0,229,255,0.16)", "0 0 0 rgba(0,229,255,0.14)"] }}
                    transition={{ repeat: Number.POSITIVE_INFINITY, duration: 3 }}
                    className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100"
                  >
                    +18 opportunities
                  </motion.div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.08fr_0.92fr]">
                  <div className="space-y-4">
                    <motion.div whileHover={{ y: -3 }} className="premium-card rounded-3xl border border-white/6 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Current conviction</p>
                          <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-white">74%</p>
                        </div>
                        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                          AI confidence elevated
                        </div>
                      </div>
                      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-white/6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: ["0%", "74%", "71%", "74%"] }}
                          transition={{ duration: 3.6, ease: [0.22, 1, 0.36, 1], repeat: Number.POSITIVE_INFINITY, repeatDelay: 0.8 }}
                          className="confidence-bar h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-indigo-400"
                        />
                      </div>
                    </motion.div>

                    <div className="space-y-3 rounded-3xl border border-white/6 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">Top live dislocations</p>
                        <p className="text-xs text-slate-500">Updated 11 sec ago</p>
                      </div>
                      {marketRows.map((row) => (
                        <motion.div
                          key={row.market}
                          whileHover={{ y: -2, scale: 1.01 }}
                          className="premium-card flex items-center justify-between rounded-2xl border border-white/6 bg-slate-950/50 px-4 py-3"
                        >
                          <div>
                            <p className="text-sm text-white">{row.market}</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Market {row.probability} / Model {row.model}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-cyan-200">{row.edge}</p>
                            <p className="mt-1 text-xs text-slate-500">{row.status}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/6 bg-gradient-to-b from-indigo-500/10 to-transparent p-5">
                      <p className="text-sm text-slate-400">Signal pipeline</p>
                      <div className="mt-5 space-y-4">
                        {workflow.map((step, index) => (
                          <div key={step} className="flex gap-4">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 text-sm text-cyan-100">
                              0{index + 1}
                            </div>
                            <p className="pt-1 text-sm leading-6 text-slate-300">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-5">
                      <p className="text-sm text-slate-400">Smart copy-trading</p>
                      <div className="mt-4 space-y-3">
                        {[
                          ["Macro Oracle", "+9.8%"],
                          ["Election Flow", "+7.2%"],
                          ["Catalyst Hunter", "+4.9%"],
                        ].map(([name, pnl]) => (
                          <motion.div
                            key={name}
                            whileHover={{ y: -2, scale: 1.01 }}
                            className="premium-card flex items-center justify-between rounded-2xl bg-slate-950/50 px-4 py-3"
                          >
                            <p className="text-sm text-white">{name}</p>
                            <p className="text-sm text-emerald-300">{pnl}</p>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="absolute inset-6 rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(6,10,18,0.1),rgba(6,10,18,0.55))] backdrop-blur-md" />
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel glow-ring max-w-md rounded-[30px] px-8 py-8 text-center"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-cyan-400/18 bg-cyan-400/10">
                    <div className="h-5 w-5 rounded-full border border-cyan-300/50" />
                  </div>
                  <p className="mt-5 text-xs uppercase tracking-[0.3em] text-slate-500">{gateLabel}</p>
                  <h3 className="mt-4 text-2xl font-medium tracking-[-0.04em] text-white">Unlock the full AI edge layer</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-300">
                    Connect a wallet and apply an invite code to access live mispricing, smart money signals, and revenue-grade intelligence.
                  </p>
                  <div className="mt-6 flex flex-col gap-3">
                    <button
                      onClick={openGate}
                      className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-medium text-slate-950 transition-all duration-300 hover:-translate-y-0.5"
                    >
                      Connect wallet to unlock
                    </button>
                    <p className="text-xs text-slate-500">Invite-only beta • privacy-first analytics • non-custodial access</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </ScaleIn>
        </section>

        <section id="product" className="grid gap-6 border-t border-white/6 py-20 md:grid-cols-3">
          {featureCards.map((card, index) => (
            <FadeIn key={card.title} delay={index * 0.1} className="glass-panel premium-card rounded-[30px] p-8">
              <div className="mb-8 h-10 w-10 rounded-2xl border border-cyan-400/18 bg-cyan-400/10" />
              <h3 className="text-2xl font-medium tracking-[-0.03em] text-white">{card.title}</h3>
              <p className="mt-4 text-base leading-7 text-slate-400">{card.copy}</p>
            </FadeIn>
          ))}
        </section>

        <section id="signals" className="grid gap-10 py-10 lg:grid-cols-[0.8fr_1.2fr]">
          <FadeIn className="max-w-xl">
            <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Why it converts</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white md:text-5xl">
              A polished gate that turns curiosity into qualified access.
            </h2>
          </FadeIn>

          <FadeIn delay={0.15} className="grid gap-4 md:grid-cols-2">
            {[
              ["Premium scarcity", "Invite codes create status, control onboarding quality, and support paid access later."],
              ["Wallet-first conversion", "Primary CTA conditions visitors into the exact unlock flow we will monetize."],
              ["Trust through restraint", "High-value data is visible enough to create desire, but protected by a premium glass gate."],
              ["Clean measurement", "Privacy-safe event tracking now captures where users drop before or after wallet intent."],
            ].map(([title, copy]) => (
              <div key={title} className="glass-panel rounded-[28px] p-7">
                <h3 className="text-lg font-medium text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{copy}</p>
              </div>
            ))}
          </FadeIn>
        </section>
      </div>

      <AnimatePresence>
        {modalOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(2,6,14,0.76)] p-6 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="glass-panel glow-ring w-full max-w-xl rounded-[32px] p-7"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Access gate</p>
                  <h3 className="mt-3 text-3xl font-medium tracking-[-0.04em] text-white">Connect wallet to unlock premium signals</h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300"
                >
                  Close
                </button>
              </div>

              <div className="mt-8 space-y-7">
                <div>
                  <p className="text-sm text-slate-400">1. Choose wallet</p>
                  <div className="mt-4 grid gap-3 md:grid-cols-3">
                    {walletOptions.map((wallet) => {
                      const active = selectedWallet === wallet.id;
                      return (
                        <button
                          key={wallet.id}
                          onClick={() => setSelectedWallet(wallet.id)}
                          className={`premium-card rounded-[24px] border px-4 py-4 text-left transition-all duration-300 ${
                            active
                              ? "border-cyan-300/40 bg-cyan-400/10 shadow-[0_0_24px_rgba(0,229,255,0.08)]"
                              : "border-white/8 bg-white/[0.03] hover:border-cyan-300/18"
                          }`}
                        >
                          <p className="text-sm font-medium text-white">{wallet.label}</p>
                          <p className="mt-1 text-xs text-slate-500">{wallet.note}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <p className="text-sm text-slate-400">2. Enter invite code</p>
                  <input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="LUNA-ALPHA"
                    className="mt-4 w-full rounded-[22px] border border-white/8 bg-slate-950/60 px-5 py-4 text-base tracking-[0.18em] text-white outline-none transition-colors duration-300 placeholder:text-slate-600 focus:border-cyan-300/28"
                  />
                  <p className="mt-3 text-xs text-slate-500">Use beta allowlist code. Demo codes can be supplied from environment later.</p>
                </div>

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={verifyAccess}
                    disabled={pending}
                    className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-slate-950 transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-70"
                  >
                    {pending ? "Verifying access..." : "Verify & unlock dashboard"}
                  </button>
                  <button
                    onClick={async () => {
                      await track("view_only_modal_closed");
                      setModalOpen(false);
                    }}
                    className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-300 transition-colors duration-300 hover:border-white/20"
                  >
                    Stay in preview mode
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
