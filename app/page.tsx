'use client'
import Navbar from '@/components/Navbar'
import Ticker from '@/components/Ticker'
import Hero from '@/components/Hero'
import Dashboard from '@/components/Dashboard'
import Features from '@/components/Features'
import Waitlist from '@/components/Waitlist'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Ticker />
      <Hero />
      <Dashboard />
      <Features />
      <Waitlist />
      <footer style={{
        position: 'relative',
        zIndex: 1,
        borderTop: '1px solid rgba(140,120,255,0.1)',
        padding: '32px 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        color: '#6b7a99',
        fontSize: '12px',
        flexWrap: 'wrap',
        gap: '12px',
      }}>
        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: '18px', color: '#e8edf5', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7EB8FF', boxShadow: '0 0 10px #7EB8FF', display: 'inline-block' }} />
          lunascope
        </div>
        <div>© 2026 LunaScope. All rights reserved.</div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Twitter', 'Telegram', 'Discord'].map(link => (
            <a key={link} href="#" style={{ color: '#6b7a99', textDecoration: 'none', transition: 'color 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#7EB8FF')}
              onMouseLeave={e => (e.currentTarget.style.color = '#6b7a99')}>
              {link}
            </a>
          ))}
        </div>
      </footer>
    </main>
  )
}