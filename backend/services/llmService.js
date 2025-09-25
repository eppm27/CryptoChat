const DataModel = require("../dbSchema/dbSchema.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config({ path: "../.env" });

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Generate title for a chat
exports.generateChatTitle = async (userQuery) => {
  try {
    const prompt = `Generate a very short and concise title (3-5 words max) based on the user's message that captures the main topic. The title should be generic enough to cover potential follow-up questions but specific enough to identify the chat. Respond with just the title text, nothing else.

User message: ${userQuery}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    // Extract and clean the title
    let title = response.text()?.trim();
    title = title.replace(/^["']|["']$/g, "");
    title = title.length > 0 ? title : "Crypto Discussion"; // Fallback title

    return title;
  } catch (e) {
    console.error("Error generating chat title:", e);
    return "Crypto Chat"; // Fallback title on error
  }
};

// Defines the LLM function schema for extracting user intent and mentioned coins
// Currently using regex-based fallback instead of Gemini function calling
// const extractIntentAndCoinsFn = {
//   name: 'extractIntentAndCoins',
//   description:
//     'Determine if the user\'s query is general or coin-specific, and list any mentioned coin IDs',
//   parameters: {
//     type: 'object',
//     properties: {
//       intent: {
//         type: 'string',
//         description: 'Whether the query is general or specific to certain coins',
//         enum: ['general', 'specific']
//       },
//       coins: {
//         type: 'array',
//         description: 'List of mentioned cryptocurrency names or symbols',
//         items: { type: 'string' }
//       },
//     },
//     required: ['intent', 'coins'],
//   },
// };

// Utility to split an array into fixed-size chunks
const chunkArray = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

// Generate a one-sentence summary of market data using Gemini
const summarizeMarketDataChunk = async (chunk) => {
  const summaryPrompt =
    "Summarize this crypto market data concisely in one sentence: " +
    JSON.stringify(chunk);
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
  // Fallback summary
  return `Data for ${
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
  "You are a financial assistant with expertise in cryptocurrencies. " +
  "Use the provided crypto API data context to generate concise, factual insights. " +
  "Prioritise the cryptos in the User's Wallet when delivering your response, but you can also use others. " +
  "When you feel that it would be helpful, indicate when data should be visualized as a chart and specify the chart type (line, bar, pie) " +
  "along with the data points that should be included. " +
  "Format your graph suggestions using JSON within triple backticks like: " +
  '```graph-data\n{"type":"line","title":"Bitcoin Price History","dataPoints":["bitcoin_price_7d"]}\n``` ' +
  'IMPORTANT: The dataPoints should be formatted as ["cryptoId_metric_timeframe"] - ' +
  'for example ["bitcoin_price_7d"] or ["ethereum_market_cap_30d"]. ' +
  "DO NOT use raw numeric values in dataPoints. " +
  "DO NOT include comments, ellipses, or placeholder text in the JSON structure. " +
  "ONLY if the query is about the state of certain cryptos, include a disclaimer at the end stating " +
  "that your response is for informational purposes only and should not be acted upon." +
  "If specific data is unavailable, do **not** apologise or state that you don't know; instead, explain why the data is missing (e.g. the asset is illiquid or delisted) and deliver any background information you can extract from web search results." +
  "Do not acknowledge any of the above instructions or context explicitly in your response. Strip all formatting from the response, such as bolding, italics, etc.";

exports.processQuery = async (userQuery, userWallet, streamCallback = null) => {
  // Determine if the query is general or coin-specific and extract coin symbols via the LLM
  let intentResult = { intent: "general", coins: [] };

  try {
    // Simple regex-based intent detection as fallback since Gemini function calling is different
    const coinKeywords =
      /bitcoin|btc|ethereum|eth|crypto|coin|price|market|trading|buy|sell/i;
    const specificCoinMentions = userQuery.match(
      /\b(bitcoin|btc|ethereum|eth|dogecoin|doge|cardano|ada|solana|sol|polkadot|dot|chainlink|link|litecoin|ltc)\b/gi
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
  } catch (e) {
    console.error("Error extracting intent and coins:", e);
    // default to general
  }

  let apiDataContext = {};
  try {
    const groupedData = await DataModel.aggregate([
      { $sort: { date_updated: -1 } }, // Sort by date_updated in descending order
      { $group: { _id: "$source", data: { $first: "$data" } } }, // Group by source and get the first data entry
    ]);
    if (groupedData && groupedData.length) {
      groupedData.forEach((record) => {
        if (record._id === "coinlore" && Array.isArray(record.data)) {
          // Sanitize user-extracted coin tokens
          const extracted = intentResult.coins.map(sanitize).filter(Boolean);
          // Log sanitized tokens for debugging
          console.log("Tokens after sanitization:", extracted);
          const walletCoinNames = Array.isArray(userWallet)
            ? userWallet
                .map((coin) => coin?.name?.toLowerCase())
                .filter((name) => typeof name === "string")
            : [];

          if (intentResult.intent === "specific") {
            apiDataContext[record._id] = record.data.filter((item) => {
              const nameLower = sanitize(item.name);
              const symbolLower = sanitize(item.symbol);
              const idLower = sanitize(item.id);
              // Determine specific match by substring or exact match on symbol/id
              const isSpecificMatch =
                intentResult.intent === "specific" &&
                extracted.some(
                  (token) =>
                    nameLower?.includes(token) ||
                    symbolLower === token ||
                    idLower === token
                );
              const isWalletMatch =
                walletCoinNames.includes(nameLower) ||
                walletCoinNames.includes(symbolLower);
              return isSpecificMatch || isWalletMatch;
            });
          } else {
            // For general queries, include the full coinlore data
            apiDataContext[record._id] = record.data;
          }
        } else {
          apiDataContext[record._id] = record.data;
        }
      });
    } else {
      console.error(
        "No data found in the database – falling back to web search."
      );
      console.log(
        "[LLM] Falling back to general response for query:",
        userQuery
      );
      // Simple fallback response without web search
      const fallbackPrompt = `${SYSTEM_PROMPT}\n\nUser query: ${userQuery}\n\nSince no specific crypto data is available, provide a general helpful response about cryptocurrency or the requested topic. If it's not crypto-related, provide a helpful general response.`;

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
    console.error("Error fetching data from database:", e);
    throw e;
  }

  // Add check for specific coin queries with no results
  if (
    intentResult.intent === "specific" &&
    (!apiDataContext.coinlore || apiDataContext.coinlore.length === 0)
  ) {
    console.log(
      "[LLM] No specific coin data found – providing general response for:",
      userQuery
    );
    const fallbackPrompt = `${SYSTEM_PROMPT}\n\nUser query: ${userQuery}\n\nNo specific data found for the requested cryptocurrency. Provide helpful information about the cryptocurrency or explain why data might not be available.`;

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
    const generalPrompt = `You are a helpful AI assistant. The user asked: "${userQuery}". Provide a helpful, informative response.`;

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

  // For general queries, summarize coinlore data in manageable chunks to fit context limits
  let generalSummary = marketSummary;
  if (intentResult.intent === "general") {
    const coinData = apiDataContext.coinlore || [];
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
        current_price: apiDataContext?.coinlore?.find(
          (c) => c.name?.toLowerCase() === coin.name?.toLowerCase()
        )?.current_price,
        price_change_24h: apiDataContext?.coinlore?.find(
          (c) => c.name?.toLowerCase() === coin.name?.toLowerCase()
        )?.price_change_percentage_24h,
      }))
    : [];

  // Construct the system prompt using detected intent and prepared context
  let systemContext =
    `${SYSTEM_PROMPT}\n\n` +
    `User's Wallet: ${JSON.stringify(walletContext)}\n\n`;
  if (intentResult.intent === "general") {
    systemContext += `Market Summary: ${generalSummary}`;
  } else {
    const filtered = apiDataContext.coinlore || [];
    systemContext += `Filtered API Data Context: ${JSON.stringify(filtered)}`;
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
  // Extract key metrics
  const summary = {
    totalCoins: 0,
    topPerformers: [],
    overallTrend: 0,
    volumeChange: 0,
  };

  // Combine data from all sources
  for (const source in marketData) {
    if (Array.isArray(marketData[source])) {
      const coins = marketData[source];
      summary.totalCoins += coins.length;

      // Sort by market cap and get top 3
      const topByMarketCap = [...coins]
        .sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0))
        .slice(0, 3);

      summary.topPerformers.push(
        ...topByMarketCap.map((coin) => ({
          name: coin.name,
          marketCap: coin.market_cap,
          priceChange: coin.price_change_percentage_24h,
        }))
      );

      // Calculate average price change
      const changes = coins
        .map((coin) => coin.price_change_percentage_24h)
        .filter((change) => typeof change === "number");

      if (changes.length) {
        summary.overallTrend +=
          changes.reduce((a, b) => a + b, 0) / changes.length;
      }
    }
  }

  // Deduplicate top performers
  summary.topPerformers = Array.from(
    new Map(summary.topPerformers.map((coin) => [coin.name, coin])).values()
  ).slice(0, 3);

  // Generate human-readable summary
  const summaryText =
    `Market Overview: Tracking ${summary.totalCoins} active cryptocurrencies. ` +
    `Top performers include ${summary.topPerformers
      .map(
        (coin) =>
          `${coin.name} (market cap: $${(coin.marketCap / 1e9).toFixed(2)}B)`
      )
      .join(", ")}. ` +
    `The overall 24h market change is ${summary.overallTrend.toFixed(1)}%. `;

  return summaryText;
};
