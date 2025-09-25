// A place to store the relevant crypto APIs used

// Just free non subscription ones for now
const cryptoAPIs = {
  // Using USD for consistency across sources, updated to include more popular cryptocurrencies
  coingecko:
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,dogecoin,cardano,solana,polkadot,binancecoin,chainlink,litecoin,polygon&sparkline=true&price_change_percentage=1h,24h,7d",
  // Individual crypto market data endpoint (more flexible)
  coingeckoMarkets: "https://api.coingecko.com/api/v3/coins/markets",
  // Individual crypto data endpoint for detailed info
  coingeckoSingle: "https://api.coingecko.com/api/v3/coins",
  // Market chart data for graphs
  coingeckoChart: "https://api.coingecko.com/api/v3/coins/{id}/market_chart",
  // OHLC candlestick data
  coingeckoOHLC: "https://api.coingecko.com/api/v3/coins/{id}/ohlc",
  cryptocompare:
    "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH,DOGE,ADA,SOL&tsyms=USD",
  messari: "https://data.messari.io/api/v1/assets/{slug}/metrics?currency=USD",
  coinlore: "https://api.coinlore.net/api/tickers/",
  technicalIndicators: {
    base: "https://api.twelvedata.com",
    rsi: "/rsi",
    sma: "/sma",
  },
  // Popular cryptocurrency IDs for easy reference
  popularCryptos: [
    "bitcoin",
    "ethereum",
    "dogecoin",
    "cardano",
    "solana",
    "polkadot",
    "binancecoin",
    "chainlink",
    "litecoin",
    "polygon",
    "avalanche-2",
    "cosmos",
    "algorand",
    "stellar",
    "tron",
    "monero",
    "ethereum-classic",
    "filecoin",
    "hedera-hashgraph",
    "internet-computer",
  ],
};

module.exports = cryptoAPIs;
