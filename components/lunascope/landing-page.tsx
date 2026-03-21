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
  meta?: {
    signalCount?: number
  }
  signals?: PublishedAnalystSignal[]
}

type SnapshotMarket = {
  id: string
  slug: string | null
  category: string | null
  endDate: string | null
}

type SnapshotResponse = {
  meta?: {
    marketCount?: number
  }
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

function SignalCard({ s, i, locked }: { s: FeedSignal; i: number; locked?: boolean }) {
  const isPos = s.edgeVal > 0
  return (
    <div style={{
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: 12,
      padding: '16px 18px',
      position: 'relative',
      animation: `up 0.4s ease ${i * 0.08}s both`,
      transition: 'border-color 0.15s',
      filter: locked ? 'blur(3px)' : 'none',
      userSelect: locked ? 'none' : 'auto',
    }}
    onMouseEnter={e => { if (!locked) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)' }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em',
              color: 'rgba(255,255,255,0.35)',
              background: 'rgba(255,255,255,0.05)',
              padding: '2px 6px', borderRadius: 4,
            }}>{s.tag}</span>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
              {s.hours}h to catalyst
            </span>
            {s.hot && <span style={{ fontSize: 10, color: '#22d3ee', fontWeight: 600 }}>● HOT</span>}
          </div>
          <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.85)', lineHeight: 1.4 }}>{s.market}</div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontSize: 20, fontWeight: 700,
            color: isPos ? '#7EB8FF' : '#f87171',
            fontVariantNumeric: 'tabular-nums',
          }}>{s.edge}</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.06em' }}>EDGE</div>
        </div>
      </div>

      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5, marginBottom: 12 }}>
        {s.rationale}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ position: 'relative', height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2 }}>
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${s.marketProb}%`, background: 'rgba(255,255,255,0.18)', borderRadius: 2 }} />
            <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${s.aiProb}%`, background: isPos ? '#7EB8FF' : '#f87171', borderRadius: 2, opacity: 0.6 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontVariantNumeric: 'tabular-nums' }}>Market {s.marketProb}%</span>
            <span style={{ fontSize: 10, color: isPos ? '#7EB8FF' : '#f87171', fontVariantNumeric: 'tabular-nums' }}>AI {s.aiProb}%</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{s.conviction}</div>
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.06em' }}>CONV</div>
        </div>
      </div>

      {!locked ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 14 }}>
          <a
            href={s.tradeHref}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 36,
              padding: '0 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              color: '#0c0c0e',
              textDecoration: 'none',
              background: 'linear-gradient(135deg, #7EB8FF, #00C4FF)',
              boxShadow: '0 0 18px rgba(126,184,255,0.2)',
            }}
          >
            Trade on Polymarket →
          </a>
          <a
            href={s.detailsHref}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 36,
              padding: '0 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 500,
              color: 'rgba(255,255,255,0.72)',
              textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
            }}
          >
            View details
          </a>
        </div>
      ) : null}
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
        // Keep the fallback signal feed visible if live APIs are temporarily unavailable.
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
    signals.reduce((total, signal) => total + Math.abs(signal.edgeVal), 0) / Math.max(signals.length, 1),
  )
  const connectLabel = session.loadingSession
    ? 'Loading...'
    : session.authenticated
      ? displayWalletAddress
      : 'Wallet (optional)'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; -webkit-font-smoothing: antialiased; }
        body {
          background: #0c0c0e;
          color: #f0f0f2;
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }

        /* BG GLOW */
        body::before {
          content: '';
          position: fixed; inset: 0; pointer-events: none; z-index: 0;
          background:
            radial-gradient(ellipse 600px 400px at 80% 10%, rgba(126,184,255,0.06) 0%, transparent 70%),
            radial-gradient(ellipse 400px 300px at 10% 80%, rgba(0,196,255,0.04) 0%, transparent 70%);
        }

        @keyframes up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes ticker { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes shimmer { 0%{opacity:0.5} 50%{opacity:1} 100%{opacity:0.5} }
        @keyframes borderGlow {
          0%,100% { box-shadow: 0 0 0 rgba(126,184,255,0); }
          50% { box-shadow: 0 0 20px rgba(126,184,255,0.08); }
        }

        /* NAV */
        .nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          height: 56px;
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 36px;
          background: rgba(12,12,14,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid rgba(126,184,255,0.08);
        }
        .nav-logo {
          display: flex; align-items: center; gap: 8px;
          font-size: 15px; font-weight: 700; letter-spacing: -0.3px;
          text-decoration: none; color: inherit;
        }
        .nav-logo-icon {
          width: 28px; height: 28px;
          display: flex; align-items: center; justify-content: center;
          filter: drop-shadow(0 0 14px rgba(126,184,255,0.16));
          flex-shrink: 0;
        }
        .nav-links { display: flex; gap: 24px; }
        .nav-link {
          font-size: 13px; font-weight: 500;
          color: rgba(255,255,255,0.4);
          text-decoration: none; transition: color 0.15s;
        }
        .nav-link:hover { color: rgba(255,255,255,0.85); }
        .nav-cta {
          font-family: 'Inter', sans-serif;
          font-size: 13px; font-weight: 600;
          color: #0c0c0e;
          background: linear-gradient(135deg, #7EB8FF, #00C4FF);
          border: none; cursor: pointer;
          padding: 7px 18px; border-radius: 7px;
          transition: opacity 0.15s, box-shadow 0.2s;
          box-shadow: 0 0 16px rgba(126,184,255,0.2);
        }
        .nav-cta:hover { opacity: 0.9; box-shadow: 0 0 24px rgba(126,184,255,0.35); }

        /* TICKER */
        .ticker {
          position: fixed; top: 56px; left: 0; right: 0; z-index: 99;
          height: 28px; overflow: hidden;
          background: rgba(126,184,255,0.03);
          border-bottom: 1px solid rgba(126,184,255,0.07);
          display: flex; align-items: center;
        }
        .ticker-inner {
          display: flex; gap: 40px;
          animation: ticker 35s linear infinite;
          width: max-content;
          font-size: 11px; font-weight: 500;
        }
        .ticker-item { display: flex; align-items: center; gap: 8px; white-space: nowrap; color: rgba(255,255,255,0.35); }

        /* PAGE */
        .page { padding-top: 84px; position: relative; z-index: 1; }

        /* HERO */
        .hero {
          max-width: 1400px; margin: 0 auto;
          padding: 84px 36px 92px;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) 500px;
          gap: 96px;
          align-items: start;
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.06em;
          color: #7EB8FF;
          background: rgba(126,184,255,0.07);
          border: 1px solid rgba(126,184,255,0.15);
          border-radius: 20px; padding: 5px 12px;
          margin-bottom: 20px;
          animation: up 0.5s ease both;
        }
        .live-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #7EB8FF; box-shadow: 0 0 6px #7EB8FF;
          animation: pulse 1.4s ease-in-out infinite;
        }

        .hero-title {
          font-size: clamp(40px, 4.6vw, 64px);
          font-weight: 800;
          letter-spacing: -2.6px;
          line-height: 1.04;
          margin-bottom: 20px;
          animation: up 0.5s ease 0.06s both;
        }
        .hero-title em {
          font-style: normal;
          color: rgba(255,255,255,0.3);
        }

        .hero-sub {
          font-size: 16px;
          color: rgba(255,255,255,0.4);
          line-height: 1.65;
          margin-bottom: 36px;
          max-width: 500px;
          font-weight: 400;
          animation: up 0.5s ease 0.12s both;
        }

        .hero-actions {
          display: flex; gap: 10px;
          animation: up 0.5s ease 0.18s both;
          margin-bottom: 56px;
        }
        .btn-primary {
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 600;
          color: #0c0c0e; background: linear-gradient(135deg, #7EB8FF, #00C4FF);
          border: none; cursor: pointer;
          padding: 12px 24px; border-radius: 9px;
          transition: all 0.2s;
          box-shadow: 0 0 20px rgba(126,184,255,0.25);
        }
        .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); box-shadow: 0 4px 28px rgba(126,184,255,0.4); }
        .btn-outline {
          font-family: 'Inter', sans-serif;
          font-size: 14px; font-weight: 500;
          color: rgba(255,255,255,0.55);
          background: transparent;
          border: 1px solid rgba(126,184,255,0.15);
          cursor: pointer; padding: 12px 22px; border-radius: 9px;
          transition: all 0.2s;
        }
        .btn-outline:hover { border-color: rgba(126,184,255,0.35); color: #7EB8FF; background: rgba(126,184,255,0.05); }

        .hero-stats {
          display: flex; gap: 48px;
          padding-top: 36px;
          border-top: 1px solid rgba(126,184,255,0.08);
          animation: up 0.5s ease 0.24s both;
        }
        .stat-val {
          font-size: 26px; font-weight: 700; letter-spacing: -0.7px;
          font-variant-numeric: tabular-nums;
          color: #7EB8FF;
        }
        .stat-label { font-size: 13px; color: rgba(255,255,255,0.3); margin-top: 4px; }

        /* FEED */
        .feed { animation: up 0.5s ease 0.1s both; }
        .feed-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px;
        }
        .feed-label { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; color: rgba(255,255,255,0.3); }
        .feed-live { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #7EB8FF; font-weight: 600; }

        .locked-overlay {
          border: 1px solid rgba(126,184,255,0.1);
          border-radius: 12px; padding: 16px 18px;
          display: flex; align-items: center; justify-content: center; gap: 10px;
          font-size: 12px; color: rgba(255,255,255,0.3); font-weight: 500;
          background: rgba(126,184,255,0.02);
        }

        /* DIVIDER */
        .divider {
          max-width: 1400px; margin: 0 auto;
          border: none; border-top: 1px solid rgba(126,184,255,0.07);
        }

        /* HOW IT WORKS */
        .section {
          max-width: 1400px; margin: 0 auto;
          padding: 92px 36px;
        }
        .section-label { font-size: 11px; font-weight: 600; letter-spacing: 0.07em; color: #7EB8FF; margin-bottom: 12px; }
        .section-title { font-size: clamp(28px, 3vw, 40px); font-weight: 800; letter-spacing: -1.3px; margin-bottom: 56px; line-height: 1.08; }

        .features {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 1px; background: rgba(126,184,255,0.06);
          border-radius: 14px; overflow: hidden;
          box-shadow: 0 0 40px rgba(126,184,255,0.04);
        }
        .feature {
          background: #0c0c0e;
          padding: 28px 24px;
          transition: background 0.2s;
        }
        .feature:hover { background: rgba(126,184,255,0.03); }
        .feature-num { font-size: 11px; font-weight: 700; color: #7EB8FF; letter-spacing: 0.06em; margin-bottom: 12px; opacity: 0.6; }
        .feature-title { font-size: 14px; font-weight: 600; margin-bottom: 7px; }
        .feature-desc { font-size: 13px; color: rgba(255,255,255,0.35); line-height: 1.6; }

        /* ACCESS */
        .access {
          max-width: 1400px; margin: 0 auto;
          padding: 0 36px 112px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
        }
        .access-card {
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px; padding: 36px;
          transition: all 0.2s;
        }
        .access-card:hover { border-color: rgba(126,184,255,0.2); }
        .access-card.featured {
          border-color: rgba(126,184,255,0.2);
          background: rgba(126,184,255,0.03);
          box-shadow: 0 0 40px rgba(126,184,255,0.06);
          animation: borderGlow 4s ease-in-out infinite;
        }
        .access-tier { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; color: rgba(255,255,255,0.3); margin-bottom: 16px; }
        .access-price { font-size: 36px; font-weight: 800; letter-spacing: -1.5px; margin-bottom: 4px; }
        .access-price.blue {
          background: linear-gradient(135deg, #7EB8FF, #00C4FF);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .access-desc { font-size: 13px; color: rgba(255,255,255,0.3); margin-bottom: 24px; }
        .access-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 28px; }
        .access-item { display: flex; align-items: center; gap: 10px; font-size: 13px; color: rgba(255,255,255,0.6); }
        .access-item.dim { color: rgba(255,255,255,0.2); }
        .check { font-size: 12px; }

        /* FOOTER */
        .footer {
          border-top: 1px solid rgba(126,184,255,0.07);
          max-width: 1400px; margin: 0 auto;
          padding: 24px 36px;
          display: flex; align-items: center; justify-content: space-between;
          font-size: 12px; color: rgba(255,255,255,0.2);
        }
        .footer span:last-child { color: #7EB8FF; opacity: 0.6; }

        @media (max-width: 1280px) {
          .hero {
            max-width: 1240px;
            grid-template-columns: minmax(0, 1fr) 440px;
            gap: 64px;
          }
          .section,
          .access,
          .footer,
          .divider {
            max-width: 1240px;
          }
        }

        @media (max-width: 768px) {
          .hero { grid-template-columns: 1fr; gap: 48px; }
          .features { grid-template-columns: 1fr; }
          .access { grid-template-columns: 1fr; }
          .nav-links { display: none; }
          .nav { padding: 0 20px; }
          .hero { padding: 72px 20px 80px; }
          .section { padding: 80px 20px; }
          .access { padding: 0 20px 100px; }
          .footer { padding: 24px 20px; }
        }
      `}</style>

      {/* NAV */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-logo-icon">
            <LogoMark style={{ width: 24, height: 24 }} />
          </div>
          lunascope
        </a>
        <div className="nav-links">
          <a href="#signals" className="nav-link">Signals</a>
          <a href="#how" className="nav-link">How it works</a>
          <a href="#access" className="nav-link">Access</a>
        </div>
        <button className="nav-cta" onClick={() => setWalletModalOpen(true)}>{connectLabel}</button>
      </nav>

      {/* TICKER */}
      <div className="ticker">
        <div className="ticker-inner">
          {[...Array(2)].flatMap(() => signals).map((s, i) => (
            <div key={i} className="ticker-item">
              <span style={{ color: s.edgeVal > 0 ? '#7EB8FF' : '#f87171', fontWeight: 700 }}>{s.edge}</span>
              <span>{s.market.slice(0, 45)}...</span>
              <span style={{ color: rgba255(255, 255, 255, 0.2) }}>·</span>
            </div>
          ))}
        </div>
      </div>

      <div className="page">
        {/* HERO */}
        <section className="hero" id="signals">
          <div>
            <div className="hero-eyebrow">
              <span className="live-dot" />
              LIVE · REFRESHED EVERY 5 MINUTES
            </div>

            <h1 className="hero-title">
              Find the edge<br />
              <em>before the</em><br />
              market does.
            </h1>

            <p className="hero-sub">
              AI scans Polymarket 24/7. When the crowd misprices an event — you see it first, with data to back it.
            </p>

            <div className="hero-actions">
              <button className="btn-primary" onClick={() => document.getElementById('signals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View signals ↓</button>
              <button className="btn-outline" onClick={() => window.location.assign('/dashboard')}>Open dashboard</button>
            </div>

            <div className="hero-stats">
              {[
                { val: `${marketCount}+`, label: 'Markets scanned daily' },
                { val: `avg ${averageEdge}%`, label: 'Edge identified' },
                { val: '5 min', label: 'Refresh cycle' },
              ].map((s, i) => (
                <div key={i}>
                  <div className="stat-val">{s.val}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* SIGNAL FEED */}
          <div className="feed">
            <div className="feed-header">
              <span className="feed-label">SIGNAL FEED</span>
              <span className="feed-live">
                <span className="live-dot" />
                LIVE
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {signals.map((s, i) => <SignalCard key={`${s.marketId}-${i}`} s={s} i={i} />)}
              <div className="locked-overlay" style={{ justifyContent: 'space-between' }}>
                <span>No wallet required to act on a signal.</span>
                <button
                  type="button"
                  onClick={() => setWalletModalOpen(true)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#7EB8FF',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Wallet optional
                </button>
              </div>
            </div>
          </div>
        </section>

        <hr className="divider" />

        {/* HOW IT WORKS */}
        <section className="section" id="how">
          <div className="section-label">HOW IT WORKS</div>
          <h2 className="section-title">Three layers.<br />One terminal.</h2>
          <div className="features">
            {[
              { num: '01', title: 'Live Market Scan', desc: 'Pulls all active Polymarket events every 5 minutes. Filters by volume, liquidity, and proximity to resolution.' },
              { num: '02', title: 'AI Mispricing Detection', desc: 'Groq LLM cross-references market probabilities against real-time news, social signals, and patterns.' },
              { num: '03', title: 'Edge Score', desc: 'Numerical gap between market price and AI-estimated true probability. Only high-conviction signals surface.' },
              { num: '04', title: 'Time-to-Catalyst', desc: 'Tracks how close each market is to resolution. Closer catalysts — higher urgency, faster alpha.' },
              { num: '05', title: 'Conviction Score', desc: 'Model confidence expressed as a single number. Low conviction signals are filtered out automatically.' },
              { num: '06', title: 'Optional Operator Access', desc: 'The core signal flow stays open. Optional identity and private operator tiers can layer on top later without blocking action.' },
            ].map((f, i) => (
              <div key={i} className="feature">
                <div className="feature-num">{f.num}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ACCESS */}
        <section style={{ maxWidth: 1400, margin: '0 auto', padding: '92px 36px 16px' }} id="access">
          <div className="section-label">ACCESS</div>
          <h2 className="section-title" style={{ marginBottom: 32 }}>Two tiers.<br />One edge.</h2>
        </section>
        <div className="access">
          <div className="access-card">
            <div className="access-tier">GUEST</div>
            <div className="access-price">Free</div>
            <div className="access-desc">No wallet required</div>
            <div className="access-list">
              {['Live signal feed', 'Trade on Polymarket CTA', 'View details on every idea'].map(f => (
                <div key={f} className="access-item"><span className="check" style={{ color: 'rgba(255,255,255,0.4)' }}>✓</span>{f}</div>
              ))}
              {['Priority operator tooling', 'Private research notes', 'Invite-only operator tier'].map(f => (
                <div key={f} className="access-item dim"><span className="check" style={{ color: 'rgba(255,255,255,0.15)' }}>✗</span>{f}</div>
              ))}
            </div>
            <button className="btn-outline" style={{ width: '100%', padding: '10px', fontFamily: 'Inter, sans-serif', fontSize: 13 }} onClick={() => document.getElementById('signals')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View signals</button>
          </div>

          <div className="access-card featured">
            <div className="access-tier">OPERATOR</div>
            <div className="access-price blue">Private</div>
            <div className="access-desc">Invite-only · wallet optional</div>
            <div className="access-list">
              {['Private operator desk', 'Richer research context', 'Higher-priority signal flow', 'Invite-only access model', 'Wallet remains optional', 'Future premium club features'].map(f => (
                <div key={f} className="access-item"><span className="check" style={{ color: '#7EB8FF' }}>✓</span>{f}</div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', padding: '10px', fontFamily: 'Inter, sans-serif', fontSize: 13 }} onClick={() => setWalletModalOpen(true)}>
              {session.authenticated ? 'Optional wallet connected' : 'Wallet optional'}
            </button>
          </div>
        </div>

        <hr className="divider" />

        <footer className="footer">
          <span>© 2026 Lunascope</span>
          <span>Not financial advice.</span>
          <span>See what moves the market first.</span>
        </footer>
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

function rgba255(r: number, g: number, b: number, a: number) {
  return `rgba(${r},${g},${b},${a})`
}

export default LandingPage
