'use client'

export default function Navbar() {
  return (
    <nav style={{
      position: 'fixed',
      top: 0, left: 0, right: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '18px 48px',
      borderBottom: '1px solid rgba(140,120,255,0.1)',
      background: 'rgba(7,8,15,0.85)',
      backdropFilter: 'blur(16px)',
    }}>
      <div style={{
        fontFamily: 'Syne, sans-serif',
        fontWeight: 800,
        fontSize: '20px',
        letterSpacing: '-0.5px',
        color: '#e8edf5',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <span style={{
          width: 8, height: 8,
          borderRadius: '50%',
          background: '#7EB8FF',
          boxShadow: '0 0 12px #7EB8FF',
          display: 'inline-block',
          animation: 'pulse 2s ease-in-out infinite',
        }} />
        lunascope
      </div>

      <ul style={{ display: 'flex', gap: '32px', listStyle: 'none', alignItems: 'center' }}>
        {[['Features', '#features'], ['Dashboard', '#demo'], ['Pricing', '#waitlist']].map(([label, href]) => (
          <li key={label}>
            <a href={href} style={{
              color: '#6b7a99',
              textDecoration: 'none',
              fontSize: '13px',
              letterSpacing: '0.05em',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = '#e8edf5')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>
              {label}
            </a>
          </li>
        ))}
        <li>
          <a href="#waitlist" style={{
            background: 'linear-gradient(135deg, #7EB8FF, #A855F7)',
            color: '#fff',
            padding: '8px 18px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 500,
            textDecoration: 'none',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
            Join Waitlist
          </a>
        </li>
      </ul>
    </nav>
  )
}