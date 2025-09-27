const axios = require("axios");
require("dotenv").config({ path: "../.env" });
const NewsArticle = require("../dbSchema/newsSchema");
const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const AV_REFRESH_INTERVAL = 60; // 1 hour for Alpha Vantage to adhere to lim
const RAPIDAPI_REFRESH_INTERVAL = 180; // 3 hours for RapidAPI ^^
const RETENTION_PERIOD = 30; // News deleted if 30 days old

const Crypto = require("../dbSchema/cryptoSchema");

let allTickers = []; // Stores all crypto tickers

// Tickers from cyptolist to fetch news for
async function refreshTickers() {
  try {
    const coins = await Crypto.find({}, "symbol -_id").lean();
    allTickers = coins.map((coin) => coin.symbol.toUpperCase());
  } catch (error) {
    console.error("Failed to refresh tickers:", error);
    allTickers = []; // Fallback to empty array
  }
}

// Track last fetch times
let lastFetch = {
  alphaVantage: 0,
  rapidAPI: 0,
};

// Helper function to parse Alpha Vantage date, Alpha Vantage date format: "YYYYMMDDTHHMMSS"
function parseAlphaVantageDate(timePublished) {
  const dateStr = timePublished.toString();
  if (dateStr.length !== 15 || !dateStr.includes("T")) {
    return new Date(); // Fallback to current date if format is invalid
  }

  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  const hours = dateStr.substring(9, 11);
  const minutes = dateStr.substring(11, 13);
  const seconds = dateStr.substring(13, 15);

  return new Date(`${year}-${month}-${day}T${hours}:${minutes}:${seconds}Z`);
}

// Helper function to parse AV ticker symbol
function parseTicker(ticker) {
  return ticker.startsWith("CRYPTO:") ? ticker.slice(7) : ticker;
}

// Filter Alpha Vantage articles for crypto-only
function filterCryptoArticles(articles) {
  return articles
    .filter((article) =>
      article.tickers.some((ticker) => ticker.startsWith("CRYPTO:"))
    )
    .map((article) => ({
      ...article,
      tickers: article.tickers.map((ticker) => parseTicker(ticker)),
    }));
}

// Helper function to extract ticker from Rapid Crypto News
function extractTickers(text = "") {
  if (!allTickers?.length || typeof text !== "string") return [];

  const foundTickers = new Set();
  const normalizedText = text.toLowerCase();

  allTickers.forEach(({ symbol, name }) => {
    if (!symbol) return;

    // Normalize symbol and name
    const lowerSymbol = symbol.toLowerCase();
    const lowerName = name?.toLowerCase();

    // Match symbol (whole word)
    const symbolPattern = `(^|\\W)${escapeRegex(lowerSymbol)}(\\W|$)`;
    if (new RegExp(symbolPattern, "i").test(normalizedText)) {
      foundTickers.add(symbol.toUpperCase());
    }

    // Match name if exists and different from symbol
    if (lowerName && lowerName !== lowerSymbol) {
      const namePattern = `(^|\\W)${escapeRegex(lowerName)}(\\W|$)`;
      if (new RegExp(namePattern, "i").test(normalizedText)) {
        foundTickers.add(symbol.toUpperCase());
      }
    }
  });

  return Array.from(foundTickers);
}

// Helper to properly escape regex strings
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Fetch Alpha Vantage news
async function fetchFinancialNews() {
  try {
    const now = Date.now();
    if (now - lastFetch.alphaVantage < AV_REFRESH_INTERVAL * 60 * 1000) {
      return [];
    }
    const response = await axios.get("https://www.alphavantage.co/query", {
      params: {
        function: "NEWS_SENTIMENT",
        apikey: ALPHA_VANTAGE_API_KEY,
        limit: 1000,
      },
    });

    lastFetch.alphaVantage = now;

    if (!response.data.feed) {
      throw new Error("No news data returned from Alpha Vantage");
    }

    return filterCryptoArticles(
      response.data.feed.map((article) => ({
        title: article.title,
        summary: article.summary,
        source: article.source,
        url: article.url,
        published_at: parseAlphaVantageDate(article.time_published),
        topics: article.topics?.map((topic) => topic.topic) || [],
        tickers: article.ticker_sentiment?.map((item) => item.ticker) || [],
        sentiment_score: article.overall_sentiment_score || 0,
        provider: "alpha_vantage",
      }))
    );
  } catch (error) {
    console.error("Error fetching news from Alpha Vantage:", error);
    throw error;
  }
}

