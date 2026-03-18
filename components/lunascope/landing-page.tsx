"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn, ScaleIn } from "./motion";

const heroStats = [
  { label: "Mispricing delta captured", value: "$12.4M", note: "Across volatile event windows" },
  { label: "Live event signals", value: "214", note: "AI-ranked by edge confidence" },
  { label: "Copy-trading win rate", value: "68%", note: "Last 30 days simulated alpha" },
];

const featureCards = [
  {
    title: "Mispricing detection",
    copy: "Surface event contracts where AI confidence diverges from market probability before the crowd reprices.",
  },
  {
    title: "Smart signals",
    copy: "Receive copy-trading entries sized by confidence, liquidity depth, timing, and market stress.",
  },
  {
    title: "Non-custodial control",
    copy: "Keep wallets disconnected until execution. Lunascope analyzes edge without touching capital.",
  },
];

const marketRows = [
  { market: "US recession by Q4 2026", probability: "36%", model: "47%", edge: "+11 pts", status: "High edge" },
  { market: "ETH ETF inflows beat January", probability: "58%", model: "64%", edge: "+6 pts", status: "Active" },
  { market: "Fed cut before September", probability: "42%", model: "39%", edge: "-3 pts", status: "Watch" },
];

const workflow = [
  "Scan thousands of contracts in real time",
  "Rank probability dislocations using AI confidence",
  "Route only highest-quality entries to your dashboard",
];

export function LandingPage() {
  return (
    <main className="cosmic-shell relative overflow-hidden">
      <div className="grid-lines absolute inset-x-0 top-0 h-[720px] opacity-30" />
      <div className="absolute left-1/2 top-[-160px] h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-cyan-400/8 blur-[140px]" />
      <div className="absolute right-[10%] top-[140px] h-[260px] w-[260px] rounded-full bg-indigo-500/10 blur-[140px]" />

      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 pb-16 pt-6 md:px-8">
        <ScaleIn>
          <header className="glass-panel glow-ring sticky top-4 z-30 flex items-center justify-between rounded-full px-5 py-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-white/5 shadow-[0_0_20px_rgba(0,229,255,0.12)]">
                <div className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(0,229,255,0.85)]" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Lunascope</p>
                <p className="text-sm text-slate-200">AI Edge for Polymarket</p>
              </div>
            </Link>

            <nav className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
              <a href="#product" className="transition-colors duration-300 hover:text-white">Product</a>
              <a href="#signals" className="transition-colors duration-300 hover:text-white">Signals</a>
              <a href="#dashboard-preview" className="transition-colors duration-300 hover:text-white">Dashboard</a>
            </nav>

            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition-all duration-300 hover:border-cyan-300/30 hover:bg-white/5"
              >
                Live dashboard
              </Link>
              <button className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 shadow-[0_0_26px_rgba(0,229,255,0.18)] transition-all duration-300 hover:shadow-[0_0_36px_rgba(0,229,255,0.28)]">
                Connect wallet
              </button>
            </div>
          </header>
        </ScaleIn>

        <section className="relative grid flex-1 items-center gap-16 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
          <FadeIn className="max-w-3xl">
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-cyan-400/20 bg-cyan-400/8 px-4 py-2 text-sm text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.8)]" />
              Real-time mispricing intelligence across Polymarket
            </div>

            <h1 className="max-w-4xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-white md:text-7xl">
              Find the edge
              <span className="text-gradient block">before the market prices it in.</span>
            </h1>

            <p className="mt-8 max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
              Lunascope is a non-custodial AI trading intelligence layer for Polymarket. Detect mispricing, mirror high-signal wallets, and react to fast-moving event flows with calm precision.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/dashboard"
                className="rounded-full bg-cyan-400 px-6 py-3 text-sm font-medium text-slate-950 shadow-[0_0_30px_rgba(0,229,255,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(0,229,255,0.24)]"
              >
                Enter dashboard
              </Link>
              <a
                href="#dashboard-preview"
                className="rounded-full border border-white/10 bg-white/4 px-6 py-3 text-sm text-slate-200 transition-all duration-300 hover:border-cyan-300/20 hover:bg-white/8"
              >
                See product preview
              </a>
            </div>

            <div className="mt-14 grid gap-5 md:grid-cols-3">
              {heroStats.map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.7, delay: 0.15 * index }}
                  className="glass-panel rounded-3xl p-5"
                >
                  <p className="text-sm text-slate-400">{item.label}</p>
                  <p className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white">{item.value}</p>
                  <p className="mt-2 text-sm text-slate-500">{item.note}</p>
                </motion.div>
              ))}
            </div>
          </FadeIn>

          <ScaleIn delay={0.15}>
            <div id="dashboard-preview" className="glass-panel relative overflow-hidden rounded-[32px] border border-white/10 p-4 md:p-5">
              <div className="absolute inset-x-16 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/50 to-transparent" />
              <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-cyan-400/8 blur-3xl" />

              <div className="rounded-[28px] border border-white/8 bg-[rgba(4,9,19,0.94)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="flex items-center justify-between border-b border-white/6 pb-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Live edge monitor</p>
                    <h2 className="mt-2 text-lg font-medium text-white">Polymarket command center</h2>
                  </div>
                  <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                    +18 opportunities
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="space-y-4">
                    <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-400">Current conviction</p>
                          <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-white">74%</p>
                        </div>
                        <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
                          AI confidence elevated
                        </div>
                      </div>
                      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/6">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: "74%" }}
                          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-cyan-400 to-indigo-400"
                        />
                      </div>
                    </div>

                    <div className="rounded-3xl border border-white/6 bg-white/[0.03] p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-slate-400">Top live dislocations</p>
                        <p className="text-xs text-slate-500">Updated 11 sec ago</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {marketRows.map((row) => (
                          <div
                            key={row.market}
                            className="flex items-center justify-between rounded-2xl border border-white/6 bg-slate-950/50 px-4 py-3 transition-colors duration-300 hover:border-cyan-300/18"
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
                          </div>
                        ))}
                      </div>
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
                          <div key={name} className="flex items-center justify-between rounded-2xl bg-slate-950/50 px-4 py-3">
                            <p className="text-sm text-white">{name}</p>
                            <p className="text-sm text-emerald-300">{pnl}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScaleIn>
        </section>

        <section id="product" className="grid gap-6 border-t border-white/6 py-20 md:grid-cols-3">
          {featureCards.map((card, index) => (
            <FadeIn key={card.title} delay={index * 0.1} className="glass-panel rounded-[28px] p-8">
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
              Institutional calm for a market that moves on headlines.
            </h2>
          </FadeIn>

          <FadeIn delay={0.15} className="grid gap-4 md:grid-cols-2">
            {[
              ["Signal quality", "Every opportunity is ranked across confidence, spread, timing, and event volatility."],
              ["Execution trust", "Wallet-first architecture keeps intelligence separate from capital management."],
              ["Operator speed", "See watchlists, copy strategies, and edge heatmaps in one uninterrupted flow."],
              ["Premium feel", "Minimal visuals, deliberate spacing, and restrained motion help the product feel credible."],
            ].map(([title, copy]) => (
              <div key={title} className="glass-panel rounded-[28px] p-7">
                <h3 className="text-lg font-medium text-white">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{copy}</p>
              </div>
            ))}
          </FadeIn>
        </section>
      </div>
    </main>
  );
}
