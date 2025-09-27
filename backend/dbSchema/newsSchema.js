// Define schema for News articles
const mongoose = require("mongoose");
const { financialDataDB } = require("../config/db");

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  summary: {
    type: String,
    required: true,
  },
  source: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  published_at: {
    type: Date,
    required: true,
    validate: {
      validator: function (v) {
        return v instanceof Date && !isNaN(v.getTime());
      },
      message: (props) => `${props.value} is not a valid date!`,
    },
  },
  topics: {
    type: [String],
    default: [],
  },
  tickers: {
    type: [String],
    default: [],
  },
  sentiment_score: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
  metadata: {
    lastFetched: { type: Date, default: null },
    fetchInterval: { type: Number, default: 60 }, // minutes
  },
});

// Performance indexes for common queries
newsSchema.index({ published_at: -1 }); // For sorting by newest first
newsSchema.index({ tickers: 1 }); // For ticker-based queries
newsSchema.index({ url: 1 }, { unique: true }); // Prevent duplicate articles
newsSchema.index({ source: 1, published_at: -1 }); // For source-based queries with sorting
newsSchema.index({ "metadata.lastFetched": 1 }); // For update operations

module.exports = financialDataDB.model(
  "DataNewsArticle",
  newsSchema,
  "newsData"
);
