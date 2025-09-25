// A place to store the relevant crypto APIs used

// Just free non subscription ones for now
const cryptoAPIs = {
  // Using USD for consistency across sources, maybe introduce a USD to AUD feature?
  coingecko:
    "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum&sparkline=true&price_change_percentage=1h,24h,7d",
  cryptocompare:
    "https://min-api.cryptocompare.com/data/pricemulti?fsyms=BTC,ETH&tsyms=USD",
  messari: "https://data.messari.io/api/v1/assets/bitcoin/metrics?currency=USD",
  coinlore: "https://api.coinlore.net/api/tickers/",
  technicalIndicators: {
    base: "https://api.twelvedata.com",
    rsi: "/rsi",
    sma: "/sma",
  },
};

module.exports = cryptoAPIs;
