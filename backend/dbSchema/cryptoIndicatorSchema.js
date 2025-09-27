const mongoose = require("mongoose");
const { cryptoListDB } = require("../config/db");

const cryptoIndicatorDB = new mongoose.Schema(
  {
    // Reference to the main crypto document (one-to-one relationship)
    cryptoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Crypto",
      required: true,
      unique: true,
    },
    symbol: {
      type: String,
      required: true,
      index: true,
    },

    interval: {
      type: String,
      required: true,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
    time_period: {
      type: Number,
      required: true,
      default: 14,
    },
    series_type: {
      type: String,
      required: true,
      enum: ["open", "high", "low", "close"],
      default: "close",
    },

    indicator: {
      type: String,
      required: true,
      enum: ["RSI", "MACD", "SMA"],
      default: "RSI",
    },

    data: [
      {
        date: {
          type: Date,
          required: true,
        },
        value: {
          type: Number,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Compound index for querying
cryptoIndicatorDB.index({
  symbol: 1,
  indicator: 1,
  interval: 1,
  time_period: 1,
});

module.exports = cryptoListDB.model(
  "CryptoIndicator",
  cryptoIndicatorDB,
  "cryptoIndicator"
);
