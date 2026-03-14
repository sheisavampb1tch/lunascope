'use client'
import React, { useEffect, useState } from 'react'

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

type Tab = 'tokens' | 'trending' | 'whales'
type FilterType = 'all' | 'gainers' | 'losers'

function Blobs({ tokens }: { tokens: Token[] }) {
  const colors = ['#1a3a5c','#2d1b4e','#0f2744','#1e1060','#0a2a4a','#251550','#0d3060','#1a0a3a','#0f1f40','#180d40','#0a1a35','#1c0e4a']
  const positions = [
    {x:5,y:12},{x:88,y:8},{x:3,y:55},{x:92,y:48},{x:18,y:82},
    {x:78,y:78},{x:45,y:5},{x:55,y:88},{x:30,y:35},{x:70,y:30},
    {x:12,y:68},{x:85,y:65},
  ]

  return (
    <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:0,overflow:'hidden'}}>
      <style>{`
        @keyframes fl0{0%,100%{transform:translateY(0) translateX(0)}40%{transform:translateY(-18px) translateX(8px)}70%{transform:translateY(10px) translateX(-6px)}}
        @keyframes fl1{0%,100%{transform:translateY(0) translateX(0)}35%{transform:translateY(14px) translateX(-10px)}65%{transform:translateY(-8px) translateX(12px)}}
        @keyframes fl2{0%,100%{transform:translateY(0) translateX(0)}50%{transform:translateY(-20px) translateX(5px)}}
      `}</style>
      {positions.map((p, i) => {
        const img = tokens[i % tokens.length]?.image
        const color = colors[i % colors.length]
        const size = 44 + (i % 4) * 12
        const dur = 7 + (i % 4) * 1.5
        const delay = i * 0.4
        return (
          <div key={i} style={{
            position:'absolute',
            left:`${p.x}%`,
            top:`${p.y}%`,
            width:size, height:size,
            borderRadius:'50%',
            overflow:'hidden',
            opacity: img ? 0.12 : 0.15,
            filter:'blur(8px)',
            animation:`fl${i%3} ${dur}s ease-in-out infinite`,
            animationDelay:`${delay}s`,
            background: img ? color : color,
          }}>
            {img && <img src={img} alt="" style={{width:'100%',height:'100%',objectFit:'cover',opacity:0.3,filter:'saturate(0.3) brightness(0.4)'}} />}
          </div>
        )
      })}
    </div>
  )
}