// Fetch Rapid:Crypto News
const fetchRapidAPICryptoNews = async () => {
  const now = Date.now();
  if (now - lastFetch.rapidAPI < RAPIDAPI_REFRESH_INTERVAL * 60 * 1000) {
    return [];
  }
  refreshTickers();
  try {
    const response = await axios.get(
      "https://news-api65.p.rapidapi.com/api/v1/crypto/articles/search",
      {
        params: {
          format: "json",
          time_frame: "24h",
          page: 1,
          limit: 50,
        },
        headers: {
          "x-rapidapi-key": RAPIDAPI_KEY,
          "x-rapidapi-host": "news-api65.p.rapidapi.com",
        },
        timeout: 10000,
      }
    );
    lastFetch.rapidAPI = now;

    return response.data.map((article) => ({
      title: article.title || "Untitled",
      summary: article.summary || "",
      source: article.authors?.[0]?.name || "Unknown",
      url: article.link || `no-url-${Date.now()}`,
      published_at: new Date(article.published || Date.now()),
      topics: [article.category, article.subCategory].filter(Boolean),
      tickers: extractTickers(`${article.title} ${article.summary}`),
      sentiment_score:
        article.sentiment?.label === "positive"
          ? parseFloat(article.sentiment.score.toFixed(2))
          : article.sentiment?.label === "negative"
          ? -parseFloat(article.sentiment.score.toFixed(2))
          : 0,
      provider: "rapidapi",
    }));
  } catch (error) {
    console.error("RapidAPI fetch error:", {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    return [];
  }
};

// Function to delete old news from DB
async function deleteOldNews() {
  try {
    const toDeletedDate = new Date();
    toDeletedDate.setDate(toDeletedDate.getDate() - RETENTION_PERIOD);

    const result = await NewsArticle.deleteMany({
      published_at: { $lt: toDeletedDate },
    });

    if (result.deletedCount > 0) {
      console.log(`Deleted ${result.deletedCount} old news articles`);
    }
  } catch (error) {
    console.error("Failed to delete old news:", error);
  }
}

async function refreshNews() {
  try {
    const [alphaVantageNews, rapidAPInews] = await Promise.all([
      fetchFinancialNews(),
      fetchRapidAPICryptoNews(),
    ]);

    const allNews = [...alphaVantageNews, ...rapidAPInews]
      .filter(
        (article, index, self) =>
          article.url && self.findIndex((a) => a.url === article.url) === index
      )
      .map((article) => ({
        ...article,
        metadata: {
          lastFetched: new Date(),
          fetchInterval:
            article.provider === "rapidapi"
              ? RAPIDAPI_REFRESH_INTERVAL
              : AV_REFRESH_INTERVAL,
        },
      }));

    if (allNews.length > 0) {
      const bulkOps = allNews.map((article) => ({
        updateOne: {
          filter: { url: article.url },
          update: { $set: article },
          upsert: true,
        },
      }));

      const result = await NewsArticle.bulkWrite(bulkOps);
      console.log(
        `Updated ${result.upsertedCount + result.modifiedCount} articles`
      );
    }

    //  Delete old news
    await deleteOldNews();
  } catch (error) {
    console.error("Refresh failed:", error);
  }
}

module.exports = { fetchRapidAPICryptoNews, fetchFinancialNews, refreshNews };
