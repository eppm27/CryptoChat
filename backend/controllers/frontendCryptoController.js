const {
  fetchCryptoGraphData,
  fetchCryptoCandleData,
} = require('../services/frontendCryptoService');

const Crypto = require('../dbSchema/cryptoSchema');

const {
  getCryptoCache,
  getLastCacheTime,
  setCryptoCache,
} = require('../cache');

const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

const getAllCryptoList = async (req, res) => {
  const now = Date.now();

  const cache = getCryptoCache();
  const lastFetched = getLastCacheTime();

  // check if cached data is still valid
  if (cache && now - lastFetched < CACHE_TTL) {
    console.log('✅ Serving crypto list from cache');
    return res.json(cache);
  }

  // if not - fetch for fresh data from MongoDB
  try {
    console.log('Fetching fresh crypto list from MongoDB...');
    const data = await Crypto.find({}); // here the crypto is being fetched from our database

    setCryptoCache(data);
    console.log('Fetched from DB and stored in cache');

    return res.json(data);
  } catch (error) {
    console.error('❌ Error fetching crypto list:', error);
    return res.status(500).json({ error: 'Failed to load crypto data' });
  }
};


const getCryptoDetailsDatabase = async (req, res) => {
  console.log('in getCryptoDetailsDatabase');
  try {
    const { cryptos = [], type = "default" } = req.query; 
    const now = Date.now();

    const cache = getCryptoCache();
    const lastFetched = getLastCacheTime();

    let allCryptos;
    // check if cache data is still valid - if not refetch
    if (cache && now - lastFetched < CACHE_TTL) {
      allCryptos = cache;
      console.log('✅ cryptoDetails served from cache');
    } else {
      console.log('Fetching cryptoDetails from DB...');
      allCryptos = await Crypto.find({});

      setCryptoCache(allCryptos);
    }

    let cryptoData;

    if (type === "watchlist") {
      const watchlistIds = cryptos.map(item => item.cryptoId);
      cryptoData = allCryptos.filter(crypto => watchlistIds.includes(crypto.id));

    } else if (type === "cryptoDetails") {
      cryptoData = allCryptos.find(term => term.id === cryptos);
    } else if (cryptos.length === 0 && type === "default") {
      // default - meaning it would be giving everything and ordered for the explore page
      // cryptoData = allCryptos.sort((a, b) => a.market_cap_rank - b.market_cap_rank);

      cryptoData = allCryptos;
    }

    res.json(cryptoData);
  } catch (error) {
    console.error(
      'Error fetching crypto details from database - cache:',
      error
    );
    res
      .status(500)
      .json({ error: 'Failed to fetch crypto details from databse - cache' });
  }
};

const getAllCryptosForCache = async (req, res) => {
  try {
    const allCryptos = await Crypto.find({}); // fetches everything from the database

    return res.json(allCryptos);
  } catch (error) {
    console.error(
      'Error fetching all crypto details for cache from database:',
      error
    );
    res.status(500).json({
      error: 'Failed to fetch all crypto details for cache from databse',
    });
  }
};

const getCryptoGraphData = async (req, res) => {
  const { id: cryptoId } = req.params;
  const { period = '7' } = req.query;

  try {
    const [lineData, candleData] = await Promise.all([
      fetchCryptoGraphData(cryptoId, period),
      fetchCryptoCandleData(cryptoId, period),
    ]);

    const allData = {
      ...lineData,
      ...candleData,
    };

    res.json(allData);
  } catch (error) {
    console.error('Error fetching crypto data:', error.message);
    res.status(500).json({ message: 'Failed to fetch crypto data' });
  }
};

const CryptoIndicator = require('../dbSchema/cryptoIndicatorSchema');

const getCryptoIndicatorGraph = async (req, res) => {
  const { id: cryptoId } = req.params;

  try {
    const analysis = await CryptoIndicator.findOne({
      cryptoId,
      indicator: 'RSI',
    })
      .select('data symbol -_id')
      .lean();

    if (!analysis) {
      return res.status(404).json({
        success: false,
        message: 'RSI data not found',
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
    console.error('Error fetching RSI data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch RSI data',
    });
  }
};

module.exports = {
  getAllCryptoList,
  getCryptoGraphData,
  getCryptoDetailsDatabase,
  getAllCryptosForCache,
  getCryptoIndicatorGraph,
};
