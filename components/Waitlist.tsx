'use client'
import { useState } from 'react'

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState(false)

  const handleSubmit = () => {
    if (!email || !email.includes('@')) {
      setError(true)
      setTimeout(() => setError(false), 1000)
      return
    }
    setSubmitted(true)
    setEmail('')
    // TODO: send to Supabase
  }

  return (
    <section id="waitlist" style={{
      position: 'relative',
      zIndex: 1,
      padding: '80px 24px',
      maxWidth: '600px',
      margin: '0 auto',
      textAlign: 'center',
    }}>
      <div style={{
        background: '#0f1121',
        border: '1px solid rgba(140,120,255,0.12)',
        borderRadius: '20px',
        padding: '48px 40px',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 0 80px rgba(126,184,255,0.04), 0 0 120px rgba(168,85,247,0.04)',
      }}>
        {/* Glow top */}
        <div style={{
          position: 'absolute',
          top: -60, left: '50%',
          transform: 'translateX(-50%)',
          width: 200, height: 200,
          background: 'radial-gradient(circle, rgba(126,184,255,0.1) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div className="section-label" style={{ textAlign: 'center' }}>// early access</div>
        <h2 style={{
          fontFamily: 'Syne, sans-serif',
          fontSize: '28px',
          fontWeight: 700,
          letterSpacing: '-0.5px',
          marginBottom: '12px',
        }}>
          Get in early.<br />Trade smarter.
        </h2>
        <p style={{ color: '#6b7a99', fontSize: '14px', marginBottom: '32px', lineHeight: 1.7 }}>
          Join the waitlist and get free Pro access for the first 3 months. Limited to 500 spots.
        </p>

        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="your@email.com"
            style={{
              flex: 1,
              background: '#07080f',
              border: `1px solid ${error ? '#FF5C5C' : 'rgba(140,120,255,0.15)'}`,
              borderRadius: '8px',
              padding: '12px 16px',
              color: '#e8edf5',
              fontFamily: 'DM Mono, monospace',
              fontSize: '13px',
              outline: 'none',
              transition: 'border-color 0.2s',
            }}
            onFocus={e => (e.target.style.borderColor = 'rgba(126,184,255,0.4)')}
            onBlur={e => (e.target.style.borderColor = 'rgba(140,120,255,0.15)')}
          />
          <button onClick={handleSubmit} className="btn-primary" style={{ whiteSpace: 'nowrap' }}>
            Join →
          </button>
        </div>

        {submitted && (
          <div style={{ color: '#7EB8FF', fontSize: '13px', marginTop: '12px' }}>
            ✓ You&apos;re on the list! We&apos;ll reach out soon.
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7a99' }}>
          Already <span style={{ color: '#7EB8FF' }}>247 people</span> on the waitlist
        </div>
      </div>

      {/* Telegram CTA */}
      <div style={{
        marginTop: '24px',
        background: 'linear-gradient(135deg, rgba(126,184,255,0.06), rgba(168,85,247,0.06))',
        border: '1px solid rgba(126,184,255,0.12)',
        borderRadius: '16px',
        padding: '28px 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        textAlign: 'left',
      }}>
        <div style={{ fontSize: '36px', flexShrink: 0 }}>✈️</div>
        <div>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
            Try the bot right now
          </h3>
          <p style={{ fontSize: '13px', color: '#6b7a99', marginBottom: '14px', lineHeight: 1.6 }}>
            Our Telegram bot is live. Send any token contract address and get instant analytics — no signup needed.
          </p>
          <a href="https://t.me/lunascope_bot" className="btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
            Open in Telegram →
          </a>
        </div>
      </div>
    </section>
  )
}