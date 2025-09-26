import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI";

function CryptoExplorePage() {
  const [cryptoData, setCryptoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("CryptoExplorePage: Starting to fetch crypto data");
    const fetchData = async () => {
      try {
        setIsLoading(true);
        console.log("CryptoExplorePage: Calling fetchCryptoDetailsDatabase");
        const data = await fetchCryptoDetailsDatabase([], "default");
        console.log("CryptoExplorePage: Received data:", data);
        console.log(
          "CryptoExplorePage: Data length:",
          data ? data.length : "undefined"
        );
        setCryptoData(data || []);
      } catch (error) {
        console.error("CryptoExplorePage: Error fetching crypto data:", error);
        setCryptoData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCryptoClick = (cryptoId) => {
    navigate(`/cryptoDetails/${cryptoId}`);
  };

  console.log("CryptoExplorePage: Component is rendering");
  console.log("CryptoExplorePage: cryptoData state:", cryptoData);
  console.log("CryptoExplorePage: isLoading state:", isLoading);

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Explore Cryptos
          </h1>

          {isLoading ? (
            <div>
              <p>Loading...</p>
              <div className="mt-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
          ) : (
            <div>
              <p className="mb-4">Found {cryptoData.length} cryptocurrencies</p>
              {cryptoData.length === 0 ? (
                <p className="text-gray-500">No data available</p>
              ) : (
                <div className="space-y-2">
                  {cryptoData.slice(0, 5).map((crypto, index) => (
                    <div
                      key={crypto.id}
                      className="p-3 border rounded hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleCryptoClick(crypto.id)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={crypto.image}
                          alt={crypto.name}
                          className="w-8 h-8 rounded-full"
                        />
                        <div>
                          <p className="font-semibold">
                            {index + 1}. {crypto.name} (
                            {crypto.symbol?.toUpperCase()})
                          </p>
                          <p className="text-sm text-gray-600">
                            ${crypto.current_price?.toFixed(2)}
                            <span
                              className={
                                crypto.price_change_percentage_24h_in_currency >=
                                0
                                  ? "text-green-600 ml-2"
                                  : "text-red-600 ml-2"
                              }
                            >
                              {crypto.price_change_percentage_24h_in_currency?.toFixed(
                                2
                              )}
                              %
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cryptoData.length > 5 && (
                    <p className="text-gray-500 text-center pt-4">
                      ... and {cryptoData.length - 5} more
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CryptoExplorePage;
