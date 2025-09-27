import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { message } from "antd";
import { Button, Card, Skeleton, PriceChange, Badge } from "../components/ui";
import CryptoGraph from "../components/CryptoGraph.jsx";
import RSIGraph from "../components/CryptoIndicatorGraph.jsx";
import {
  fetchUserData,
  addCryptoToWatchlist,
  deleteCryptoFromWatchlist,
} from "../services/userAPI.jsx";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI.jsx";
import { ExternalLink, BookmarkPlus, BookmarkMinus, Clock3 } from "lucide-react";
import PropTypes from "prop-types";

const formatCurrency = (value, { compact = false, currency = "USD" } = {}) => {
  if (!Number.isFinite(value)) return "—";

  if (compact && Math.abs(value) >= 1000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Math.abs(value) < 1 ? 2 : 0,
    maximumFractionDigits: Math.abs(value) < 1000 ? 2 : 0,
  }).format(value);
};

const formatNumber = (value, { compact = false, suffix = "" } = {}) => {
  if (!Number.isFinite(value)) return "—";

  if (compact && Math.abs(value) >= 1000) {
    return `${new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value)}${suffix}`;
  }

  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: Math.abs(value) < 1 ? 4 : 2,
  })}${suffix}`;
};

const formatDateWithRelative = (date) => {
  if (!date) return "—";

  const givenDate = new Date(date);
  if (Number.isNaN(givenDate.getTime())) return "—";

  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const now = new Date();
  const diffMs = now.getTime() - givenDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffMonths = Math.floor(diffDays / 30.44);
  const diffYears = Math.floor(diffMonths / 12);

  let relative;
  if (diffYears >= 1) {
    relative = `${diffYears} year${diffYears === 1 ? "" : "s"} ago`;
  } else if (diffMonths >= 1) {
    relative = `${diffMonths} month${diffMonths === 1 ? "" : "s"} ago`;
  } else if (diffDays > 0) {
    relative = `${diffDays} day${diffDays === 1 ? "" : "s"} ago`;
  } else {
    relative = "today";
  }

  return `${formatter.format(givenDate)} (${relative})`;
};

const CoinDescription = ({ description }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (typeof description !== "string" || description.trim().length === 0) {
    return <p className="text-sm text-neutral-500">No description available.</p>;
  }

  const paragraphs = description
    .replaceAll("\r\n", "\n")
    .split("\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  const visibleParagraphs = isExpanded ? paragraphs : paragraphs.slice(0, 2);

  return (
    <div className="space-y-3">
      {visibleParagraphs.map((paragraph, index) => (
        <p key={index} className="text-sm leading-relaxed text-neutral-700">
          {paragraph}
        </p>
      ))}

      {paragraphs.length > 2 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="self-start"
        >
          {isExpanded ? "Show Less" : "Show More"}
        </Button>
      )}
    </div>
  );
};

CoinDescription.propTypes = {
  description: PropTypes.string,
};

const mapCommunityLinks = (linksObject) => {
  if (!linksObject || typeof linksObject !== "object") return [];
  return Object.entries(linksObject)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => ({
      label: key.charAt(0).toUpperCase() + key.slice(1),
      href: value,
    }));
};

const mapWebsiteLinks = (links) => {
  if (!links) return [];
  const array = Array.isArray(links) ? links : [links];
  return array
    .filter(Boolean)
    .map((link) => {
      try {
        const url = new URL(link);
        return {
          label: url.hostname.replace(/^www\./, ""),
          href: link,
        };
      // eslint-disable-next-line no-unused-vars
      } catch (error) {
        return {
          label: link,
          href: link,
        };
      }
    });
};

const CryptoDetailsPage = () => {
  const { cryptoId } = useParams();
  const [cryptoData, setCryptoData] = useState(null);
  const [news, setNews] = useState([]);
  const [isCryptoLoading, setIsCryptoLoading] = useState(true);
  const [isNewsLoading, setIsNewsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [watchlistEntry, setWatchlistEntry] = useState(null);
  const [isTogglingWatchlist, setIsTogglingWatchlist] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      setIsCryptoLoading(true);
      setIsNewsLoading(true);
      setError(null);

      try {
        const [cryptoResponse, user] = await Promise.all([
          fetchCryptoDetailsDatabase(cryptoId, "cryptoDetails"),
          fetchUserData().catch(() => null),
        ]);

        if (!isMounted) return;

        if (!cryptoResponse || !cryptoResponse.id) {
          throw new Error("Unable to locate cryptocurrency details.");
        }

        setCryptoData(cryptoResponse);

        if (user?.watchlist) {
          const entry = user.watchlist.find(
            (item) => item.cryptoId === cryptoId
          );
          setWatchlistEntry(entry || null);
        } else {
          setWatchlistEntry(null);
        }

        try {
          const symbol = (cryptoResponse.symbol || "").toUpperCase();
          if (symbol) {
            const response = await fetch(`/api/news/${symbol}?limit=5`);
            if (!response.ok) {
              throw new Error("Failed to fetch news");
            }
            const newsData = await response.json();
            if (isMounted) {
              setNews(Array.isArray(newsData) ? newsData : []);
            }
          } else {
            setNews([]);
          }
        } catch (newsError) {
          console.error("Error loading news:", newsError);
          if (isMounted) {
            setNews([]);
          }
        } finally {
          if (isMounted) {
            setIsNewsLoading(false);
          }
        }
      } catch (err) {
        console.error("Crypto details error:", err);
        if (isMounted) {
          setError(err.message || "Failed to load crypto details");
          setCryptoData(null);
          setIsNewsLoading(false);
        }
      } finally {
        if (isMounted) {
          setIsCryptoLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [cryptoId]);

  const inWatchlist = Boolean(watchlistEntry);

  const handleWatchlistToggle = async () => {
    if (!cryptoData || isTogglingWatchlist) return;

    try {
      setIsTogglingWatchlist(true);
      if (inWatchlist) {
        await deleteCryptoFromWatchlist(watchlistEntry);
        setWatchlistEntry(null);
        message.success(`${cryptoData.name} removed from your watchlist`);
      } else {
        await addCryptoToWatchlist({
          id: cryptoData.id,
          name: cryptoData.name,
          symbol: cryptoData.symbol,
          image: cryptoData.image,
        });
        const user = await fetchUserData().catch(() => null);
        const entry = user?.watchlist?.find((item) => item.cryptoId === cryptoId);
        setWatchlistEntry(entry || null);
        message.success(`${cryptoData.name} added to your watchlist`);
      }
    } catch (err) {
      console.error("Watchlist toggle failed:", err);
      message.error(
        err.message || "We couldn't update your watchlist. Please try again."
      );
    } finally {
      setIsTogglingWatchlist(false);
    }
  };

  const marketStats = useMemo(() => {
    if (!cryptoData) return [];

    return [
      {
        label: "Market Cap",
        value: formatCurrency(cryptoData.market_cap, { compact: true }),
      },
      {
        label: "24h Volume",
        value: formatCurrency(cryptoData.total_volume, { compact: true }),
      },
      {
        label: "Fully Diluted Valuation",
        value: formatCurrency(cryptoData.fully_diluted_valuation, {
          compact: true,
        }),
      },
      {
        label: "Circulating Supply",
        value: formatNumber(cryptoData.circulating_supply, {
          compact: true,
          suffix: ` ${cryptoData.symbol?.toUpperCase() || ""}`,
        }),
      },
      {
        label: "Total Supply",
        value: formatNumber(cryptoData.total_supply, {
          compact: true,
          suffix: ` ${cryptoData.symbol?.toUpperCase() || ""}`,
        }),
      },
      {
        label: "Max Supply",
        value: formatNumber(cryptoData.max_supply, {
          compact: true,
          suffix: ` ${cryptoData.symbol?.toUpperCase() || ""}`,
        }),
      },
    ];
  }, [cryptoData]);

  const priceRanges = useMemo(() => {
    if (!cryptoData) return [];

    const ranges = [
      {
        label: "24h Range",
        value: `${formatCurrency(cryptoData.low_24h)} – ${formatCurrency(
          cryptoData.high_24h
        )}`,
      },
    ];

    if (Number.isFinite(cryptoData.low_7d) && Number.isFinite(cryptoData.high_7d)) {
      ranges.push({
        label: "7d Range",
        value: `${formatCurrency(cryptoData.low_7d)} – ${formatCurrency(
          cryptoData.high_7d
        )}`,
      });
    }

    ranges.push(
      {
        label: "All-Time High",
        value: (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(cryptoData.ath)}</span>
            <span className="text-xs text-neutral-500">
              {formatDateWithRelative(cryptoData.ath_date)}
            </span>
          </div>
        ),
        change: cryptoData.ath_change_percentage,
      },
      {
        label: "All-Time Low",
        value: (
          <div className="flex flex-col items-end">
            <span>{formatCurrency(cryptoData.atl)}</span>
            <span className="text-xs text-neutral-500">
              {formatDateWithRelative(cryptoData.atl_date)}
            </span>
          </div>
        ),
        change: cryptoData.atl_change_percentage,
      }
    );

    return ranges;
  }, [cryptoData]);

  const categoryBadges = useMemo(() => {
    if (!Array.isArray(cryptoData?.categories)) return [];
    return cryptoData.categories.filter(Boolean).slice(0, 8);
  }, [cryptoData]);

  if (isCryptoLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-72 w-full" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-6 w-40 mb-4" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-20 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 flex items-center justify-center px-4">
        <Card className="max-w-lg w-full p-8 text-center space-y-4">
          <h1 className="text-2xl font-semibold text-neutral-900">
            We couldn't load this crypto
          </h1>
          <p className="text-neutral-600">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </Card>
      </div>
    );
  }

  if (!cryptoData) {
    return null;
  }

  const percentageChange24h = Number.parseFloat(
    cryptoData.price_change_percentage_24h_in_currency
  );
  const priceChange24h = Number.parseFloat(cryptoData.price_change_24h);
// eslint-disable-next-line react-hooks/rules-of-hooks
const websiteLinks = useMemo(
  () => mapWebsiteLinks(cryptoData?.homepageLink),
  [cryptoData]
);

// eslint-disable-next-line react-hooks/rules-of-hooks
const communityLinks = useMemo(
  () => mapCommunityLinks(cryptoData?.communityLinks),
  [cryptoData]
);

const primaryWebsite = websiteLinks[0]?.href;

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Card className="p-6 space-y-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:justify-between lg:items-start">
            <div className="flex items-start gap-4">
              <img
                src={cryptoData.image || "/default-crypto-icon.png"}
                alt={`${cryptoData.name} logo`}
                className="h-16 w-16 rounded-2xl bg-white shadow"
                onError={(event) => {
                  event.currentTarget.src = "/default-crypto-icon.png";
                }}
              />
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-neutral-900">
                    {cryptoData.name}
                  </h1>
                  <Badge className="uppercase">
                    {cryptoData.symbol}
                  </Badge>
                </div>
                {categoryBadges.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categoryBadges.map((category) => (
                      <Badge key={category} variant="primary">
                        {category}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              {primaryWebsite && (
                <a
                  href={primaryWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-4 py-2 text-sm font-semibold text-neutral-700 hover:border-primary-300 hover:text-primary-600"
                >
                  <ExternalLink className="h-4 w-4" /> Official Site
                </a>
              )}
              <Button
                onClick={handleWatchlistToggle}
                loading={isTogglingWatchlist}
                className="flex items-center gap-2"
              >
                {inWatchlist ? (
                  <>
                    <BookmarkMinus className="h-4 w-4" /> Remove from Watchlist
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" /> Add to Watchlist
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-3xl font-bold text-neutral-900">
                {formatCurrency(cryptoData.current_price)}
              </p>
              <div className="flex items-center gap-3">
                <PriceChange value={percentageChange24h || 0} size="md" />
                <span className="text-sm text-neutral-500">
                  {Number.isFinite(priceChange24h)
                    ? formatCurrency(priceChange24h)
                    : "—"} {""} change (24h)
                </span>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs uppercase text-neutral-500">Rank</p>
                <p className="text-lg font-semibold text-neutral-900">
                  #{cryptoData.market_cap_rank || "—"}
                </p>
              </div>
              <div className="rounded-2xl bg-neutral-50 p-4">
                <p className="text-xs uppercase text-neutral-500">Sentiment</p>
                <p className="text-lg font-semibold text-neutral-900">
                  {Number.isFinite(cryptoData.sentiment_votes_up_percentage)
                    ? `${cryptoData.sentiment_votes_up_percentage.toFixed(0)}% positive`
                    : "N/A"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-neutral-900">
              {cryptoData.name} Price Chart
            </h2>
          </div>
          <CryptoGraph cryptoId={cryptoId} />
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Key Metrics
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {marketStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-neutral-100 p-4 bg-white/70"
                >
                  <p className="text-xs uppercase text-neutral-500">
                    {stat.label}
                  </p>
                  <p className="mt-1 text-base font-semibold text-neutral-900">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-4">
              Price Performance
            </h2>
            <div className="space-y-2">
              {priceRanges.map((range) => (
                <div key={range.label} className="rounded-xl bg-neutral-50 p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase text-neutral-500">
                        {range.label}
                      </p>
                      <div className="mt-1 text-sm text-neutral-900">
                        {range.value}
                      </div>
                    </div>
                    {Number.isFinite(range.change) && (
                      <PriceChange value={range.change} size="sm" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-6 space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[240px]">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                Official Links
              </h2>
              <div className="flex flex-wrap gap-2">
                {websiteLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-primary-300 hover:text-primary-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {link.label}
                  </a>
                ))}
                {websiteLinks.length === 0 && (
                  <span className="text-sm text-neutral-500">N/A</span>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-[240px]">
              <h2 className="text-lg font-semibold text-neutral-900 mb-2">
                Communities
              </h2>
              <div className="flex flex-wrap gap-2">
                {communityLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:border-primary-300 hover:text-primary-600"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    {link.label}
                  </a>
                ))}
                {communityLinks.length === 0 && (
                  <span className="text-sm text-neutral-500">N/A</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              About {cryptoData.name}
            </h2>
          </div>
          <CoinDescription description={cryptoData.description} />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-neutral-900">
              {cryptoData.symbol?.toUpperCase()} RSI Indicator
            </h2>
          </div>
          <div className="rounded-2xl border border-neutral-100 bg-white/70 p-4">
            <RSIGraph cryptoId={cryptoData.id} />
          </div>
        </Card>

        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              Latest News
            </h2>
            <span className="text-xs text-neutral-500">
              Powered by CryptoChat News Engine
            </span>
          </div>

          {isNewsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-24 w-full" />
              ))}
            </div>
          ) : news.length > 0 ? (
            <div className="space-y-3">
              {news.map((article) => (
                <a
                  key={article._id || article.url}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl border border-transparent bg-white/60 p-4 transition hover:border-primary-200 hover:shadow-lg"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <span className="text-xs font-semibold uppercase text-primary-600">
                      {article.source || "Unknown Source"}
                    </span>
                    {article.published_at && (
                      <span className="text-xs text-neutral-500 flex items-center gap-1">
                        <Clock3 className="h-3 w-3" />
                        {new Date(article.published_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">
                    {article.title}
                  </h3>
                  <p className="mt-2 text-sm text-neutral-600 line-clamp-3">
                    {article.summary}
                  </p>
                  {article.tickers?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {article.tickers.map((ticker) => (
                        <Badge key={ticker} variant="secondary">
                          {ticker}
                        </Badge>
                      ))}
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              No related news articles right now. Check back soon!
            </p>
          )}
        </Card>
      </div>
    </div>
  );
};

export default CryptoDetailsPage;
