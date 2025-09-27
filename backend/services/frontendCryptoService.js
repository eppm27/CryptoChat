const axios = require("axios");
const Crypto = require("../dbSchema/cryptoSchema");

const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

const { setCryptoCache } = require("../cache");

const fetchWithRetry = async (url, retries = 5, delay = 2000, headers = {}) => {
  try {
    console.log(`🌐 Fetching: ${url}`);
    const response = await axios.get(url, {
      headers,
      timeout: 15000, // 15 second timeout
    });
    return response;
  } catch (error) {
    if (error.response && error.response.status === 429 && retries > 0) {
      console.log(
        `⏳ Rate limited, waiting ${delay}ms before retry (${retries} retries left)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return fetchWithRetry(url, retries - 1, delay * 2, headers);
    } else {
      console.error(`❌ Error fetching data from ${url}: ${error.message}`);
      return null;
    }
  }
};

const fetchIndividualCryptoDetails = async (cryptoId) => {
  try {
    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}`
    );

    if (!response || !response.data) {
      console.error(`No data returned for ${cryptoId}`);
      return null;
    }

    const data = {
      description: response.data.description?.en || "No description available",
      homepageLink: response.data.links?.homepage?.[0] || "",
      whitepaperLink: Array.isArray(response.data.links?.whitepaper)
        ? response.data.links.whitepaper[0] || ""
        : response.data.links?.whitepaper || "",
      communityLinks: {
        reddit: response.data.links?.subreddit_url || "",
        twitter: response.data.links?.twitter_screen_name
          ? `https://twitter.com/${response.data.links.twitter_screen_name}`
          : "",
        facebook: response.data.links?.facebook_username
          ? `https://www.facebook.com/${response.data.links.facebook_username}`
          : "",
        telegram: response.data.links?.telegram_channel_identifier
          ? `https://t.me/${response.data.links.telegram_channel_identifier}`
          : "",
        instagram: response.data.links?.instagram_username
          ? `https://www.instagram.com/${response.data.links.instagram_username}`
          : "",
      },
      genesisDate: response.data.genesis_date || "",
      categories: response.data.categories || [],
    };

    return data;
  } catch (error) {
    console.error(`Error fetching description for ${cryptoId}:`, error);
    return null;
  }
};

const findOldCryptos = async (newlyFetchedCryptos, existingCryptos) => {
  const newCryptoIds = new Set(newlyFetchedCryptos.map((coin) => coin.id));
  // Filter to only include old cryptos that are no longer in the newly fetched list
  const oldCryptos = existingCryptos.filter(
    (coin) => !newCryptoIds.has(coin.id)
  );

  if (oldCryptos && oldCryptos.length > 0) {
    const cryptoIds = oldCryptos.map((crypto) => crypto.id);
    await new Promise((resolve) => setTimeout(resolve, 20000));

    try {
      const response = await axios.get(
        "https://api.coingecko.com/api/v3/coins/markets",
        {
          params: {
            vs_currency: "aud",
            sparkline: true,
            price_change_percentage: "1h,24h,7d",
            ids: cryptoIds.join(","),
          },
        }
      );

      const oldCryptoData = response.data;

      console.log(
        "the fetched new data for old data not in top 500 ",
        oldCryptoData
      );
      return oldCryptoData;
    } catch (error) {
      console.log(
        "findOldCryptos fetfch failed - cant geet their data: ",
        error
      );
      return null;
    }
  }
};

const enrichCryptoFields = (coin, addedFields) => ({
  id: coin.id,
  symbol: coin.symbol,
  name: coin.name,
  image: coin.image || "",
  current_price: coin.current_price || 0,
  market_cap: coin.market_cap || 0,
  market_cap_rank: coin.market_cap_rank || null,
  fully_diluted_valuation: coin.fully_diluted_valuation || 0,
  total_volume: coin.total_volume || 0,
  high_24h: coin.high_24h || 0,
  low_24h: coin.low_24h || 0,
  price_change_24h: coin.price_change_24h || 0,
  price_change_percentage_24h: coin.price_change_percentage_24h || 0,
  market_cap_change_24h: coin.market_cap_change_24h || 0,
  market_cap_change_percentage_24h: coin.market_cap_change_percentage_24h || 0,
  circulating_supply: coin.circulating_supply || 0,
  total_supply: coin.total_supply || 0,
  max_supply: coin.max_supply || 0,
  ath: coin.ath || 0,
  ath_change_percentage: coin.ath_change_percentage || 0,
  ath_date: coin.ath_date || "",
  atl: coin.atl || 0,
  atl_change_percentage: coin.atl_change_percentage || 0,
  atl_date: coin.atl_date || "",
  roi: coin.roi?.percentage ?? null,
  last_updated: coin.last_updated || "",
  price_change_percentage_1h_in_currency:
    coin.price_change_percentage_1h_in_currency || 0,
  price_change_percentage_24h_in_currency:
    coin.price_change_percentage_24h_in_currency || 0,
  price_change_percentage_7d_in_currency:
    coin.price_change_percentage_7d_in_currency || 0,
  sparkline_in_7d: coin.sparkline_in_7d?.price || [],
  high_7d:
    Array.isArray(coin.sparkline_in_7d?.price) &&
    coin.sparkline_in_7d.price.length > 0
      ? Math.max(...coin.sparkline_in_7d.price)
      : 0,
  low_7d:
    Array.isArray(coin.sparkline_in_7d?.price) &&
    coin.sparkline_in_7d.price.length > 0
      ? Math.min(...coin.sparkline_in_7d.price)
      : 0,

  ...addedFields, // merge in new fields
});

const findNewCryptos = async (newlyFetchedCryptos, existingCryptos) => {
  // a list of existing ids for faster comparison later on
  const existingIds = new Set(existingCryptos.map((coin) => coin.id));
  // Filter to only include new cryptos not present in the existing list
  const newCryptos = newlyFetchedCryptos.filter(
    (coin) => !existingIds.has(coin.id)
  );

  try {
    const enrichedCryptos = await Promise.all(
      newCryptos.map(async (coin) => {
        await new Promise((resolve) => setTimeout(resolve, 20000));

        const addedFields = await fetchIndividualCryptoDetails(coin.id); // received additional fields for new cryptos
        if (!addedFields) return null;
        return enrichCryptoFields(coin, addedFields);
      })
    );

    // replace the new terms with the new ones
    // convert them to map so its easier to find ids
    const enrichedMap = new Map(
      enrichedCryptos.filter(Boolean).map((c) => [c.id, c])
    );

    const updatedCryptos = newlyFetchedCryptos.map((coin) =>
      enrichedMap.has(coin.id) ? enrichedMap.get(coin.id) : coin
    );

    return updatedCryptos;
  } catch (error) {
    console.log(
      "failed to fetch for additional fields for new cryptos: ",
      error
    );
    return null;
  }
};

const saveUpdatedData = async (cryptoData) => {
  console.log("in saveUpdatedData");
  const updatedata = cryptoData.map((crypto) =>
    Crypto.findOneAndUpdate({ id: crypto.id }, crypto, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    })
  );

  await Promise.all(updatedata);
};

