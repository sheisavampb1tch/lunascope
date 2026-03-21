export function getPolymarketMarketUrl(slug: string | null | undefined) {
  if (!slug) {
    return "https://polymarket.com"
  }

  return `https://polymarket.com/event/${slug}`
}
