'use client'

const stats = [
  { val: '4,200+', label: 'Tokens Tracked', color: '#7EB8FF' },
  { val: '$2.8B', label: 'Volume Analyzed', color: '#A855F7' },
  { val: '12ms', label: 'Data Latency', color: '#C084FC' },
  { val: '99.9%', label: 'Uptime', color: '#e8edf5' },
]

export default function Hero() {
  return (
    <>
      <section style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '120px 24px 80px',
        background: `
          radial-gradient(ellipse 60% 50% at 50% 0%, rgba(168,85,247,0.1) 0%, transparent 70%),
          radial-gradient(ellipse 40% 30% at 50% 0%, rgba(126,184,255,0.08) 0%, transparent 60%)
        `,
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: 'rgba(126,184,255,0.08)',
          border: '1px solid rgba(126,184,255,0.2)',
          borderRadius: '100px',
          padding: '6px 16px',
          fontSize: '12px',
          color: '#7EB8FF',
          letterSpacing: '0.1em',
          marginBottom: '32px',
          animation: 'fadeUp 0.6s ease both',
        }}>
          <span style={{
            width: 6, height: 6,
            borderRadius: '50%',
            background: '#7EB8FF',
            display: 'inline-block',
            animation: 'pulse 1.5s ease-in-out infinite',
          }} />
          EARLY ACCESS — LIMITED SPOTS
        </div>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: 'clamp(48px, 8vw, 92px)',
          fontWeight: 800,
          lineHeight: 1.0,
          letterSpacing: '-3px',
          marginBottom: '24px',
          animation: 'fadeUp 0.6s 0.1s ease both',
        }}>
          See What<br />
          <span style={{
            background: 'linear-gradient(135deg, #7EB8FF, #A855F7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Moves</span> the<br />
          Market First
        </h1>

        <p style={{
          fontSize: '16px',
          color: '#6b7a99',
          maxWidth: '520px',
          lineHeight: 1.8,
          marginBottom: '48px',
          animation: 'fadeUp 0.6s 0.2s ease both',
        }}>
          Real-time analytics for meme tokens and NFT projects. Track holders, volume, whale activity and on-chain signals — all in one place.
        </p>

        {/* CTA Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap',
          justifyContent: 'center',
          marginBottom: '64px',
          animation: 'fadeUp 0.6s 0.3s ease both',
        }}>
          <a href="#waitlist" className="btn-primary">🚀 Join Waitlist</a>
          <a href="https://t.me/lunascope_bot" className="btn-secondary">✈️ Telegram Bot</a>
        </div>

        {/* Stats */}
        <div style={{
          display: 'flex',
          maxWidth: '800px',
          width: '100%',
          border: '1px solid rgba(140,120,255,0.12)',
          borderRadius: '12px',
          overflow: 'hidden',
          background: '#0f1121',
          animation: 'fadeUp 0.6s 0.4s ease both',
          boxShadow: '0 0 40px rgba(126,184,255,0.05), inset 0 0 40px rgba(168,85,247,0.03)',
        }}>
          {stats.map((s, i) => (
            <div key={i} style={{
              flex: 1,
              padding: '20px 24px',
              borderRight: i < stats.length - 1 ? '1px solid rgba(140,120,255,0.1)' : 'none',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: 'Syne, sans-serif',
                fontSize: '24px',
                fontWeight: 700,
                color: s.color,
                textShadow: `0 0 20px ${s.color}44`,
              }}>{s.val}</div>
              <div style={{ fontSize: '11px', color: '#6b7a99', letterSpacing: '0.08em', marginTop: '4px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}