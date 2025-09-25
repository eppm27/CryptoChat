const DataModel = require("../dbSchema/dbSchema.js");

const extractGraphSpecs = (text) => {
  const graphRegex = /```graph-data\s*([\s\S]*?)```/gs;
  const matches = [...text.matchAll(graphRegex)];

  return matches
    .map((match) => {
      try {
        // Clean up the JSON string
        const jsonStr = match[1]
          .replace(/\/\/.*$/gm, "") // Remove single-line comments
          .replace(/\/\*[\s\S]*?\*\//g, "") // Remove multi-line comments
          .replace(/,(\s*[\]}])/g, "$1"); // Remove trailing commas

        console.log("Cleaned JSON string:", jsonStr);
        return JSON.parse(jsonStr);
      } catch (e) {
        console.error("Error parsing graph data JSON:", e);
        // For debugging, log the exact content that failed to parse
        console.error("Failed JSON content:", match[1]);
        return null;
      }
    })
    .filter(Boolean);
};

const generatePriceHistoryData = (cryptoData, cryptoId) => {
  // Find the cryptocurrency in the data
  console.log(
    "Available crypto data:",
    cryptoData.map((c) => c.id).slice(0, 10)
  ); // Show first 10 IDs
  const crypto = cryptoData.find(
    (item) =>
      item.id?.toLowerCase() === cryptoId.toLowerCase() ||
      item.name?.toLowerCase() === cryptoId.toLowerCase() ||
      item.symbol?.toLowerCase() === cryptoId.toLowerCase()
  );
  console.log(
    "Crypto data available:",
    !!crypto,
    crypto?.sparkline_in_7d?.price ? "with sparkline" : "no sparkline"
  );
  if (!crypto || !crypto.sparkline_in_7d?.price) {
    return null;
  }

  // Coingecko provides 168 hourly prices in the sparkline (7d)
  const prices = crypto.sparkline_in_7d.price;
  const now = new Date();

  return prices.map((price, index) => {
    // Calculate timestamp based on index (hourly data points)
    const timestamp = new Date(now);
    timestamp.setHours(now.getHours() - (prices.length - index));

    return {
      time: timestamp.toISOString(),
      price: price,
    };
  });
};

