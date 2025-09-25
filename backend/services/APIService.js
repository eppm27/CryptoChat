// This is where the API service will go

// API sourcing (notes from meeting)
//      Researching which APIs to call
//          Yahoo Finance
//          Twitter API
//          Focus on crypto
//      All API call
//      Specific API call
//          Prompt keywords. Is this relevant to the question?
//          Check the date updated (or maybe check if data matches). Is this out of date?

const cryptoAPIs = require("../config/cryptoAPIs");

const fetchWithTimeout = (url, timeout = 5000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { signal: controller.signal })
    .then(async (res) => {
      clearTimeout(timeoutId); // clear timeout on successful response
      if (!res.ok) throw new Error(`Failed to fetch from ${url}`);
      const data = await res.json();
      if (!data) throw new Error(`No data returned from ${url}`);
      return data;
    })
    .catch((error) => {
      clearTimeout(timeoutId); // make sure to clear the timeout on error as well
      throw error; // re-throw the error so it's caught by the outer catch
    });
};

const getCryptoPairs = async (apiKey) => {
  try {
    const response = await fetchWithTimeout(
      `https://api.twelvedata.com/cryptocurrencies?apikey=${apiKey}`
    );

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error("Invalid response from cryptocurrency pairs endpoint");
    }

    const symbolMap = response.data.reduce((acc, crypto) => {
      // Only include pairs where the quote currency is "US Dollar"
      if (crypto.currency_quote === "US Dollar") {
        // Use both the full currency base name and the ticker abbreviation as keys
        const baseName = crypto.currency_base.toLowerCase();
        const baseTicker = crypto.symbol.split("/")[0].toLowerCase();

        if (!acc[baseName]) {
          acc[baseName] = crypto.symbol;
        }
        if (!acc[baseTicker]) {
          acc[baseTicker] = crypto.symbol;
        }
      }
      return acc;
    }, {});

    return symbolMap;
  } catch (error) {
    console.error("Error fetching cryptocurrency pairs:", error);
    return null;
  }
};

const fetchCryptoData = async (source = null) => {
  try {
    let fetchingSources = cryptoAPIs;

    // Filter out technicalIndicators as it's not a direct API endpoint
    fetchingSources = Object.entries(cryptoAPIs).reduce((acc, [key, value]) => {
      if (key !== "technicalIndicators" && typeof value === "string") {
        acc[key] = value;
      }
      return acc;
    }, {});

    if (source) {
      if (fetchingSources[source]) {
        fetchingSources = { [source]: fetchingSources[source] };
      } else {
        throw new Error(`Source "${source}" not approved.`);
      }
    }

    let allData = [];

    for (const [sourceName, url] of Object.entries(fetchingSources)) {
      try {
        const data = await fetchWithTimeout(url, 5000);

        // Handle different API response structures
        if (sourceName === "coingecko") {
          // For CoinGecko, handle the coins/markets endpoint response format
          // Data from this endpoint is an array of coin objects with sparkline data
          if (Array.isArray(data)) {
            // Data is already in the right format, just normalise it
            allData.push({
              source: sourceName,
              data: data.map((coin) => ({
                id: coin.id,
                name: coin.name,
                symbol: coin.symbol,
                current_price: coin.current_price,
                market_cap: coin.market_cap,
                price_change_percentage_24h: coin.price_change_percentage_24h,
                sparkline_in_7d: coin.sparkline_in_7d || { price: [] },
              })),
            });
          } else {
            // Handle old format or unexpected response
            console.warn(
              "CoinGecko data not in expected format, unable to extract sparkline data"
            );
            allData.push({
              source: sourceName,
              data: data, // Keep original data
            });
          }
        } else if (sourceName === "cryptocompare") {
          const cryptos = data;
          const technicalData = {};

          for (const crypto of Object.keys(cryptos).slice(0, 10)) {
            try {
              const indicators = await fetchTechnicalIndicators(crypto);
              technicalData[crypto] = indicators;
            } catch (error) {
              console.warn(
                `Error fetching technical indicators for ${crypto}:`,
                error
              );
              continue;
            }
          }
          allData.push({
            source: sourceName,
            data: {
              prices: data,
              technical: technicalData,
            },
          });
        } else if (sourceName === "messari") {
          allData.push({
            source: sourceName,
            data: data.data,
          });
        } else if (sourceName === "coinlore") {
          allData.push({
            source: sourceName,
            data: data.data,
          });
        }
      } catch (error) {
        console.warn(`Skipping ${sourceName}: ${error.message}`);
      }
    }

    if (allData.length === 0) {
      throw new Error("No data found from any source.");
    }

    return allData;
  } catch (error) {
    console.error("Error fetching crypto data:", error);
    throw new Error("Failed to fetch crypto data");
  }
};

const fetchTechnicalIndicators = async (symbol) => {
  try {
    const apiKey = process.env.TWELVE_DATA_API_KEY;
    const baseUrl = cryptoAPIs.technicalIndicators.base;

    // Get valid crypto pairs
    const symbolMap = await getCryptoPairs(apiKey);
    if (!symbolMap) {
      throw new Error("Unable to fetch valid cryptocurrency pairs");
    }

    // Convert the input to lowercase
    const inputSymbol = symbol.toLowerCase();
    const tradingSymbol = symbolMap[inputSymbol];

    if (!tradingSymbol) {
      throw new Error(`No valid trading symbol found for ${symbol}`);
    }

    const pair = tradingSymbol;

    // Fetch RSI
    const rsiResponse = await fetchWithTimeout(
      `${baseUrl}${cryptoAPIs.technicalIndicators.rsi}?symbol=${pair}&interval=1day&apikey=${apiKey}`
    );

    // Fetch SMA
    const smaResponse = await fetchWithTimeout(
      `${baseUrl}${cryptoAPIs.technicalIndicators.sma}?symbol=${pair}&interval=1day&time_period=20&apikey=${apiKey}`
    );

    // check for api errors
    if (rsiResponse.status === "error" || smaResponse.status === "error") {
      console.log("API Error Response:", {
        symbol: tradingSymbol,
        rsi: rsiResponse,
        sma: smaResponse,
      });
      throw new Error(rsiResponse.message || smaResponse.message);
    }

    // Validate the response structure
    if (
      !rsiResponse.values ||
      !rsiResponse.values.length ||
      !smaResponse.values ||
      !smaResponse.values.length
    ) {
      console.log("Invalid API Response Structure:", {
        symbol: tradingSymbol,
        rsi: rsiResponse,
        sma: smaResponse,
      });
      throw new Error(
        "Invalid response structure from technical indicators API"
      );
    }

    return {
      rsi: {
        value: parseFloat(rsiResponse.values[0].rsi) || null,
        period: 14,
        timestamp: new Date(),
      },
      sma: {
        value: parseFloat(smaResponse.values[0].sma) || null,
        period: 20,
        timestamp: new Date(),
      },
    };
  } catch (error) {
    console.error(`Error fetching technical indicators for ${symbol}:`, error);
    return {
      rsi: { value: null, period: 14, timestamp: new Date() },
      sma: { value: null, period: 20, timestamp: new Date() },
    };
  }
};

module.exports = { fetchCryptoData };
