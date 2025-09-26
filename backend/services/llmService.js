const DataModel = require("../dbSchema/dbSchema.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

// Generate crypto-specific title for a chat
exports.generateChatTitle = async (userQuery) => {
  try {
    const prompt = `You are a cryptocurrency expert. Generate a concise, crypto-focused chat title (3-6 words max) for this user message. 

Guidelines:
- If specific coins are mentioned, include them (e.g., "Bitcoin Price Analysis", "ETH vs SOL Comparison")
- For general crypto topics, use relevant terms (e.g., "Market Trends", "DeFi Strategy", "Portfolio Review")
- For price queries, use "Analysis" or "Outlook"
- For trading topics, use "Trading" or "Strategy"
- Keep it professional and specific
- Return ONLY the title, no quotes or extra text

User message: ${userQuery}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Extract and clean the title
    let title = response.text()?.trim();
    title = title.replace(/^["']|["']$/g, "");

    // Ensure it's not too long and has fallback
    if (title.split(" ").length > 6) {
      title = title.split(" ").slice(0, 6).join(" ");
    }

    return title.length > 0 ? title : "Crypto Analysis";
  } catch (e) {
    console.error("Error generating chat title:", e);
    return "Crypto Chat";
  }
};

// Utility to split an array into fixed-size chunks
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Generate intelligent crypto market summary using Gemini
const summarizeMarketDataChunk = async (chunk) => {
  const summaryPrompt = `Analyze this cryptocurrency market data and provide a concise, insightful summary focusing on:
- Key price movements and trends
- Notable market cap changes
- Trading volume patterns
- Any significant performance outliers

Respond in 1-2 sentences with actionable insights:

${JSON.stringify(chunk, null, 2)}`;

  try {
    const result = await model.generateContent(summaryPrompt);
    const response = await result.response;
    const text = response.text();

    if (text && typeof text === "string") {
      return text;
    }
  } catch (error) {
    console.error("Error summarizing chunk:", error);
  }
  // Fallback with basic metrics
  if (Array.isArray(chunk) && chunk.length > 0) {
    const avgChange =
      chunk.reduce(
        (sum, coin) => sum + (coin.price_change_percentage_24h || 0),
        0
      ) / chunk.length;
    return `Market data for ${chunk.length} cryptocurrencies showing ${
      avgChange > 0 ? "positive" : "negative"
    } average trend of ${avgChange.toFixed(1)}%.`;
  }
  return `Market data available for ${
    Array.isArray(chunk) ? chunk.length : 0
  } cryptocurrencies.`;
};

// Normalize strings by lowercasing, stripping non-alphanumerics, and trimming
const sanitize = (s) =>
  s
    ?.toString()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();

const SYSTEM_PROMPT =
  "You are CryptoGPT, an expert cryptocurrency analyst and portfolio advisor with deep knowledge of blockchain technology, DeFi protocols, market dynamics, and trading strategies. " +
  "\n\nYour expertise includes:" +
  "\n• Technical analysis of price movements, support/resistance levels, and chart patterns" +
  "\n• Fundamental analysis of tokenomics, utility, adoption, and project fundamentals" +
  "\n• Market sentiment analysis and trend identification" +
  "\n• Portfolio optimization and risk management strategies" +
  "\n• DeFi yield farming, staking, and protocol analysis" +
  "\n• Regulatory impact assessment and compliance considerations" +
  "\n\nResponse Guidelines:" +
  "\n• PRIORITIZE cryptocurrencies in the user's wallet for personalized insights" +
  "\n• Provide specific, actionable analysis using real-time market data" +
  "\n• Include relevant metrics: price changes, volume, market cap, volatility" +
  "\n• Suggest risk levels: Low, Medium, High for any recommendations" +
  "\n• When beneficial, recommend data visualizations using this format:" +
  '\n```graph-data\n{"type":"line|bar|pie|candlestick","title":"Descriptive Title","dataPoints":["cryptoId_metric_timeframe"]}\n```' +
  '\n• Available chart types: "line" (price/volume trends), "bar" (comparisons), "pie" (portfolio), "candlestick" (OHLC data)' +
  '\n• Supported timeframes: "1d", "7d", "30d", "90d", "365d" for comprehensive analysis' +
  '\n• Example dataPoints: ["bitcoin_price_7d"], ["ethereum_price_30d"], ["bitcoin_price_365d"], ["ethereum_volume_90d"]' +
  '\n• For comparisons: ["bitcoin_price_7d", "ethereum_price_7d", "cardano_price_7d"]' +
  "\n• For investment discussions, always include: 'This analysis is for informational purposes only. Cryptocurrency investments carry significant risk. Always conduct your own research and consider your risk tolerance.'" +
  "\n• If data is unavailable, explain the reason (illiquid market, delisted, new token) and provide context" +
  "\n• Use clear, professional language without excessive formatting" +
  "\n• Focus on practical insights that help users make informed decisions";

exports.processQuery = async (userQuery, userWallet, streamCallback = null) => {
  // Determine if the query is general or coin-specific and extract coin symbols via the LLM
  let intentResult = { intent: "general", coins: [] };

  try {
    // Enhanced intent detection using Gemini for better crypto understanding
    const intentPrompt = `Analyze this cryptocurrency-related query and determine:
1. Intent: "specific" (asks about particular coins) or "general" (market trends, concepts, strategies)
2. Coins: List any mentioned cryptocurrency names, symbols, or tickers

Query: "${userQuery}"

Respond in JSON format only:
{"intent": "specific|general", "coins": ["coin1", "coin2"]}`;

    try {
      const intentResponse = await model.generateContent(intentPrompt);
      const intentText = intentResponse.response.text().trim();

      // Extract JSON from response
      const jsonMatch = intentText.match(/\{[^}]+\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.intent && Array.isArray(parsed.coins)) {
          intentResult = parsed;
        }
      }
    } catch (error) {
      console.error(
        "Error with Gemini intent detection, falling back to regex:",
        error
      );

      // Fallback to enhanced regex-based detection
      const coinKeywords =
        /bitcoin|btc|ethereum|eth|crypto|coin|price|market|trading|buy|sell|defi|nft|blockchain|altcoin|portfolio|wallet/i;
      const specificCoinMentions = userQuery.match(
        /\b(bitcoin|btc|ethereum|eth|dogecoin|doge|cardano|ada|solana|sol|polkadot|dot|chainlink|link|litecoin|ltc|bnb|xrp|usdt|usdc|matic|avax|atom|luna|near|algo|icp|fil|aave|uni|comp|mkr|snx|crv|1inch|sushi)\b/gi
      );

      if (specificCoinMentions && specificCoinMentions.length > 0) {
        intentResult = {
          intent: "specific",
          coins: specificCoinMentions,
        };
      } else if (coinKeywords.test(userQuery)) {
        intentResult = { intent: "general", coins: [] };
      } else {
        intentResult = { intent: "general", coins: [] };
      }
    }
  } catch (e) {
    console.error("Error extracting intent and coins:", e);
    // default to general
  }

  let apiDataContext = {};
  try {
    // Get comprehensive crypto data from the main crypto database (same as frontend)
    const Crypto = require("../dbSchema/cryptoSchema");
    const allCryptos = await Crypto.find({})
      .sort({ market_cap_rank: 1 })
      .limit(500);

    console.log(
      `[LLM] Loaded ${allCryptos.length} cryptocurrencies from main database`
    );

    if (allCryptos && allCryptos.length > 0) {
      // Sanitize user-extracted coin tokens
      const extracted = intentResult.coins.map(sanitize).filter(Boolean);
      console.log("Tokens after sanitization:", extracted);

      const walletCoinNames = Array.isArray(userWallet)
        ? userWallet
            .map((coin) => coin?.name?.toLowerCase())
            .filter((name) => typeof name === "string")
        : [];

      if (intentResult.intent === "specific") {
        // Filter for specific cryptocurrency matches
        apiDataContext.crypto = allCryptos.filter((crypto) => {
          const nameLower = sanitize(crypto.name);
          const symbolLower = sanitize(crypto.symbol);
          const idLower = sanitize(crypto.id);

          // Check for specific match by substring or exact match on symbol/id
          const isSpecificMatch =
            intentResult.intent === "specific" &&
            extracted.some(
              (token) =>
                nameLower?.includes(token) ||
                symbolLower === token ||
                idLower === token
            );

          // Check for wallet match
          const isWalletMatch =
            walletCoinNames.includes(nameLower) ||
            walletCoinNames.includes(symbolLower);

          return isSpecificMatch || isWalletMatch;
        });

        console.log(
          `[LLM] Filtered to ${apiDataContext.crypto.length} specific cryptocurrencies`
        );
      } else {
        // For general queries, include comprehensive crypto data (top 100 for context efficiency)
        apiDataContext.crypto = allCryptos.slice(0, 100);
        console.log(
          `[LLM] Using top ${apiDataContext.crypto.length} cryptocurrencies for general analysis`
        );
      }
    } else {
      console.error(
        "No crypto data found in main database – falling back to general response."
      );
      console.log(
        "[LLM] Falling back to general response for query:",
        userQuery
      );
      // Simple fallback response without web search
      const fallbackPrompt = `${SYSTEM_PROMPT}\n\nUser query: ${userQuery}\n\nNo current market data available. Provide expert cryptocurrency analysis based on your knowledge of:\n• Market fundamentals and historical trends\n• Technical analysis principles\n• Risk management strategies\n• Current industry developments\n\nFocus on educational content and general best practices for crypto investing and trading.`;

      const result = await model.generateContentStream(fallbackPrompt);
      let searchText = "";

      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) {
          process.stdout.write(chunkText);
          searchText += chunkText;
          if (streamCallback) {
            streamCallback({ type: "content", content: chunkText });
          }
        }
      }
      console.log();
      return { text: searchText.trim(), visualizations: [] };
    }
  } catch (e) {
    console.error("Error fetching crypto data from main database:", e);
    throw e;
  }

  // Add check for specific coin queries with no results
  if (
    intentResult.intent === "specific" &&
    (!apiDataContext.crypto || apiDataContext.crypto.length === 0)
  ) {
    console.log(
      "[LLM] No specific coin data found – providing general response for:",
      userQuery
    );
    const fallbackPrompt = `${SYSTEM_PROMPT}\n\nUser query: ${userQuery}\n\nThe requested cryptocurrency data is not currently available in our database. This could be due to:\n• The token being newly launched or delisted\n• Low trading volume or illiquid markets\n• API limitations or data sourcing issues\n\nProvide general information about the cryptocurrency if you know it, including:\n• Project overview and use case\n• Key features and technology\n• Market positioning and competitors\n• Potential risks and considerations\n\nIf it's an unknown token, explain how to research new cryptocurrencies safely.`;

    const result = await model.generateContentStream(fallbackPrompt);
    let searchText = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        process.stdout.write(chunkText);
        searchText += chunkText;
        if (streamCallback) {
          streamCallback({ type: "content", content: chunkText });
        }
      }
    }
    console.log();
    return { text: searchText.trim(), visualizations: [] };
  }

  // Fallback 3: user asked a *general* question that is not crypto‑related
  const cryptoKeywords =
    /bitcoin|crypto|cryptocurrency|coin|blockchain|market|price/i;
  if (intentResult.intent === "general" && !cryptoKeywords.test(userQuery)) {
    console.log(
      "[LLM] General query without crypto keywords – providing general response for:",
      userQuery
    );
    const generalPrompt = `You are CryptoGPT, but the user's query "${userQuery}" appears to be non-crypto related. Provide a helpful response while maintaining your cryptocurrency expertise identity. If appropriate, you may briefly relate the topic to crypto/blockchain applications, but focus on directly answering their question first.`;

    const result = await model.generateContentStream(generalPrompt);
    let searchText = "";

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      if (chunkText) {
        process.stdout.write(chunkText);
        searchText += chunkText;
        if (streamCallback) {
          streamCallback({ type: "content", content: chunkText });
        }
      }
    }
    console.log();
    return { text: searchText.trim(), visualizations: [] };
  }

  const marketSummary = await generateMarketSummary(apiDataContext);

  // For general queries, summarize crypto data in manageable chunks to fit context limits
  let generalSummary = marketSummary;
  if (intentResult.intent === "general") {
    const coinData = apiDataContext.crypto || [];
    const chunks = chunkArray(coinData, 5);
    const summaryPromises = chunks.map((chunk) =>
      summarizeMarketDataChunk(chunk)
    );
    const chunkSummaries = await Promise.all(summaryPromises);
    generalSummary = chunkSummaries.join(" ");
  }

  // Prepare simplified wallet context with current price and 24h change
  const walletContext = Array.isArray(userWallet)
    ? userWallet.map((coin) => ({
        name: coin.name,
        quantity: coin.quantity,
        // Add current price and 24h change if available from API data
        current_price: apiDataContext?.crypto?.find(
          (c) => c.name?.toLowerCase() === coin.name?.toLowerCase()
        )?.current_price,
        price_change_24h: apiDataContext?.crypto?.find(
          (c) => c.name?.toLowerCase() === coin.name?.toLowerCase()
        )?.price_change_percentage_24h_in_currency,
      }))
    : [];

  // Construct the system prompt using detected intent and prepared context
  let systemContext =
    `${SYSTEM_PROMPT}\n\n` +
    `User's Wallet: ${JSON.stringify(walletContext)}\n\n`;
  if (intentResult.intent === "general") {
    systemContext += `Market Summary: ${generalSummary}`;
  } else {
    const filtered = apiDataContext.crypto || [];
    // Limit the data sent to avoid context overflow - include key metrics only
    const filteredData = filtered.map((crypto) => ({
      id: crypto.id,
      name: crypto.name,
      symbol: crypto.symbol,
      current_price: crypto.current_price,
      market_cap: crypto.market_cap,
      market_cap_rank: crypto.market_cap_rank,
      price_change_percentage_24h:
        crypto.price_change_percentage_24h_in_currency,
      price_change_percentage_7d: crypto.price_change_percentage_7d_in_currency,
      total_volume: crypto.total_volume,
    }));
    systemContext += `Filtered Crypto Data Context: ${JSON.stringify(
      filteredData
    )}`;
  }

  // Use Gemini streaming
  const prompt = `${systemContext}\n\nUser query: ${userQuery}`;
  const result = await model.generateContentStream(prompt);

  let fullText = "";
  for await (const chunk of result.stream) {
    const chunkText = chunk.text();
    if (chunkText) {
      process.stdout.write(chunkText);
      fullText += chunkText;
      // Send each chunk to the callback if provided
      if (streamCallback && typeof streamCallback === "function") {
        streamCallback({
          type: "content",
          content: chunkText,
        });
      }
    }
  }
  console.log();

  // Parse and structure the response normally
  const graphMatch = fullText.match(/```graph-data\n([\s\S]*?)\n```/);
  return {
    text: fullText.replace(/```graph-data\n[\s\S]*?\n```/, "").trim(),
    visualizations: graphMatch ? [JSON.parse(graphMatch[1])] : [],
  };
};

