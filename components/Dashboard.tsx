'use client'
const tokens = [
  { icon: '🐸', name: 'PEPE', mc: '$7.8B', price: '$0.00001842', change: '+12.4%', up: true },
  { icon: '🐕', name: 'WIF', mc: '$2.8B', price: '$2.841', change: '-4.2%', up: false },
  { icon: '🔥', name: 'FLOKI', mc: '$1.9B', price: '$0.0001923', change: '+22.7%', up: true },
]

const bars1 = [30, 45, 35, 60, 40, 75, 55, 90, 70, 100]
const bars2 = [50, 40, 65, 45, 80, 60, 70, 55, 85, 100]

export default function Dashboard() {
  return (
    <section id="demo" style={{
      position: 'relative',
      zIndex: 1,
      padding: '80px 24px',
      maxWidth: '1100px',
      margin: '0 auto',
    }}>
      <div className="section-label">// live demo</div>
      <div className="section-title">Your edge,<br />visualized.</div>

      {/* Frame */}
      <div style={{
        background: '#0f1121',
        border: '1px solid rgba(140,120,255,0.12)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 40px 80px rgba(0,0,0,0.5), 0 0 60px rgba(126,184,255,0.04), 0 0 120px rgba(168,85,247,0.04)',
      }}>
        {/* Browser bar */}
        <div style={{
          background: '#0b0d1a',
          borderBottom: '1px solid rgba(140,120,255,0.1)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          {['#FF5C5C', '#F7C948', '#4ade80'].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />
          ))}
          <div style={{
            marginLeft: '12px',
            fontSize: '11px',
            color: '#6b7a99',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(140,120,255,0.1)',
            padding: '4px 12px',
            borderRadius: '4px',
          }}>
            lunascope.xyz/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div style={{ padding: '20px', background: '#07080f' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '16px' }}>Meme Token Dashboard</div>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['1H', '24H', '7D'].map((t, i) => (
                <span key={t} style={{
                  fontSize: '11px',
                  padding: '4px 10px',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: i === 1 ? '#7EB8FF' : '#6b7a99',
                  background: i === 1 ? 'rgba(126,184,255,0.08)' : 'rgba(255,255,255,0.04)',
                  border: i === 1 ? '1px solid rgba(126,184,255,0.2)' : '1px solid rgba(140,120,255,0.1)',
                }}>
                  {t}
                </span>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(140,120,255,0.08)' }}>
            {/* Volume card */}
            <div style={{ background: '#0f1121', padding: '20px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#6b7a99', textTransform: 'uppercase', marginBottom: '12px' }}>Total Volume 24H</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#7EB8FF', textShadow: '0 0 20px rgba(126,184,255,0.3)' }}>$847.2M</div>
              <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px' }}>↑ +18.4% vs yesterday</div>
              <div style={{ marginTop: '16px', height: '50px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                {bars1.map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: '2px 2px 0 0',
                    background: i > 6 ? 'linear-gradient(to top, #7EB8FF, #A855F7)' : '#7EB8FF',
                    opacity: 0.7,
                  }} />
                ))}
              </div>
            </div>

            {/* New tokens card */}
            <div style={{ background: '#0f1121', padding: '20px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#6b7a99', textTransform: 'uppercase', marginBottom: '12px' }}>New Tokens (24H)</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#A855F7', textShadow: '0 0 20px rgba(168,85,247,0.3)' }}>1,284</div>
              <div style={{ fontSize: '12px', color: '#4ade80', marginTop: '4px' }}>↑ +6.2% vs yesterday</div>
              <div style={{ marginTop: '16px', height: '50px', display: 'flex', alignItems: 'flex-end', gap: '3px' }}>
                {bars2.map((h, i) => (
                  <div key={i} style={{
                    flex: 1,
                    height: `${h}%`,
                    borderRadius: '2px 2px 0 0',
                    background: '#A855F7',
                    opacity: 0.7,
                  }} />
                ))}
              </div>
            </div>

            {/* Rug risk */}
            <div style={{ background: '#0f1121', padding: '20px' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#6b7a99', textTransform: 'uppercase', marginBottom: '12px' }}>Avg Rug Risk Score</div>
              <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '28px', fontWeight: 700, color: '#C084FC', textShadow: '0 0 20px rgba(192,132,252,0.3)' }}>3.2 / 10</div>
              <div style={{ fontSize: '12px', color: '#C084FC', marginTop: '4px' }}>● Low Risk Today</div>
            </div>

            {/* Token list */}
            <div style={{ background: '#0f1121', padding: '20px', gridColumn: 'span 3' }}>
              <div style={{ fontSize: '10px', letterSpacing: '0.12em', color: '#6b7a99', textTransform: 'uppercase', marginBottom: '12px' }}>🔥 Trending Now</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {tokens.map((t) => (
                  <div key={t.name} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    background: 'rgba(126,184,255,0.02)',
                    border: '1px solid rgba(140,120,255,0.1)',
                    borderRadius: '8px',
                    transition: 'border-color 0.2s',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(126,184,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                        {t.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500 }}>{t.name}</div>
                        <div style={{ fontSize: '11px', color: '#6b7a99' }}>MC: {t.mc}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '13px', fontWeight: 600 }}>{t.price}</div>
                      <div style={{ fontSize: '11px', marginTop: '2px', color: t.up ? '#4ade80' : '#FF5C5C' }}>{t.change}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}