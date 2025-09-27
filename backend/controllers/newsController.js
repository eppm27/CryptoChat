const NewsArticle = require("../dbSchema/newsSchema");

const getLatestNews = async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    const parsedLimit = Number.isFinite(limitNumber)
      ? Math.max(1, Math.floor(limitNumber))
      : 10;
    const parsedOffset = Number.isFinite(offsetNumber)
      ? Math.max(0, Math.floor(offsetNumber))
      : 0;

    const news = await NewsArticle.find()
      .sort({ published_at: -1 })
      .skip(parsedOffset)
      .limit(parsedLimit);
    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getNewsByTicker = async (req, res) => {
  try {
    const { ticker } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    if (!ticker) {
      return res.status(400).json({ error: "Ticker is required" });
    }

    const formattedTicker = ticker.toUpperCase();
    const limitNumber = Number(limit);
    const offsetNumber = Number(offset);

    const parsedLimit = Number.isFinite(limitNumber)
      ? Math.max(1, Math.floor(limitNumber))
      : 10;
    const parsedOffset = Number.isFinite(offsetNumber)
      ? Math.max(0, Math.floor(offsetNumber))
      : 0;

    const news = await NewsArticle.find({
      $or: [
        { tickers: `CRYPTO:${formattedTicker}` }, // Alpha Vantage format
        { tickers: formattedTicker }, // Other APIs (RapidAPI, etc.)
      ],
    })
      .sort({ published_at: -1 }) // Newest first
      .skip(parsedOffset)
      .limit(parsedLimit);

    res.json(news);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getLatestNews,
  getNewsByTicker,
};
