'use client'
import React, { useEffect, useState } from 'react'
import type { PublishedAnalystSignal } from '@/lib/markets/types'
import { LogoMark } from './icons'
import { getPolymarketMarketUrl } from './polymarket-links'
import { useWalletAuth } from './use-wallet-auth'
import { WalletConnectModal } from './wallet-connect-modal'

type FeedSignal = {
  marketId: string
  market: string
  marketProb: number
  aiProb: number
  edge: string
  edgeVal: number
  conviction: number
  rationale: string
  catalyst: string
  hours: number
  tag: string
  hot: boolean
  tradeHref: string
  detailsHref: string
}

type LiveSignalsResponse = {
  meta?: { signalCount?: number }
  signals?: PublishedAnalystSignal[]
}

type SnapshotMarket = {
  id: string
  slug: string | null
  category: string | null
  endDate: string | null
}

type SnapshotResponse = {
  meta?: { marketCount?: number }
  markets?: SnapshotMarket[]
}

const FALLBACK_SIGNALS: FeedSignal[] = [
  {
    marketId: 'fed-cut-may-2026',
    market: 'Will Fed cut rates in May 2026?',
    marketProb: 34,
    aiProb: 61,
    edge: '+27%',
    edgeVal: 27,
    conviction: 88,
    rationale: 'Core PCE dropped to 2.1% — Fed pivot threshold crossed. Market underpricing cut probability.',
    catalyst: 'FOMC Meeting',
    hours: 18,
    tag: 'MACRO',
    hot: true,
    tradeHref: 'https://polymarket.com',
    detailsHref: '/dashboard',
  },
  {
    marketId: 'btc-100k-before-april',
    market: 'Will BTC hit $100K before April?',
    marketProb: 22,
    aiProb: 41,
    edge: '+19%',
    edgeVal: 19,
    conviction: 74,
    rationale: 'Spot ETF inflows hit 3-month high. Institutional accumulation pattern matches pre-rally structure.',
    catalyst: 'ETF Flow Report',
    hours: 43,
    tag: 'CRYPTO',
    hot: false,
    tradeHref: 'https://polymarket.com',
    detailsHref: '/dashboard',
  },
  {
    marketId: 'trump-crypto-eo-week',
    market: 'Will Trump sign crypto EO this week?',
    marketProb: 58,
    aiProb: 79,
    edge: '+21%',
    edgeVal: 21,
    conviction: 81,
    rationale: 'WH insider briefing leaked to Bloomberg. Three senior officials confirm EO drafted and ready.',
    catalyst: 'White House',
    hours: 6,
    tag: 'POLITICS',
    hot: true,
    tradeHref: 'https://polymarket.com',
    detailsHref: '/dashboard',
  },
  {
    marketId: 'elon-leave-doge-before-june',
    market: 'Will Elon Musk leave DOGE before June?',
    marketProb: 71,
    aiProb: 48,
    edge: '-23%',
    edgeVal: -23,
    conviction: 76,
    rationale: 'Tesla board minutes show no transition discussion. Market overpricing departure probability.',
    catalyst: 'Tesla Board',
    hours: 72,
    tag: 'POLITICS',
    hot: false,
    tradeHref: 'https://polymarket.com',
    detailsHref: '/dashboard',
  },
]

const DEFAULT_MARKET_COUNT = 247
const AUTO_REFRESH_MS = 60_000

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function toPercent(value: number) {
  return Math.round(clamp(value, 0, 1) * 100)
}

function formatSignedPercent(value: number) {
  const rounded = Math.round(value)
  return `${rounded >= 0 ? '+' : ''}${rounded}%`
}

function getTag(category: string | null | undefined) {
  if (!category) return 'LIVE'
  return category.replace(/[_-]+/g, ' ').trim().slice(0, 10).toUpperCase()
}

function getHoursToCatalyst(endDate: string | null | undefined) {
  if (!endDate) return 24
  const hours = Math.ceil((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60))
  if (!Number.isFinite(hours)) return 24
  return clamp(hours, 1, 999)
}

function getConviction(signal: PublishedAnalystSignal) {
  return clamp(Math.round(signal.signal_score * 10), 50, 99)
}

