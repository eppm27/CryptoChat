const {
  fetchCryptoGraphData,
  fetchCryptoCandleData,
} = require("../services/frontendCryptoService");

const {
  validateCryptoForCharts,
  ensurePopularCryptosAvailable,
} = require("../services/cryptoAvailabilityService");

const Crypto = require("../dbSchema/cryptoSchema");

const {
  getCryptoCache,
  getLastCacheTime,
  setCryptoCache,
} = require("../cache");

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const getAllCryptoList = async (req, res) => {
  const now = Date.now();

  const cache = getCryptoCache();
  const lastFetched = getLastCacheTime();

  // check if cached data is still valid
  if (cache && now - lastFetched < CACHE_TTL) {
    console.log("✅ Serving crypto list from cache");
    return res.json(cache);
  }

  // if not - fetch for fresh data from MongoDB
  try {
    console.log("Fetching fresh crypto list from MongoDB...");
    const data = await Crypto.find({}); // here the crypto is being fetched from our database

    setCryptoCache(data);
    console.log("Fetched from DB and stored in cache");

    return res.json(data);
  } catch (error) {
    console.error("❌ Error fetching crypto list:", error);
    return res.status(500).json({ error: "Failed to load crypto data" });
  }
};

const getCryptoDetailsDatabase = async (req, res) => {
  try {
    let { cryptos = [], type = "default" } = req.query;
    
    // Handle different ways axios might serialize the array
    if (typeof cryptos === "string") {
      try {
        const parsed = JSON.parse(cryptos);
        cryptos = parsed;
      } catch (parseError) {
        // Accept simple comma separated lists as a fallback
        cryptos = cryptos
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    }
    
    const now = Date.now();

    const cache = getCryptoCache();
    const lastFetched = getLastCacheTime();

    let allCryptos;
    // check if cache data is still valid - if not refetch
    if (cache && now - lastFetched < CACHE_TTL) {
      allCryptos = cache;
      console.log("✅ cryptoDetails served from cache");
    } else {
      console.log("Fetching cryptoDetails from DB...");
      allCryptos = await Crypto.find({});

      setCryptoCache(allCryptos);
    }

    let cryptoData;

    if (type === "watchlist") {
      const toId = (item) => {
        if (!item) return null;
        if (typeof item === "string") return item;
        if (typeof item === "object") {
          return item.cryptoId || item.id || item._id || null;
        }
        return null;
      };

      const watchlistIds = Array.isArray(cryptos)
        ? cryptos.map(toId).filter(Boolean)
        : [];

      cryptoData = allCryptos.filter((crypto) =>
        watchlistIds.includes(crypto.id)
      );
    } else if (type === "cryptoDetails") {
      cryptoData = allCryptos.find((term) => term.id === cryptos);
    } else if (cryptos.length === 0 && type === "default") {
      // default - meaning it would be giving everything and ordered for the explore page
      // cryptoData = allCryptos.sort((a, b) => a.market_cap_rank - b.market_cap_rank);

      cryptoData = allCryptos;
    }

    res.json(cryptoData);
  } catch (error) {
    console.error(
      "Error fetching crypto details from database - cache:",
      error
    );
    res
      .status(500)
      .json({ error: "Failed to fetch crypto details from databse - cache" });
  }
};

const getAllCryptosForCache = async (req, res) => {
  try {
    const allCryptos = await Crypto.find({}); // fetches everything from the database

    return res.json(allCryptos);
  } catch (error) {
    console.error(
      "Error fetching all crypto details for cache from database:",
      error
    );
    res.status(500).json({
      error: "Failed to fetch all crypto details for cache from databse",
    });
  }
};

const getCryptoGraphData = async (req, res) => {
  const { id: cryptoId } = req.params;
  const { period = "7" } = req.query;

  try {
    console.log(`📊 Graph data request for: ${cryptoId} (${period} days)`);

    // Validate that the cryptocurrency exists and can provide chart data
    const validation = await validateCryptoForCharts(cryptoId);

    if (!validation.exists) {
      console.error(`❌ Cryptocurrency not found: ${cryptoId}`);
      return res.status(404).json({
        message: `Cryptocurrency '${cryptoId}' not found`,
        suggestion: "Please check the cryptocurrency ID and try again",
      });
    }

    if (!validation.canFetchCharts) {
      console.error(`❌ Chart data not available for: ${cryptoId}`);
      return res.status(400).json({
        message: `Chart data not available for '${cryptoId}'`,
        error: validation.error,
      });
    }

    console.log(
      `✅ Crypto validation passed for ${cryptoId}: ${
        validation.name
      } (${validation.symbol?.toUpperCase()})`
    );

    const [lineData, candleData] = await Promise.all([
      fetchCryptoGraphData(cryptoId, period),
      fetchCryptoCandleData(cryptoId, period),
    ]);

    const allData = {
      ...lineData,
      ...candleData,
      cryptoInfo: {
        id: cryptoId,
        name: validation.name,
        symbol: validation.symbol,
        inDatabase: validation.inDatabase,
      },
    };

    console.log(`✅ Successfully returning graph data for ${cryptoId}`);
    res.json(allData);
  } catch (error) {
    console.error(
      `❌ Error fetching crypto graph data for ${cryptoId}:`,
      error.message
    );
    res.status(500).json({
      message: `Failed to fetch crypto graph data for '${cryptoId}'`,
      error: error.message,
      cryptoId: cryptoId,
    });
  }
};

const CryptoIndicator = require("../dbSchema/cryptoIndicatorSchema");

const getCryptoIndicatorGraph = async (req, res) => {
  const { id: cryptoId } = req.params;

  try {
    const analysis = await CryptoIndicator.findOne({
      cryptoId,
      indicator: "RSI",
    })
      .select("data symbol -_id")
      .lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: "RSI data not found",
      });
    }

    // Transform data for frontend
    const rsiData = analysis.data
      .map((item) => ({
        x: new Date(item.date).getTime(), // Convert to timestamp
        y: item.value,
      }))
      .sort((a, b) => a.x - b.x); // Sort by date ascending

    res.json({
      success: true,
      symbol: analysis.symbol,
      rsiData,
    });
  } catch (error) {
    console.error("Error fetching RSI data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch RSI data",
    });
  }
};

const getCryptoChartSupport = async (req, res) => {
  try {
    const {
      getCryptosWithChartSupport,
    } = require("../services/cryptoAvailabilityService");
    const supportedCryptos = await getCryptosWithChartSupport();

    res.json({
      count: supportedCryptos.length,
      cryptocurrencies: supportedCryptos,
    });
  } catch (error) {
    console.error("Error fetching cryptos with chart support:", error);
    res.status(500).json({
      message: "Failed to fetch cryptocurrencies with chart support",
      error: error.message,
    });
  }
};

module.exports = {
  getAllCryptoList,
  getCryptoGraphData,
  getCryptoDetailsDatabase,
  getAllCryptosForCache,
  getCryptoIndicatorGraph,
  getCryptoChartSupport,
};
