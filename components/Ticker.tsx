'use client'
import { useEffect, useState } from 'react'

const COIN_IDS = [
  'pepe', 'dogecoin', 'shiba-inu', 'floki',
  'dogwifcoin', 'bonk', 'brett', 'mog-coin'
]

const COIN_SYMBOLS: Record<string, string> = {
  'pepe': 'PEPE',
  'dogecoin': 'DOGE',
  'shiba-inu': 'SHIB',
  'floki': 'FLOKI',
  'dogwifcoin': 'WIF',
  'bonk': 'BONK',
  'brett': 'BRETT',
  'mog-coin': 'MOG',
}

interface Token {
  name: string
  price: string
  change: string
  up: boolean
}

function formatPrice(price: number): string {
  if (price < 0.000001) return `$${price.toFixed(10)}`
  if (price < 0.00001) return `$${price.toFixed(8)}`
  if (price < 0.001) return `$${price.toFixed(6)}`
  if (price < 1) return `$${price.toFixed(5)}`
  return `$${price.toFixed(3)}`
}

export default function Ticker() {
  const [tokens, setTokens] = useState<Token[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const ids = COIN_IDS.join(',')
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
          { cache: 'no-store' }
        )
        const data = await res.json()

        const fetched: Token[] = COIN_IDS.map(id => {
          const coin = data[id]
          const price = coin?.usd ?? 0
          const change = coin?.usd_24h_change ?? 0
          return {
            name: COIN_SYMBOLS[id],
            price: formatPrice(price),
            change: `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
            up: change >= 0,
          }
        })

        setTokens(fetched)
      } catch {
        setTokens([
          { name: 'PEPE', price: '$0.00001842', change: '+12.4%', up: true },
          { name: 'DOGE', price: '$0.1823', change: '+3.1%', up: true },
          { name: 'SHIB', price: '$0.00002241', change: '-1.8%', up: false },
          { name: 'FLOKI', price: '$0.0001923', change: '+22.7%', up: true },
          { name: 'WIF', price: '$2.841', change: '-4.2%', up: false },
          { name: 'BONK', price: '$0.00003182', change: '+8.9%', up: true },
          { name: 'BRETT', price: '$0.1124', change: '+15.3%', up: true },
          { name: 'MOG', price: '$0.00000124', change: '-2.1%', up: false },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchPrices()
    const interval = setInterval(fetchPrices, 60000)
    return () => clearInterval(interval)
  }, [])

  const allTokens = [...tokens, ...tokens]

  return (
    <div style={{
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden',
      borderTop: '1px solid rgba(140,120,255,0.1)',
      borderBottom: '1px solid rgba(140,120,255,0.1)',
      padding: '10px 0',
      background: '#0b0d1a',
      marginTop: '64px',
    }}>
      <style>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        .ticker-track {
          display: flex;
          gap: 48px;
          animation: ticker 30s linear infinite;
          width: max-content;
        }
      `}</style>
      {loading ? (
        <div style={{ textAlign: 'center', fontSize: '12px', color: '#6b7a99', padding: '0 24px' }}>
          Loading live prices...
        </div>
      ) : (
        <div className="ticker-track">
          {allTokens.map((t, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', whiteSpace: 'nowrap' }}>
              <span style={{ color: '#6b7a99' }}>{t.name}</span>
              <span style={{ color: '#e8edf5', fontWeight: 500 }}>{t.price}</span>
              <span style={{ color: t.up ? '#4ade80' : '#FF5C5C' }}>{t.change}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}