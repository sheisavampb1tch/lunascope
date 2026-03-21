'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { LogoMark, WalletIcon } from './icons'
import type { WalletOption } from './use-wallet-auth'

type AccessSummary = {
  hasAccess: boolean
  tier: 'FREE' | 'ALPHA' | 'PRO' | 'ADMIN' | null
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | null
  sourceCode: string | null
}

type WalletModalSession = {
  loadingSession: boolean
  connectingWalletId: string | null
  redeeming: boolean
  authenticated: boolean
  walletAddress: string | null
  access: AccessSummary
  error: string | null
}

type WalletConnectModalProps = {
  open: boolean
  onClose: () => void
  wallets: WalletOption[]
  session: WalletModalSession
  displayWalletAddress: string
  onConnect: (walletId: WalletOption['id']) => Promise<void>
  onRedeem: (inviteCode: string) => Promise<void>
  onDisconnect: () => Promise<void>
}

function WalletGlyph({ walletId }: { walletId: WalletOption['id'] }) {
  const baseStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    display: 'block',
  }

  if (walletId === 'metamask') {
    return (
      <svg viewBox="0 0 24 24" fill="none" style={baseStyle} aria-hidden="true">
        <path d="M4.5 5.2 10.5 9.5 9.4 6.8 4.5 5.2Z" fill="#E2761B" />
        <path d="m19.5 5.2-6 4.3 1.1-2.7 4.9-1.6Z" fill="#E2761B" />
        <path d="m6 14.8 2.1 3.1 4-1.1-.1 2.2v1.1H9.5l-3.5-5.3Z" fill="#E2761B" />
        <path d="m18 14.8-3.5 5.3H12v-1.1l-.1-2.2 4 1.1 2.1-3.1Z" fill="#E2761B" />
        <path d="m14.7 11.3 1 2.1-3.7 1-.1-3Z" fill="#F6851B" />
        <path d="m9.3 11.3-.1 3-3.7-1 1-2.1Z" fill="#F6851B" />
        <path d="m9.3 11.3 2.6-.2 2.8.2-.2 3.5-2.6 1.4-2.4-1.4-.2-3.5Z" fill="#763D16" />
      </svg>
    )
  }

  if (walletId === 'coinbase') {
    return (
      <svg viewBox="0 0 24 24" fill="none" style={baseStyle} aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#2563FF" />
        <path d="M12 7.2A4.8 4.8 0 1 0 12 16.8A4.8 4.8 0 1 0 12 7.2Z" fill="white" />
        <path d="M12 9.7a2.3 2.3 0 1 0 0 4.6a2.3 2.3 0 1 0 0-4.6Z" fill="#2563FF" />
      </svg>
    )
  }

  if (walletId === 'rabby') {
    return (
      <svg viewBox="0 0 24 24" fill="none" style={baseStyle} aria-hidden="true">
        <rect x="2.5" y="2.5" width="19" height="19" rx="6" fill="#111827" stroke="rgba(255,255,255,0.08)" />
        <path d="M8 7.5 5.5 12 8 16.5h2.6L8.2 12l2.4-4.5Z" fill="#7EB8FF" />
        <path d="M16 7.5 18.5 12 16 16.5h-2.6l2.4-4.5-2.4-4.5Z" fill="#00C4FF" />
        <path d="M10.2 7.5h3.6L11.6 12l2.2 4.5h-3.6L8 12l2.2-4.5Z" fill="#D9F3FF" fillOpacity=".92" />
      </svg>
    )
  }

  if (walletId === 'walletconnect') {
    return (
      <svg viewBox="0 0 24 24" fill="none" style={baseStyle} aria-hidden="true">
        <rect x="2" y="2" width="20" height="20" rx="6" fill="#3B99FC" />
        <path d="M7.3 9.8c2.6-2.4 6.8-2.4 9.4 0l.3.3-.9.9-.3-.3c-2.1-2-5.5-2-7.6 0l-.3.3-.9-.9.3-.3Zm-1.6 1.9c3.4-3.2 9.1-3.2 12.5 0l.2.2-.9.9-.2-.2c-2.9-2.7-7.6-2.7-10.4 0l-.2.2-.9-.9.2-.2Zm2.8 2 .7-.7c1.8-1.7 4.8-1.7 6.6 0l.7.7-1 1-.7-.7c-1.3-1.2-3.4-1.2-4.7 0l-.7.7-1-1Zm5.5 1.5a1.2 1.2 0 1 1-2.4 0a1.2 1.2 0 0 1 2.4 0Z" fill="white" />
      </svg>
    )
  }

  return <WalletIcon style={{ width: 18, height: 18 }} />
}

