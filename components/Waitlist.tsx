'use client'
import { useState } from 'react'

const SUPABASE_URL = 'https://zhfmjnaaxzkajiqkycfb.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZm1qbmFheHprYWppcWt5Y2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMxODA5ODIsImV4cCI6MjA4ODc1Njk4Mn0.A9PFcxtQgYrHJn8405NhjG9gIhYcJD-vNQIfcztRRC8'

async function addToWaitlist(email: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/waitlist`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({ email }),
  })
  return res
}

export default function Waitlist() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) {
      setError('invalid')
      setTimeout(() => setError(''), 1000)
      return
    }
    setLoading(true)
    try {
      const res = await addToWaitlist(email)
      if (res.status === 201) {
        setSubmitted(true)
        setEmail('')
      } else if (res.status === 409) {
        setError('duplicate')
        setTimeout(() => setError(''), 2000)
      } else {
        setError('server')
        setTimeout(() => setError(''), 2000)
      }
    } catch {
      setError('server')
      setTimeout(() => setError(''), 2000)
    }
    setLoading(false)
  }

  const errorMsg =
    error === 'invalid' ? 'Enter a valid email.' :
    error === 'duplicate' ? 'This email is already on the list!' :
    error === 'server' ? 'Something went wrong. Try again.' : ''

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

        {!submitted ? (
          <>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="your@email.com"
                disabled={loading}
                style={{
                  flex: 1,
                  background: '#07080f',
                  border: `1px solid ${error === 'invalid' ? '#FF5C5C' : 'rgba(140,120,255,0.15)'}`,
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#e8edf5',
                  fontFamily: 'DM Mono, monospace',
                  fontSize: '13px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  opacity: loading ? 0.6 : 1,
                }}
                onFocus={e => (e.target.style.borderColor = 'rgba(126,184,255,0.4)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(140,120,255,0.15)')}
              />
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="btn-primary"
                style={{ whiteSpace: 'nowrap', opacity: loading ? 0.7 : 1 }}
              >
                {loading ? '...' : 'Join →'}
              </button>
            </div>
            {errorMsg && (
              <div style={{ color: '#FF5C5C', fontSize: '13px', marginTop: '10px' }}>
                {errorMsg}
              </div>
            )}
          </>
        ) : (
          <div style={{
            background: 'rgba(126,184,255,0.06)',
            border: '1px solid rgba(126,184,255,0.2)',
            borderRadius: '10px',
            padding: '20px',
            color: '#7EB8FF',
            fontSize: '14px',
            lineHeight: 1.6,
          }}>
            ✓ You&apos;re on the list!<br/>
            <span style={{ color: '#6b7a99', fontSize: '13px' }}>We&apos;ll reach out when early access opens.</span>
          </div>
        )}

        <div style={{ marginTop: '20px', fontSize: '12px', color: '#6b7a99' }}>
          Limited to <span style={{ color: '#7EB8FF' }}>500 spots</span>
        </div>
      </div>

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
            Our Telegram bot is live. Send any token address and get instant analytics — no signup needed.
          </p>
          <a href="https://t.me/lunascope_bot" className="btn-primary" style={{ fontSize: '13px', padding: '10px 20px' }}>
            Open in Telegram →
          </a>
        </div>
      </div>
    </section>
  )
}