import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import CreateQuickStartPrompts from "../components/QuickStartPrompts.jsx";
import { fetchUserData } from "../services/userAPI.jsx";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI.jsx";
import NewsPreview from "../components/NewsPreview";
import { Button, Card, Skeleton, PriceChange } from "../components/ui";
import { cn } from "../utils/cn";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(true);
  const [watchlistPreview, setWatchlistPreview] = useState([]);
  const [walletPreview, setWalletPreview] = useState([]);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalChangeUsd: 0,
    totalChangePercent: 0,
    holdingsCount: 0,
  });

  useEffect(() => {
    document.title = "Dashboard - CryptoChat";
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const user = await fetchUserData();
        setUserData(user);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError(err.message);
        // If authentication fails, redirect to login
        if (
          err.message.includes("Failed to fetch user data") ||
          err.message.includes("Unauthorized")
        ) {
          navigate("/");
          return;
        }
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [navigate]);

  const quickStartPrompts = useMemo(() => <CreateQuickStartPrompts />, []);

  useEffect(() => {
    const loadPortfolioData = async () => {
      if (!userData) {
        setWatchlistPreview([]);
        setWalletPreview([]);
        setPortfolioStats({
          totalValue: 0,
          totalChangeUsd: 0,
          totalChangePercent: 0,
          holdingsCount: 0,
        });
        setIsPortfolioLoading(false);
        return;
      }

      const watchlistIds = (userData.watchlist || [])
        .map((item) => item.cryptoId)
        .filter(Boolean);
      const walletIds = (userData.wallet || [])
        .map((item) => item.cryptoId)
        .filter(Boolean);

      if (watchlistIds.length === 0 && walletIds.length === 0) {
        setWatchlistPreview([]);
        setWalletPreview([]);
        setPortfolioStats({
          totalValue: 0,
          totalChangeUsd: 0,
          totalChangePercent: 0,
          holdingsCount: 0,
        });
        setIsPortfolioLoading(false);
        return;
      }

      try {
        setIsPortfolioLoading(true);
        const uniqueIds = Array.from(new Set([...watchlistIds, ...walletIds]));
        const marketData = uniqueIds.length
          ? await fetchCryptoDetailsDatabase(uniqueIds, "watchlist")
          : [];

        const marketMap = new Map();
        if (Array.isArray(marketData)) {
          marketData.forEach((crypto) => {
            if (crypto?.id) {
              marketMap.set(crypto.id, crypto);
            }
          });
        }

        const uniqueWatchlistEntries = [];
        const seenWatchlistIds = new Set();
        (userData.watchlist || []).forEach((entry) => {
          if (!entry?.cryptoId || seenWatchlistIds.has(entry.cryptoId)) return;
          seenWatchlistIds.add(entry.cryptoId);
          uniqueWatchlistEntries.push(entry);
        });

        const mappedWatchlist = uniqueWatchlistEntries
          .map((entry) => {
            const marketInfo = marketMap.get(entry.cryptoId);
            if (!marketInfo) return null;

            return {
              id: entry.cryptoId,
              name: entry.cryptoName,
              symbol: entry.cryptoSymbol,
              price: marketInfo.current_price,
              change24h: marketInfo.price_change_percentage_24h,
              marketCap: marketInfo.market_cap,
              image: marketInfo.image,
            };
          })
          .filter(Boolean)
          .sort((a, b) => (b.marketCap || 0) - (a.marketCap || 0));

        const uniqueWalletEntries = [];
        const seenWalletIds = new Set();
        (userData.wallet || []).forEach((entry) => {
          if (!entry?.cryptoId || seenWalletIds.has(entry.cryptoId)) return;
          seenWalletIds.add(entry.cryptoId);
          uniqueWalletEntries.push(entry);
        });

        const mappedWallet = uniqueWalletEntries
          .map((entry) => {
            const marketInfo = marketMap.get(entry.cryptoId);
            if (!marketInfo) return null;

            const quantity = parseFloat(entry.amount ?? entry.quantity ?? 0) || 0;
            const currentPrice = parseFloat(marketInfo.current_price) || 0;
            const currentValue = quantity * currentPrice;
            const change24h = parseFloat(marketInfo.price_change_percentage_24h) || 0;
            const purchasePrice = parseFloat(entry.purchasePrice) || currentPrice;

            return {
              id: entry.cryptoId,
              name: entry.cryptoName,
              symbol: entry.cryptoSymbol,
              quantity,
              currentPrice,
              currentValue,
              change24h,
              purchasePrice,
              image: marketInfo.image,
            };
          })
          .filter(Boolean)
          .sort((a, b) => b.currentValue - a.currentValue);

        const totalValue = mappedWallet.reduce(
          (sum, item) => sum + item.currentValue,
          0
        );
        const totalChangeUsd = mappedWallet.reduce((sum, item) => {
          const change = Number.isFinite(item.change24h) ? item.change24h : 0;
          return sum + (item.currentValue * change) / 100;
        }, 0);
        const totalChangePercent = totalValue
          ? (totalChangeUsd / totalValue) * 100
          : 0;

        setWatchlistPreview(mappedWatchlist.slice(0, 4));
        setWalletPreview(mappedWallet.slice(0, 4));
        setPortfolioStats({
          totalValue,
          totalChangeUsd,
          totalChangePercent,
          holdingsCount: mappedWallet.length,
        });
      } catch (portfolioError) {
        console.error("Error loading dashboard portfolio data:", portfolioError);
        message.error("Couldn't load portfolio data. Please refresh.");
        setWatchlistPreview([]);
        setWalletPreview([]);
        setPortfolioStats({
          totalValue: 0,
          totalChangeUsd: 0,
          totalChangePercent: 0,
          holdingsCount: 0,
        });
      } finally {
        setIsPortfolioLoading(false);
      }
    };

    loadPortfolioData();
  }, [userData]);

  const formatCurrency = useCallback((value, { compact = false } = {}) => {
    if (!Number.isFinite(value)) return "—";
    if (compact) {
      return `$${new Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)}`;
    }
    return `$${value.toLocaleString(undefined, {
      minimumFractionDigits: value < 1 ? 2 : 0,
      maximumFractionDigits: value < 1000 ? 2 : 0,
    })}`;
  }, []);

  const formatQuantity = useCallback((value) => {
    if (!Number.isFinite(value)) return "—";
    return value.toLocaleString(undefined, {
      minimumFractionDigits: value < 1 ? 2 : 0,
      maximumFractionDigits: value < 1 ? 6 : 2,
    });
  }, []);

  const savedPromptPreview = useMemo(
    () => (userData?.savedPrompts || []).slice(0, 3),
    [userData]
  );

  const dashboardStats = useMemo(
    () => [
      {
        label: "Portfolio Value",
        value: formatCurrency(portfolioStats.totalValue),
        meta:
          portfolioStats.totalValue > 0
            ? {
                type: "change",
                amount: portfolioStats.totalChangeUsd,
                percent: portfolioStats.totalChangePercent,
              }
            : {
                type: "empty",
                text: "Add holdings to get insights",
              },
      },
      {
        label: "Holdings",
        value: `${portfolioStats.holdingsCount || 0} asset${
          portfolioStats.holdingsCount === 1 ? "" : "s"
        }`,
        meta:
          walletPreview.length > 0
            ? {
                type: "text",
                text: `${walletPreview[0].symbol?.toUpperCase() || ""} is your top holding`,
              }
            : {
                type: "empty",
                text: "Track your investments",
              },
      },
      {
        label: "Watchlist",
        value: `${userData?.watchlist?.length || 0} saved`,
        meta:
          watchlistPreview.length > 0
            ? {
                type: "change",
                amount: null,
                percent: watchlistPreview[0].change24h,
                symbol: watchlistPreview[0].symbol,
              }
            : {
                type: "empty",
                text: "Add favorites to monitor",
              },
      },
      {
        label: "Saved Prompts",
        value: `${userData?.savedPrompts?.length || 0}`,
        meta:
          savedPromptPreview.length > 0
            ? {
                type: "text",
                text: (() => {
                  const prompt = savedPromptPreview[0]?.prompt?.trim();
                  if (!prompt) return "Keep handy prompts here";
                  const shortened = prompt.slice(0, 48);
                  return prompt.length > 48 ? `${shortened}…` : shortened;
                })(),
              }
            : {
              type: "empty",
              text: "Keep handy prompts here",
            },
      },
    ],
    [
      formatCurrency,
      portfolioStats.totalValue,
      portfolioStats.totalChangeUsd,
      portfolioStats.totalChangePercent,
      portfolioStats.holdingsCount,
      walletPreview,
      userData,
      watchlistPreview,
      savedPromptPreview,
    ]
  );

  const maxWalletValue = useMemo(
    () =>
      walletPreview.reduce((max, asset) => {
        const value = Number.isFinite(asset.currentValue) ? asset.currentValue : 0;
        return value > max ? value : max;
      }, 0),
    [walletPreview]
  );

  const handleNewChat = () => {
    navigate("/chat/new", {
      state: { isNewChat: true },
    });
  };

  // Icons
  const ChatIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );

  const TrendingUpIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
      />
    </svg>
  );

  const BookmarkIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  );

  const NewsIcon = () => (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
      />
    </svg>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
          <div className="text-center space-y-4">
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-6 w-80 mx-auto" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6">
                <Skeleton className="h-12 w-full" />
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">
              Something went wrong
            </h2>
            <p className="text-neutral-600 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        <section className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3 text-left">
            {userData ? (
              <>
                <h1 className="text-3xl font-bold text-neutral-900">
                  Welcome back, {userData.firstName}! 👋
                </h1>
                <p className="text-neutral-600 text-base md:text-lg">
                  Here’s what’s happening with your crypto today.
                </p>
              </>
            ) : (
              <div className="space-y-3">
                <Skeleton className="h-9 w-64" />
                <Skeleton className="h-5 w-80" />
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/wallet")}
              className="flex items-center gap-2"
            >
              <TrendingUpIcon />
              Wallet Overview
            </Button>
            <Button
              onClick={handleNewChat}
              icon={<ChatIcon />}
              className="flex items-center gap-2"
            >
              Start New Chat
            </Button>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardStats.map((stat) => (
            <Card key={stat.label} className="p-5">
              <p className="text-sm text-neutral-500">{stat.label}</p>
              <h3 className="mt-2 text-2xl font-semibold text-neutral-900">
                {stat.value}
              </h3>
              {stat.meta?.type === "change" ? (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  {stat.meta.amount !== null && (
                    <span
                      className={cn(
                        "font-semibold",
                        (stat.meta.amount || 0) >= 0
                          ? "text-success-600"
                          : "text-danger-600"
                      )}
                    >
                      {formatCurrency(Math.abs(stat.meta.amount))}
                      {stat.meta.amount >= 0 ? " gain" : " loss"}
                    </span>
                  )}
                  <PriceChange value={stat.meta.percent || 0} size="sm" />
                  {stat.meta.symbol && (
                    <span className="text-neutral-500 text-xs uppercase">
                      {stat.meta.symbol}
                    </span>
                  )}
                </div>
              ) : stat.meta?.type === "text" ? (
                <p className="mt-3 text-sm text-neutral-500 line-clamp-2">
                  {stat.meta.text}
                </p>
              ) : (
                <p className="mt-3 text-sm text-neutral-500">
                  {stat.meta?.text}
                </p>
              )}
            </Card>
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[2fr,1fr]">
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900">Portfolio</h2>
                  <p className="text-sm text-neutral-500">
                    Track performance across your holdings
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/wallet")}
                >
                  Open Wallet
                </Button>
              </div>

              {isPortfolioLoading ? (
                <div className="mt-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-4 w-20 ml-auto" />
                        <Skeleton className="h-3 w-14 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : walletPreview.length > 0 ? (
                <div className="mt-6 space-y-5">
                  {walletPreview.map((asset) => {
                    const share = maxWalletValue
                      ? Math.max((asset.currentValue / maxWalletValue) * 100, 4)
                      : 0;
                    return (
                      <div
                        key={asset.id}
                        className="flex flex-col gap-3 rounded-2xl border border-neutral-100/80 bg-white/70 p-4 backdrop-blur"
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={asset.image || "/default-crypto-icon.png"}
                              alt={asset.name}
                              className="h-12 w-12 rounded-full bg-neutral-100 object-contain"
                              onError={(event) => {
                                event.currentTarget.src = "/default-crypto-icon.png";
                              }}
                            />
                            <div>
                              <p className="font-semibold text-neutral-900">
                                {asset.name}
                              </p>
                              <p className="text-xs text-neutral-500 uppercase">
                                {formatQuantity(asset.quantity)} {asset.symbol}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-neutral-900">
                              {formatCurrency(asset.currentValue)}
                            </p>
                            <PriceChange value={asset.change24h || 0} size="sm" />
                          </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
                          <div
                            className="h-full rounded-full bg-primary-500"
                            style={{ width: `${share}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                    <TrendingUpIcon />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                    Your portfolio is empty
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Add holdings to see real-time performance insights.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/wallet")}
                  >
                    Add Crypto
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <TrendingUpIcon />
                  <h2 className="text-xl font-bold text-neutral-900">
                    Watchlist Highlights
                  </h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/watchlist")}
                >
                  Manage Watchlist
                </Button>
              </div>

              {isPortfolioLoading ? (
                <div className="mt-6 space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <Skeleton className="h-10 w-10 rounded-full" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <Skeleton className="h-4 w-16 ml-auto" />
                        <Skeleton className="h-3 w-12 ml-auto" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : watchlistPreview.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {watchlistPreview.map((asset) => (
                    <button
                      key={asset.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-4 rounded-2xl border border-transparent bg-white/60 p-4 text-left transition hover:border-primary-200 hover:shadow-lg"
                      onClick={() => navigate(`/cryptoDetails/${asset.id}`)}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={asset.image || "/default-crypto-icon.png"}
                          alt={asset.name}
                          className="h-10 w-10 rounded-full bg-neutral-100 object-contain"
                          onError={(event) => {
                            event.currentTarget.src = "/default-crypto-icon.png";
                          }}
                        />
                        <div>
                          <p className="font-semibold text-neutral-900">
                            {asset.name}
                          </p>
                          <p className="text-xs uppercase text-neutral-500">
                            {asset.symbol}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatCurrency(asset.price)}
                        </p>
                        <PriceChange value={asset.change24h || 0} size="sm" />
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-6 text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100">
                    <TrendingUpIcon />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-neutral-900">
                    Build your watchlist
                  </h3>
                  <p className="mt-2 text-sm text-neutral-500">
                    Add coins to stay on top of price movements.
                  </p>
                  <Button
                    className="mt-4"
                    onClick={() => navigate("/watchlist")}
                  >
                    Go to Watchlist
                  </Button>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 text-neutral-900">
                <ChatIcon />
                <h2 className="text-xl font-bold">Quick Start Prompts</h2>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                Ask CryptoChat for insights with one tap.
              </p>
              <div className="mt-5 space-y-4">{quickStartPrompts}</div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-neutral-900">
                  <BookmarkIcon />
                  <h2 className="text-xl font-bold">Saved Prompts</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/saved")}
                >
                  View All
                </Button>
              </div>
              {savedPromptPreview.length > 0 ? (
                <ul className="mt-5 space-y-4">
                  {savedPromptPreview.map((prompt) => (
                    <li
                      key={prompt._id || prompt.prompt}
                      className="rounded-2xl border border-neutral-100 bg-white/70 p-4 text-sm text-neutral-700"
                    >
                      “{prompt.prompt || prompt}”
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5 rounded-2xl border border-dashed border-neutral-200 bg-white/50 p-6 text-center text-sm text-neutral-500">
                  Save prompts from chats to revisit them quickly.
                </div>
              )}
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-neutral-900">
                  <NewsIcon />
                  <h2 className="text-xl font-bold">Latest News</h2>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/news")}
                >
                  See All
                </Button>
              </div>
              <div className="mt-5">
                <NewsPreview />
              </div>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardPage;
