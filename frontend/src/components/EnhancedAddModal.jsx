import React, { useEffect, useState, useMemo } from "react";
import { message } from "antd";
import PropTypes from "prop-types";
import "@ant-design/v5-patch-for-react-19";
import {
  addCryptoToWallet,
  addCryptoToWatchlist,
  addPromptToSaved,
} from "../services/userAPI";
import { Button, Card } from "../components/ui";
import { cn } from "../utils/cn";

const EnhancedAddModal = ({ closeModal, onSuccess, modalType }) => {
  const [cryptos, setCryptos] = useState([]);
  const [selectedCrypto, setSelectedCrypto] = useState(null);
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [savePrompt, setSavePrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [userData, setUserData] = useState();
  const [errorExist, setErrorExist] = useState(false);
  const [errorType, setErrorType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [step, setStep] = useState(1); // Multi-step form
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Filter and sort cryptos based on search
  const filteredCryptos = useMemo(() => {
    if (!searchQuery) return cryptos.slice(0, 20); // Show top 20 by default

    return cryptos
      .filter(
        (crypto) =>
          crypto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          crypto.symbol.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  }, [cryptos, searchQuery]);

  // Popular cryptocurrencies for quick selection
  const popularCryptos = useMemo(() => {
    const popular = [
      "bitcoin",
      "ethereum",
      "binancecoin",
      "cardano",
      "solana",
      "polkadot",
    ];
    return cryptos.filter((crypto) => popular.includes(crypto.id));
  }, [cryptos]);

  // Calculate portfolio impact
  const portfolioImpact = useMemo(() => {
    if (!selectedCrypto || !cryptoAmount || !purchasePrice) return null;

    const totalValue = parseFloat(cryptoAmount) * parseFloat(purchasePrice);
    const currentValue =
      parseFloat(cryptoAmount) *
      (selectedCrypto.current_price || parseFloat(purchasePrice));
    const profitLoss = currentValue - totalValue;
    const profitLossPercent =
      totalValue > 0 ? (profitLoss / totalValue) * 100 : 0;

    return {
      investmentAmount: totalValue,
      currentValue,
      profitLoss,
      profitLossPercent,
    };
  }, [selectedCrypto, cryptoAmount, purchasePrice]);

  const handleSave = async () => {
    if (modalType === "wallet") {
      if (!selectedCrypto || !cryptoAmount || !purchasePrice) {
        message.error("Please fill in all required fields.");
        return;
      }

      setLoading(true);

      if (
        !userData.wallet.find((term) => term.cryptoId === selectedCrypto.id)
      ) {
        try {
          // Enhanced data for wallet simulation
          const enhancedCrypto = {
            ...selectedCrypto,
            purchasePrice: parseFloat(purchasePrice),
            purchaseDate: new Date().toISOString(),
            quantity: parseFloat(cryptoAmount),
          };

          const msg = await addCryptoToWallet(enhancedCrypto, cryptoAmount);
          message.success("🎉 " + msg);
          onSuccess?.();
          setShowConfirmation(true);

          // Auto close after success animation
          setTimeout(() => {
            closeModal();
          }, 2000);
        } catch (error) {
          console.error("Wallet error:", error);
          message.error(error.message || "Failed to add to wallet");
        }
      } else {
        setErrorExist(true);
        setErrorType("Crypto already exists in wallet");
      }

      setLoading(false);
    } else if (modalType === "watchlist") {
      if (!selectedCrypto) {
        message.error("Please select a crypto.");
        return;
      }

      setLoading(true);

      if (
        !userData.watchlist.find((term) => term.cryptoId === selectedCrypto.id)
      ) {
        try {
          const msg = await addCryptoToWatchlist(selectedCrypto);
          message.success("⭐ " + msg);
          onSuccess?.();
          closeModal();
        } catch (error) {
          console.error("Watchlist error:", error);
          message.error(error.message || "Failed to add to watchlist");
        }
      } else {
        setErrorExist(true);
        setErrorType("Crypto already exists in watchlist");
      }

      setLoading(false);
    } else if (modalType === "savedPrompts") {
      if (!savePrompt) {
        message.error("Please enter a prompt.");
        return;
      }

      setLoading(true);

      if (
        !userData.savedPrompts.find(
          (term) => term.prompt.toLowerCase() === savePrompt.toLowerCase()
        )
      ) {
        try {
          const msg = await addPromptToSaved(savePrompt);
          message.success("💾 " + msg);
          onSuccess?.();
          closeModal();
        } catch (error) {
          console.error("Saved Prompt error:", error);
          message.error(error.message || "Failed to save prompt");
        }
      } else {
        setErrorExist(true);
        setErrorType("Prompt already exists in saved");
      }

      setLoading(false);
    }
  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await fetch("/user/user-data", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const data = await response.json();
        setUserData(data.user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };

    loadUserData();

    if (modalType === "wallet" || modalType === "watchlist") {
      setCryptoLoading(true);
      const loadCryptos = async () => {
        try {
          const res = await fetch("/api/crypto/cryptos");
          const data = await res.json();
          data.sort((a, b) => (b.market_cap || 0) - (a.market_cap || 0)); // Sort by market cap
          setCryptos(data);
        } catch (err) {
          console.error("Failed to fetch cryptos:", err);
        } finally {
          setCryptoLoading(false);
        }
      };
      loadCryptos();
    }
  }, [modalType]);

  // Success confirmation screen
  if (showConfirmation) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
        <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl text-center">
          <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-success-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-neutral-900 mb-2">
            Successfully Added!
          </h3>
          <p className="text-neutral-600 mb-4">
            {cryptoAmount} {selectedCrypto?.symbol?.toUpperCase()} has been
            added to your wallet
          </p>
          <div className="bg-primary-50 rounded-xl p-4">
            <p className="text-sm text-primary-700">
              Investment Value:{" "}
              <span className="font-semibold">
                ${portfolioImpact?.investmentAmount?.toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 pb-4 border-b border-neutral-100">
          <button
            onClick={closeModal}
            className="absolute right-4 top-4 p-2 hover:bg-neutral-100 rounded-full transition-colors"
            disabled={loading}
          >
            <svg
              className="w-5 h-5 text-neutral-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg
                className="w-6 h-6 text-primary-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-neutral-900">
              {modalType === "wallet"
                ? "Add Crypto to Wallet"
                : modalType === "watchlist"
                ? "Add to Watchlist"
                : "Save Prompt"}
            </h2>
            <p className="text-neutral-600 mt-1">
              {modalType === "wallet"
                ? "Simulate your crypto investments"
                : modalType === "watchlist"
                ? "Track your favorite cryptocurrencies"
                : "Save your favorite prompts"}
            </p>
          </div>

          {modalType === "wallet" && (
            <div className="flex justify-center mt-4">
              <div className="flex items-center space-x-4">
                <div
                  className={cn(
                    "flex items-center space-x-2",
                    step >= 1 ? "text-primary-600" : "text-neutral-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                      step >= 1
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-200 text-neutral-600"
                    )}
                  >
                    1
                  </div>
                  <span className="text-sm font-medium">Select Crypto</span>
                </div>
                <div
                  className={cn(
                    "w-8 h-0.5",
                    step >= 2 ? "bg-primary-600" : "bg-neutral-200"
                  )}
                />
                <div
                  className={cn(
                    "flex items-center space-x-2",
                    step >= 2 ? "text-primary-600" : "text-neutral-400"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
                      step >= 2
                        ? "bg-primary-600 text-white"
                        : "bg-neutral-200 text-neutral-600"
                    )}
                  >
                    2
                  </div>
                  <span className="text-sm font-medium">Set Amount</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {(modalType === "wallet" || modalType === "watchlist") && (
            <>
              {/* Step 1: Crypto Selection */}
              {(modalType !== "wallet" || step === 1) && (
                <div className="space-y-6">
                  {/* Search */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      Search Cryptocurrency
                    </label>
                    <div className="relative">
                      <svg
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                      <input
                        type="text"
                        className="w-full pl-10 pr-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="Search Bitcoin, Ethereum, etc..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        disabled={loading || cryptoLoading}
                      />
                    </div>
                  </div>

                  {/* Popular Cryptos */}
                  {!searchQuery && popularCryptos.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-3">
                        🔥 Popular Cryptocurrencies
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {popularCryptos.slice(0, 6).map((crypto) => (
                          <button
                            key={crypto.id}
                            onClick={() => {
                              setSelectedCrypto(crypto);
                              if (modalType === "wallet") setStep(2);
                              setErrorExist(false);
                              setErrorType(null);
                            }}
                            disabled={loading}
                            className={cn(
                              "p-3 rounded-xl border-2 transition-all hover:shadow-md text-left",
                              selectedCrypto?.id === crypto.id
                                ? "border-primary-500 bg-primary-50"
                                : "border-neutral-200 hover:border-primary-300"
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={crypto.image}
                                alt={crypto.name}
                                className="w-8 h-8 rounded-full"
                                onError={(e) => {
                                  e.target.src = "/default-crypto-icon.png";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-neutral-900 truncate">
                                  {crypto.name}
                                </p>
                                <p className="text-sm text-neutral-500 uppercase">
                                  {crypto.symbol}
                                </p>
                              </div>
                              {crypto.current_price && (
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-neutral-900">
                                    $
                                    {crypto.current_price.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits:
                                          crypto.current_price < 1 ? 6 : 2,
                                      }
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Crypto List */}
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 mb-3">
                      {searchQuery
                        ? `Search Results (${filteredCryptos.length})`
                        : "All Cryptocurrencies"}
                    </label>

                    {cryptoLoading ? (
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="animate-pulse p-4 border border-neutral-200 rounded-xl"
                          >
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
                              <div className="flex-1">
                                <div className="h-4 bg-neutral-200 rounded w-24"></div>
                                <div className="h-3 bg-neutral-200 rounded w-16 mt-1"></div>
                              </div>
                              <div className="h-4 bg-neutral-200 rounded w-20"></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-2 border border-neutral-200 rounded-xl">
                        {filteredCryptos.map((crypto) => (
                          <button
                            key={crypto.id}
                            onClick={() => {
                              setSelectedCrypto(crypto);
                              if (modalType === "wallet") setStep(2);
                              setErrorExist(false);
                              setErrorType(null);
                            }}
                            disabled={loading}
                            className={cn(
                              "w-full p-4 hover:bg-neutral-50 transition-colors text-left",
                              selectedCrypto?.id === crypto.id
                                ? "bg-primary-50"
                                : ""
                            )}
                          >
                            <div className="flex items-center space-x-3">
                              <img
                                src={crypto.image}
                                alt={crypto.name}
                                className="w-10 h-10 rounded-full"
                                onError={(e) => {
                                  e.target.src = "/default-crypto-icon.png";
                                }}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-neutral-900 truncate">
                                  {crypto.name}
                                </p>
                                <p className="text-sm text-neutral-500 uppercase">
                                  {crypto.symbol}
                                </p>
                              </div>
                              <div className="text-right">
                                {crypto.current_price && (
                                  <p className="text-sm font-semibold text-neutral-900 mb-1">
                                    $
                                    {crypto.current_price.toLocaleString(
                                      undefined,
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits:
                                          crypto.current_price < 1 ? 6 : 2,
                                      }
                                    )}
                                  </p>
                                )}
                                {crypto.price_change_percentage_24h && (
                                  <p
                                    className={cn(
                                      "text-xs font-medium",
                                      crypto.price_change_percentage_24h > 0
                                        ? "text-success-600"
                                        : "text-danger-600"
                                    )}
                                  >
                                    {crypto.price_change_percentage_24h > 0
                                      ? "+"
                                      : ""}
                                    {crypto.price_change_percentage_24h.toFixed(
                                      2
                                    )}
                                    %
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {errorExist && (
                    <div className="p-4 bg-danger-50 border border-danger-200 rounded-xl">
                      <p className="text-danger-700">
                        <span className="font-semibold">
                          {selectedCrypto?.name}
                        </span>{" "}
                        is already in your{" "}
                        {errorType === "Crypto already exists in wallet"
                          ? "wallet"
                          : "watchlist"}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Step 2: Amount Input (Wallet only) */}
              {modalType === "wallet" && step === 2 && selectedCrypto && (
                <div className="space-y-6">
                  {/* Selected Crypto Display */}
                  <Card className="p-4 bg-primary-50 border-primary-200">
                    <div className="flex items-center space-x-3">
                      <img
                        src={selectedCrypto.image}
                        alt={selectedCrypto.name}
                        className="w-12 h-12 rounded-full"
                        onError={(e) => {
                          e.target.src = "/default-crypto-icon.png";
                        }}
                      />
                      <div className="flex-1">
                        <h3 className="font-semibold text-neutral-900">
                          {selectedCrypto.name}
                        </h3>
                        <p className="text-sm text-neutral-600 uppercase">
                          {selectedCrypto.symbol}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-neutral-900">
                          $
                          {selectedCrypto.current_price?.toLocaleString(
                            undefined,
                            {
                              minimumFractionDigits: 2,
                              maximumFractionDigits:
                                selectedCrypto.current_price < 1 ? 6 : 2,
                            }
                          )}
                        </p>
                        {selectedCrypto.price_change_percentage_24h && (
                          <p
                            className={cn(
                              "text-sm font-medium",
                              selectedCrypto.price_change_percentage_24h > 0
                                ? "text-success-600"
                                : "text-danger-600"
                            )}
                          >
                            {selectedCrypto.price_change_percentage_24h > 0
                              ? "+"
                              : ""}
                            {selectedCrypto.price_change_percentage_24h.toFixed(
                              2
                            )}
                            %
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>

                  {/* Amount Input */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        step="0.00000001"
                        min="0"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder="0.00"
                        value={cryptoAmount}
                        onChange={(e) => setCryptoAmount(e.target.value)}
                        disabled={loading}
                      />
                      <p className="text-xs text-neutral-500 mt-1">
                        Amount of {selectedCrypto.symbol.toUpperCase()} to add
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 mb-2">
                        Purchase Price (USD)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        placeholder={
                          selectedCrypto.current_price?.toFixed(2) || "0.00"
                        }
                        value={purchasePrice}
                        onChange={(e) => setPurchasePrice(e.target.value)}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setPurchasePrice(
                            selectedCrypto.current_price?.toString() || ""
                          )
                        }
                        className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                      >
                        Use current price
                      </button>
                    </div>
                  </div>

                  {/* Portfolio Impact Preview */}
                  {portfolioImpact && (
                    <Card className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 border-primary-200">
                      <h4 className="font-semibold text-neutral-900 mb-3 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2 text-primary-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                          />
                        </svg>
                        Investment Preview
                      </h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-neutral-600">
                            Total Investment
                          </p>
                          <p className="text-lg font-semibold text-neutral-900">
                            ${portfolioImpact.investmentAmount.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-600">
                            Current Value
                          </p>
                          <p className="text-lg font-semibold text-neutral-900">
                            ${portfolioImpact.currentValue.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-600">
                            Unrealized P&L
                          </p>
                          <p
                            className={cn(
                              "text-lg font-semibold",
                              portfolioImpact.profitLoss > 0
                                ? "text-success-600"
                                : portfolioImpact.profitLoss < 0
                                ? "text-danger-600"
                                : "text-neutral-600"
                            )}
                          >
                            {portfolioImpact.profitLoss > 0 ? "+" : ""}$
                            {portfolioImpact.profitLoss.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-neutral-600">Return %</p>
                          <p
                            className={cn(
                              "text-lg font-semibold",
                              portfolioImpact.profitLossPercent > 0
                                ? "text-success-600"
                                : portfolioImpact.profitLossPercent < 0
                                ? "text-danger-600"
                                : "text-neutral-600"
                            )}
                          >
                            {portfolioImpact.profitLossPercent > 0 ? "+" : ""}
                            {portfolioImpact.profitLossPercent.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>
              )}
            </>
          )}

          {/* Saved Prompts */}
          {modalType === "savedPrompts" && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-neutral-700 mb-2">
                  Prompt Text
                </label>
                <textarea
                  className="w-full px-4 py-3 border border-neutral-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all resize-none"
                  rows="4"
                  placeholder="Enter your prompt here..."
                  value={savePrompt}
                  onChange={(e) => {
                    setSavePrompt(e.target.value);
                    const promptExists = userData?.savedPrompts?.some(
                      (term) =>
                        term.prompt?.toLowerCase() ===
                        e.target.value.toLowerCase()
                    );
                    if (!promptExists) {
                      setErrorExist(false);
                      setErrorType(null);
                    }
                  }}
                  disabled={loading}
                />

                {errorExist &&
                  errorType === "Prompt already exists in saved" && (
                    <div className="mt-2 p-3 bg-danger-50 border border-danger-200 rounded-lg">
                      <p className="text-danger-700 text-sm">
                        This prompt already exists in your saved prompts
                      </p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0">
          <div className="flex gap-3">
            {modalType === "wallet" && step === 2 && (
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="flex-1"
              >
                ← Back
              </Button>
            )}
            <Button
              variant="ghost"
              onClick={closeModal}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={
                modalType === "wallet" && step === 1 && selectedCrypto
                  ? () => setStep(2)
                  : handleSave
              }
              disabled={
                loading ||
                (modalType === "wallet" && step === 1
                  ? !selectedCrypto
                  : modalType === "wallet" && step === 2
                  ? !selectedCrypto || !cryptoAmount || !purchasePrice
                  : modalType === "watchlist"
                  ? !selectedCrypto
                  : modalType === "savedPrompts"
                  ? !savePrompt.trim()
                  : false)
              }
              loading={loading}
              className="flex-1"
            >
              {modalType === "wallet" && step === 1 && selectedCrypto
                ? "Next →"
                : loading
                ? "Processing..."
                : modalType === "wallet"
                ? "Add to Wallet"
                : modalType === "watchlist"
                ? "Add to Watchlist"
                : "Save Prompt"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAddModal;

EnhancedAddModal.propTypes = {
  closeModal: PropTypes.func.isRequired,
  onSuccess: PropTypes.func,
  modalType: PropTypes.oneOf(["wallet", "watchlist", "savedPrompts"])
    .isRequired,
};
