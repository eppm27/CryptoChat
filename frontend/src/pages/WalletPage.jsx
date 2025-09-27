import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchUserData } from "../services/userAPI.jsx";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI.jsx";
import { Card, Button, Skeleton, PriceChange, Badge } from "../components/ui";
import { cn } from "../utils/cn";
import AddModal from "../components/AddModal.jsx";

const WalletPage = () => {
  const navigate = useNavigate();
  const [walletData, setWalletData] = useState([]);
  const [_userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);
  const [totalChange24h, setTotalChange24h] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.title = "My Wallet - CryptoChat";

    const loadUserData = async () => {
      // Set a timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        setIsLoading(false);
        setError("Request timed out. Please try again.");
      }, 15000); // 15 seconds timeout

      try {
        const user = await fetchUserData();
        setUserData(user);

        if (user.wallet && user.wallet.length > 0) {
          // Get current market data for all cryptos in wallet
          const cryptoIds = user.wallet.map((item) => item.cryptoId);
          const marketData = await fetchCryptoDetailsDatabase(
            cryptoIds,
            "watchlist"
          );

          // Merge wallet data with current market data
          const enrichedWalletData = user.wallet.map((walletItem) => {
            const marketInfo = marketData.find(
              (crypto) => crypto.id === walletItem.cryptoId
            );

            return {
              ...walletItem,
              // Map the correct field names
              coin: walletItem.cryptoName,
              symbol: walletItem.cryptoSymbol,
              quantity: walletItem.amount,
              imageUrl: marketInfo?.image,
              currentPrice: marketInfo?.current_price || 0,
              change24h: marketInfo?.price_change_percentage_24h || 0,
              purchasePrice:
                walletItem.purchasePrice || marketInfo?.current_price || 0,
            };
          });

          setWalletData(enrichedWalletData);

          // Calculate total portfolio value and change
          const total = enrichedWalletData.reduce((sum, item) => {
            return (
              sum +
              parseFloat(item.currentPrice || 0) *
                parseFloat(item.quantity || 0)
            );
          }, 0);

          const totalChange = enrichedWalletData.reduce((sum, item) => {
            const itemValue =
              parseFloat(item.currentPrice || 0) *
              parseFloat(item.quantity || 0);
            const change = parseFloat(item.change24h || 0);
            return sum + (itemValue * change) / 100;
          }, 0);

          setTotalValue(total);
          setTotalChange24h(totalChange);
        } else {
          setWalletData([]);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (err.message.includes("Unauthorized")) {
          // Redirect to login if not authenticated
          navigate("/");
          return;
        }
        setError(err.message || "Failed to load wallet data");
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [navigate]);

  const handleAddSuccess = () => {
    // Reload user data to refresh wallet using the same logic as initial load
    const reloadWalletData = async () => {
      try {
        const user = await fetchUserData();
        setUserData(user);

        if (user.wallet && user.wallet.length > 0) {
          // Get current market data for all cryptos in wallet
          const cryptoIds = user.wallet.map((item) => item.cryptoId);
          const marketData = await fetchCryptoDetailsDatabase(
            cryptoIds,
            "watchlist"
          );

          // Merge wallet data with current market data
          const enrichedWalletData = user.wallet.map((walletItem) => {
            const marketInfo = marketData.find(
              (crypto) => crypto.id === walletItem.cryptoId
            );

            return {
              ...walletItem,
              // Map the correct field names
              coin: walletItem.cryptoName,
              symbol: walletItem.cryptoSymbol,
              quantity: walletItem.amount,
              imageUrl: marketInfo?.image,
              currentPrice: marketInfo?.current_price || 0,
              change24h: marketInfo?.price_change_percentage_24h || 0,
              purchasePrice:
                walletItem.purchasePrice || marketInfo?.current_price || 0,
            };
          });

          setWalletData(enrichedWalletData);

          // Calculate total portfolio value and change
          const total = enrichedWalletData.reduce((sum, item) => {
            return (
              sum +
              parseFloat(item.currentPrice || 0) *
                parseFloat(item.quantity || 0)
            );
          }, 0);

          const totalChange = enrichedWalletData.reduce((sum, item) => {
            const itemValue =
              parseFloat(item.currentPrice || 0) *
              parseFloat(item.quantity || 0);
            const change = parseFloat(item.change24h || 0);
            return sum + (itemValue * change) / 100;
          }, 0);

          setTotalValue(total);
          setTotalChange24h(totalChange);
        } else {
          setWalletData([]);
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        if (err.message.includes("Unauthorized")) {
          navigate("/");
          return;
        }
      }
    };
    reloadWalletData();
  };

  const WalletItem = ({ item }) => {
    // Safely parse numeric values with fallbacks
    const currentPrice = parseFloat(item.currentPrice) || 0;
    const purchasePrice =
      parseFloat(item.purchasePrice || item.currentPrice) || currentPrice || 0;
    const quantity = parseFloat(item.quantity || item.amount) || 0;

    const currentValue = currentPrice * quantity;
    const purchaseValue = purchasePrice * quantity;
    const totalProfitLoss = currentValue - purchaseValue;
    const profitLossPercent =
      purchaseValue > 0 ? (totalProfitLoss / purchaseValue) * 100 : 0;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm">
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              <img
                src={item.imageUrl || "/default-crypto-icon.png"}
                alt={item.coin}
                className="h-12 w-12 rounded-full"
                onError={(e) => {
                  e.target.src = "/default-crypto-icon.png";
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-lg text-neutral-900 truncate">
                {item.coin || item.cryptoName || "Unknown Crypto"}
              </h3>
              <p className="text-sm text-neutral-500 uppercase">
                {item.symbol || item.cryptoSymbol || "N/A"}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-neutral-500">Holdings</p>
              <p className="font-semibold text-neutral-900">
                {quantity.toLocaleString()} {item.symbol || item.cryptoSymbol}
              </p>
              {purchasePrice !== currentPrice && (
                <p className="text-xs text-neutral-500 mt-1">
                  Avg. Cost: ${purchasePrice.toFixed(2)}
                </p>
              )}
            </div>
          </div>

          {/* Price Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-neutral-500 mb-1">Current Price</p>
              <p className="font-semibold text-neutral-900">
                $
                {currentPrice.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: currentPrice < 1 ? 6 : 2,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500 mb-1">Current Value</p>
              <p className="font-bold text-lg text-neutral-900">
                $
                {currentValue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
          </div>

          {/* Performance */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-xs text-neutral-500 mb-1">24h Change</p>
                <PriceChange value={item.change24h || 0} size="sm" />
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500 mb-1">Total P&L</p>
                <p
                  className={cn(
                    "text-sm font-semibold",
                    totalProfitLoss > 0
                      ? "text-success-600"
                      : totalProfitLoss < 0
                      ? "text-danger-600"
                      : "text-neutral-600"
                  )}
                >
                  {totalProfitLoss > 0 ? "+" : ""}$
                  {Math.abs(totalProfitLoss).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
                <p
                  className={cn(
                    "text-xs",
                    profitLossPercent > 0
                      ? "text-success-600"
                      : profitLossPercent < 0
                      ? "text-danger-600"
                      : "text-neutral-600"
                  )}
                >
                  ({profitLossPercent > 0 ? "+" : ""}
                  {profitLossPercent.toFixed(2)}%)
                </p>
              </div>
            </div>

            <Button variant="outline" size="sm" className="text-xs">
              Trade
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
        <div className="max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64 mb-6" />

            {/* Portfolio Overview Skeleton */}
            <Card className="p-6 mb-6">
              <Skeleton className="h-6 w-32 mb-4" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            </Card>
          </div>

          {/* Holdings Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-24 mb-1" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16 mb-1" />
                    <Skeleton className="h-5 w-20" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900">
                My Crypto Wallet
              </h1>
              <p className="text-neutral-600">
                Track and manage your cryptocurrency portfolio
              </p>
            </div>
            {walletData.length > 0 && (
              <Button
                onClick={() => setShowAddModal(true)}
                className="hidden md:flex"
              >
                Add Crypto
              </Button>
            )}
          </div>

          {/* Portfolio Overview */}
          {walletData.length > 0 && (
            <Card className="p-6 mb-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white">
              <h2 className="text-lg font-semibold mb-4">Portfolio Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-primary-100 text-sm mb-1">Total Value</p>
                  <p className="text-2xl font-bold">
                    $
                    {totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-primary-100 text-sm mb-1">24h Change</p>
                  <p
                    className={cn(
                      "text-lg font-semibold",
                      totalChange24h > 0
                        ? "text-success-200"
                        : totalChange24h < 0
                        ? "text-danger-200"
                        : "text-white"
                    )}
                  >
                    {totalChange24h > 0 ? "+" : ""}$
                    {Math.abs(totalChange24h).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-primary-100 text-sm mb-1">Holdings</p>
                  <p className="text-lg font-semibold">
                    {walletData.length} Crypto{walletData.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Card className="mb-6 p-4 bg-danger-50 border-danger-200">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 text-danger-600">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-danger-900">
                  Error Loading Wallet
                </h3>
                <p className="text-sm text-danger-700">{error}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null);
                  window.location.reload();
                }}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          </Card>
        )}

        {/* Holdings */}
        {walletData.length === 0 ? (
          <Card className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-neutral-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-neutral-900 mb-2">
              Your wallet is empty
            </h3>
            <p className="text-neutral-600 mb-6">
              Start building your crypto portfolio by adding your first
              cryptocurrency
            </p>
            <Button onClick={() => setShowAddModal(true)} size="lg">
              Add Your First Crypto
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-neutral-900">
                Your Holdings
              </h2>
            </div>

            {walletData.map((item, index) => (
              <WalletItem key={`${item.coin}-${index}`} item={item} />
            ))}

            {/* Mobile Add Button */}
            <div className="md:hidden pt-4">
              <Button
                onClick={() => setShowAddModal(true)}
                className="w-full"
                size="lg"
              >
                Add Crypto
              </Button>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        {walletData.length > 0 && (
          <Card className="mt-6 p-4">
            <h3 className="font-semibold text-neutral-900 mb-3">Quick Stats</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-sm text-neutral-500 mb-1">Best Performer</p>
                <p className="font-semibold text-success-600">
                  {walletData.length > 0
                    ? walletData
                        .reduce((best, current) =>
                          parseFloat(current.change24h || 0) >
                          parseFloat(best.change24h || 0)
                            ? current
                            : best
                        )
                        .symbol?.toUpperCase() || "N/A"
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Worst Performer</p>
                <p className="font-semibold text-danger-600">
                  {walletData.length > 0
                    ? walletData
                        .reduce((worst, current) =>
                          parseFloat(current.change24h || 0) <
                          parseFloat(worst.change24h || 0)
                            ? current
                            : worst
                        )
                        .symbol?.toUpperCase() || "N/A"
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Largest Holding</p>
                <p className="font-semibold text-neutral-900">
                  {walletData.length > 0
                    ? walletData
                        .reduce((largest, current) => {
                          const currentValue =
                            parseFloat(current.currentPrice || 0) *
                            parseFloat(current.quantity || 0);
                          const largestValue =
                            parseFloat(largest.currentPrice || 0) *
                            parseFloat(largest.quantity || 0);
                          return currentValue > largestValue
                            ? current
                            : largest;
                        })
                        .symbol?.toUpperCase() || "N/A"
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-neutral-500 mb-1">Avg. Change</p>
                <PriceChange
                  value={(
                    walletData.reduce(
                      (sum, item) => sum + parseFloat(item.change24h),
                      0
                    ) / walletData.length
                  ).toFixed(2)}
                  size="sm"
                />
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Add Crypto Modal */}
      {showAddModal && (
        <AddModal
          closeModal={() => setShowAddModal(false)}
          onSuccess={handleAddSuccess}
          modalType="wallet"
        />
      )}
    </div>
  );
};

export default WalletPage;
