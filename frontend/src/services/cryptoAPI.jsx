import axios from "axios";

export const fetchCryptoDetailsDatabase = async (cryptos, type) => {
  try {
    console.log("cryptoAPI: Preparing API call with params:", { cryptos, type });
    const params = {};
    if (cryptos) params.cryptos = cryptos;
    if (type) params.type = type;

    console.log("cryptoAPI: Making request to /api/crypto/cryptos-fetch-details");
    const response = await axios.get("/api/crypto/cryptos-fetch-details", {
      params,
      withCredentials: true,
    });

    console.log("cryptoAPI: Response received:", response.status, response.data?.length || 0, "items");
    return response.data;
  } catch (error) {
    console.error("cryptoAPI: Error fetching data from backend:", error);
    console.error("cryptoAPI: Error details:", error.response?.status, error.response?.data);
    throw error;
  }
};

export const fetchCryptoGraphData = async (cryptoId, selectedPeriod = "7") => {
  try {
    const response = await axios.get(`/api/crypto/${cryptoId}/graph-details`, {
      params: {
        period: selectedPeriod,
      },
    });

    return response.data;
  } catch (error) {
    console.error("Frontend error fetching graph data:", error);
    throw error;
  }
};

export const fetchCryptoIndicatorGraph = async (cryptoId) => {
  try {
    const response = await axios.get(
      `/api/crypto/${cryptoId}/indicator-graph/rsi`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
