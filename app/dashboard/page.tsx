'use client'
import { useEffect, useState } from 'react'

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

const MEME_COIN_IDS = [
  'pepe', 'dogecoin', 'shiba-inu', 'floki', 'dogwifcoin',
  'bonk', 'brett', 'mog-coin', 'popcat', 'gigachad-memecoin',
  'cat-in-a-dogs-world', 'book-of-meme', 'baby-doge-coin', 'coq-inu', 'turbo'
]

type FilterType = 'all' | 'gainers' | 'losers'
type NavItem = 'dashboard' | 'trending' | 'whales' | 'alerts'

export default function Dashboard() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')
  const [activeNav, setActiveNav] = useState<NavItem>('dashboard')
  const [mounted, setMounted] = useState(false)

  const fetchTokens = async () => {
    try {
      const ids = MEME_COIN_IDS.join(',')
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
        { cache: 'no-store' }
      )
      const data = await res.json()
      setTokens(data)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setMounted(true)
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

  const navItems: { id: NavItem; icon: string; label: string }[] = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'trending', icon: '↑', label: 'Trending' },
    { id: 'whales', icon: '◈', label: 'Whales' },
    { id: 'alerts', icon: '◎', label: 'Alerts' },
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #07080f; }

        .dash-root {
          display: flex;
          min-height: 100vh;
          background: #07080f;
          color: #e8edf5;
          font-family: 'Syne', sans-serif;
          opacity: 0;
          animation: fadeIn 0.4s ease forwards;
        }
        @keyframes fadeIn { to { opacity: 1; } }

        /* SIDEBAR */
        .sidebar {
          width: 72px;
          background: #0b0d1a;
          border-right: 1px solid rgba(126,184,255,0.08);
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 24px 0;
          gap: 8px;
          position: fixed;
          top: 0; left: 0; bottom: 0;
          z-index: 50;
        }
        .sidebar-logo {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #7EB8FF22, #A855F722);
          border: 1px solid rgba(126,184,255,0.2);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
          cursor: pointer;
          text-decoration: none;
        }
        .sidebar-logo span {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #7EB8FF;
          box-shadow: 0 0 10px #7EB8FF;
          display: block;
        }
        .nav-item {
          width: 44px; height: 44px;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          font-size: 18px;
          color: #6b7a99;
          border: 1px solid transparent;
          background: transparent;
        }
        .nav-item:hover {
          background: rgba(126,184,255,0.06);
          color: #e8edf5;
        }
        .nav-item.active {
          background: rgba(126,184,255,0.1);
          border-color: rgba(126,184,255,0.2);
          color: #7EB8FF;
        }
        .nav-tooltip {
          position: absolute;
          left: 56px;
          background: #1a1d2e;
          border: 1px solid rgba(126,184,255,0.15);
          border-radius: 8px;
          padding: 6px 12px;
          font-size: 12px;
          color: #e8edf5;
          white-space: nowrap;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s;
          z-index: 100;
        }
        .nav-item:hover .nav-tooltip { opacity: 1; }

        .sidebar-bottom {
          margin-top: auto;
          display: flex; flex-direction: column; align-items: center; gap: 8px;
        }

        /* MAIN */
        .main {
          margin-left: 72px;
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }

        /* TOP BAR */
        .topbar {
          height: 60px;
          border-bottom: 1px solid rgba(126,184,255,0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 28px;
          background: rgba(7,8,15,0.8);
          backdrop-filter: blur(12px);
          position: sticky; top: 0; z-index: 40;
        }
        .topbar-title {
          font-size: 15px;
          font-weight: 700;
          color: #e8edf5;
        }
        .topbar-right {
          display: flex; align-items: center; gap: 12px;
        }
        .live-badge {
          display: flex; align-items: center; gap: 6px;
          font-size: 11px; color: #4ade80;
          background: rgba(74,222,128,0.08);
          border: 1px solid rgba(74,222,128,0.2);
          border-radius: 20px;
          padding: 4px 10px;
          font-family: 'DM Mono', monospace;
        }
        .live-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px #4ade80;
          animation: blink 1.5s ease-in-out infinite;
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .search-input {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(126,184,255,0.1);
          border-radius: 10px;
          padding: 7px 14px;
          color: #e8edf5;
          font-size: 13px;
          font-family: 'Syne', sans-serif;
          outline: none;
          width: 180px;
          transition: border-color 0.2s;
        }
        .search-input:focus {
          border-color: rgba(126,184,255,0.3);
        }
        .search-input::placeholder { color: #6b7a99; }

        /* CONTENT */
        .content {
          padding: 28px;
          flex: 1;
        }

        /* STAT CARDS */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 24px;
        }
        .stat-card {
          background: #0f1121;
          border: 1px solid rgba(126,184,255,0.08);
          border-radius: 16px;
          padding: 20px;
          transition: border-color 0.2s, transform 0.2s;
          animation: slideUp 0.4s ease forwards;
          opacity: 0;
        }
        .stat-card:hover {
          border-color: rgba(126,184,255,0.18);
          transform: translateY(-1px);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stat-card:nth-child(1) { animation-delay: 0.05s; }
        .stat-card:nth-child(2) { animation-delay: 0.1s; }
        .stat-card:nth-child(3) { animation-delay: 0.15s; }
        .stat-card:nth-child(4) { animation-delay: 0.2s; }

        .stat-label {
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6b7a99;
          margin-bottom: 10px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 800;
          line-height: 1;
          margin-bottom: 6px;
        }
        .stat-sub {
          font-size: 11px;
          color: #6b7a99;
          font-family: 'DM Mono', monospace;
        }

        /* TABLE SECTION */
        .table-section {
          background: #0f1121;
          border: 1px solid rgba(126,184,255,0.08);
          border-radius: 16px;
          overflow: hidden;
          animation: slideUp 0.4s ease 0.25s forwards;
          opacity: 0;
        }
        .table-header-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 18px 20px;
          border-bottom: 1px solid rgba(126,184,255,0.06);
        }
        .table-title {
          font-size: 14px;
          font-weight: 700;
          color: #e8edf5;
        }
        .filter-tabs {
          display: flex;
          gap: 6px;
        }
        .filter-tab {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 12px;
          cursor: pointer;
          border: 1px solid rgba(126,184,255,0.1);
          background: transparent;
          color: #6b7a99;
          font-family: 'Syne', sans-serif;
          transition: all 0.15s;
          text-transform: capitalize;
        }
        .filter-tab:hover {
          color: #e8edf5;
          border-color: rgba(126,184,255,0.2);
        }
        .filter-tab.active {
          background: rgba(126,184,255,0.1);
          border-color: rgba(126,184,255,0.3);
          color: #7EB8FF;
        }

        .col-headers {
          display: grid;
          grid-template-columns: 44px 2fr 1fr 1fr 1fr 80px;
          padding: 10px 20px;
          font-size: 10px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #6b7a99;
          border-bottom: 1px solid rgba(126,184,255,0.04);
        }

        .token-row {
          display: grid;
          grid-template-columns: 44px 2fr 1fr 1fr 1fr 80px;
          padding: 13px 20px;
          border-bottom: 1px solid rgba(126,184,255,0.04);
          transition: background 0.15s;
          cursor: default;
          align-items: center;
        }
        .token-row:last-child { border-bottom: none; }
        .token-row:hover { background: rgba(126,184,255,0.025); }

        .token-rank {
          font-size: 12px;
          color: #6b7a99;
          font-family: 'DM Mono', monospace;
        }
        .token-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .token-img {
          width: 30px; height: 30px;
          border-radius: 50%;
          border: 1px solid rgba(126,184,255,0.1);
        }
        .token-name { font-size: 13px; font-weight: 600; }
        .token-symbol { font-size: 11px; color: #6b7a99; margin-top: 1px; }

        .token-price {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          text-align: right;
        }
        .token-change {
          font-family: 'DM Mono', monospace;
          font-size: 13px;
          text-align: right;
          font-weight: 500;
        }
        .token-mcap {
          font-family: 'DM Mono', monospace;
          font-size: 12px;
          color: #6b7a99;
          text-align: right;
        }
        .token-badge {
          display: flex;
          justify-content: flex-end;
        }
        .badge {
          font-size: 10px;
          padding: 3px 8px;
          border-radius: 6px;
          font-family: 'DM Mono', monospace;
        }
        .badge-up {
          background: rgba(74,222,128,0.1);
          color: #4ade80;
          border: 1px solid rgba(74,222,128,0.2);
        }
        .badge-down {
          background: rgba(255,92,92,0.1);
          color: #FF5C5C;
          border: 1px solid rgba(255,92,92,0.2);
        }

        /* SKELETON */
        .skeleton {
          height: 14px;
          border-radius: 6px;
          background: linear-gradient(90deg, #1a1d2e 25%, #1f2236 50%, #1a1d2e 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .footer-note {
          text-align: center;
          padding: 20px;
          font-size: 11px;
          color: #6b7a99;
          font-family: 'DM Mono', monospace;
          border-top: 1px solid rgba(126,184,255,0.04);
        }
        .footer-note a {
          color: #7EB8FF;
          text-decoration: none;
        }
        .footer-note a:hover { text-decoration: underline; }
      `}</style>

      <div className="dash-root">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <a href="/" className="sidebar-logo">
            <span />
          </a>

          {navItems.map(item => (
            <div
              key={item.id}
              className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
              onClick={() => setActiveNav(item.id)}
            >
              {item.icon}
              <span className="nav-tooltip">{item.label}</span>
            </div>
          ))}

          <div className="sidebar-bottom">
            <div className="nav-item" style={{ fontSize: '16px' }}>
              ⚙
              <span className="nav-tooltip">Settings</span>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <div className="main">
          {/* TOP BAR */}
          <div className="topbar">
            <span className="topbar-title">
              {activeNav === 'dashboard' && 'Meme Token Dashboard'}
              {activeNav === 'trending' && 'Trending Now'}
              {activeNav === 'whales' && 'Whale Activity'}
              {activeNav === 'alerts' && 'Alerts'}
            </span>
            <div className="topbar-right">
              {lastUpdated && (
                <span style={{ fontSize: '11px', color: '#6b7a99', fontFamily: 'DM Mono, monospace' }}>
                  Updated {lastUpdated}
                </span>
              )}
              <input
                className="search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search token..."
              />
              <div className="live-badge">
                <span className="live-dot" />
                LIVE
              </div>
            </div>
          </div>

          {/* PAGE CONTENT */}
          <div className="content">

            {/* STAT CARDS */}
            <div className="stats-grid">
              {[
                {
                  label: 'Total Volume 24H',
                  value: loading ? '—' : formatMarketCap(totalVolume),
                  color: '#7EB8FF',
                  sub: `${tokens.length} tokens tracked`,
                },
                {
                  label: 'Total Market Cap',
                  value: loading ? '—' : formatMarketCap(totalMcap),
                  color: '#A855F7',
                  sub: 'Combined meme mcap',
                },
                {
                  label: 'Gainers Today',
                  value: loading ? '—' : `${gainersCount} / ${tokens.length}`,
                  color: '#4ade80',
                  sub: 'Positive 24h change',
                },
                {
                  label: 'Top Gainer',
                  value: loading ? '—' : topGainer
                    ? `+${topGainer.price_change_percentage_24h.toFixed(1)}%`
                    : '—',
                  color: '#F7C948',
                  sub: loading ? '' : topGainer?.symbol.toUpperCase(),
                },
              ].map((s, i) => (
                <div key={i} className="stat-card">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-sub">{s.sub}</div>
                </div>
              ))}
            </div>

            {/* TOKEN TABLE */}
            <div className="table-section">
              <div className="table-header-row">
                <span className="table-title">
                  {filter === 'all' ? 'All Tokens' : filter === 'gainers' ? '🟢 Gainers' : '🔴 Losers'}
                  {' '}
                  <span style={{ color: '#6b7a99', fontWeight: 400, fontSize: '12px' }}>
                    ({filtered.length})
                  </span>
                </span>
                <div className="filter-tabs">
                  {(['all', 'gainers', 'losers'] as FilterType[]).map(f => (
                    <button
                      key={f}
                      className={`filter-tab ${filter === f ? 'active' : ''}`}
                      onClick={() => setFilter(f)}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div className="col-headers">
                <div>#</div>
                <div>Token</div>
                <div style={{ textAlign: 'right' }}>Price</div>
                <div style={{ textAlign: 'right' }}>24h %</div>
                <div style={{ textAlign: 'right' }}>Market Cap</div>
                <div style={{ textAlign: 'right' }}>Signal</div>
              </div>

              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="token-row" style={{ opacity: 0.4 }}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="skeleton" style={{ width: j === 1 ? '60%' : '80%' }} />
                    ))}
                  </div>
                ))
                : filtered.map((t, i) => {
                  const up = t.price_change_percentage_24h >= 0
                  return (
                    <div key={t.id} className="token-row">
                      <div className="token-rank">{i + 1}</div>
                      <div className="token-info">
                        <img src={t.image} alt={t.name} className="token-img" />
                        <div>
                          <div className="token-name">{t.name}</div>
                          <div className="token-symbol">{t.symbol.toUpperCase()}</div>
                        </div>
                      </div>
                      <div className="token-price">{formatPrice(t.current_price)}</div>
                      <div className="token-change" style={{ color: up ? '#4ade80' : '#FF5C5C' }}>
                        {up ? '+' : ''}{t.price_change_percentage_24h?.toFixed(2)}%
                      </div>
                      <div className="token-mcap">{formatMarketCap(t.market_cap)}</div>
                      <div className="token-badge">
                        <span className={`badge ${up ? 'badge-up' : 'badge-down'}`}>
                          {up ? '↑ Bull' : '↓ Bear'}
                        </span>
                      </div>
                    </div>
                  )
                })
              }

              <div className="footer-note">
                Data by CoinGecko · Updates every 60s · <a href="/">← lunascope.xyz</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}