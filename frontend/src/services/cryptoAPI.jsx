import axios from "axios";
import { demoCryptos, isDemoMode } from "../demo/demoStore";

export const fetchCryptoDetailsDatabase = async (cryptos, type) => {
  if (isDemoMode()) {
    const requested = Array.isArray(cryptos) ? cryptos : String(cryptos || "").split(",");
    const matches = demoCryptos.filter((crypto) => requested.length === 0 || requested.includes(crypto.id));
    return ["details", "cryptoDetails"].includes(type)
      ? matches[0] || demoCryptos[0]
      : matches;
  }
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
  if (isDemoMode()) {
    const days = Number(selectedPeriod) || 7;
    const base = demoCryptos.find((crypto) => crypto.id === cryptoId)?.current_price || 100;
    return Array.from({ length: Math.min(days, 30) }, (_, index) => ({
      timestamp: new Date(Date.now() - (days - index) * 86400000).toISOString(),
      price: base * (0.94 + index * 0.004 + Math.sin(index) * 0.012),
    }));
  }
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
  if (isDemoMode()) return [];
  try {
    const response = await axios.get(
      `/api/crypto/${cryptoId}/indicator-graph/rsi`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
