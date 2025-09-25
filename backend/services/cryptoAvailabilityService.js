const axios = require("axios");
const Crypto = require("../dbSchema/cryptoSchema");
const cryptoAPIs = require("../config/cryptoAPIs");

/**
 * Ensures popular cryptocurrencies are always available in the database
 * This includes cryptocurrencies like Dogecoin, Bitcoin, Ethereum, etc.
 */
const ensurePopularCryptosAvailable = async () => {
  try {
    console.log("🔄 Checking popular cryptocurrencies availability...");

    // Get list of crypto IDs currently in database
    const existingCryptos = await Crypto.find({}, "id").lean();
    const existingIds = new Set(existingCryptos.map((crypto) => crypto.id));

    // Check which popular cryptos are missing
    const missingCryptos = cryptoAPIs.popularCryptos.filter(
      (id) => !existingIds.has(id)
    );

    if (missingCryptos.length === 0) {
      console.log("✅ All popular cryptocurrencies are available");
      return;
    }

    console.log(
      `📥 Fetching ${missingCryptos.length} missing popular cryptocurrencies:`,
      missingCryptos
    );

    // Fetch missing popular cryptocurrencies
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "aud",
          ids: missingCryptos.join(","),
          order: "market_cap_desc",
          per_page: missingCryptos.length,
          page: 1,
          sparkline: true,
          price_change_percentage: "1h,24h,7d",
        },
      }
    );

    if (response.data && response.data.length > 0) {
      const cryptoData = response.data.map((crypto) => ({
        ...crypto,
        roi: crypto.roi?.percentage ?? null,
        sparkline_in_7d: crypto.sparkline_in_7d?.price || [],
        high_7d:
          Array.isArray(crypto.sparkline_in_7d?.price) &&
          crypto.sparkline_in_7d.price.length > 0
            ? Math.max(...crypto.sparkline_in_7d.price)
            : 0,
        low_7d:
          Array.isArray(crypto.sparkline_in_7d?.price) &&
          crypto.sparkline_in_7d.price.length > 0
            ? Math.min(...crypto.sparkline_in_7d.price)
            : 0,
        metadata: {
          lastFetched: new Date(),
          isPopular: true,
        },
      }));

      // Insert the missing cryptocurrencies
      const insertPromises = cryptoData.map((crypto) =>
        Crypto.findOneAndUpdate({ id: crypto.id }, crypto, {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true,
        })
      );

      await Promise.all(insertPromises);
      console.log(
        `✅ Successfully added ${cryptoData.length} popular cryptocurrencies to database`
      );

      // Log specific cryptocurrencies added
      cryptoData.forEach((crypto) => {
        console.log(
          `  • ${crypto.name} (${crypto.symbol.toUpperCase()}) - Rank #${
            crypto.market_cap_rank || "N/A"
          }`
        );
      });
    }
  } catch (error) {
    console.error(
      "❌ Error ensuring popular cryptocurrencies are available:",
      error.message
    );
  }
};

/**
 * Validates that a cryptocurrency exists and has the required data for charts
 */
const validateCryptoForCharts = async (cryptoId) => {
  try {
    console.log(`🔍 Validating crypto availability for charts: ${cryptoId}`);

    // Check if crypto exists in database
    const crypto = await Crypto.findOne({ id: cryptoId }).lean();

    if (!crypto) {
      console.log(
        `⚠️ Cryptocurrency ${cryptoId} not found in database, attempting to fetch...`
      );

      // Try to fetch from CoinGecko
      const response = await axios.get(
        `https://api.coingecko.com/api/v3/coins/${cryptoId}`,
        {
          timeout: 10000,
        }
      );

      if (response.data) {
        console.log(`✅ Found ${cryptoId} data from CoinGecko API`);
        return {
          exists: true,
          inDatabase: false,
          canFetchCharts: true,
          name: response.data.name,
          symbol: response.data.symbol,
        };
      }
    }

    return {
      exists: !!crypto,
      inDatabase: !!crypto,
      canFetchCharts: true,
      name: crypto?.name,
      symbol: crypto?.symbol,
    };
  } catch (error) {
    console.error(`❌ Error validating crypto ${cryptoId}:`, error.message);
    return {
      exists: false,
      inDatabase: false,
      canFetchCharts: false,
      error: error.message,
    };
  }
};

/**
 * Get a list of all cryptocurrencies that support chart data
 */
const getCryptosWithChartSupport = async () => {
  try {
    const cryptos = await Crypto.find(
      {},
      "id name symbol market_cap_rank"
    ).lean();

    // Sort by market cap rank (popular first)
    return cryptos
      .filter(
        (crypto) => crypto.market_cap_rank && crypto.market_cap_rank <= 1000
      )
      .sort(
        (a, b) => (a.market_cap_rank || 999999) - (b.market_cap_rank || 999999)
      )
      .map((crypto) => ({
        id: crypto.id,
        name: crypto.name,
        symbol: crypto.symbol,
        rank: crypto.market_cap_rank,
      }));
  } catch (error) {
    console.error(
      "❌ Error getting cryptos with chart support:",
      error.message
    );
    return [];
  }
};

module.exports = {
  ensurePopularCryptosAvailable,
  validateCryptoForCharts,
  getCryptosWithChartSupport,
};
