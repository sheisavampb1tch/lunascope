'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type BrowserEthereumProvider = {
  request: (args: { method: string; params?: unknown[] | Record<string, unknown> }) => Promise<unknown>
  providers?: BrowserEthereumProvider[]
  isMetaMask?: boolean
  isCoinbaseWallet?: boolean
  isRabby?: boolean
}

type AccessSummary = {
  walletAddress: string | null
  hasAccess: boolean
  tier: 'FREE' | 'ALPHA' | 'PRO' | 'ADMIN' | null
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | null
  sourceCode: string | null
  grantedAt: string | null
}

type SessionResponse = {
  authenticated: boolean
  walletAddress: string | null
  access: AccessSummary
}

export type WalletOption = {
  id: 'metamask' | 'rabby' | 'coinbase' | 'browser' | 'walletconnect'
  name: string
  subtitle: string
  badge?: string
  ready: boolean
  featured?: boolean
  provider?: BrowserEthereumProvider
}

type DetectedWalletDescriptor = Pick<WalletOption, 'id' | 'name' | 'subtitle' | 'badge'>

type WalletState = {
  loadingSession: boolean
  connectingWalletId: string | null
  redeeming: boolean
  authenticated: boolean
  walletAddress: string | null
  access: AccessSummary
  error: string | null
}

const EMPTY_ACCESS: AccessSummary = {
  walletAddress: null,
  hasAccess: false,
  tier: null,
  status: null,
  sourceCode: null,
  grantedAt: null,
}

declare global {
  interface Window {
    ethereum?: BrowserEthereumProvider
  }
}

function detectWallet(provider: BrowserEthereumProvider) {
  if (provider.isRabby) {
    return {
      id: 'rabby',
      name: 'Rabby',
      subtitle: 'Detected in your browser',
      badge: 'Detected',
    } satisfies DetectedWalletDescriptor
  }

  if (provider.isCoinbaseWallet) {
    return {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      subtitle: 'Detected in your browser',
      badge: 'Detected',
    } satisfies DetectedWalletDescriptor
  }

  if (provider.isMetaMask) {
    return {
      id: 'metamask',
      name: 'MetaMask',
      subtitle: 'Detected in your browser',
      badge: 'Detected',
    } satisfies DetectedWalletDescriptor
  }

  return {
    id: 'browser',
    name: 'Browser Wallet',
    subtitle: 'Sign in with your installed EVM wallet',
    badge: 'Detected',
  } satisfies DetectedWalletDescriptor
}

function listWallets() {
  const provider = typeof window === 'undefined' ? undefined : window.ethereum
  const discoveredProviders = Array.isArray(provider?.providers) && provider.providers.length > 0
    ? provider.providers
    : provider
      ? [provider]
      : []

  const detected = new Map<WalletOption['id'], WalletOption>()

  for (const discoveredProvider of discoveredProviders) {
    const wallet = detectWallet(discoveredProvider)
    if (!detected.has(wallet.id)) {
      detected.set(wallet.id, {
        ...wallet,
        ready: true,
        featured: true,
        provider: discoveredProvider,
      })
    }
  }

  const orderedIds: WalletOption['id'][] = ['metamask', 'rabby', 'coinbase', 'browser']
  const baseWallets = orderedIds.map((id) => {
    const detectedWallet = detected.get(id)
    if (detectedWallet) {
      return detectedWallet
    }

    if (id === 'metamask') {
      return {
        id,
        name: 'MetaMask',
        subtitle: 'Install the extension to connect',
        ready: false,
      } satisfies WalletOption
    }

    if (id === 'rabby') {
      return {
        id,
        name: 'Rabby',
        subtitle: 'Install the extension to connect',
        ready: false,
      } satisfies WalletOption
    }

    if (id === 'coinbase') {
      return {
        id,
        name: 'Coinbase Wallet',
        subtitle: 'Install the extension to connect',
        ready: false,
      } satisfies WalletOption
    }

    return {
      id,
      name: 'Browser Wallet',
      subtitle: 'No injected wallet detected yet',
      ready: false,
    } satisfies WalletOption
  })

  return [
    ...baseWallets.filter((wallet) => wallet.ready),
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      subtitle: 'Mobile pairing arrives in the next UI pass',
      badge: 'Soon',
      ready: false,
    } satisfies WalletOption,
    ...baseWallets.filter((wallet) => !wallet.ready),
  ]
}

async function parseJson<T>(response: Response) {
  const json = (await response.json()) as T & { error?: string }
  if (!response.ok) {
    throw new Error(json.error || 'Request failed.')
  }
  return json
}

async function signMessage(provider: BrowserEthereumProvider, message: string, walletAddress: string) {
  try {
    return await provider.request({
      method: 'personal_sign',
      params: [message, walletAddress],
    }) as string
  } catch (error) {
    if (error instanceof Error) {
      return await provider.request({
        method: 'personal_sign',
        params: [walletAddress, message],
      }) as string
    }
    throw error
  }
}

