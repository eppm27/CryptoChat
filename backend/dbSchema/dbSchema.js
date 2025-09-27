// Defining the db schema for financial data
const { default: mongoose } = require("mongoose");
const { financialDataDB } = require("../config/db");

const dataSchema = new mongoose.Schema(
  {
    source: { type: String, required: true },
    sentimentMetric: {
      type: String,
      enum: ["sentiment", "metric"],
      required: true,
    },
    data: { type: mongoose.Schema.Types.Mixed, required: true },
    topic: { type: [String], required: true },
    date_updated: { type: Date, default: Date.now },
  },
  { collection: "data" }
);

// Performance indexes for common queries
dataSchema.index({ source: 1 }); // For source-based queries
dataSchema.index({ date_updated: -1 }); // For sorting by newest first
dataSchema.index({ source: 1, date_updated: -1 }); // Compound index for grouped queries

module.exports = financialDataDB.model("Data", dataSchema, "data");
