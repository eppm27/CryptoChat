// Import CoinGecko API service for rich data
const {
  fetchCryptoGraphData,
  fetchCryptoCandleData,
} = require("./frontendCryptoService");

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

// Enhanced function to fetch rich price history data from CoinGecko API
const generatePriceHistoryData = async (cryptoId, timeframe = "7") => {
  try {
    console.log(
      `Fetching price history for ${cryptoId} with timeframe ${timeframe}`
    );

    // Map timeframe to API days parameter
    const daysMap = {
      "1d": "1",
      "7d": "7",
      "30d": "30",
      "90d": "90",
      "365d": "365",
      1: "1",
      7: "7",
      30: "30",
      90: "90",
      365: "365",
    };

    const days = daysMap[timeframe] || "7";
    const data = await fetchCryptoGraphData(cryptoId, days);

    if (!data || !data.priceData) {
      console.warn(`No price data available for ${cryptoId}`);
      return null;
    }

    // Convert CoinGecko format [timestamp, price] to our format
    return data.priceData.map(([timestamp, price]) => ({
      time: new Date(timestamp).toISOString(),
      price: price,
    }));
  } catch (error) {
    console.error(`Error fetching price history for ${cryptoId}:`, error);
    return null;
  }
};

// Fallback function for database data (kept for compatibility)