const generateComparisonData = (cryptoData, cryptoIds, metric = "price") => {
  const cryptos = cryptoData.filter((item) =>
    cryptoIds.some(
      (id) =>
        item.id?.toLowerCase() === id.toLowerCase() ||
        item.name?.toLowerCase() === id.toLowerCase() ||
        item.symbol?.toLowerCase() === id.toLowerCase()
    )
  );

  if (!cryptos.length) return null;

  const labels = cryptos.map((crypto) => crypto.name || crypto.symbol);
  const data = cryptos.map((crypto) => {
    switch (metric) {
      case "price":
        return crypto.current_price;
      case "market_cap":
        return crypto.market_cap;
      case "volume":
        return crypto.total_volume;
      case "change_24h":
        return crypto.price_change_percentage_24h;
      default:
        return crypto.current_price;
    }
  });

  return {
    labels,
    datasets: [
      {
        label: metric.charAt(0).toUpperCase() + metric.slice(1),
        data,
        backgroundColor: [
          "rgba(75, 192, 192, 0.6)",
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
      },
    ],
  };
};

const generatePortfolioData = (wallet, cryptoData) => {
  if (!wallet || !wallet.length) return null;

  const portfolioItems = wallet
    .map((item) => {
      const crypto = cryptoData.find(
        (c) =>
          c.id?.toLowerCase() === item.id?.toLowerCase() ||
          c.name?.toLowerCase() === item.name?.toLowerCase()
      );

      if (!crypto) return null;

      return {
        name: item.name,
        value: item.quantity * (crypto.current_price || 0),
      };
    })
    .filter(Boolean);

  return {
    labels: portfolioItems.map((item) => item.name),
    datasets: [
      {
        data: portfolioItems.map((item) => item.value),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };
};

const processGraphsInResponse = async (llmResponse, userWallet) => {
  // Support both raw string and { text, visualizations } object
  const rawText =
    typeof llmResponse === "string" ? llmResponse : llmResponse.text || "";
  const graphSpecs =
    Array.isArray(llmResponse.visualizations) &&
    llmResponse.visualizations.length > 0
      ? llmResponse.visualizations
      : extractGraphSpecs(rawText);

  if (!graphSpecs || !graphSpecs.length) {
    // No graphs requested, just return the raw text without graph data
    return { text: rawText, visualizations: [] };
  }

  try {
    // Get the latest crypto data from the database
    const dbData = await DataModel.aggregate([
      { $sort: { date_updated: -1 } },
      { $group: { _id: "$source", data: { $first: "$data" } } },
    ]);

    // Extract relevant data sources, preferring Coingecko over CoinLore
    const cgData = dbData.find((item) => item._id === "coingecko")?.data || [];
    const clData = dbData.find((item) => item._id === "coinlore")?.data || [];
    const cryptoData = cgData.length ? cgData : clData;

    // If no data from Coingecko or CoinLore, bail out early
    if (!cryptoData.length) {
      console.warn("No crypto data available; skipping graph generation.");
      return {
        text:
          rawText.trim() + " (No crypto data available to generate graphs.)",
        visualizations: [],
      };
    }

    // Process each graph specification
    const visualizations = [];

    for (const spec of graphSpecs) {
      const { type, title, dataPoints: datapoints } = spec;
      let graphData;

      switch (type) {
        case "line":
          // For line charts, handle two possible formats:
          // 1. dataPoints as array of strings (e.g., ["bitcoin_price_7d"])
          // 2. dataPoints as array of numeric values (e.g., [50000, 51000, 52000])
          if (datapoints && datapoints.length) {
            if (
              typeof datapoints[0] === "string" &&
              datapoints[0].includes("_")
            ) {
              // Format 1: Parse "cryptoId_metric_timeframe" format
              const [cryptoId, metric, timeframe] = datapoints[0].split("_");
              console.log(`Processing ${cryptoId} ${metric} for ${timeframe}`);
              if (metric === "price") {
                graphData = generatePriceHistoryData(
                  cryptoData,
                  cryptoId,
                  timeframe
                );
                console.log(
                  "Generated price history data:",
                  graphData ? `${graphData.length} points` : "null"
                );
              }
            } else if (
              Array.isArray(datapoints) &&
              typeof datapoints[0] === "number"
            ) {
              // Format 2: Direct numeric values - create time series with current timestamps
              const now = new Date();
              graphData = datapoints.map((value, index) => {
                const timestamp = new Date(now);
                // For daily datapoints, go back by days
                timestamp.setDate(
                  timestamp.getDate() - (datapoints.length - 1 - index)
                );
                return {
                  time: timestamp.toISOString().split("T")[0], // Just use the date portion
                  price: value,
                };
              });
            } else if (title && title.toLowerCase().includes("bitcoin")) {
              // Fallback for Bitcoin if we can identify it from the title
              graphData = generatePriceHistoryData(cryptoData, "bitcoin", "7d");
            }
          }
          break;

        case "bar":
          // For bar charts, comparison between multiple cryptos
          if (datapoints && datapoints.length) {
            const metric = datapoints[0].split("_")[1] || "price";
            graphData = generateComparisonData(
              cryptoData,
              datapoints.map((d) => d.split("_")[0]),
              metric
            );
          }
          break;

        case "pie":
          // For pie charts, portfolio distribution
          if (datapoints && datapoints.includes("portfolio")) {
            graphData = generatePortfolioData(userWallet, cryptoData);
          }
          break;

        default:
          console.warn(`Unsupported chart type: ${type}`);
      }

      if (graphData) {
        console.log(
          "Graph data generated successfully:",
          Array.isArray(graphData)
            ? `Array with ${graphData.length} elements`
            : "Object with structure"
        );

        // Add structure info for debugging
        if (Array.isArray(graphData) && graphData.length > 0) {
          console.log("First element structure:", JSON.stringify(graphData[0]));
        } else if (typeof graphData === "object") {
          console.log("Object keys:", Object.keys(graphData));
        }
        visualizations.push({
          type,
          title,
          dataPoints: graphData,
        });
      }
    }

    // Remove the graph-data blocks from the text
    const cleanedText = rawText.replace(/```graph-data.*?```/gs, "");

    return {
      text: cleanedText,
      visualizations,
    };
  } catch (error) {
    console.error("Error processing graph data:", error);
    // Return original text if graph processing fails
    return { text: rawText, visualizations: [] };
  }
};

module.exports = {
  processGraphsInResponse,
  extractGraphSpecs,
  generatePriceHistoryData,
  generateComparisonData,
  generatePortfolioData,
};
