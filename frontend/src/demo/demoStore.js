const DEMO_KEY = "cryptochat-demo";

export const isDemoMode = () =>
  typeof window !== "undefined" && sessionStorage.getItem(DEMO_KEY) === "true";

export const enableDemoMode = () => sessionStorage.setItem(DEMO_KEY, "true");
export const disableDemoMode = () => sessionStorage.removeItem(DEMO_KEY);

export const demoUser = {
  _id: "demo-user",
  firstName: "Demo",
  lastName: "Investor",
  email: "demo@cryptochat.app",
  wallet: [
    { _id: "demo-btc", cryptoId: "bitcoin", cryptoName: "Bitcoin", cryptoSymbol: "BTC", amount: 0.18, purchasePrice: 58000 },
    { _id: "demo-eth", cryptoId: "ethereum", cryptoName: "Ethereum", cryptoSymbol: "ETH", amount: 2.4, purchasePrice: 2800 },
    { _id: "demo-sol", cryptoId: "solana", cryptoName: "Solana", cryptoSymbol: "SOL", amount: 18, purchasePrice: 115 },
  ],
  watchlist: [
    { _id: "watch-btc", cryptoId: "bitcoin", cryptoName: "Bitcoin", cryptoSymbol: "BTC" },
    { _id: "watch-eth", cryptoId: "ethereum", cryptoName: "Ethereum", cryptoSymbol: "ETH" },
    { _id: "watch-sol", cryptoId: "solana", cryptoName: "Solana", cryptoSymbol: "SOL" },
    { _id: "watch-link", cryptoId: "chainlink", cryptoName: "Chainlink", cryptoSymbol: "LINK" },
  ],
  savedPrompts: [
    { _id: "prompt-1", prompt: "Compare Bitcoin and Ethereum risk factors." },
    { _id: "prompt-2", prompt: "Summarise my portfolio allocation." },
  ],
};

export const demoCryptos = [
  { id: "bitcoin", name: "Bitcoin", symbol: "btc", current_price: 67240, price_change_percentage_24h: 2.8, market_cap: 1320000000000, total_volume: 36500000000, high_24h: 68110, low_24h: 64920, circulating_supply: 19700000, total_supply: 19700000, max_supply: 21000000, image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png" },
  { id: "ethereum", name: "Ethereum", symbol: "eth", current_price: 3540, price_change_percentage_24h: 1.4, market_cap: 425000000000, total_volume: 18200000000, high_24h: 3615, low_24h: 3450, circulating_supply: 120200000, total_supply: 120200000, image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png" },
  { id: "solana", name: "Solana", symbol: "sol", current_price: 148.2, price_change_percentage_24h: -0.7, market_cap: 69000000000, total_volume: 2900000000, high_24h: 152.6, low_24h: 145.1, circulating_supply: 466000000, total_supply: 582000000, image: "https://assets.coingecko.com/coins/images/4128/large/solana.png" },
  { id: "chainlink", name: "Chainlink", symbol: "link", current_price: 14.85, price_change_percentage_24h: 3.1, market_cap: 9000000000, total_volume: 510000000, high_24h: 15.1, low_24h: 14.2, circulating_supply: 608000000, total_supply: 1000000000, max_supply: 1000000000, image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png" },
];

export const demoChats = [
  { _id: "demo-market", title: "Weekly market outlook", lastMessage: "Bitcoin momentum remains positive, with volatility risk elevated.", updatedAt: new Date().toISOString() },
];

export const demoMessages = [
  { _id: "demo-message-1", role: "user", content: "Summarise my portfolio risk.", createdAt: new Date(Date.now() - 60000).toISOString() },
  { _id: "demo-message-2", role: "chatBot", content: "Your sample portfolio is concentrated in large-cap crypto assets, with **Bitcoin** as the largest position. Ethereum adds smart-contract exposure, while Solana contributes higher volatility. Consider position limits and remember that this demo is educational—not financial advice.", createdAt: new Date().toISOString() },
];

export const demoNews = [
  { _id: "news-1", title: "Bitcoin holds above a key market level", summary: "Digital-asset markets remained active as traders assessed liquidity, risk appetite and upcoming macroeconomic data.", source: "CryptoChat Demo", tickers: ["BTC"], url: "https://www.coindesk.com/", published_at: new Date(Date.now() - 3600000).toISOString() },
  { _id: "news-2", title: "Ethereum ecosystem activity continues to grow", summary: "Developers and market participants are watching scaling adoption and network usage across the Ethereum ecosystem.", source: "CryptoChat Demo", tickers: ["ETH"], url: "https://ethereum.org/", published_at: new Date(Date.now() - 7200000).toISOString() },
  { _id: "news-3", title: "Risk management remains central for crypto portfolios", summary: "Diversification, position sizing and volatility awareness remain important considerations for digital-asset investors.", source: "CryptoChat Demo", tickers: ["BTC", "ETH", "SOL"], url: "https://www.investor.gov/", published_at: new Date(Date.now() - 10800000).toISOString() },
];
