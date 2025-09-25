const NewsArticle = require('../dbSchema/newsSchema');

const getLatestNews = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const news = await NewsArticle.find()
      .sort({ published_at: -1 })
      .limit(Number(limit));
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNewsByTicker = async (req, res) => {
  try {
    const { ticker } = req.params;
    const { limit = 10 } = req.query;

    if (!ticker) {
      return res.status(400).json({ error: 'Ticker is required' });
    }

    const formattedTicker = ticker.toUpperCase();
    const news = await NewsArticle.find({
      $or: [
        { tickers: `CRYPTO:${formattedTicker}` }, // Alpha Vantage format
        { tickers: formattedTicker }, // Other APIs (RapidAPI, etc.)
      ],
    })
      .sort({ published_at: -1 }) // Newest first
      .limit(Number(limit));

    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getLatestNews,
  getNewsByTicker,
};
