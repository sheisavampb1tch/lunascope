'use client'
const tokens = [
  { name: 'PEPE', price: '$0.00001842', change: '+12.4%', up: true },
  { name: 'DOGE', price: '$0.1823', change: '+3.1%', up: true },
  { name: 'SHIB', price: '$0.00002241', change: '-1.8%', up: false },
  { name: 'FLOKI', price: '$0.0001923', change: '+22.7%', up: true },
  { name: 'WIF', price: '$2.841', change: '-4.2%', up: false },
  { name: 'BONK', price: '$0.00003182', change: '+8.9%', up: true },
  { name: 'BRETT', price: '$0.1124', change: '+15.3%', up: true },
  { name: 'MOG', price: '$0.00000124', change: '-2.1%', up: false },
]

const allTokens = [...tokens, ...tokens]

export default function Ticker() {
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
      <div className="ticker-track">
        {allTokens.map((t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', whiteSpace: 'nowrap' }}>
            <span style={{ color: '#6b7a99' }}>{t.name}</span>
            <span style={{ color: '#e8edf5', fontWeight: 500 }}>{t.price}</span>
            <span style={{ color: t.up ? '#4ade80' : '#FF5C5C' }}>{t.change}</span>
          </div>
        ))}
      </div>
    </div>
  )
}