export default function Home() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<Tab>('tokens')
  const [filter, setFilter] = useState<FilterType>('all')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState('')

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
  const totalMcap = tokens.reduce((acc, t) => acc + t.market_cap, 0)
  const gainersCount = tokens.filter(t => t.price_change_percentage_24h > 0).length
  const losersCount = tokens.filter(t => t.price_change_percentage_24h < 0).length
  const topGainer = [...tokens].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0]
  const trending = [...tokens].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h).slice(0, 5)

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body{background:#111114;min-height:100%}
        .app{min-height:100vh;background:#111114;color:#ecedee;font-family:'Syne',sans-serif;position:relative}
        .navbar{position:sticky;top:0;z-index:100;height:60px;display:flex;align-items:center;justify-content:space-between;padding:0 24px;background:rgba(17,17,20,0.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06)}
        .navbar-left{display:flex;align-items:center;gap:8px}
        .logo{display:flex;align-items:center;gap:8px;text-decoration:none;color:inherit;margin-right:16px}
        .logo-icon{width:28px;height:28px;border-radius:8px;background:linear-gradient(135deg,#7EB8FF,#A855F7);display:flex;align-items:center;justify-content:center}
        .logo-dot{width:8px;height:8px;border-radius:50%;background:#fff;box-shadow:0 0 6px rgba(255,255,255,0.8)}
        .logo-text{font-size:16px;font-weight:700;letter-spacing:-0.3px}
        .nav-tabs{display:flex;gap:2px}
        .nav-tab{padding:6px 14px;border-radius:8px;font-size:14px;font-weight:500;cursor:pointer;border:none;background:transparent;color:rgba(255,255,255,0.45);font-family:'Syne',sans-serif;transition:all 0.15s}
        .nav-tab:hover{color:rgba(255,255,255,0.8);background:rgba(255,255,255,0.05)}
        .nav-tab.active{color:#ecedee;background:rgba(255,255,255,0.08)}
        .navbar-right{display:flex;align-items:center;gap:10px}
        .search-box{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:7px 14px;width:220px;transition:border-color 0.15s}
        .search-box:focus-within{border-color:rgba(126,184,255,0.3)}
        .search-box input{background:none;border:none;outline:none;color:#ecedee;font-size:13px;font-family:'Syne',sans-serif;width:100%}
        .search-box input::placeholder{color:rgba(255,255,255,0.25)}
        .live-badge{display:flex;align-items:center;gap:5px;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.15);border-radius:20px;padding:5px 12px;font-size:11px;color:#4ade80;font-family:'DM Mono',monospace;letter-spacing:0.05em}
        .live-dot{width:5px;height:5px;border-radius:50%;background:#4ade80;box-shadow:0 0 5px #4ade80;animation:blink 1.5s ease-in-out infinite}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}
        .updated{font-size:11px;color:rgba(255,255,255,0.25);font-family:'DM Mono',monospace}
        .content{max-width:1100px;margin:0 auto;padding:32px 24px;position:relative;z-index:1}
        .stats-row{display:flex;gap:32px;margin-bottom:32px;padding-bottom:24px;border-bottom:1px solid rgba(255,255,255,0.05)}
        .stat{display:flex;flex-direction:column;gap:4px}
        .stat-val{font-size:20px;font-weight:700;letter-spacing:-0.5px;font-family:'DM Mono',monospace}
        .stat-label{font-size:11px;color:rgba(255,255,255,0.35)}
        .stat-change{font-size:12px;font-family:'DM Mono',monospace}
        .stat-divider{width:1px;background:rgba(255,255,255,0.06);align-self:stretch}
        .filter-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
        .filter-btn{padding:5px 14px;border-radius:20px;font-size:12px;font-weight:500;cursor:pointer;border:1px solid rgba(255,255,255,0.08);background:rgba(255,255,255,0.03);color:rgba(255,255,255,0.45);font-family:'Syne',sans-serif;transition:all 0.15s;text-transform:capitalize}
        .filter-btn:hover{color:rgba(255,255,255,0.8);border-color:rgba(255,255,255,0.15)}
        .filter-btn.active{background:rgba(126,184,255,0.1);border-color:rgba(126,184,255,0.3);color:#7EB8FF}
        .table{width:100%;border-collapse:collapse}
        .th{padding:10px 12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,0.3);text-align:left;font-weight:500;border-bottom:1px solid rgba(255,255,255,0.05)}
        .th-right{text-align:right}
        .tr{border-bottom:1px solid rgba(255,255,255,0.03);cursor:pointer;transition:background 0.1s}
        .tr:last-child{border-bottom:none}
        .tr:hover{background:rgba(255,255,255,0.025)}
        .td{padding:13px 12px;font-size:14px;vertical-align:middle}
        .td-right{text-align:right}
        .td-mono{font-family:'DM Mono',monospace;font-size:13px}
        .token-cell{display:flex;align-items:center;gap:10px}
        .token-img{width:30px;height:30px;border-radius:50%;border:1px solid rgba(255,255,255,0.06)}
        .token-img-skel{width:30px;height:30px;border-radius:50%;background:#1e1e24;flex-shrink:0}
        .token-name{font-size:14px;font-weight:600}
        .token-sym{font-size:12px;color:rgba(255,255,255,0.35);margin-top:1px}
        .chg-up{color:#4ade80}
        .chg-dn{color:#f87171}
        .signal{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:3px 8px;border-radius:6px;font-family:'DM Mono',monospace;font-weight:500}
        .signal-up{background:rgba(74,222,128,0.08);color:#4ade80;border:1px solid rgba(74,222,128,0.12)}
        .signal-dn{background:rgba(248,113,113,0.08);color:#f87171;border:1px solid rgba(248,113,113,0.12)}
        .skel{display:inline-block;border-radius:5px;background:linear-gradient(90deg,#1a1a22 25%,#1f1f2a 50%,#1a1a22 75%);background-size:200% 100%;animation:shim 1.4s infinite}
        @keyframes shim{0%{background-position:200% 0}100%{background-position:-200% 0}}
        .foot{text-align:center;padding:18px;font-size:11px;color:rgba(255,255,255,0.2);font-family:'DM Mono',monospace;border-top:1px solid rgba(255,255,255,0.03)}
        .trending-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:24px}
        .t-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:14px;padding:16px;cursor:pointer;transition:all 0.15s;animation:fadeUp 0.3s ease forwards;opacity:0}
        .t-card:hover{border-color:rgba(126,184,255,0.2);background:rgba(126,184,255,0.04)}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        .t-card:nth-child(1){animation-delay:.04s}.t-card:nth-child(2){animation-delay:.08s}.t-card:nth-child(3){animation-delay:.12s}.t-card:nth-child(4){animation-delay:.16s}.t-card:nth-child(5){animation-delay:.20s}
        .t-card-top{display:flex;align-items:center;gap:8px;margin-bottom:10px}
        .t-card-name{font-size:13px;font-weight:600}
        .t-card-price{font-size:15px;font-weight:700;font-family:'DM Mono',monospace;margin-bottom:4px}
        .t-card-chg{font-size:13px;font-family:'DM Mono',monospace;font-weight:600}
        .coming-soon{text-align:center;padding:80px 0;color:rgba(255,255,255,0.2);font-size:14px}
        .coming-soon h3{font-size:20px;font-weight:700;color:rgba(255,255,255,0.4);margin-bottom:8px}
        .empty-state{text-align:center;padding:48px;color:rgba(255,255,255,0.25);font-size:13px}
      `}</style>

      <div className="app">
        <Blobs tokens={tokens} />

        <nav className="navbar">
          <div className="navbar-left">
            <a href="/" className="logo">
              <div className="logo-icon"><span className="logo-dot" /></div>
              <span className="logo-text">lunascope</span>
            </a>
            <div className="nav-tabs">
              {(['tokens','trending','whales'] as Tab[]).map(t => (
                <button key={t} className={`nav-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="navbar-right">
            {lastUpdated && <span className="updated">{lastUpdated}</span>}
            <div className="search-box">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tokens..." />
            </div>
            <div className="live-badge">
              <span className="live-dot" />
              LIVE
            </div>
          </div>
        </nav>

        <div className="content">
          <div className="stats-row">
            {[
              { label: '24H Volume', val: loading ? '—' : formatMarketCap(totalVolume), change: null },
              { label: 'Total Mkt Cap', val: loading ? '—' : formatMarketCap(totalMcap), change: null },
              { label: 'Gainers / Losers', val: loading ? '—' : `${gainersCount} / ${losersCount}`, change: null },
              {
                label: 'Top Gainer',
                val: loading ? '—' : topGainer ? topGainer.symbol.toUpperCase() : '—',
                change: loading ? null : topGainer && topGainer.price_change_percentage_24h > 0
                  ? `+${topGainer.price_change_percentage_24h.toFixed(1)}%`
                  : null
              },
            ].map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="stat-divider" />}
                <div className="stat">
                  <div className="stat-label">{s.label}</div>
                  <div className="stat-val">{s.val}</div>
                  {s.change && <div className="stat-change chg-up">{s.change}</div>}
                </div>
              </React.Fragment>
            ))}
          </div>

          {tab === 'tokens' && (
            <>
              <div className="filter-row">
                {(['all', 'gainers', 'losers'] as FilterType[]).map(f => (
                  <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                    {f}
                  </button>
                ))}
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th className="th" style={{width:40}}>#</th>
                    <th className="th">Token name</th>
                    <th className="th th-right">Price</th>
                    <th className="th th-right">1H</th>
                    <th className="th th-right">24H</th>
                    <th className="th th-right">Mkt Cap</th>
                    <th className="th th-right">Volume</th>
                    <th className="th th-right">Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {loading
                    ? Array.from({length:10}).map((_,i) => (
                      <tr key={i} className="tr">
                        <td className="td"><span className="skel" style={{width:20,height:13}} /></td>
                        <td className="td">
                          <div className="token-cell">
                            <div className="token-img-skel" />
                            <div>
                              <div className="skel" style={{width:80,height:13,display:'block',marginBottom:4}} />
                              <div className="skel" style={{width:40,height:11,display:'block'}} />
                            </div>
                          </div>
                        </td>
                        {[100,50,50,80,80,60].map((w,j) => (
                          <td key={j} className="td td-right"><span className="skel" style={{width:w,height:13}} /></td>
                        ))}
                      </tr>
                    ))
                    : filtered.length === 0
                      ? <tr><td colSpan={8} className="empty-state">No tokens match this filter</td></tr>
                      : filtered.map((t,i) => {
                        const isUp = t.price_change_percentage_24h >= 0
                        return (
                          <tr key={t.id} className="tr" onClick={() => window.location.href=`/token/${t.id}`}>
                            <td className="td td-mono" style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>{i+1}</td>
                            <td className="td">
                              <div className="token-cell">
                                <img src={t.image} alt={t.name} className="token-img" />
                                <div>
                                  <div className="token-name">{t.name}</div>
                                  <div className="token-sym">{t.symbol.toUpperCase()}</div>
                                </div>
                              </div>
                            </td>
                            <td className="td td-right td-mono">{formatPrice(t.current_price)}</td>
                            <td className="td td-right td-mono" style={{color:'rgba(255,255,255,0.3)'}}>—</td>
                            <td className={`td td-right td-mono ${isUp?'chg-up':'chg-dn'}`}>
                              {isUp?'+':''}{t.price_change_percentage_24h?.toFixed(2)}%
                            </td>
                            <td className="td td-right td-mono" style={{color:'rgba(255,255,255,0.5)'}}>{formatMarketCap(t.market_cap)}</td>
                            <td className="td td-right td-mono" style={{color:'rgba(255,255,255,0.5)'}}>{formatMarketCap(t.total_volume)}</td>
                            <td className="td td-right">
                              <span className={`signal ${isUp?'signal-up':'signal-dn'}`}>
                                {isUp?'↑':'↓'} {isUp?'Bull':'Bear'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                  }
                </tbody>
              </table>
              <div className="foot">Track meme coins · See what moves the market first · Data by CoinGecko</div>
            </>
          )}

          {tab === 'trending' && (
            <>
              <div className="trending-grid">
                {loading
                  ? Array.from({length:5}).map((_,i) => (
                    <div key={i} className="t-card">
                      <div className="skel" style={{width:30,height:30,borderRadius:'50%',display:'block',marginBottom:8}} />
                      <div className="skel" style={{width:'70%',height:13,display:'block',marginBottom:6}} />
                      <div className="skel" style={{width:'50%',height:18,display:'block'}} />
                    </div>
                  ))
                  : trending.map(t => (
                    <div key={t.id} className="t-card" onClick={() => window.location.href=`/token/${t.id}`}>
                      <div className="t-card-top">
                        <img src={t.image} alt={t.name} style={{width:28,height:28,borderRadius:'50%'}} />
                        <span className="t-card-name">{t.symbol.toUpperCase()}</span>
                      </div>
                      <div className="t-card-price">{formatPrice(t.current_price)}</div>
                      <div className={`t-card-chg ${t.price_change_percentage_24h>=0?'chg-up':'chg-dn'}`}>
                        {t.price_change_percentage_24h>=0?'+':''}{t.price_change_percentage_24h.toFixed(2)}%
                      </div>
                    </div>
                  ))
                }
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th className="th" style={{width:40}}>#</th>
                    <th className="th">Token</th>
                    <th className="th th-right">Price</th>
                    <th className="th th-right">24H Change</th>
                    <th className="th th-right">Volume</th>
                    <th className="th th-right">Mkt Cap</th>
                  </tr>
                </thead>
                <tbody>
                  {[...tokens].sort((a,b) => b.price_change_percentage_24h - a.price_change_percentage_24h).map((t,i) => (
                    <tr key={t.id} className="tr" onClick={() => window.location.href=`/token/${t.id}`}>
                      <td className="td td-mono" style={{color:'rgba(255,255,255,0.3)',fontSize:12}}>{i+1}</td>
                      <td className="td">
                        <div className="token-cell">
                          <img src={t.image} alt={t.name} className="token-img" />
                          <div>
                            <div className="token-name">{t.name}</div>
                            <div className="token-sym">{t.symbol.toUpperCase()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="td td-right td-mono">{formatPrice(t.current_price)}</td>
                      <td className={`td td-right td-mono ${t.price_change_percentage_24h>=0?'chg-up':'chg-dn'}`}>
                        {t.price_change_percentage_24h>=0?'+':''}{t.price_change_percentage_24h.toFixed(2)}%
                      </td>
                      <td className="td td-right td-mono" style={{color:'rgba(255,255,255,0.5)'}}>{formatMarketCap(t.total_volume)}</td>
                      <td className="td td-right td-mono" style={{color:'rgba(255,255,255,0.5)'}}>{formatMarketCap(t.market_cap)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          {tab === 'whales' && (
            <div className="coming-soon">
              <h3>Whale Tracker</h3>
              <p>Coming soon — large transaction monitoring via Etherscan</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}