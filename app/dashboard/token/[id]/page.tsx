'use client'
import React, { useEffect, useState, useRef } from 'react'

interface TokenInfo {
  id: string
  symbol: string
  name: string
  image: { large: string }
  market_data: {
    current_price: { usd: number }
    price_change_percentage_24h: number
    price_change_percentage_7d: number
    price_change_percentage_30d: number
    market_cap: { usd: number }
    total_volume: { usd: number }
    circulating_supply: number
    ath: { usd: number }
    atl: { usd: number }
  }
  description: { en: string }
}

interface ChartData {
  prices: [number, number][]
}

function formatPrice(price: number): string {
  if (price < 0.000001) return `$${price.toFixed(10)}`
  if (price < 0.00001) return `$${price.toFixed(8)}`
  if (price < 0.001) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(5)}`
  if (price < 1000) return `$${price.toFixed(3)}`
  return `$${price.toLocaleString()}`
}

function formatLarge(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(2)}B`
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`
  return `$${n.toLocaleString()}`
}

function MiniChart({ prices, isUp }: { prices: [number, number][]; isUp: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || prices.length === 0) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const W = canvas.width
    const H = canvas.height
    const vals = prices.map(p => p[1])
    const min = Math.min(...vals)
    const max = Math.max(...vals)
    const range = max - min || 1

    ctx.clearRect(0, 0, W, H)

    // gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H)
    grad.addColorStop(0, isUp ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)')
    grad.addColorStop(1, 'rgba(0,0,0,0)')

    ctx.beginPath()
    prices.forEach(([, v], i) => {
      const x = (i / (prices.length - 1)) * W
      const y = H - ((v - min) / range) * (H - 8) - 4
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.lineTo(W, H)
    ctx.lineTo(0, H)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()

    // line
    ctx.beginPath()
    prices.forEach(([, v], i) => {
      const x = (i / (prices.length - 1)) * W
      const y = H - ((v - min) / range) * (H - 8) - 4
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = isUp ? '#4ade80' : '#f87171'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.stroke()
  }, [prices, isUp])

  return <canvas ref={canvasRef} width={600} height={160} style={{ width: '100%', height: '160px' }} />
}

export default function TokenPage({ params }: { params: { id: string } }) {
  const [info, setInfo] = useState<TokenInfo | null>(null)
  const [chart, setChart] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState<'7' | '30' | '90'>('7')

  useEffect(() => {
    fetch(`/api/token/${params.id}`)
      .then(r => r.json())
      .then(d => {
        setInfo(d.info)
        setChart(d.chart)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [params.id])

  const price = info?.market_data?.current_price?.usd ?? 0
const change24h = info?.market_data?.price_change_percentage_24h ?? 0
  const isUp = change24h >= 0

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0e0e14; }

        .page {
          min-height: 100vh;
          background: #0e0e14;
          color: #e2e8f0;
          font-family: 'Syne', sans-serif;
          padding: 0;
        }

        /* TOPBAR */
        .topbar {
          height: 56px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 28px;
          background: #0e0e14;
          position: sticky; top: 0; z-index: 40;
        }
        .topbar-left { display: flex; align-items: center; gap: 12px; }
        .back-btn {
          display: flex; align-items: center; gap: 6px;
          color: #4a5568; font-size: 13px;
          text-decoration: none; cursor: pointer;
          transition: color 0.15s;
          background: none; border: none; font-family: 'Syne', sans-serif;
        }
        .back-btn:hover { color: #e2e8f0; }
        .breadcrumb { font-size: 13px; color: #4a5568; }
        .breadcrumb span { color: #e2e8f0; }

        .live-pill {
          display: flex; align-items: center; gap: 5px;
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.15);
          border-radius: 20px; padding: 4px 10px;
          font-size: 11px; color: #4ade80;
          font-family: 'DM Mono', monospace;
        }
        .live-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #4ade80; box-shadow: 0 0 5px #4ade80;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* CONTENT */
        .content { max-width: 1000px; margin: 0 auto; padding: 28px 24px; }

        /* TOKEN HEADER */
        .token-header {
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 28px;
          animation: up 0.3s ease forwards; opacity: 0;
        }
        @keyframes up { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }

        .token-logo { width: 52px; height: 52px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.08); }
        .token-logo-skel {
          width: 52px; height: 52px; border-radius: 50%;
          background: #1a1a24; flex-shrink: 0;
        }
        .token-title-group { flex: 1; }
        .token-name-row { display: flex; align-items: center; gap: 10px; }
        .token-name { font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
        .token-symbol {
          font-size: 12px; color: #4a5568;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px; padding: 3px 8px;
          font-family: 'DM Mono', monospace;
        }
        .token-price-row { display: flex; align-items: baseline; gap: 10px; margin-top: 4px; }
        .token-price { font-size: 28px; font-weight: 800; letter-spacing: -1px; font-family: 'DM Mono', monospace; }
        .token-change {
          font-size: 14px; font-weight: 600;
          font-family: 'DM Mono', monospace;
          padding: 3px 8px; border-radius: 6px;
        }
        .change-up { color: #4ade80; background: rgba(74,222,128,0.1); }
        .change-dn { color: #f87171; background: rgba(248,113,113,0.1); }

        /* CHART CARD */
        .chart-card {
          background: #13131a;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; overflow: hidden;
          margin-bottom: 16px;
          animation: up 0.3s ease 0.05s forwards; opacity: 0;
        }
        .chart-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px 12px;
        }
        .chart-title { font-size: 13px; font-weight: 700; }
        .day-tabs {
          display: flex; gap: 2px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 3px;
        }
        .day-tab {
          padding: 4px 10px; border-radius: 5px;
          font-size: 11px; font-weight: 600;
          cursor: pointer; border: none;
          background: transparent; color: #4a5568;
          font-family: 'DM Mono', monospace;
          transition: all 0.15s;
        }
        .day-tab:hover { color: #a0aec0; }
        .day-tab.active { background: rgba(126,184,255,0.12); color: #7EB8FF; }
        .chart-body { padding: 0 18px 16px; }
        .chart-skel {
          height: 160px; border-radius: 8px;
          background: linear-gradient(90deg, #1a1a24 25%, #1f1f2e 50%, #1a1a24 75%);
          background-size: 200% 100%;
          animation: shim 1.4s infinite;
        }
        @keyframes shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        /* STATS GRID */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .stat-card {
          background: #13131a;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; padding: 16px 18px;
          animation: up 0.3s ease forwards; opacity: 0;
          transition: border-color 0.2s;
        }
        .stat-card:hover { border-color: rgba(126,184,255,0.15); }
        .stat-card:nth-child(1){animation-delay:.1s}
        .stat-card:nth-child(2){animation-delay:.14s}
        .stat-card:nth-child(3){animation-delay:.18s}
        .stat-card:nth-child(4){animation-delay:.22s}
        .stat-card:nth-child(5){animation-delay:.26s}
        .stat-card:nth-child(6){animation-delay:.30s}
        .stat-label { font-size: 10px; letter-spacing: .1em; text-transform: uppercase; color: #4a5568; margin-bottom: 8px; }
        .stat-value { font-size: 18px; font-weight: 700; font-family: 'DM Mono', monospace; }
        .stat-sub { font-size: 11px; color: #4a5568; margin-top: 4px; }

        .skel-line {
          height: 13px; border-radius: 5px;
          background: linear-gradient(90deg, #1a1a24 25%, #1f1f2e 50%, #1a1a24 75%);
          background-size: 200% 100%;
          animation: shim 1.4s infinite;
        }
      `}</style>

      <div className="page">
        {/* TOPBAR */}
        <div className="topbar">
          <div className="topbar-left">
            <a href="/dashboard" className="back-btn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </a>
            <span className="breadcrumb">
              Dashboard / <span>{info?.name ?? params.id}</span>
            </span>
          </div>
          <div className="live-pill">
            <span className="live-dot" />
            LIVE
          </div>
        </div>

        <div className="content">
          {/* TOKEN HEADER */}
          <div className="token-header">
            {loading
              ? <div className="token-logo-skel" />
              : <img src={info?.image.large} alt={info?.name} className="token-logo" />
            }
            <div className="token-title-group">
              {loading ? (
                <>
                  <div className="skel-line" style={{ width: 160, marginBottom: 8 }} />
                  <div className="skel-line" style={{ width: 120 }} />
                </>
              ) : (
                <>
                  <div className="token-name-row">
                    <span className="token-name">{info?.name}</span>
                    <span className="token-symbol">{info?.symbol.toUpperCase()}</span>
                  </div>
                  <div className="token-price-row">
                    <span className="token-price">{formatPrice(price)}</span>
                    <span className={`token-change ${isUp ? 'change-up' : 'change-dn'}`}>
                      {isUp ? '+' : ''}{change24h.toFixed(2)}% 24h
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* CHART */}
          <div className="chart-card">
            <div className="chart-top">
              <span className="chart-title">Price Chart</span>
              <div className="day-tabs">
                {(['7', '30', '90'] as const).map(d => (
                  <button key={d} className={`day-tab ${days === d ? 'active' : ''}`} onClick={() => setDays(d)}>
                    {d}D
                  </button>
                ))}
              </div>
            </div>
            <div className="chart-body">
              {loading || !chart
                ? <div className="chart-skel" />
                : <MiniChart prices={chart.prices} isUp={isUp} />
              }
            </div>
          </div>

          {/* STATS */}
          <div className="stats-grid">
            {loading ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stat-card" style={{ animationDelay: `${0.1 + i * 0.04}s` }}>
                <div className="skel-line" style={{ width: '60%', marginBottom: 8 }} />
                <div className="skel-line" style={{ width: '80%' }} />
              </div>
            )) : [
              { label: 'Market Cap', value: formatLarge(info?.market_data.market_cap.usd ?? 0), sub: '' },
              { label: 'Volume 24H', value: formatLarge(info?.market_data.total_volume.usd ?? 0), sub: '' },
              { label: '7D Change', value: `${(info?.market_data.price_change_percentage_7d ?? 0) >= 0 ? '+' : ''}${info?.market_data.price_change_percentage_7d?.toFixed(2)}%`, sub: '', color: (info?.market_data.price_change_percentage_7d ?? 0) >= 0 ? '#4ade80' : '#f87171' },
              { label: '30D Change', value: `${(info?.market_data.price_change_percentage_30d ?? 0) >= 0 ? '+' : ''}${info?.market_data.price_change_percentage_30d?.toFixed(2)}%`, sub: '', color: (info?.market_data.price_change_percentage_30d ?? 0) >= 0 ? '#4ade80' : '#f87171' },
              { label: 'All Time High', value: formatPrice(info?.market_data.ath.usd ?? 0), sub: '' },
              { label: 'All Time Low', value: formatPrice(info?.market_data.atl.usd ?? 0), sub: '' },
            ].map((s, i) => (
              <div key={i} className="stat-card">
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ color: (s as any).color ?? '#e2e8f0' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}