import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Tabs, Tab, Divider, Box, Skeleton, Tooltip } from "@mui/material";
import { Element, Link } from "react-scroll";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI";
import { message } from "antd";
import CryptoGraph from "../components/CryptoGraph.jsx";
import { ArrowDropUp, ArrowDropDown } from "@mui/icons-material";
import createHyperlinkBox from "../components/CreateHyperlinkBox";
import PropTypes from "prop-types";
import { Eye } from "lucide-react";
import {
  fetchUserData,
  addCryptoToWatchlist,
  deleteCryptoFromWatchlist,
} from "../services/userAPI.jsx";
import RSIGraph from "../components/CryptoIndicatorGraph.jsx";

const InfoRow = ({ label, value }) => (
  <>
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-start"
      flexWrap="wrap"
      py={1}
    >
      <span className="text-gray-500 font-semibold">{label}</span>
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "8px",
          textAlign: "right",
          flex: "1 1 auto",
        }}
      >
        {value}
      </Box>
    </Box>
    <Divider />
  </>
);

const convertDate = (date) => {
  const givenDate = new Date(date);

  const formatDate = givenDate.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const currentDate = new Date();
  const dateDiff = currentDate - givenDate;
  const diffInYears = dateDiff / (1000 * 60 * 60 * 24 * 365);
  const yearsAgo = Math.floor(diffInYears);

  if (yearsAgo >= 1) {
    return `${formatDate} (${yearsAgo} ${
      yearsAgo === 1 ? "year" : "years"
    } ago)`;
  } else {
    // convert year to months
    const diffInMonths = dateDiff / (1000 * 60 * 60 * 24 * 30.44);
    const monthsAgo = Math.floor(diffInMonths);

    if (monthsAgo >= 1) {
      return `${formatDate} (${monthsAgo} ${
        monthsAgo === 1 ? "month" : "months"
      } ago)`;
    }
    // convert to days
    const diffInDays = Math.floor(dateDiff / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return `${formatDate} (today)`;
    } else {
      return `${formatDate} (${diffInDays} ${
        diffInDays === 1 ? "day" : "days"
      } ago)`;
    }
  }
};

const CoinDescription = ({ description }) => {
  const [expand, setExpand] = useState(false);

  if (typeof description !== "string") {
    return null;
  }

  const splitLines = description.split("\n");
  const visibleLines = expand ? splitLines : splitLines.slice(0, 2);

  return (
    <div className="flex flex-col gap-2">
      {/* displayed content */}
      <div>
        {visibleLines.map((line, index) => (
          <span key={index}>
            {line}
            <br />
          </span>
        ))}
      </div>

      {/* divider and expand button */}
      {splitLines.length > 2 && (
        <div className="border-t-2 border-gray-300 pt-2 flex">
          <button
            onClick={() => setExpand(!expand)}
            className="ml-auto bg-gray-200 hover:bg-gray-300 text-gray-800 text-md font-medium py-1 px-3 rounded-md shadow-sm transition"
          >
            {expand ? "Show Less" : "Show More"}
          </button>
        </div>
      )}
    </div>
  );
};