const generateMarketSummary = async (marketData) => {
  // Extract comprehensive market metrics
  const summary = {
    totalCoins: 0,
    topPerformers: [],
    topLosers: [],
    overallTrend: 0,
    totalMarketCap: 0,
    totalVolume: 0,
    volatilityIndex: 0,
  };

  // Process crypto data (now using direct crypto database instead of multiple sources)
  if (Array.isArray(marketData.crypto)) {
    const coins = marketData.crypto;
    summary.totalCoins = coins.length;

    // Calculate market cap and volume totals
    summary.totalMarketCap = coins.reduce(
      (sum, coin) => sum + (coin.market_cap || 0),
      0
    );
    summary.totalVolume = coins.reduce(
      (sum, coin) => sum + (coin.total_volume || 0),
      0
    );

    // Sort by performance for top gainers and losers
    const sortedByPerformance = [...coins]
      .filter(
        (coin) =>
          typeof coin.price_change_percentage_24h_in_currency === "number"
      )
      .sort(
        (a, b) =>
          (b.price_change_percentage_24h_in_currency || 0) -
          (a.price_change_percentage_24h_in_currency || 0)
      );

    // Top 3 performers
    summary.topPerformers = sortedByPerformance.slice(0, 3).map((coin) => ({
      name: coin.name,
      symbol: coin.symbol?.toUpperCase(),
      marketCap: coin.market_cap,
      priceChange: coin.price_change_percentage_24h_in_currency,
      currentPrice: coin.current_price,
    }));

    // Top 3 losers
    summary.topLosers = sortedByPerformance
      .slice(-3)
      .reverse()
      .map((coin) => ({
        name: coin.name,
        symbol: coin.symbol?.toUpperCase(),
        marketCap: coin.market_cap,
        priceChange: coin.price_change_percentage_24h_in_currency,
        currentPrice: coin.current_price,
      }));

    // Calculate overall trend and volatility
    const changes = coins
      .map((coin) => coin.price_change_percentage_24h_in_currency)
      .filter((change) => typeof change === "number");

    if (changes.length) {
      const avgChange = changes.reduce((a, b) => a + b, 0) / changes.length;
      summary.overallTrend = avgChange;

      // Calculate volatility (standard deviation of price changes)
      const variance =
        changes.reduce(
          (sum, change) => sum + Math.pow(change - avgChange, 2),
          0
        ) / changes.length;
      summary.volatilityIndex = Math.sqrt(variance);
    }
  }

  // Limit results to top 3 (already done in processing above)

  // Generate intelligent market summary
  const marketTrend =
    summary.overallTrend > 2
      ? "strongly bullish"
      : summary.overallTrend > 0.5
      ? "bullish"
      : summary.overallTrend > -0.5
      ? "neutral"
      : summary.overallTrend > -2
      ? "bearish"
      : "strongly bearish";

  const volatilityLevel =
    summary.volatilityIndex > 8
      ? "extremely high"
      : summary.volatilityIndex > 5
      ? "high"
      : summary.volatilityIndex > 3
      ? "moderate"
      : "low";

  const summaryText =
    `MARKET OVERVIEW: Tracking ${summary.totalCoins} cryptocurrencies with $${(
      summary.totalMarketCap / 1e12
    ).toFixed(2)}T total market cap. ` +
    `Market sentiment is ${marketTrend} with ${volatilityLevel} volatility (${summary.volatilityIndex.toFixed(
      1
    )}%). ` +
    `24h volume: $${(summary.totalVolume / 1e9).toFixed(1)}B. ` +
    `TOP GAINERS: ${summary.topPerformers
      .map((coin) => `${coin.symbol} (+${coin.priceChange.toFixed(1)}%)`)
      .join(", ")}. ` +
    `TOP LOSERS: ${summary.topLosers
      .map((coin) => `${coin.symbol} (${coin.priceChange.toFixed(1)}%)`)
      .join(", ")}.`;

  return summaryText;
};