// Fetching for the top 500 tickers
const fetchTopCryptos = async () => {
  console.log("in fetchTopCryptos");
  const perPage = 250; // Max items per page
  const totalCoins = 500;
  const totalPages = Math.ceil(totalCoins / perPage);

  let topCoins = [];

  for (let page = 1; page <= totalPages; page++) {
    const response = await axios.get(
      "https://api.coingecko.com/api/v3/coins/markets",
      {
        params: {
          vs_currency: "aud",
          order: "market_cap_desc",
          per_page: perPage,
          page: page,
          sparkline: true,
          price_change_percentage: "1h,24h,7d",
        },
      }
    );
    topCoins.push(...response.data);
    await new Promise((resolve) => setTimeout(resolve, 25000)); // To completely avoid 429 error from coinGecko from calling too often
  }

  return topCoins.filter((item) => item.id !== null);
};

// returns the entire list of updated cryptos - containing both old ones and new ones
const fetchNewestCryptoData = async () => {
  const topCoins = await fetchTopCryptos();

  try {
    const response = await axios.get("http://backend:3000/api/crypto/cryptos");
    const existingCryptos = response.data;

    const additionalCryptoList = await findOldCryptos(
      topCoins,
      existingCryptos
    );

    if (additionalCryptoList && additionalCryptoList.length > 0) {
      topCoins.push(...additionalCryptoList);
    } else {
      console.log("no old cryptos were found in this update"); // if there exists old ones, then flatten and push it in
    }

    const completeCryptoList = await findNewCryptos(topCoins, existingCryptos);

    return completeCryptoList;
  } catch (error) {
    console.log("failed to update or fetch top 1000 cryptos: ", error);
    return null;
  }
};

