export async function GET() {
  const ids = [
    // Meme coins
    'pepe','dogecoin','shiba-inu','floki','dogwifcoin','bonk','brett',
    'mog-coin','popcat','gigachad-memecoin','cat-in-a-dogs-world',
    'book-of-meme','baby-doge-coin','coq-inu','turbo','pnut',
    'act-i-the-ai-prophecy','fwog','goat','mew',
    // Major
    'bitcoin','ethereum','solana','binancecoin','ripple',
    'cardano','avalanche-2','chainlink','uniswap','sui',
  ].join(',')

  const res = await fetch(
    `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`,
    { next: { revalidate: 60 } }
  )

  const data = await res.json()
  return Response.json(data)
}