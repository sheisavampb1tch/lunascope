export async function GET() {
  const ids = 'pepe,dogecoin,shiba-inu,floki,dogwifcoin,bonk,brett,mog-coin,popcat,gigachad-memecoin,cat-in-a-dogs-world,book-of-meme,baby-doge-coin,coq-inu,turbo'

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
    { next: { revalidate: 60 } }
  )

  const data = await res.json()
  return Response.json(data)
}