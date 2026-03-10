'use client'
const features = [
  { icon: '🔍', title: 'Token Scanner', desc: 'Paste any contract address. Get holders distribution, liquidity lock status, dev wallet activity, and rug risk score instantly.' },
  { icon: '🐋', title: 'Whale Tracker', desc: 'Follow the smart money. Get alerts when wallets holding 1%+ of supply move tokens. Know before the chart moves.' },
  { icon: '📊', title: 'Trend Detection', desc: 'AI-powered trend detection identifies tokens gaining momentum before they hit mainstream crypto Twitter.' },
  { icon: '🤖', title: 'Telegram Bot', desc: 'Get real-time signals straight to Telegram. Set custom alerts for price, volume spikes, or whale movements.' },
  { icon: '⚡', title: 'Real-time Data', desc: '12ms data latency. No delays, no stale prices. See on-chain activity as it happens across Ethereum and Solana.' },
  { icon: '🛡️', title: 'Rug Protection', desc: 'Automatic honeypot detection, liquidity analysis, and contract audit scoring on every token you view.' },
]

export default function Features() {
  return (
    <section id="features" style={{
      position: 'relative',
      zIndex: 1,
      padding: '80px 24px',
      maxWidth: '1100px',
      margin: '0 auto',
    }}>
      <div className="section-label">// what you get</div>
      <div className="section-title">Built for degens<br />who do their research.</div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        background: 'rgba(140,120,255,0.08)',
        border: '1px solid rgba(140,120,255,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 0 60px rgba(126,184,255,0.03)',
      }}>
        {features.map((f) => (
          <div
            key={f.title}
            style={{
              background: '#0f1121',
              padding: '32px',
              transition: 'background 0.2s',
              cursor: 'default',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.background = 'rgba(126,184,255,0.04)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.background = '#0f1121'
            }}
          >
            <div style={{ fontSize: '24px', marginBottom: '16px' }}>{f.icon}</div>
            <div style={{
              fontFamily: 'Syne, sans-serif',
              fontSize: '16px',
              fontWeight: 700,
              marginBottom: '8px',
              letterSpacing: '-0.3px',
              color: '#e8edf5',
            }}>
              {f.title}
            </div>
            <div style={{ fontSize: '13px', color: '#6b7a99', lineHeight: 1.7 }}>{f.desc}</div>
          </div>
        ))}
      </div>
    </section>
  )
}