const CryptoDetailsPage = () => {
  const { cryptoId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [cryptoData, setCryptoData] = useState();
  const [news, setNews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [cryptoUser, setCryptoUser] = useState();

  useEffect(() => {
    const fetchCryptoData = async () => {
      try {
        const data = await fetchCryptoDetailsDatabase(
          cryptoId,
          "cryptoDetails"
        );
        setCryptoData(data);
        return data.symbol;
      } catch (error) {
        console.error("Error:", error);
        message.error(
          error.message || "Failed to fetch crypto data for crypto"
        );
      }
    };

    const fetchNews = async (symbol) => {
      try {
        const response = await fetch(
          `/api/news/${symbol.toUpperCase()}?limit=5`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error(error);
      }
    };

    const checkWatchlistState = async () => {
      try {
        const response = await fetchUserData();
        const userWatchlist = response.watchlist;
        const cryptoState = userWatchlist.filter(
          (crypto) => crypto.cryptoId === cryptoId
        );

        if (cryptoState.length > 0) {
          setInWatchlist(true);
          setCryptoUser(cryptoState[0]);
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchCryptoData().then((symbol) => {
      if (symbol) {
        fetchNews(symbol).finally(() => {
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    // fetch for user Data
    checkWatchlistState();
  }, [cryptoId]);

  const tabSections = React.useMemo(
    () => [
      { label: "Overview", name: "overview" },
      { label: "Info", name: "info" },
      { label: "News", name: "news" },
    ],
    []
  );

  // handles scroll
  useEffect(() => {
    const handleScroll = () => {
      const sections = tabSections.map((section) =>
        document.getElementById(section.name)
      );
      sections.forEach((section, index) => {
        if (!section) return;
        const rect = section.getBoundingClientRect();
        if (rect.top <= 80 && rect.bottom >= 80) {
          setActiveTab(tabSections[index].name);
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [tabSections]);

  // handles manual tab selection
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleWatchlistButton = async () => {
    try {
      if (inWatchlist) {
        await deleteCryptoFromWatchlist(cryptoUser);
        setInWatchlist(false);
      } else {
        const response = await addCryptoToWatchlist(cryptoData);
        console.log(response);
        setInWatchlist(true);
      }
    } catch (error) {
      console.log(
        "failed to add/delete to watchlist from details page ",
        error
      );
    }
  };

  const getSentimentColor = (score) => {
    if (score > 0.3) return "bg-green-100 text-green-800";
    if (score < -0.3) return "bg-red-100 text-red-800";
    return "bg-gray-100 text-gray-800";
  };

  const formatSentimentScore = (score) => {
    if (!score) return "N/A";
    return score.toFixed(2);
  };

  return (
    <div className="mx-6">
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        className="fixed bg-white border-b-2 shadow-md left-0 w-full z-[100] opacity-100 top-20"
        variant="scrollable"
        scrollButtons="auto"
        sx={{ top: "70px" }}
      >
        {tabSections.map((section) => (
          <Tab
            key={section.name}
            label={section.label}
            value={section.name}
            component={Link}
            to={section.name}
            spy={true}
            smooth={true}
            duration={500}
            offset={-60}
            activeClass="text-blue-500"
            sx={{
              flex: tabSections.length <= 4 ? 1 : "unset",
              minWidth: 110,
              minHeight: 60,
            }}
          />
        ))}
      </Tabs>

      <Element name="overview" className="h-auto pt-20" id="overview">
        {cryptoData && !isLoading ? (
          <div className="flex flex-col w-full">
            {/* --- Top Info (Logo, Name, Symbol) --- */}
            <div className="flex items-center gap-2">
              <img
                src={cryptoData.image}
                className="w-10"
                alt={`${cryptoData.name} logo`}
              />
              <p className="font-bold text-xl">{cryptoData.name}</p>
              <p className="text-gray-500">{cryptoData.symbol.toUpperCase()}</p>
              <p className="text-gray-500">AUD</p>
            </div>

            {/* --- Price and Change Info --- */}
            <div className="flex items-end gap-3 mt-4">
              <p className="text-4xl font-bold">
                {new Intl.NumberFormat("en-AU", {
                  style: "currency",
                  currency: "AUD",
                }).format(cryptoData.current_price)}
              </p>

              <div className="flex flex-row items-center">
                <p
                  className={`text-lg ${
                    cryptoData.price_change_24h >= 0
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {cryptoData.price_change_24h >= 0 ? (
                    <ArrowDropUp fontSize="large" />
                  ) : (
                    <ArrowDropDown fontSize="large" />
                  )}
                </p>

                <div className="flex flex-col gap-1 text-left">
                  <p
                    className={`text-xl font-bold ${
                      cryptoData.price_change_percentage_24h_in_currency >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {cryptoData.price_change_percentage_24h_in_currency.toFixed(
                      2
                    )}
                    %
                  </p>
                  <p
                    className={`text-rg font-semibold ${
                      cryptoData.price_change_24h >= 0
                        ? "text-green-600"
                        : "text-red-500"
                    }`}
                  >
                    ${cryptoData.price_change_24h.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* --- Watchlist Button --- */}
            <div className="flex justify-end mt-4">
              <button
                className={`inline-flex justify-center gap-1 items-center h-10 py-2 px-4 rounded-xl text-white font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-green-300 
                ${
                  inWatchlist
                    ? "bg-red-500 hover:bg-red-600 transition-colors duration-300 ease-in-out"
                    : "bg-green-500 hover:bg-green-600 transition-colors duration-300 ease-in-out"
                }
                `}
                onClick={handleWatchlistButton}
              >
                <Eye />
                {inWatchlist ? "Remove from Watchlist" : "Add to Watchlist"}
              </button>
            </div>

            {/* --- Price Graph --- */}
            <div className="mt-8">
              <CryptoGraph cryptoId={cryptoId} />
            </div>

            {/* --- Statistics Section --- */}
            <div className="flex flex-col mt-8">
              <p className="text-left font-bold">
                {cryptoData.name} Statistics
              </p>
              <Divider sx={{ marginTop: 1, marginBottom: 1 }} />

              <Box>
                <InfoRow
                  label="Market Cap"
                  value={`$${(cryptoData.market_cap ?? 0).toLocaleString()}`}
                />
                <InfoRow
                  label="Fully Diluted Valuation"
                  value={`$${(
                    cryptoData.fully_diluted_valuation ?? 0
                  ).toLocaleString()}`}
                />
                <InfoRow
                  label="24 Hour Trading Volume"
                  value={`$${(cryptoData.total_volume ?? 0).toLocaleString()}`}
                />
                <InfoRow
                  label="Circulating Supply"
                  value={(cryptoData.circulating_supply ?? 0).toLocaleString()}
                />
                <InfoRow
                  label="Total Supply"
                  value={(cryptoData.total_supply ?? 0).toLocaleString()}
                />
                <InfoRow
                  label="Max Supply"
                  value={(cryptoData.max_supply ?? 0).toLocaleString()}
                />
              </Box>
            </div>
          </div>
        ) : (
          // --- Loading Skeleton ---
          <div className="flex flex-col w-full gap-4">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" width={40} height={40} />
              <Skeleton variant="text" width={120} height={30} />
              <Skeleton variant="text" width={60} height={20} />
            </div>

            <div className="flex flex-col gap-2">
              <Skeleton variant="text" width="40%" height={50} />
              <Skeleton variant="text" width="60%" height={30} />
            </div>

            <Skeleton variant="rectangular" height={300} />

            <div className="flex flex-col mt-8">
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="rectangular" height={200} />
            </div>
          </div>
        )}
      </Element>

      <Element name="info" className="h-auto py-4" id="info">
        <Element name="info" className="h-auto py-4" id="info">
          {cryptoData && !isLoading ? (
            <div className="flex flex-col w-full">
              {/* Info Section */}
              <div className="flex flex-col mt-4">
                <p className="text-left font-bold">Info</p>
                <Divider sx={{ marginTop: 1, marginBottom: 1 }} />

                <Box>
                  <InfoRow
                    label="Website"
                    value={createHyperlinkBox(
                      [
                        ...(Array.isArray(cryptoData.homepageLink)
                          ? cryptoData.homepageLink
                          : [cryptoData.homepageLink]),
                      ],
                      "website"
                    )}
                  />
                  <InfoRow
                    label="Community"
                    value={createHyperlinkBox(
                      cryptoData.communityLinks,
                      "community"
                    )}
                  />
                  <InfoRow
                    label="Categories"
                    value={createHyperlinkBox(
                      cryptoData.categories,
                      "categories"
                    )}
                  />
                </Box>
              </div>

              {/* Historical Price Section */}
              <div className="flex flex-col mt-8">
                <p className="text-left font-bold">
                  {cryptoData.symbol.toUpperCase()} Historical Data
                </p>
                <Divider sx={{ marginTop: 1, marginBottom: 1 }} />

                <Box>
                  <InfoRow
                    label="24h Range"
                    value={`$${cryptoData.low_24h.toLocaleString()} – $${cryptoData.high_24h.toLocaleString()}`}
                  />
                  {cryptoData.low_7d && cryptoData.high_7d && (
                    <InfoRow
                      label="7d Range"
                      value={`$${cryptoData.low_7d.toLocaleString()} – $${cryptoData.high_7d.toLocaleString()}`}
                    />
                  )}
                  <InfoRow
                    label="All-Time High"
                    value={
                      <div className="flex flex-col">
                        <div className="flex gap-2 justify-end">
                          <span>${cryptoData.ath.toLocaleString()}</span>
                          <span
                            className={
                              cryptoData.ath_change_percentage < 0
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {cryptoData.ath_change_percentage < 0 ? (
                              <ArrowDropDown fontSize="small" />
                            ) : (
                              <ArrowDropUp fontSize="small" />
                            )}
                            {cryptoData.ath_change_percentage.toFixed(2)}%
                          </span>
                        </div>
                        <span>{convertDate(cryptoData.ath_date)}</span>
                      </div>
                    }
                  />
                  <InfoRow
                    label="All-Time Low"
                    value={
                      <div className="flex flex-col">
                        <div className="flex gap-2 justify-end">
                          <span>${cryptoData.atl.toLocaleString()}</span>
                          <span
                            className={
                              cryptoData.atl_change_percentage < 0
                                ? "text-red-500"
                                : "text-green-500"
                            }
                          >
                            {cryptoData.atl_change_percentage < 0 ? (
                              <ArrowDropDown fontSize="small" />
                            ) : (
                              <ArrowDropUp fontSize="small" />
                            )}
                            {cryptoData.atl_change_percentage.toFixed(2)}%
                          </span>
                        </div>
                        <span>{convertDate(cryptoData.atl_date)}</span>
                      </div>
                    }
                  />
                </Box>
              </div>

              {/* Description Section */}
              <div className="flex flex-col gap-2 text-left mt-8">
                <p className="font-bold">
                  About {cryptoData.name} ({cryptoData.symbol.toUpperCase()})
                </p>
                {cryptoData?.description && (
                  <CoinDescription description={cryptoData.description} />
                )}
              </div>

              {/* RSI Graph Section */}
              <div className="flex flex-col mt-8">
                <div className="flex items-center gap-1">
                  <p className="text-left font-bold">
                    {cryptoData.symbol.toUpperCase()} RSI
                  </p>
                  <Tooltip
                    title={
                      <div className="max-w-xs p-2">
                        <p className="font-semibold">
                          Relative Strength Index (RSI)
                        </p>
                        <p className="text-sm">
                          RSI is a tool for measuring short-term momentum.
                          Values above 70 indicate overbought, below 30
                          oversold.
                        </p>
                      </div>
                    }
                    arrow
                    placement="top"
                    open={tooltipOpen}
                    onOpen={() => setTooltipOpen(true)}
                    onClose={() => setTooltipOpen(false)}
                    disableFocusListener
                    disableHoverListener
                    disableTouchListener
                  >
                    <HelpOutlineIcon
                      fontSize="small"
                      className="text-gray-500 cursor-help hover:text-gray-700"
                      onClick={() => setTooltipOpen(!tooltipOpen)}
                    />
                  </Tooltip>
                </div>
                <Divider sx={{ marginTop: 1, marginBottom: 2 }} />
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                  <RSIGraph cryptoId={cryptoData._id} />
                </div>
              </div>
            </div>
          ) : (
            // Loading skeleton
            <div className="flex flex-col w-full gap-4">
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="rectangular" height={300} />
              <Skeleton variant="text" width="30%" />
              <Skeleton variant="rectangular" height={300} />
            </div>
          )}
        </Element>
      </Element>

      <Element name="news" className="h-auto py-10" id="news">
        <h2 className="text-2xl font-bold mb-4 text-left">Related News</h2>

        {!isLoading ? (
          news?.length > 0 ? (
            <div className="flex flex-col gap-4">
              {news.map((article) => (
                <a
                  key={article._id || article.url}
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-white shadow-md rounded-2xl p-4 border border-gray-200 hover:shadow-lg transition cursor-pointer"
                >
                  <div className="flex gap-2 items-end justify-end mb-2">
                    <span
                      className={`text-xs font-medium px-2.5 py-0.5 rounded bg-gray-200 ${getSentimentColor(
                        article.sentiment_score
                      )}`}
                    >
                      Sentiment: {formatSentimentScore(article.sentiment_score)}
                    </span>
                    {article.source && (
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                        {article.source}
                      </span>
                    )}
                  </div>

                  <div className="mb-4 text-left">
                    <h3 className="text-xl font-semibold text-gray-800 leading-tight mb-2">
                      {article.title}
                    </h3>
                    <p className="text-gray-600 mt-1 leading-tight">
                      {article.summary}
                    </p>
                  </div>

                  {article.tickers?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {article.tickers.map((ticker) => (
                        <span
                          key={ticker}
                          className="bg-gray-200 text-gray-800 text-xs font-medium px-2 py-0.5 rounded"
                        >
                          {ticker}
                        </span>
                      ))}
                    </div>
                  )}

                  {article.published_at && (
                    <div className="text-xs text-gray-500 text-right mt-2">
                      {new Date(article.published_at).toLocaleDateString()}
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              No news available.
            </div>
          )
        ) : (
          <div className="flex flex-col gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} variant="rectangular" height={150} />
            ))}
          </div>
        )}
      </Element>
    </div>
  );
};

export default CryptoDetailsPage;

CoinDescription.propTypes = {
  description: PropTypes.string.isRequired,
};

InfoRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
