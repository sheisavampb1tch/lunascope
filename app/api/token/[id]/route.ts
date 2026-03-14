export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  const [infoRes, chartRes] = await Promise.all([
    fetch(
      `https://api.coingecko.com/api/v3/coins/${id}?localization=false&tickers=false&community_data=false&developer_data=false`,
      { next: { revalidate: 60 } }
    ),
    fetch(
      `https://api.coingecko.com/api/v3/coins/${id}/market_chart?vs_currency=usd&days=7`,
      { next: { revalidate: 60 } }
    )
  ])

  const info = await infoRes.json()
  const chart = await chartRes.json()

  return Response.json({ info, chart })
}