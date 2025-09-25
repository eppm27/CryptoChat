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

module.exports = financialDataDB.model("Data", dataSchema, "data");
