"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FadeIn, ScaleIn } from "./motion";

const summaryCards = [
  { label: "Portfolio edge", value: "+12.8 pts", delta: "+2.4 pts today", tone: "cyan" },
  { label: "Live signals", value: "18", delta: "6 ready to mirror", tone: "indigo" },
  { label: "Copy strategies", value: "04", delta: "2 outperforming", tone: "slate" },
  { label: "Event watchlist", value: "37", delta: "11 nearing catalyst", tone: "emerald" },
];

const opportunities = [
  {
    name: "Will the Fed cut before September?",
    category: "Macro",
    market: "42%",
    model: "51%",
    edge: "+9 pts",
    confidence: 0.82,
    liquidity: "$2.1M",
  },
  {
    name: "Will ETH ETF inflows beat January?",
    category: "Crypto",
    market: "58%",
    model: "64%",
    edge: "+6 pts",
    confidence: 0.74,
    liquidity: "$1.4M",
  },
  {
    name: "Will Trump win Florida by 5+ points?",
    category: "Election",
    market: "47%",
    model: "54%",
    edge: "+7 pts",
    confidence: 0.79,
    liquidity: "$3.6M",
  },
];

const signalFeed = [
  { time: "12:42", title: "Macro Oracle copied into Fed cut basket", detail: "Synchronized 4 wallets at 0.44 average fill.", positive: true },
  { time: "12:31", title: "Model confidence increased on recession contracts", detail: "News sentiment divergence crossed threshold.", positive: true },
  { time: "12:12", title: "Election market moved into watch state", detail: "Spread tightened after order book depth weakened.", positive: false },
];

const strategies = [
  { name: "Macro Oracle", followers: "124 mirroring", pnl: "+18.2%", risk: "Low turnover" },
  { name: "Catalyst Hunter", followers: "91 mirroring", pnl: "+11.4%", risk: "Event-driven" },
  { name: "Election Flow", followers: "203 mirroring", pnl: "+9.7%", risk: "High liquidity" },
];

function toneClass(tone: string) {
  if (tone === "cyan") return "from-cyan-400/18 to-cyan-400/5 text-cyan-100";
  if (tone === "indigo") return "from-indigo-400/18 to-indigo-400/5 text-indigo-100";
  if (tone === "emerald") return "from-emerald-400/18 to-emerald-400/5 text-emerald-100";
  return "from-white/10 to-white/[0.03] text-slate-100";
}