// cache version of updateing both the database and the cache
const updateCryptoInfoMongo = async () => {
  console.log("in updateCryptoInfoMongo");

  try {
    const newestCryptoData = await fetchNewestCryptoData();

    if (!newestCryptoData || !Array.isArray(newestCryptoData)) {
      console.error("❌ fetchNewestCryptoData returned null or invalid format");
      return;
    }

    const allData = newestCryptoData.map((crypto) => ({
      ...crypto,
      roi: crypto.roi?.percentage ?? null,
      sparkline_in_7d: crypto.sparkline_in_7d?.price || [],
      metadata: {
        lastFetched: new Date(),
        fetchInterval: REFRESH_INTERVAL,
      },
    }));

    await saveUpdatedData(allData);
    console.log(`✅ Successfully updated MongoDB`);

    try {
      const response = await axios.get(
        "http://backend:3000/api/crypto/cryptos-cache-update"
      );
      // const response = await axios.get("http://localhost:3000/api/crypto/cryptos-cache-update");
      setCryptoCache(response.data);
      console.log(`✅ Also refreshed in-memory cache`);
    } catch (error) {
      console.error(
        "❌ Error during fetching the entire database for cache:",
        error
      );
    }
  } catch (error) {
    console.error(
      "❌ Error during updateCryptoInfoMongo - cache version:",
      error
    );
  }
};

// Import crypto availability service
const {
  ensurePopularCryptosAvailable,
} = require("./cryptoAvailabilityService");

// Initialize popular cryptocurrencies on startup
const initializeCryptoService = async () => {
  console.log("🚀 Initializing crypto service...");

  // Ensure popular cryptocurrencies (including Dogecoin) are available
  await ensurePopularCryptosAvailable();

  // Then run the main update
  await updateCryptoInfoMongo();

  console.log("✅ Crypto service initialization complete");
};

// Set up periodic updates
setInterval(updateCryptoInfoMongo, REFRESH_INTERVAL);

// Initialize the service
initializeCryptoService().catch((error) => {
  console.error("❌ Error during crypto service initialization:", error);
});

const fetchCryptoGraphData = async (cryptoId, selectedPeriod = "7") => {
  try {
    console.log(
      `📊 Fetching graph data for ${cryptoId} (${selectedPeriod} days)`
    );

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/market_chart?vs_currency=aud&days=${selectedPeriod}`,
      3,
      3000, // Longer delay between retries
      headers
    );

    if (!response || !response.data) {
      console.error(`❌ No graph data returned for ${cryptoId}`);
      throw new Error(`No graph data available for ${cryptoId}`);
    }

    const { prices, market_caps } = response.data;

    if (!prices || !Array.isArray(prices) || prices.length === 0) {
      console.error(`❌ Invalid price data for ${cryptoId}:`, {
        prices: prices?.length,
      });
      throw new Error(`Invalid price data for ${cryptoId}`);
    }

    console.log(
      `✅ Successfully fetched graph data for ${cryptoId}: ${prices.length} price points`
    );

    return {
      priceData: prices,
      marketCapData: market_caps || [],
    };
  } catch (error) {
    console.error(
      `❌ Error fetching price graph data for ${cryptoId}:`,
      error.message
    );
    throw new Error(
      `Error fetching crypto graph data for ${cryptoId}: ${error.message}`
    );
  }
};

const fetchCryptoCandleData = async (cryptoId, selectedPeriod = "7") => {
  try {
    console.log(
      `🕯️ Fetching candle data for ${cryptoId} (${selectedPeriod} days)`
    );

    // Add delay to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const headers = {};
    if (process.env.COINGECKO_API_KEY) {
      headers["x-cg-demo-api-key"] = process.env.COINGECKO_API_KEY;
    }

    const response = await fetchWithRetry(
      `https://api.coingecko.com/api/v3/coins/${cryptoId}/ohlc?vs_currency=aud&days=${selectedPeriod}`,
      3,
      3000, // Longer delay between retries
      headers
    );

    if (!response || !response.data) {
      console.error(`❌ No candle data returned for ${cryptoId}`);
      throw new Error(`No candle data available for ${cryptoId}`);
    }

    const ohlcData = response.data;

    if (!Array.isArray(ohlcData)) {
      console.error(`❌ Invalid OHLC data for ${cryptoId}:`, typeof ohlcData);
      throw new Error(`Invalid OHLC data format for ${cryptoId}`);
    }

    console.log(
      `✅ Successfully fetched candle data for ${cryptoId}: ${ohlcData.length} candles`
    );

    return {
      ohlcData: ohlcData,
    };
  } catch (error) {
    console.error(
      `❌ Error fetching price candle data for ${cryptoId}:`,
      error.message
    );
    throw new Error(
      `Error fetching candle graph data for ${cryptoId}: ${error.message}`
    );
  }
};

module.exports = {
  fetchCryptoGraphData,
  fetchCryptoCandleData,
  updateCryptoInfoMongo,
  fetchWithRetry,
  fetchIndividualCryptoDetails,
  fetchTopCryptos,
  enrichCryptoFields,
};
