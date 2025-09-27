const mongoose = require("mongoose");
const { cryptoListDB } = require("../config/db");

const cryptoDB = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
  },
  symbol: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  current_price: {
    type: Number,
    required: true,
  },
  market_cap: {
    type: Number,
    required: true,
  },
  market_cap_rank: {
    type: Number,
    required: true,
  },
  fully_diluted_valuation: {
    type: Number,
    required: false,
    default: null,
  },
  total_volume: {
    type: Number,
    required: true,
  },
  high_24h: {
    type: Number,
    required: true,
  },
  low_24h: {
    type: Number,
    required: true,
  },
  high_7d: {
    type: Number,
    required: true,
  },
  low_7d: {
    type: Number,
    required: true,
  },
  price_change_24h: {
    type: Number,
    required: true,
  },
  price_change_percentage_24h: {
    type: Number,
    required: true,
  },
  market_cap_change_24h: {
    type: Number,
    required: true,
  },
  market_cap_change_percentage_24h: {
    type: Number,
    required: true,
  },
  circulating_supply: {
    type: Number,
    required: true,
  },
  total_supply: {
    type: Number,
    required: true,
  },
  max_supply: {
    type: Number,
    required: false,
    default: null,
  },
  ath: {
    type: Number,
    required: false,
    default: null,
  },
  ath_change_percentage: {
    type: Number,
    required: false,
    default: null,
  },
  ath_date: {
    type: String,
    required: false,
    default: null,
  },
  atl: {
    type: Number,
    required: false,
    default: null,
  },
  atl_change_percentage: {
    type: Number,
    required: false,
    default: null,
  },
  atl_date: {
    type: String,
    required: false,
    default: null,
  },
  roi: {
    type: Number,
    required: false,
    default: null,
  },
  last_updated: {
    type: String,
    required: true,
  },
  price_change_percentage_1h_in_currency: {
    type: Number,
    required: true,
  },
  price_change_percentage_24h_in_currency: {
    type: Number,
    required: true,
  },
  price_change_percentage_7d_in_currency: {
    type: Number,
    required: true,
  },
  sparkline_in_7d: {
    type: [Number],
    required: true,
  },
  description: {
    type: String,
    required: false,
    default: "No description is provided",
  },
  homepageLink: {
    type: String,
    required: false,
    default: "",
  },
  whitepaperLink: {
    type: String,
    required: false,
    default: "",
  },
  communityLinks: {
    reddit: { type: String, required: false, default: "" },
    twitter: { type: String, required: false, default: "" },
    facebook: { type: String, required: false, default: "" },
    telegram: { type: String, required: false, default: "" },
    instagram: { type: String, required: false, default: "" },
  },
  genesisDate: {
    type: String,
    required: false,
    default: null,
  },
  categories: {
    type: [String],
    required: false,
    default: [],
  },
  coinType: {
    type: String,
    required: false,
    default: "",
  },
});

// Performance indexes for common queries
cryptoDB.index({ market_cap_rank: 1 }); // For sorting by market cap rank
cryptoDB.index({ symbol: 1 }); // For symbol-based lookups
cryptoDB.index({ name: 1 }); // For name-based searches
cryptoDB.index({ id: 1 }, { unique: true }); // Unique constraint on id
cryptoDB.index({ current_price: -1 }); // For price-based sorting
cryptoDB.index({ price_change_percentage_24h_in_currency: -1 }); // For performance sorting

module.exports = cryptoListDB.model("Crypto", cryptoDB, "cryptolists");
