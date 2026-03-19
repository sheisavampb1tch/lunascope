import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-data",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://lunascope.ai"),
  title: "Lunascope | AI Edge for Polymarket",
  description:
    "Premium non-custodial trading intelligence for Polymarket with mispricing detection, copy-trading signals, and real-time edge monitoring.",
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: ["/icon.png"],
    apple: [
      { url: "/icon.png", type: "image/png" },
    ],
  },
  openGraph: {
    title: "Lunascope | AI Edge for Polymarket",
    description:
      "Mispricing detection, copy-trading signals, and premium non-custodial intelligence for Polymarket.",
    url: "https://lunascope.ai",
    siteName: "Lunascope",
    images: [
      {
        url: "/og-lunascope.svg",
        width: 1200,
        height: 630,
        alt: "Lunascope AI Edge for Polymarket",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lunascope | AI Edge for Polymarket",
    description:
      "Unlock AI-powered mispricing detection and copy-trading intelligence for Polymarket.",
    images: ["/og-lunascope.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-[family-name:var(--font-inter)] antialiased`}>
        {children}
      </body>
    </html>
  );
}
