import axios from "axios";

export const fetchCryptoDetailsDatabase = async (cryptos, type) => {
  try {
    const params = {};
    if (cryptos) params.cryptos = cryptos;
    if (type) params.type = type;

    const response = await axios.get("/api/crypto/cryptos-fetch-details", {
      params,
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching watchlist data details from backend:", error);
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