function mapLiveSignals(signals: PublishedAnalystSignal[], marketsById: Map<string, SnapshotMarket>) {
  return signals.map((signal) => {
    const market = marketsById.get(signal.market_id)
    const marketProb = toPercent(signal.analysis.market_price)
    const aiProb = toPercent(signal.analysis.ai_probability)
    const directionalEdge = signal.analysis.side === 'NO'
      ? -Math.round(signal.analysis.edge * 100)
      : Math.round(signal.analysis.edge * 100)

    return {
      marketId: signal.market_id,
      market: signal.title,
      marketProb,
      aiProb,
      edge: formatSignedPercent(directionalEdge),
      edgeVal: directionalEdge,
      conviction: getConviction(signal),
      rationale: signal.rationale,
      catalyst: market?.category ?? 'Live market',
      hours: getHoursToCatalyst(market?.endDate),
      tag: getTag(market?.category),
      hot: Math.abs(directionalEdge) >= 15 || signal.confidence === 'HIGH',
      tradeHref: getPolymarketMarketUrl(market?.slug),
      detailsHref: `/signals/${signal.market_id}`,
    } satisfies FeedSignal
  })
}

function SignalFeedCard({ s, i }: { s: FeedSignal; i: number }) {
  const isPos = s.edgeVal > 0
  const edgeColor = isPos ? 'var(--accent)' : 'var(--danger)'

  return (
    <div
      className="signal-feed-card"
      style={{ animation: `up 0.4s ease ${i * 0.07}s both` }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 7 }}>
            <span className="luna-badge luna-badge-default">{s.tag}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', fontVariantNumeric: 'tabular-nums' }}>
              {s.hours}h to catalyst
            </span>
            {s.hot && (
              <span style={{ fontSize: 10, fontWeight: 700, color: '#22d3ee', letterSpacing: '0.04em' }}>
                ● HOT
              </span>
            )}
          </div>
          <div className="luna-heading" style={{ fontSize: 13.5, lineHeight: 1.42, color: 'rgba(255,255,255,0.88)' }}>
            {s.market}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            className="data-number"
            style={{ fontSize: 22, fontWeight: 700, color: edgeColor, lineHeight: 1 }}
          >
            {s.edge}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.07em', marginTop: 3 }}>
            EDGE
          </div>
        </div>
      </div>

      {/* Rationale */}
      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.32)', lineHeight: 1.6, marginBottom: 12 }}>
        {s.rationale}
      </p>

      {/* Prob bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div className="prob-bar">
            <div className="prob-bar-market" style={{ width: `${s.marketProb}%` }} />
            <div className="prob-bar-ai confidence-bar" style={{ width: `${s.aiProb}%`, background: edgeColor }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
            <span className="data-number" style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>
              Market {s.marketProb}%
            </span>
            <span className="data-number" style={{ fontSize: 10, color: edgeColor }}>
              AI {s.aiProb}%
            </span>
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="data-number" style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
            {s.conviction}
          </div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.07em' }}>CONV</div>
        </div>
      </div>

      {/* Action links */}
      <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
        <a
          href={s.tradeHref}
          target="_blank"
          rel="noreferrer"
          className="luna-button"
          style={{ fontSize: 12, padding: '8px 14px', flex: 1, justifyContent: 'center' }}
        >
          Trade on Polymarket →
        </a>
        <a
          href={s.detailsHref}
          className="luna-button-secondary"
          style={{ fontSize: 12, padding: '8px 14px' }}
        >
          Details
        </a>
      </div>
    </div>
  )
}

