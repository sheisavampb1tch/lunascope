'use client'
import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Ticker from '@/components/Ticker'

interface Token {
  id: string
  symbol: string
  name: string
  image: string
  current_price: number
  price_change_percentage_24h: number
  market_cap: number
  total_volume: number
  market_cap_rank: number
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

export default function AppPage() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all')
  const [search, setSearch] = useState('')
  const [lastUpdated, setLastUpdated] = useState<string>('')

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
  const gainers = tokens.filter(t => t.price_change_percentage_24h > 0).length
  const topGainer = [...tokens].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h)[0]

  return (
    <main style={{ minHeight: '100vh', background: '#07080f', color: '#e8edf5' }}>
      <Navbar />
      <Ticker />

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 24px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '28px' }}>
              Meme Token Dashboard
            </div>
            <div style={{ fontSize: '13px', color: '#6b7a99', marginTop: '4px' }}>
              Live data · Updates every 60s {lastUpdated && `· Last updated ${lastUpdated}`}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: '#4ade80',
            background: 'rgba(74,222,128,0.08)',
            border: '1px solid rgba(74,222,128,0.2)',
            borderRadius: '6px',
            padding: '6px 12px',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', display: 'inline-block', boxShadow: '0 0 6px #4ade80' }} />
            LIVE
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '24px' }}>
          {[
            { label: 'Total Volume 24H', value: loading ? '...' : formatMarketCap(totalVolume), color: '#7EB8FF', sub: `${tokens.length} tokens tracked` },
            { label: 'Gainers Today', value: loading ? '...' : `${gainers} / ${tokens.length}`, color: '#4ade80', sub: 'Positive 24h change' },
            { label: 'Top Gainer', value: loading ? '...' : topGainer ? `${topGainer.symbol.toUpperCase()} +${topGainer.price_change_percentage_24h.toFixed(1)}%` : '-', color: '#A855F7', sub: 'Best performer 24h' },
          ].map((s, i) => (
            <div key={i} style={{
              background: '#0f1121',
              border: '1px solid rgba(140,120,255,0.1)',
              borderRadius: '12px',
              padding: '20px',
            }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#6b7a99', textTransform: 'uppercase', marginBottom: '8px' }}>{s.label}</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#6b7a99', marginTop: '4px' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Filters + Search */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search token..."
            style={{
              background: '#0f1121',
              border: '1px solid rgba(140,120,255,0.15)',
              borderRadius: '8px',
              padding: '8px 16px',
              color: '#e8edf5',
              fontSize: '13px',
              outline: 'none',
              width: '200px',
            }}
          />
          <div style={{ display: 'flex', gap: '8px' }}>
            {(['all', 'gainers', 'losers'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  border: filter === f ? '1px solid rgba(126,184,255,0.4)' : '1px solid rgba(140,120,255,0.1)',
                  background: filter === f ? 'rgba(126,184,255,0.08)' : '#0f1121',
                  color: filter === f ? '#7EB8FF' : '#6b7a99',
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Token Table */}
        <div style={{
          background: '#0f1121',
          border: '1px solid rgba(140,120,255,0.1)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          {/* Table header */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '40px 2fr 1fr 1fr 1fr',
            padding: '12px 20px',
            fontSize: '10px',
            letterSpacing: '0.1em',
            color: '#6b7a99',
            textTransform: 'uppercase',
            borderBottom: '1px solid rgba(140,120,255,0.08)',
          }}>
            <div>#</div>
            <div>Token</div>
            <div style={{ textAlign: 'right' }}>Price</div>
            <div style={{ textAlign: 'right' }}>24h %</div>
            <div style={{ textAlign: 'right' }}>Market Cap</div>
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{
                display: 'grid',
                gridTemplateColumns: '40px 2fr 1fr 1fr 1fr',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(140,120,255,0.05)',
                opacity: 0.3,
              }}>
                {Array.from({ length: 5 }).map((_, j) => (
                  <div key={j} style={{ height: 16, background: '#1a1d2e', borderRadius: 4, margin: '0 4px' }} />
                ))}
              </div>
            ))
          ) : filtered.map((t, i) => (
            <div
              key={t.id}
              style={{
                display: 'grid',
                gridTemplateColumns: '40px 2fr 1fr 1fr 1fr',
                padding: '14px 20px',
                borderBottom: '1px solid rgba(140,120,255,0.05)',
                transition: 'background 0.15s',
                cursor: 'default',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(126,184,255,0.02)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontSize: '12px', color: '#6b7a99', display: 'flex', alignItems: 'center' }}>{i + 1}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img src={t.image} alt={t.name} style={{ width: 28, height: 28, borderRadius: '50%' }} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{t.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b7a99' }}>{t.symbol.toUpperCase()}</div>
                </div>
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontFamily: 'DM Mono, monospace', fontSize: '13px' }}>
                {formatPrice(t.current_price)}
              </div>
              <div style={{
                textAlign: 'right',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                fontSize: '13px',
                color: t.price_change_percentage_24h >= 0 ? '#4ade80' : '#FF5C5C',
                fontFamily: 'DM Mono, monospace',
              }}>
                {t.price_change_percentage_24h >= 0 ? '+' : ''}{t.price_change_percentage_24h?.toFixed(2)}%
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', fontSize: '13px', color: '#6b7a99', fontFamily: 'DM Mono, monospace' }}>
                {formatMarketCap(t.market_cap)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#6b7a99' }}>
          Data powered by CoinGecko · <a href="/" style={{ color: '#7EB8FF', textDecoration: 'none' }}>← Back to lunascope.xyz</a>
        </div>
      </div>
    </main>
  )
}