// Enhanced comparison function using CoinGecko API
const generateComparisonData = async (
  cryptoIds,
  metric = "price",
  timeframe = "7"
) => {
  try {
    console.log(
      `Generating comparison data for ${cryptoIds.join(
        ", "
      )} - metric: ${metric}`
    );

    const comparisonData = [];

    // Fetch data for each cryptocurrency
    for (const cryptoId of cryptoIds) {
      try {
        const data = await fetchCryptoGraphData(cryptoId, timeframe);
        if (data) {
          let value;
          switch (metric) {
            case "price":
              // Get latest price
              value =
                data.priceData && data.priceData.length > 0
                  ? data.priceData[data.priceData.length - 1][1]
                  : 0;
              break;
            case "market_cap":
              // Get latest market cap
              value =
                data.marketCapData && data.marketCapData.length > 0
                  ? data.marketCapData[data.marketCapData.length - 1][1]
                  : 0;
              break;
            default:
              value =
                data.priceData && data.priceData.length > 0
                  ? data.priceData[data.priceData.length - 1][1]
                  : 0;
          }

          comparisonData.push({
            id: cryptoId,
            name: cryptoId.charAt(0).toUpperCase() + cryptoId.slice(1),
            value: value,
          });
        }
      } catch (error) {
        console.warn(`Failed to fetch data for ${cryptoId}:`, error.message);
      }
    }

    if (!comparisonData.length) return null;

    return {
      labels: comparisonData.map((item) => item.name),
      datasets: [
        {
          label: metric.charAt(0).toUpperCase() + metric.slice(1),
          data: comparisonData.map((item) => item.value),
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
  } catch (error) {
    console.error("Error generating comparison data:", error);
    return null;
  }
};

// Enhanced function to generate volume data
const generateVolumeData = async (cryptoId, timeframe = "7") => {
  try {
    console.log(
      `Fetching volume data for ${cryptoId} with timeframe ${timeframe}`
    );

    const daysMap = {
      "1d": "1",
      "7d": "7",
      "30d": "30",
      "90d": "90",
      "365d": "365",
      1: "1",
      7: "7",
      30: "30",
      90: "90",
      365: "365",
    };

    const days = daysMap[timeframe] || "7";

    // Get both price and market cap data (volume might be in market_caps)
    const data = await fetchCryptoGraphData(cryptoId, days);

    if (!data || !data.priceData) {
      console.warn(`No volume data available for ${cryptoId}`);
      return null;
    }

    // Convert to volume format (using price data as volume proxy for now)
    return data.priceData.map(([timestamp, value]) => ({
      time: new Date(timestamp).toISOString(),
      volume: value, // This would be actual volume data if available
    }));
  } catch (error) {
    console.error(`Error fetching volume data for ${cryptoId}:`, error);
    return null;
  }
};

// Enhanced function to generate OHLC candlestick data
const generateCandlestickData = async (cryptoId, timeframe = "7") => {
  try {
    console.log(
      `Fetching candlestick data for ${cryptoId} with timeframe ${timeframe}`
    );

    const daysMap = {
      "1d": "1",
      "7d": "7",
      "30d": "30",
      "90d": "90",
      "365d": "365",
      1: "1",
      7: "7",
      30: "30",
      90: "90",
      365: "365",
    };

    const days = daysMap[timeframe] || "7";
    const data = await fetchCryptoCandleData(cryptoId, days);

    if (!data || !data.ohlcData) {
      console.warn(`No OHLC data available for ${cryptoId}`);
      return null;
    }

    // Convert CoinGecko OHLC format to our format
    return data.ohlcData.map(([timestamp, open, high, low, close]) => ({
      time: new Date(timestamp).toISOString(),
      open: open,
      high: high,
      low: low,
      close: close,
    }));
  } catch (error) {
    console.error(`Error fetching candlestick data for ${cryptoId}:`, error);
    return null;
  }
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

const processGraphsInResponse = async (llmResponse) => {
  console.log("🔍 GraphService: Processing LLM response");
  console.log("- LLM Response type:", typeof llmResponse);
  console.log("- LLM Response visualizations:", llmResponse?.visualizations?.length || 0);
  
  // Support both raw string and { text, visualizations } object
  const rawText =
    typeof llmResponse === "string" ? llmResponse : llmResponse.text || "";
  const graphSpecs =
    Array.isArray(llmResponse.visualizations) &&
    llmResponse.visualizations.length > 0
      ? llmResponse.visualizations
      : extractGraphSpecs(rawText);

  console.log("- Graph specs found:", graphSpecs?.length || 0);
  if (graphSpecs?.length > 0) {
    console.log("- First graph spec:", JSON.stringify(graphSpecs[0], null, 2));
  }

  if (!graphSpecs || !graphSpecs.length) {
    // No graphs requested, just return the raw text without graph data
    console.log("❌ No graph specs found, returning empty visualizations");
    return { text: rawText, visualizations: [] };
  }

  try {
    // Process each graph specification using CoinGecko API
    const visualizations = [];

    for (const spec of graphSpecs) {
      const { type, title, dataPoints: datapoints } = spec;
      let graphData;

      switch (type) {
        case "line":
          // For line charts, handle multiple formats
          if (datapoints && datapoints.length) {
            if (
              typeof datapoints[0] === "string" &&
              datapoints[0].includes("_")
            ) {
              // Format 1: Parse "cryptoId_metric_timeframe" format
              const [cryptoId, metric, timeframe] = datapoints[0].split("_");
              console.log(`Processing ${cryptoId} ${metric} for ${timeframe}`);

              if (metric === "price") {
                graphData = await generatePriceHistoryData(cryptoId, timeframe);
              } else if (metric === "volume") {
                graphData = await generateVolumeData(cryptoId, timeframe);
              }

              console.log(
                "Generated price history data:",
                graphData ? `${graphData.length} points` : "null"
              );
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
              graphData = await generatePriceHistoryData("bitcoin", "7");
            }
          }
          break;

        case "candlestick":
          // For candlestick charts, use OHLC data
          if (datapoints && datapoints.length) {
            if (
              typeof datapoints[0] === "string" &&
              datapoints[0].includes("_")
            ) {
              const [cryptoId, , timeframe] = datapoints[0].split("_");
              console.log(
                `Processing candlestick data for ${cryptoId} - ${timeframe}`
              );
              graphData = await generateCandlestickData(cryptoId, timeframe);
            } else if (title && title.toLowerCase().includes("bitcoin")) {
              graphData = await generateCandlestickData("bitcoin", "7");
            }
          }
          break;

        case "bar":
          // For bar charts, comparison between multiple cryptos
          if (datapoints && datapoints.length) {
            const metric = datapoints[0].split("_")[1] || "price";
            const timeframe = datapoints[0].split("_")[2] || "7";
            graphData = await generateComparisonData(
              datapoints.map((d) => d.split("_")[0]),
              metric,
              timeframe
            );
          }
          break;

        case "pie":
          // For pie charts, portfolio distribution
          if (datapoints && datapoints.includes("portfolio")) {
            // For portfolio data, we still need some database fallback
            // But let's enhance it later - for now, skip portfolio charts
            console.log("Portfolio charts not yet enhanced with API data");
            graphData = null;
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
  generateVolumeData,
  generateCandlestickData,
};