function AccessBadge({ tier, status }: { tier: AccessSummary['tier']; status: AccessSummary['status'] }) {
  const label = tier ? `${tier} ${status ?? ''}`.trim() : 'Guest'
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: '#7EB8FF',
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(126,184,255,0.18)',
        background: 'rgba(126,184,255,0.08)',
      }}
    >
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7EB8FF', boxShadow: '0 0 8px rgba(126,184,255,0.7)' }} />
      {label.toUpperCase()}
    </span>
  )
}

export function WalletConnectModal({
  open,
  onClose,
  wallets,
  session,
  displayWalletAddress,
  onConnect,
  onRedeem,
  onDisconnect,
}: WalletConnectModalProps) {
  const [inviteCode, setInviteCode] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEscape)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleEscape)
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setInviteCode('')
      setLocalError(null)
    }
  }, [open])

  const featuredWallet = useMemo(
    () => wallets.find((wallet) => wallet.ready && wallet.id !== 'browser') ?? wallets.find((wallet) => wallet.ready),
    [wallets],
  )
  const secondaryWallets = useMemo(
    () => wallets.filter((wallet) => !featuredWallet || wallet.id !== featuredWallet.id),
    [featuredWallet, wallets],
  )
  const combinedError = localError ?? session.error
  const accessReady = session.authenticated && session.access.hasAccess
  const inviteRequired = session.authenticated && !session.access.hasAccess

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 400,
        background: 'rgba(5,7,10,0.72)',
        backdropFilter: 'blur(18px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 430,
          borderRadius: 24,
          border: '1px solid rgba(126,184,255,0.12)',
          background: 'linear-gradient(180deg, rgba(15,16,21,0.96) 0%, rgba(12,12,14,0.98) 100%)',
          boxShadow: '0 24px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(126,184,255,0.02), 0 0 60px rgba(126,184,255,0.08)',
          color: '#f0f0f2',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: '-20% auto auto 50%',
            width: 260,
            height: 260,
            transform: 'translateX(-50%)',
            background: 'radial-gradient(circle, rgba(126,184,255,0.14), rgba(126,184,255,0))',
            pointerEvents: 'none',
          }}
        />

        <div style={{ position: 'relative', zIndex: 1, padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 22 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(126,184,255,0.12)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 18px rgba(126,184,255,0.12)',
                  }}
                >
                  <LogoMark style={{ width: 22, height: 22 }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.35)' }}>
                  LUNASCOPE ACCESS
                </div>
              </div>
              <h3 style={{ fontSize: 28, lineHeight: 1.05, fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 8 }}>
                {session.authenticated ? 'Wallet session live' : 'Connect wallet'}
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.4)', maxWidth: 300 }}>
                {session.authenticated
                  ? 'Signed session active. Unlock private LunaScope operator access or continue into the terminal.'
                  : 'Sign a secure message to unlock LunaScope. No transaction is sent on-chain.'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
                color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {session.authenticated ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div
                style={{
                  borderRadius: 18,
                  padding: 18,
                  border: '1px solid rgba(126,184,255,0.12)',
                  background: 'linear-gradient(135deg, rgba(126,184,255,0.12), rgba(0,196,255,0.06))',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.42)', marginBottom: 6 }}>
                      CONNECTED WALLET
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                      {displayWalletAddress}
                    </div>
                  </div>
                  <AccessBadge tier={session.access.tier} status={session.access.status} />
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: 'rgba(255,255,255,0.52)' }}>
                  {accessReady
                    ? 'Operator access is active on this wallet. You can open the dashboard and view the unlocked signal feed.'
                    : 'Wallet is connected. Redeem an invite code to unlock operator-only signals and richer analyst context.'}
                </div>
              </div>

              {inviteRequired ? (
                <form
                  onSubmit={async (event) => {
                    event.preventDefault()
                    setLocalError(null)

                    if (!inviteCode.trim()) {
                      setLocalError('Enter an invite code to activate access.')
                      return
                    }

                    try {
                      await onRedeem(inviteCode.trim())
                      setInviteCode('')
                    } catch (error) {
                      setLocalError(error instanceof Error ? error.message : 'Invite redemption failed.')
                    }
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    padding: 18,
                    borderRadius: 18,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.025)',
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#7EB8FF' }}>INVITE ACCESS</div>
                  <input
                    value={inviteCode}
                    onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                    placeholder="ENTER INVITE CODE"
                    style={{
                      width: '100%',
                      padding: '13px 14px',
                      borderRadius: 12,
                      border: '1px solid rgba(126,184,255,0.12)',
                      background: 'rgba(10,12,16,0.9)',
                      color: '#f0f0f2',
                      fontSize: 14,
                      fontWeight: 500,
                      outline: 'none',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}
                  />
                  <button
                    type="submit"
                    disabled={session.redeeming}
                    style={{
                      width: '100%',
                      padding: '13px 16px',
                      borderRadius: 12,
                      border: 'none',
                      cursor: session.redeeming ? 'default' : 'pointer',
                      background: 'linear-gradient(135deg, #7EB8FF, #00C4FF)',
                      color: '#0c0c0e',
                      fontSize: 14,
                      fontWeight: 600,
                      opacity: session.redeeming ? 0.75 : 1,
                      boxShadow: '0 0 22px rgba(126,184,255,0.24)',
                    }}
                  >
                    {session.redeeming ? 'Redeeming access...' : 'Redeem invite'}
                  </button>
                </form>
              ) : null}

              <div style={{ display: 'flex', gap: 10 }}>
                {accessReady ? (
                  <a
                    href="/dashboard"
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '13px 16px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      background: 'linear-gradient(135deg, #7EB8FF, #00C4FF)',
                      color: '#0c0c0e',
                      fontSize: 14,
                      fontWeight: 600,
                      boxShadow: '0 0 22px rgba(126,184,255,0.24)',
                    }}
                  >
                    Open dashboard
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => void onDisconnect()}
                  style={{
                    flex: accessReady ? '0 0 132px' : 1,
                    padding: '13px 16px',
                    borderRadius: 12,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(255,255,255,0.03)',
                    color: 'rgba(255,255,255,0.72)',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Disconnect
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {featuredWallet ? (
                <button
                  type="button"
                  disabled={!featuredWallet.ready || session.connectingWalletId !== null}
                  onClick={() => void onConnect(featuredWallet.id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 18,
                    border: '1px solid rgba(126,184,255,0.16)',
                    padding: 18,
                    cursor: featuredWallet.ready && !session.connectingWalletId ? 'pointer' : 'default',
                    background: 'linear-gradient(135deg, rgba(126,184,255,0.95), rgba(0,196,255,0.92))',
                    color: '#0c0c0e',
                    boxShadow: '0 12px 40px rgba(126,184,255,0.18)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        background: 'rgba(12,12,14,0.14)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <WalletGlyph walletId={featuredWallet.id} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 4 }}>
                        Connect {featuredWallet.name}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.45, color: 'rgba(12,12,14,0.72)' }}>
                        Sign a secure LunaScope session with your detected wallet. No gas, no transaction, no custody.
                      </div>
                    </div>
                  </div>
                </button>
              ) : null}

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: 'rgba(255,255,255,0.3)' }}>
                  OTHER WALLETS
                </div>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              </div>

              <div
                style={{
                  borderRadius: 18,
                  border: '1px solid rgba(255,255,255,0.07)',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                {secondaryWallets.map((wallet, index) => {
                  const busy = session.connectingWalletId === wallet.id
                  const disabled = !wallet.ready || Boolean(session.connectingWalletId)

                  return (
                    <button
                      key={wallet.id}
                      type="button"
                      onClick={() => void onConnect(wallet.id)}
                      disabled={disabled}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        padding: '16px 18px',
                        background: 'transparent',
                        border: 'none',
                        borderTop: index === 0 ? 'none' : '1px solid rgba(255,255,255,0.06)',
                        color: '#f0f0f2',
                        cursor: disabled ? 'default' : 'pointer',
                        opacity: wallet.ready || wallet.id === 'walletconnect' ? 1 : 0.8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}>
                        <div
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 12,
                            background: 'rgba(255,255,255,0.04)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <WalletGlyph walletId={wallet.id} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 3 }}>
                            {wallet.name}
                          </div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.34)' }}>
                            {wallet.subtitle}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: wallet.ready ? '#7EB8FF' : 'rgba(255,255,255,0.34)' }}>
                        {busy ? 'Connecting...' : wallet.badge ?? (wallet.ready ? 'Ready' : 'Install')}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {combinedError ? (
            <div
              style={{
                marginTop: 14,
                borderRadius: 12,
                border: '1px solid rgba(248,113,113,0.22)',
                background: 'rgba(248,113,113,0.08)',
                padding: '12px 14px',
                color: '#fca5a5',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {combinedError}
            </div>
          ) : null}

          <div style={{ marginTop: 16, fontSize: 11, lineHeight: 1.6, color: 'rgba(255,255,255,0.25)' }}>
            By connecting a wallet, you only sign an authentication message for LunaScope. This flow never submits a blockchain transaction.
          </div>
        </div>
      </div>
    </div>
  )
}
