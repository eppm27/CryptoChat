// Define schema for News articles
const mongoose = require('mongoose');
const { financialDataDB } = require('../config/db');

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

module.exports = financialDataDB.model(
  'DataNewsArticle',
  newsSchema,
  'newsData'
);