export function LandingPage() {
  const [signals, setSignals] = useState<FeedSignal[]>(FALLBACK_SIGNALS)
  const [marketCount, setMarketCount] = useState(DEFAULT_MARKET_COUNT)
  const [walletModalOpen, setWalletModalOpen] = useState(false)
  const {
    wallets,
    session,
    displayWalletAddress,
    connectWallet,
    redeemInvite,
    disconnectWallet,
  } = useWalletAuth()

  useEffect(() => {
    let isMounted = true

    const refreshSignals = async () => {
      try {
        const [signalsResponse, snapshotResponse] = await Promise.allSettled([
          fetch('/api/signals/live?limit=6', { cache: 'no-store' }),
          fetch('/api/markets/snapshot?limit=60', { cache: 'no-store' }),
        ])

        const marketsById = new Map<string, SnapshotMarket>()

        if (snapshotResponse.status === 'fulfilled' && snapshotResponse.value.ok) {
          const snapshot = await snapshotResponse.value.json() as SnapshotResponse
          for (const market of snapshot.markets ?? []) {
            marketsById.set(market.id, market)
          }
          if (isMounted && typeof snapshot.meta?.marketCount === 'number') {
            setMarketCount(snapshot.meta.marketCount)
          }
        }

        if (signalsResponse.status === 'fulfilled' && signalsResponse.value.ok) {
          const payload = await signalsResponse.value.json() as LiveSignalsResponse
          const nextSignals = mapLiveSignals(payload.signals ?? [], marketsById)
          if (isMounted && nextSignals.length > 0) {
            setSignals(nextSignals)
          }
        }
      } catch {
        // Keep fallback signals visible if APIs are temporarily unavailable
      }
    }

    refreshSignals()
    const interval = setInterval(refreshSignals, AUTO_REFRESH_MS)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  const averageEdge = Math.round(
    signals.reduce((total, s) => total + Math.abs(s.edgeVal), 0) / Math.max(signals.length, 1),
  )

  const connectLabel = session.loadingSession
    ? 'Loading...'
    : session.authenticated
      ? displayWalletAddress
      : 'Wallet (optional)'

  const tickerItems = [...signals, ...signals]

  return (
    <>
      {/* ── NAV ── */}
      <nav className="luna-nav">
        <a href="/" className="luna-nav-logo">
          <span className="luna-nav-mark">
            <LogoMark style={{ width: 24, height: 24 }} />
          </span>
          lunascope
        </a>
        <div className="luna-nav-links">
          <a href="#signals" className="luna-nav-link">Signals</a>
          <a href="#how" className="luna-nav-link">How it works</a>
          <a href="#access" className="luna-nav-link">Access</a>
        </div>
        <button
          className="luna-button"
          style={{ fontSize: 13, padding: '7px 18px' }}
          onClick={() => setWalletModalOpen(true)}
        >
          {connectLabel}
        </button>
      </nav>

      {/* ── TICKER ── */}
      <div className="luna-ticker">
        <div className="luna-ticker-track">
          {tickerItems.map((s, i) => (
            <div key={`${s.marketId}-${i}`} className="luna-ticker-item">
              <span
                className="data-number"
                style={{ color: s.edgeVal > 0 ? 'var(--accent)' : 'var(--danger)', fontWeight: 700 }}
              >
                {s.edge}
              </span>
              <span>{s.market.slice(0, 48)}{s.market.length > 48 ? '…' : ''}</span>
              <span style={{ color: 'rgba(255,255,255,0.2)' }}>·</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── PAGE BODY ── */}
      <div className="luna-page" style={{ position: 'relative', zIndex: 1 }}>

        {/* ── HERO + SIGNAL FEED ── */}
        <section className="landing-hero" id="signals">
          {/* LEFT — Copy */}
          <div>
            <div className="hero-eyebrow" style={{ marginBottom: 22, animation: 'up 0.45s ease both' }}>
              <span className="live-dot" />
              LIVE · REFRESHED EVERY 5 MINUTES
            </div>

            <h1 className="hero-title" style={{ marginBottom: 22, animation: 'up 0.45s ease 0.06s both' }}>
              Find the edge<br />
              <span style={{ color: 'rgba(255,255,255,0.28)' }}>before the</span><br />
              <span className="gradient-text">market does.</span>
            </h1>

            <p className="hero-sub" style={{ marginBottom: 36, animation: 'up 0.45s ease 0.12s both' }}>
              AI scans Polymarket 24/7. When the crowd misprices an event — you see it first, with data to back it.
            </p>

            <div style={{ display: 'flex', gap: 10, marginBottom: 52, animation: 'up 0.45s ease 0.18s both' }}>
              <button
                className="luna-button"
                style={{ fontSize: 14, padding: '12px 26px' }}
                onClick={() => document.getElementById('signals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                View signals ↓
              </button>
              <button
                className="luna-button-secondary"
                style={{ fontSize: 14, padding: '12px 24px' }}
                onClick={() => window.location.assign('/dashboard')}
              >
                Open dashboard
              </button>
            </div>

            {/* Stat KPI row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 12,
                animation: 'up 0.45s ease 0.24s both',
              }}
            >
              {[
                { val: `${marketCount}+`, label: 'Markets scanned daily' },
                { val: `avg ${averageEdge}%`, label: 'Edge identified' },
                { val: '5 min', label: 'Refresh cycle' },
              ].map((stat) => (
                <div key={stat.label} className="hero-stat">
                  <div className="hero-stat-val">{stat.val}</div>
                  <div className="hero-stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Signal Feed */}
          <div className="landing-hero-right">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span className="luna-label">SIGNAL FEED</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>
                <span className="live-dot" />
                LIVE
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {signals.map((s, i) => (
                <SignalFeedCard key={`${s.marketId}-${i}`} s={s} i={i} />
              ))}
              {/* Wallet optional pill */}
              <div
                style={{
                  border: '1px solid rgba(126,184,255,0.1)',
                  borderRadius: 12,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'rgba(126,184,255,0.02)',
                }}
              >
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                  No wallet required to act on a signal.
                </span>
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(true)}
                  className="luna-button-ghost"
                  style={{ fontSize: 12, padding: '5px 12px', color: 'var(--accent)', borderColor: 'rgba(126,184,255,0.18)' }}
                >
                  Wallet optional
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <hr className="luna-divider" />

        {/* ── HOW IT WORKS ── */}
        <section className="luna-section" id="how">
          <div style={{ marginBottom: 56 }}>
            <div className="luna-section-label">HOW IT WORKS</div>
            <h2 className="luna-section-title" style={{ marginTop: 10 }}>
              Three layers.<br />
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>One terminal.</span>
            </h2>
          </div>
          <div className="feature-grid">
            {[
              {
                num: '01',
                title: 'Live Market Scan',
                desc: 'Pulls all active Polymarket events every 5 minutes. Filters by volume, liquidity, and proximity to resolution.',
              },
              {
                num: '02',
                title: 'AI Mispricing Detection',
                desc: 'Groq LLM cross-references market probabilities against real-time news, social signals, and structural patterns.',
              },
              {
                num: '03',
                title: 'Edge Score',
                desc: 'Numerical gap between market price and AI-estimated true probability. Only high-conviction signals surface.',
              },
              {
                num: '04',
                title: 'Time-to-Catalyst',
                desc: 'Tracks proximity to resolution. Closer catalysts — higher urgency, faster alpha decay.',
              },
              {
                num: '05',
                title: 'Conviction Score',
                desc: 'Model confidence expressed as a single number. Low-conviction signals are filtered out automatically.',
              },
              {
                num: '06',
                title: 'Optional Operator Access',
                desc: 'The core signal flow stays open. Optional identity and private operator tiers can layer on top later.',
              },
            ].map((f) => (
              <div key={f.num} className="feature-cell">
                <div className="feature-num">{f.num}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── DIVIDER ── */}
        <hr className="luna-divider" />

        {/* ── ACCESS TIERS ── */}
        <section className="luna-section" id="access">
          <div style={{ marginBottom: 48 }}>
            <div className="luna-section-label">ACCESS</div>
            <h2 className="luna-section-title" style={{ marginTop: 10 }}>
              Two tiers.<br />
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>One edge.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Guest */}
            <div className="tier-card">
              <div className="tier-label">GUEST</div>
              <div className="tier-price">Free</div>
              <div className="tier-desc">No wallet required</div>
              <div className="tier-features">
                {['Live signal feed', 'Trade on Polymarket CTA', 'View details on every idea'].map((f) => (
                  <div key={f} className="tier-feature">
                    <span className="tier-check on">✓</span>
                    {f}
                  </div>
                ))}
                {['Priority operator tooling', 'Private research notes', 'Invite-only operator tier'].map((f) => (
                  <div key={f} className="tier-feature dim">
                    <span className="tier-check off">✗</span>
                    {f}
                  </div>
                ))}
              </div>
              <button
                className="luna-button-secondary"
                style={{ width: '100%', padding: '11px', fontSize: 13 }}
                onClick={() => document.getElementById('signals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              >
                View signals
              </button>
            </div>

            {/* Operator */}
            <div className="tier-card featured">
              <div className="tier-label">OPERATOR</div>
              <div className="tier-price gradient-text">Private</div>
              <div className="tier-desc">Invite-only · wallet optional</div>
              <div className="tier-features">
                {[
                  'Private operator desk',
                  'Richer research context',
                  'Higher-priority signal flow',
                  'Invite-only access model',
                  'Wallet remains optional',
                  'Future premium club features',
                ].map((f) => (
                  <div key={f} className="tier-feature">
                    <span className="tier-check on">✓</span>
                    {f}
                  </div>
                ))}
              </div>
              <button
                className="luna-button"
                style={{ width: '100%', padding: '11px', fontSize: 13 }}
                onClick={() => setWalletModalOpen(true)}
              >
                {session.authenticated ? 'Optional wallet connected' : 'Wallet optional'}
              </button>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <div
          style={{
            maxWidth: 1480,
            margin: '0 auto',
            padding: '24px 36px',
            borderTop: '1px solid rgba(126,184,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark style={{ width: 18, height: 18, opacity: 0.6 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.22)' }}>© 2026 Lunascope</span>
          </div>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)' }}>Not financial advice.</span>
          <span style={{ fontSize: 12, color: 'var(--accent)', opacity: 0.6 }}>See what moves the market first.</span>
        </div>
      </div>

      <WalletConnectModal
        open={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
        wallets={wallets}
        session={session}
        displayWalletAddress={displayWalletAddress}
        onConnect={connectWallet}
        onRedeem={redeemInvite}
        onDisconnect={disconnectWallet}
      />
    </>
  )
}

export default LandingPage