export function DashboardPage() {
  return (
    <main className="cosmic-shell min-h-screen overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-[320px] bg-[radial-gradient(circle_at_top,rgba(0,229,255,0.12),transparent_45%)]" />

      <div className="mx-auto max-w-7xl px-6 py-6 md:px-8">
        <ScaleIn>
          <header className="glass-panel glow-ring flex flex-wrap items-center justify-between gap-4 rounded-[28px] px-5 py-4">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/24 bg-cyan-400/8">
                  <div className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_18px_rgba(0,229,255,0.85)]" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Lunascope</p>
                  <p className="text-base text-white">Trading intelligence dashboard</p>
                </div>
              </Link>

              <div className="hidden items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] p-1 md:flex">
                {["Overview", "Markets", "Signals", "Copy Trading"].map((item, index) => (
                  <button
                    key={item}
                    className={`rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                      index === 0
                        ? "bg-cyan-400 text-slate-950"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-full border border-emerald-400/18 bg-emerald-400/10 px-4 py-2 text-sm text-emerald-200">
                Wallet connected • 0x7A...19C2
              </div>
              <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition-colors duration-300 hover:border-cyan-300/24">
                Export briefing
              </button>
            </div>
          </header>
        </ScaleIn>

        <section className="grid gap-6 pb-6 pt-10 lg:grid-cols-[1.2fr_0.8fr]">
          <FadeIn>
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.28em] text-cyan-200/80">Overview</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                Calm signal flow for fast-moving prediction markets.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 md:text-lg">
                Prioritized opportunities, copyable strategies, and contract-level confidence shifts are arranged into one premium command surface so decisions feel immediate instead of chaotic.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={0.12}>
            <div className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Session focus</p>
                  <p className="mt-2 text-2xl font-medium text-white">Macro dislocations</p>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                  Highest alpha cluster
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  ["Fed cut basket", "74% conviction", "Up 9 pts vs market"],
                  ["Recession timing", "66% conviction", "Catalyst in 48h"],
                  ["ETH ETF flows", "61% conviction", "Spread stabilizing"],
                ].map(([title, conviction, detail]) => (
                  <div key={title} className="rounded-2xl border border-white/6 bg-slate-950/45 px-4 py-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{title}</p>
                      <p className="text-xs text-cyan-200">{conviction}</p>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card, index) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.08 * index, ease: [0.22, 1, 0.36, 1] }}
              className={`glass-panel rounded-[28px] bg-gradient-to-b p-6 ${toneClass(card.tone)}`}
            >
              <p className="text-sm text-slate-400">{card.label}</p>
              <p className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">{card.value}</p>
              <p className="mt-3 text-sm text-slate-400">{card.delta}</p>
            </motion.div>
          ))}
        </section>

        <section className="grid gap-6 py-8 xl:grid-cols-[1.18fr_0.82fr]">
          <FadeIn className="glass-panel rounded-[32px] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-400">High-conviction markets</p>
                <h2 className="mt-2 text-2xl font-medium tracking-[-0.04em] text-white">Today&apos;s best AI-priced edge</h2>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] p-1">
                {["All", "Macro", "Crypto", "Politics"].map((filter, index) => (
                  <button
                    key={filter}
                    className={`rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                      index === 0 ? "bg-white text-slate-950" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 overflow-hidden rounded-[28px] border border-white/6">
              <div className="grid grid-cols-[1.6fr_0.55fr_0.55fr_0.5fr_0.7fr_0.55fr] gap-4 border-b border-white/6 bg-white/[0.03] px-5 py-4 text-xs uppercase tracking-[0.24em] text-slate-500">
                <p>Market</p>
                <p>Type</p>
                <p>Market</p>
                <p>Model</p>
                <p>Edge</p>
                <p>Depth</p>
              </div>
              <div className="divide-y divide-white/6">
                {opportunities.map((row) => (
                  <div
                    key={row.name}
                    className="grid grid-cols-[1.6fr_0.55fr_0.55fr_0.5fr_0.7fr_0.55fr] gap-4 px-5 py-5 transition-colors duration-300 hover:bg-white/[0.03]"
                  >
                    <div>
                      <p className="text-sm text-white">{row.name}</p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/6">
                        <motion.div
                          initial={{ width: 0 }}
                          whileInView={{ width: `${row.confidence * 100}%` }}
                          viewport={{ once: true, amount: 0.6 }}
                          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-300 to-indigo-400"
                        />
                      </div>
                    </div>
                    <p className="text-sm text-slate-400">{row.category}</p>
                    <p className="text-sm text-slate-300">{row.market}</p>
                    <p className="text-sm text-slate-300">{row.model}</p>
                    <p className="text-sm text-cyan-200">{row.edge}</p>
                    <p className="text-sm text-slate-400">{row.liquidity}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <div className="space-y-6">
            <FadeIn delay={0.08} className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Signal feed</p>
                  <h2 className="mt-2 text-2xl font-medium text-white">Real-time operator stream</h2>
                </div>
                <div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-100">
                  Live
                </div>
              </div>
              <div className="mt-6 space-y-4">
                {signalFeed.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-white/6 bg-slate-950/50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-white">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.time}</p>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
                    <p className={`mt-3 text-xs ${item.positive ? "text-emerald-300" : "text-amber-300"}`}>
                      {item.positive ? "Alpha-positive shift" : "Watch for slippage"}
                    </p>
                  </div>
                ))}
              </div>
            </FadeIn>

            <FadeIn delay={0.16} className="glass-panel rounded-[32px] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Copy trading</p>
                  <h2 className="mt-2 text-2xl font-medium text-white">Strategies worth mirroring</h2>
                </div>
                <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition-colors duration-300 hover:border-cyan-300/24">
                  Manage presets
                </button>
              </div>
              <div className="mt-6 space-y-4">
                {strategies.map((strategy) => (
                  <div key={strategy.name} className="rounded-2xl border border-white/6 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-white">{strategy.name}</p>
                        <p className="mt-1 text-xs text-slate-500">{strategy.followers}</p>
                      </div>
                      <p className="text-sm text-emerald-300">{strategy.pnl}</p>
                    </div>
                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-xs text-slate-500">{strategy.risk}</p>
                      <button className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-medium text-slate-950 transition-transform duration-300 hover:-translate-y-0.5">
                        Mirror strategy
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>
      </div>
    </main>
  );
}
