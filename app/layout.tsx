import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'LunaScope — Meme Token Analytics',
  description: 'Real-time analytics for meme tokens and NFT projects. Track holders, volume, whale activity and on-chain signals.',
  icons: {
    icon: '/favicon.jpg',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}