function shortenAddress(walletAddress: string | null | undefined) {
  if (!walletAddress) return ''
  return `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
}

export function useWalletAuth() {
  const [wallets, setWallets] = useState<WalletOption[]>([])
  const [state, setState] = useState<WalletState>({
    loadingSession: true,
    connectingWalletId: null,
    redeeming: false,
    authenticated: false,
    walletAddress: null,
    access: EMPTY_ACCESS,
    error: null,
  })

  const refreshWallets = useCallback(() => {
    setWallets(listWallets())
  }, [])

  const loadSession = useCallback(async () => {
    setState((current) => ({ ...current, loadingSession: true }))

    try {
      const session = await parseJson<SessionResponse>(
        await fetch('/api/auth/session', {
          method: 'GET',
          cache: 'no-store',
          credentials: 'same-origin',
        }),
      )

      setState((current) => ({
        ...current,
        loadingSession: false,
        authenticated: session.authenticated,
        walletAddress: session.walletAddress,
        access: session.access,
        error: null,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        loadingSession: false,
        error: error instanceof Error ? error.message : 'Failed to load wallet session.',
      }))
    }
  }, [])

  useEffect(() => {
    void loadSession()
    refreshWallets()

    if (typeof window === 'undefined') return

    const handleFocus = () => refreshWallets()
    window.addEventListener('focus', handleFocus)

    return () => {
      window.removeEventListener('focus', handleFocus)
    }
  }, [loadSession, refreshWallets])

  const connectWallet = useCallback(async (walletId: WalletOption['id']) => {
    const wallet = listWallets().find((candidate) => candidate.id === walletId)
    if (!wallet?.provider) {
      throw new Error(
        walletId === 'walletconnect'
          ? 'WalletConnect mobile pairing will be added in the next pass.'
          : 'No injected wallet was detected for this option.',
      )
    }

    setState((current) => ({
      ...current,
      connectingWalletId: walletId,
      error: null,
    }))

    try {
      const accounts = await wallet.provider.request({
        method: 'eth_requestAccounts',
      }) as string[]

      const walletAddress = accounts?.[0]
      if (!walletAddress) {
        throw new Error('Wallet did not return an address.')
      }

      const chainHex = await wallet.provider.request({
        method: 'eth_chainId',
      }) as string | undefined
      const chainId = chainHex ? Number.parseInt(chainHex, 16) : 1

      const challenge = await parseJson<{ message: string }>(
        await fetch('/api/auth/wallet/nonce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            walletAddress,
            chainId: Number.isFinite(chainId) ? chainId : 1,
          }),
        }),
      )

      const signature = await signMessage(wallet.provider, challenge.message, walletAddress)

      await parseJson(
        await fetch('/api/auth/wallet/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({
            walletAddress,
            signature,
            message: challenge.message,
          }),
        }),
      )

      await loadSession()
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Wallet connection failed.',
      }))
    } finally {
      setState((current) => ({
        ...current,
        connectingWalletId: null,
      }))
      refreshWallets()
    }
  }, [loadSession, refreshWallets])

  const redeemInvite = useCallback(async (inviteCode: string) => {
    setState((current) => ({
      ...current,
      redeeming: true,
      error: null,
    }))

    try {
      await parseJson(
        await fetch('/api/access/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'same-origin',
          body: JSON.stringify({ inviteCode }),
        }),
      )

      await loadSession()
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Invite redemption failed.',
      }))
      throw error
    } finally {
      setState((current) => ({
        ...current,
        redeeming: false,
      }))
    }
  }, [loadSession])

  const disconnectWallet = useCallback(async () => {
    setState((current) => ({
      ...current,
      error: null,
    }))

    try {
      await parseJson(
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'same-origin',
        }),
      )

      setState((current) => ({
        ...current,
        authenticated: false,
        walletAddress: null,
        access: EMPTY_ACCESS,
      }))
    } catch (error) {
      setState((current) => ({
        ...current,
        error: error instanceof Error ? error.message : 'Failed to disconnect wallet.',
      }))
    }
  }, [])

  const displayWalletAddress = useMemo(() => shortenAddress(state.walletAddress), [state.walletAddress])
  const loadingSession = state.loadingSession
  const connecting = Boolean(state.connectingWalletId)
  const redeeming = state.redeeming
  const error = state.error

  const setError = useCallback((value: string | null) => {
    setState((current) => ({
      ...current,
      error: value,
    }))
  }, [])

  const connectInjectedWallet = useCallback(async () => {
    const detectedWallet = wallets.find((wallet) => wallet.ready && wallet.id !== 'walletconnect')
    const walletId = detectedWallet?.id ?? 'browser'
    await connectWallet(walletId)
  }, [connectWallet, wallets])

  return {
    wallets,
    session: state,
    loadingSession,
    connecting,
    redeeming,
    error,
    setError,
    displayWalletAddress,
    refreshWallets,
    loadSession,
    connectWallet,
    connectInjectedWallet,
    redeemInvite,
    disconnectWallet,
    logout: disconnectWallet,
  }
}
