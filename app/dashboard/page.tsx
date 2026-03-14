'use client'
import { useEffect, useState } from 'react'

import React from 'react'

interface Token {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
}

function formatPrice(price: number): string {
  if (price < 0.000001) return `$${price.toFixed(10)}`
  if (price < 0.00001) return `$${price.toFixed(8)}`
  if (price < 0.001) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(5)}`
  if (price < 1000) return `$${price.toFixed(3)}`
  return `$${price.toLocaleString()}`
}

function formatMarketCap(mc: number): string {
  if (mc >= 1_000_000_000) return `$${(mc / 1_000_000_000).toFixed(1)}B`
  if (mc >= 1_000_000) return `$${(mc / 1_000_000).toFixed(1)}M`
  return `$${mc.toLocaleString()}`
}

type FilterType = 'all' | 'gainers' | 'losers'
type NavItem = 'dashboard' | 'trending' | 'whales' | 'alerts'

const NAV_ITEMS: { id: NavItem; icon: React.ReactNode; label: string }[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  },
  {
    id: 'trending', label: 'Trending',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
  },
  {
    id: 'whales', label: 'Whales',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  },
  {
    id: 'alerts', label: 'Alerts',
    icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
  },
]

export default function Dashboard() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard')

  const fetchTokens = async () => {
    try {
      const res = await fetch('/api/tokens', { cache: 'no-store' })
      const data = await res.json()
      if (Array.isArray(data)) {
        setTokens(data)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTokens()
    const interval = setInterval(fetchTokens, 60000)
    return () => clearInterval(interval)
  }, [])

  const filtered = tokens
    .filter(t => {
      if (filter === 'gainers') return t.price_change_percentage_24h > 0
      if (filter === 'losers') return t.price_change_percentage_24h < 0
      return true
    })
    .filter(t =>
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.symbol.toLowerCase().includes(search.toLowerCase())
    )

  const totalVolume = tokens.reduce((acc, t) => acc + t.total_volume, 0)
  const gainersCount = tokens.filter(t => t.price_change_percentage_24h > 0).length
  const topGainer = [...tokens].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0]
  const totalMcap = tokens.reduce((acc, t) => acc + t.market_cap, 0)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #0e0e14; height: 100%; }

        .root {
          display: flex;
          height: 100vh;
          overflow: hidden;
          background: #0e0e14;
          color: #e2e8f0;
          font-family: 'Syne', sans-serif;
          animation: fadeIn 0.3s ease forwards;
        }
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

        /* ── SIDEBAR ── */
        .sidebar {
          width: 64px;
          background: #13131a;
          border-right: 1px solid rgba(255,255,255,0.05);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px 0 20px;
          flex-shrink: 0;
        }

        .sb-logo {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7EB8FF, #A855F7);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 28px;
          text-decoration: none;
          flex-shrink: 0;
        }
        .sb-logo-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 0 8px rgba(255,255,255,0.8);
        }

        .sb-nav {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          flex: 1;
        }

        .sb-item {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          color: #4a5568;
          transition: all 0.15s;
          position: relative;
          border: 1px solid transparent;
        }
        .sb-item:hover {
          color: #a0aec0;
          background: rgba(255,255,255,0.05);
        }
        .sb-item.active {
          color: #7EB8FF;
          background: rgba(126,184,255,0.1);
          border-color: rgba(126,184,255,0.2);
        }
        .sb-tooltip {
          position: absolute;
          left: 48px;
          background: #1e1e2a;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 7px;
          padding: 4px 10px;
          font-size: 12px;
          color: #e2e8f0;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.1s;
          z-index: 999;
        }
        .sb-item:hover .sb-tooltip { opacity: 1; }

        .sb-divider {
          width: 24px; height: 1px;
          background: rgba(255,255,255,0.06);
          margin: 12px 0;
        }

        .sb-bottom {
          display: flex; flex-direction: column;
          align-items: center; gap: 4px;
        }

        /* ── MAIN ── */
        .main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }

        /* ── TOPBAR ── */
        .topbar {
          height: 56px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          display: flex; align-items: center; justify-content: space-between;
          padding: 0 24px;
          background: #0e0e14;
          flex-shrink: 0;
        }
        .topbar-title {
          font-size: 14px; font-weight: 700;
          color: #e2e8f0; letter-spacing: -0.2px;
        }
        .topbar-right { display: flex; align-items: center; gap: 10px; }

        .search-wrap {
          position: relative;
        }
        .search-icon {
          position: absolute; left: 10px; top: 50%;
          transform: translateY(-50%);
          color: #4a5568;
          display: flex; align-items: center;
        }
        .search-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 8px;
          padding: 6px 12px 6px 32px;
          color: #e2e8f0;
          font-size: 13px;
          font-family: 'Syne', sans-serif;
          outline: none;
          width: 200px;
          transition: border-color 0.15s;
        }
        .search-input::placeholder { color: #4a5568; }
        .search-input:focus { border-color: rgba(126,184,255,0.3); }

        .live-pill {
          display: flex; align-items: center; gap: 5px;
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.15);
          border-radius: 20px;
          padding: 4px 10px;
          font-size: 11px; color: #4ade80;
          font-family: 'DM Mono', monospace;
        }
        .live-dot {
          width: 5px; height: 5px; border-radius: 50%;
          background: #4ade80; box-shadow: 0 0 5px #4ade80;
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }

        .updated-text {
          font-size: 11px; color: #4a5568;
          font-family: 'DM Mono', monospace;
        }

        /* ── SCROLL AREA ── */
        .scroll-area {
          flex: 1; overflow-y: auto; padding: 20px 24px;
        }
        .scroll-area::-webkit-scrollbar { width: 4px; }
        .scroll-area::-webkit-scrollbar-track { background: transparent; }
        .scroll-area::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 4px; }

        /* ── STAT CARDS ── */
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 16px;
        }
        .card {
          background: #13131a;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 18px;
          transition: border-color 0.2s, transform 0.2s;
          animation: up 0.35s ease forwards; opacity: 0;
        }
        .card:hover { border-color: rgba(126,184,255,0.15); transform: translateY(-1px); }
        @keyframes up { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .card:nth-child(1){animation-delay:.04s}
        .card:nth-child(2){animation-delay:.08s}
        .card:nth-child(3){animation-delay:.12s}
        .card:nth-child(4){animation-delay:.16s}

        .card-label {
          font-size: 10px; letter-spacing: .1em;
          text-transform: uppercase; color: #4a5568; margin-bottom: 10px;
        }
        .card-value {
          font-size: 24px; font-weight: 800;
          letter-spacing: -.5px; line-height: 1; margin-bottom: 6px;
        }
        .card-sub { font-size: 11px; color: #4a5568; font-family: 'DM Mono', monospace; }

        /* ── TABLE ── */
        .table-wrap {
          background: #13131a;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; overflow: hidden;
          animation: up 0.35s ease .2s forwards; opacity: 0;
        }
        .table-top {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 18px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .table-top-title { font-size: 13px; font-weight: 700; color: #e2e8f0; }
        .table-top-count { font-size: 12px; color: #4a5568; margin-left: 6px; }

        .tabs {
          display: flex; gap: 2px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 8px; padding: 3px;
        }
        .tab {
          padding: 4px 12px; border-radius: 6px;
          font-size: 12px; font-weight: 500;
          cursor: pointer; border: none;
          background: transparent; color: #4a5568;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s; text-transform: capitalize;
        }
        .tab:hover { color: #a0aec0; }
        .tab.active { background: rgba(126,184,255,0.12); color: #7EB8FF; }

        .col-head {
          display: grid;
          grid-template-columns: 40px 2fr 1fr 1fr 1fr 80px;
          padding: 8px 18px;
          font-size: 10px; letter-spacing: .1em;
          text-transform: uppercase; color: #4a5568;
          border-bottom: 1px solid rgba(255,255,255,0.03);
        }

        .t-row {
          display: grid;
          grid-template-columns: 40px 2fr 1fr 1fr 1fr 80px;
          padding: 11px 18px; align-items: center;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          transition: background 0.12s;
        }
        .t-row:last-child { border-bottom: none; }
        .t-row:hover { background: rgba(255,255,255,0.02); }

        .t-rank { font-size: 12px; color: #4a5568; font-family: 'DM Mono', monospace; }
        .t-info { display: flex; align-items: center; gap: 9px; }
        .t-img { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(255,255,255,0.06); }
        .t-name { font-size: 13px; font-weight: 600; }
        .t-sym { font-size: 11px; color: #4a5568; margin-top: 1px; }
        .t-price { font-family: 'DM Mono', monospace; font-size: 13px; text-align: right; }
        .t-chg { font-family: 'DM Mono', monospace; font-size: 13px; text-align: right; font-weight: 500; }
        .t-mc { font-family: 'DM Mono', monospace; font-size: 12px; color: #4a5568; text-align: right; }
        .t-badge-wrap { display: flex; justify-content: flex-end; }
        .t-badge {
          font-size: 10px; padding: 3px 8px; border-radius: 6px;
          font-family: 'DM Mono', monospace; font-weight: 500;
        }
        .up { background: rgba(74,222,128,0.08); color: #4ade80; border: 1px solid rgba(74,222,128,0.15); }
        .dn { background: rgba(248,113,113,0.08); color: #f87171; border: 1px solid rgba(248,113,113,0.15); }

        .skel {
          height: 13px; border-radius: 5px;
          background: linear-gradient(90deg, #1a1a24 25%, #1f1f2e 50%, #1a1a24 75%);
          background-size: 200% 100%;
          animation: shim 1.4s infinite;
        }
        @keyframes shim { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

        .table-foot {
          text-align: center; padding: 14px;
          font-size: 11px; color: #4a5568;
          font-family: 'DM Mono', monospace;
          border-top: 1px solid rgba(255,255,255,0.03);
        }
        .table-foot a { color: #7EB8FF; text-decoration: none; }
      `}</style>

      <div className="root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a href="/" className="sb-logo">
            <span className="sb-logo-dot" />
          </a>

          <nav className="sb-nav">
            {NAV_ITEMS.map(item => (
              <div
                key={item.id}
                className={`sb-item ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => setActiveNav(item.id)}
              >
                {item.icon}
                <span className="sb-tooltip">{item.label}</span>
              </div>
            ))}
          </nav>

          <div className="sb-divider" />
          <div className="sb-bottom">
            <div className="sb-item">
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              <span className="sb-tooltip">Settings</span>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <div className="main">
          {/* TOPBAR */}
          <div className="topbar">
            <span className="topbar-title">
              {activeNav === 'dashboard' && 'Meme Token Dashboard'}
              {activeNav === 'trending' && 'Trending Now'}
              {activeNav === 'whales' && 'Whale Activity'}
              {activeNav === 'alerts' && 'Price Alerts'}
            </span>
            <div className="topbar-right">
              {lastUpdated && <span className="updated-text">{lastUpdated}</span>}
              <div className="search-wrap">
                <span className="search-icon">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                </span>
                <input
                  className="search-input"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search token..."
                />
              </div>
              <div className="live-pill">
                <span className="live-dot" />
                LIVE
              </div>
            </div>
          </div>

          {/* SCROLL AREA */}
          <div className="scroll-area">
            {/* CARDS */}
            <div className="cards-grid">
              {[
                { label: 'Total Volume 24H', value: loading ? '—' : formatMarketCap(totalVolume), color: '#7EB8FF', sub: `${tokens.length} tokens tracked` },
                { label: 'Total Market Cap', value: loading ? '—' : formatMarketCap(totalMcap), color: '#A855F7', sub: 'Combined meme mcap' },
                { label: 'Gainers Today', value: loading ? '—' : `${gainersCount} / ${tokens.length}`, color: '#4ade80', sub: 'Positive 24h change' },
                { label: 'Top Gainer', value: loading ? '—' : topGainer ? `+${topGainer.price_change_percentage_24h.toFixed(1)}%` : '—', color: '#F7C948', sub: loading ? '' : topGainer?.symbol.toUpperCase() ?? '' },
              ].map((s, i) => (
                <div key={i} className="card">
                  <div className="card-label">{s.label}</div>
                  <div className="card-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="card-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* TABLE */}
            <div className="table-wrap">
              <div className="table-top">
                <span>
                  <span className="table-top-title">
                    {filter === 'all' ? 'All Tokens' : filter === 'gainers' ? 'Gainers' : 'Losers'}
                  </span>
                  <span className="table-top-count">({filtered.length})</span>
                </span>
                <div className="tabs">
                  {(['all', 'gainers', 'losers'] as FilterType[]).map(f => (
                    <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-head">
                <div>#</div>
                <div>Token</div>
                <div style={{ textAlign: 'right' }}>Price</div>
                <div style={{ textAlign: 'right' }}>24h</div>
                <div style={{ textAlign: 'right' }}>Mkt Cap</div>
                <div style={{ textAlign: 'right' }}>Signal</div>
              </div>

              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="t-row" style={{ opacity: 0.3 }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="skel" style={{ width: j === 1 ? '55%' : '75%' }} />
                    ))}
                  </div>
                ))
                : filtered.map((t, i) => {
                  const isUp = t.price_change_percentage_24h >= 0
                  return (
                    <div key={t.id} className="t-row" style={{ cursor: 'pointer' }} onClick={() => window.location.href = `/dashboard/token/${t.id}`}>
                      <div className="t-rank">{i + 1}</div>
                      <div className="t-info">
                        <img src={t.image} alt={t.name} className="t-img" />
                        <div>
                          <div className="t-name">{t.name}</div>
                          <div className="t-sym">{t.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="t-price">{formatPrice(t.current_price)}</div>
                      <div className="t-chg" style={{ color: isUp ? '#4ade80' : '#f87171' }}>
                        {isUp ? '+' : ''}{t.price_change_percentage_24h?.toFixed(2)}%
                      </div>
                      <div className="t-mc">{formatMarketCap(t.market_cap)}</div>
                      <div className="t-badge-wrap">
                        <span className={`t-badge ${isUp ? 'up' : 'dn'}`}>
                          {isUp ? '↑ Bull' : '↓ Bear'}
                        </span>
                      </div>
                    </div>
                  )
                })
              }

              <div className="table-foot">
                Data by CoinGecko · updates every 60s · <a href="/">← lunascope.xyz</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}