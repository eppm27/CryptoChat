const axios = require("axios");
require("dotenv").config({ path: "../.env" });
const Crypto = require("../dbSchema/cryptoSchema");
const CryptoIndicator = require("../dbSchema/cryptoIndicatorSchema");
const cron = require("node-cron");
// Alpha Vantage API configuration
const ALPHA_VANTAGE_IND_KEY = process.env.ALPHA_VANTAGE_IND_KEY;
const AV_BASE_URL = "https://www.alphavantage.co/query";

// Fetch top 100 cryptos from database
async function getTopCryptos() {
  try {
    const cryptos = await Crypto.find()
      .sort({ market_cap_rank: 1 })
      .limit(10)
      .select("_id symbol name");
    // Ensure symbols are uppercase
    return cryptos.map((crypto) => ({
      ...crypto.toObject(),
      symbol: crypto.symbol.toUpperCase(),
    }));
  } catch (error) {
    console.error("Error fetching cryptos:", error);
    return [];
  }
}

// Fetch RSI data from Alpha Vantage
async function fetchRSI(symbol) {
  try {
    const response = await axios.get(AV_BASE_URL, {
      params: {
        function: "RSI",
        symbol: symbol,
        interval: "daily",
        time_period: 14,
        series_type: "close",
        apikey: ALPHA_VANTAGE_IND_KEY,
      },
      timeout: 10000,
    });

    if (!response.data || !response.data["Technical Analysis: RSI"]) {
      console.warn(`No RSI data for ${symbol}`);
      return null;
    }

    const technicalData = response.data["Technical Analysis: RSI"];
    const dataPoints = Object.entries(technicalData).map(([date, values]) => ({
      date: new Date(date),
      value: parseFloat(values.RSI),
    }));

    return {
      data: dataPoints,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error(`Error fetching RSI for ${symbol}:`, error.message);
    return null;
  }
}

// Store RSI data in MongoDB
async function storeRSIData(crypto, rsiData) {
  console.log("rsi data for:", crypto._id);
  console.log("rsi data for:", rsiData);

  // hardcorded values to fetch data since limited api calls
  try {
    const updateDoc = {
      cryptoId: crypto._id,
      symbol: crypto.symbol.toUpperCase(),
      interval: "daily",
      time_period: 14,
      series_type: "close",
      indicator: "RSI",
      data: rsiData.data,
      lastUpdated: rsiData.lastUpdated,
    };
    await CryptoIndicator.findOneAndUpdate(
      { cryptoId: crypto._id, indicator: "RSI" },
      updateDoc,
      { upsert: true, new: true }
    );
    console.log(`Stored RSI data for ${crypto.symbol}`);
  } catch (error) {
    console.error(`Error storing RSI for ${rsiData.symbol}:`, error);
  }
}

// Rate limiting helper (Alpha Vantage has 5 requests/minute limit)
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function needsUpdate(cryptoId) {
  try {
    const indicator = await CryptoIndicator.findOne({
      cryptoId: cryptoId,
      indicator: "RSI",
    });

    if (!indicator) {
      return true; // Doesn't exist yet, needs update
    }

    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;

    return now - indicator.updatedAt > oneDayInMs;
  } catch (error) {
    console.error("Error checking update status:", error);
    return true; // If there's an error, proceed with update
  }
}
// Main execution function
async function fetchAndStoreRSIData() {
  const cryptos = await getTopCryptos();
  console.log(`Fetching RSI for ${cryptos.length} cryptos...`);

  for (const [index, crypto] of cryptos.entries()) {
    // Add delay to avoid rate limiting
    if (index > 0) await delay(15000);
    const shouldUpdate = await needsUpdate(crypto._id);
    if (!shouldUpdate) {
      console.log(`Skipping ${crypto.symbol} - no need to update yet`);
      continue;
    }

    console.log(`Processing ${index + 1}/${cryptos.length}: ${crypto.symbol}`);
    const rsiData = await fetchRSI(crypto.symbol);
    if (rsiData) {
      await storeRSIData(crypto, rsiData);
    }
  }

  console.log("RSI data update completed");
}

cron.schedule("0 2 * * *", () => {
  console.log("Running scheduled RSI update...");
  fetchAndStoreRSIData();
});
