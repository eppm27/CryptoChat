import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI";
import {
  Card,
  Button,
  Input,
  Badge,
  Skeleton,
  PriceChange,
} from "../components/ui/index";
import { cn } from "../utils/cn";

function CryptoExplorePage() {
  const [cryptoData, setCryptoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("market_cap");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [itemsToShow, setItemsToShow] = useState(20);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Explore Crypto - CryptoChat";
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCryptoDetailsDatabase([], "default");
        setCryptoData(data || []);
      } catch (error) {
        console.error("Error fetching crypto data:", error);
        setCryptoData([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Categories for filtering
  const categories = ["all", "top-10", "top-50", "gainers", "losers"];

  // Filtered and sorted crypto data
  const filteredAndSortedData = useMemo(() => {
    let filtered = cryptoData.filter((crypto) => {
      // Search filter
      const matchesSearch =
        crypto.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol?.toLowerCase().includes(searchTerm.toLowerCase());

      // Category filter
      let matchesCategory = true;
      if (selectedCategory === "top-10") {
        matchesCategory = crypto.market_cap_rank <= 10;
      } else if (selectedCategory === "top-50") {
        matchesCategory = crypto.market_cap_rank <= 50;
      } else if (selectedCategory === "gainers") {
        matchesCategory = crypto.price_change_percentage_24h_in_currency > 0;
      } else if (selectedCategory === "losers") {
        matchesCategory = crypto.price_change_percentage_24h_in_currency < 0;
      }

      return matchesSearch && matchesCategory;
    });

    // Sort data
    filtered.sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case "market_cap":
          aVal = a.market_cap || 0;
          bVal = b.market_cap || 0;
          break;
        case "price":
          aVal = a.current_price || 0;
          bVal = b.current_price || 0;
          break;
        case "change_24h":
          aVal = a.price_change_percentage_24h_in_currency || 0;
          bVal = b.price_change_percentage_24h_in_currency || 0;
          break;
        case "name":
          aVal = a.name || "";
          bVal = b.name || "";
          return sortOrder === "asc"
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        default:
          aVal = a.market_cap_rank || 999999;
          bVal = b.market_cap_rank || 999999;
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    return filtered.slice(0, itemsToShow);
  }, [
    cryptoData,
    searchTerm,
    selectedCategory,
    sortBy,
    sortOrder,
    itemsToShow,
  ]);

  const handleCryptoClick = (cryptoId) => {
    navigate(`/cryptoDetails/${cryptoId}`);
  };

  const formatMarketCap = (value) => {
    if (!value) return "N/A";
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const formatVolume = (value) => {
    if (!value) return "N/A";
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
    return `$${value.toLocaleString()}`;
  };

  const CryptoSkeletonCard = () => (
    <Card className="p-6">
      <div className="flex items-center space-x-4">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="space-y-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="space-y-1">
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-4 w-18" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Explore Cryptocurrencies
          </h1>
          <p className="text-gray-600">
            Discover and analyze the latest crypto market trends
          </p>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="max-w-md mx-auto">
              <Input
                type="search"
                placeholder="Search cryptocurrencies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
                icon="🔍"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((category) => (
                <Badge
                  key={category}
                  variant={
                    selectedCategory === category ? "default" : "secondary"
                  }
                  className={cn(
                    "cursor-pointer transition-colors capitalize",
                    selectedCategory === category
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "hover:bg-gray-200"
                  )}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category.replace("-", " ")}
                </Badge>
              ))}
            </div>

            {/* Sort Options */}
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant={sortBy === "market_cap" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "market_cap") {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                  } else {
                    setSortBy("market_cap");
                    setSortOrder("desc");
                  }
                }}
              >
                Market Cap{" "}
                {sortBy === "market_cap" && (sortOrder === "desc" ? "↓" : "↑")}
              </Button>
              <Button
                variant={sortBy === "price" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "price") {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                  } else {
                    setSortBy("price");
                    setSortOrder("desc");
                  }
                }}
              >
                Price {sortBy === "price" && (sortOrder === "desc" ? "↓" : "↑")}
              </Button>
              <Button
                variant={sortBy === "change_24h" ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (sortBy === "change_24h") {
                    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
                  } else {
                    setSortBy("change_24h");
                    setSortOrder("desc");
                  }
                }}
              >
                24h Change{" "}
                {sortBy === "change_24h" && (sortOrder === "desc" ? "↓" : "↑")}
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        {!isLoading && (
          <div className="text-center text-gray-600">
            Showing {filteredAndSortedData.length} of {cryptoData.length}{" "}
            cryptocurrencies
          </div>
        )}

        {/* Crypto Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-1">
          {isLoading ? (
            // Skeleton Loading
            Array.from({ length: 6 }).map((_, index) => (
              <CryptoSkeletonCard key={index} />
            ))
          ) : filteredAndSortedData.length === 0 ? (
            // Empty State
            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
              <div className="space-y-4">
                <div className="text-6xl">🔍</div>
                <h3 className="text-xl font-semibold text-gray-900">
                  No cryptocurrencies found
                </h3>
                <p className="text-gray-600">
                  Try adjusting your search terms or filters to find what you're
                  looking for.
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("all");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          ) : (
            // Crypto List
            filteredAndSortedData.map((crypto, index) => (
              <Card
                key={crypto.id}
                className="group p-6 cursor-pointer hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm"
                onClick={() => handleCryptoClick(crypto.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Badge
                        variant="secondary"
                        className="absolute -top-2 -left-2 text-xs px-1.5 py-0.5 min-w-0"
                      >
                        #{crypto.market_cap_rank || index + 1}
                      </Badge>
                      <img
                        src={crypto.image}
                        alt={crypto.name}
                        className="w-12 h-12 rounded-full"
                        loading="lazy"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {crypto.name}
                      </h3>
                      <p className="text-sm text-gray-500 uppercase font-medium">
                        {crypto.symbol}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">
                      ${crypto.current_price?.toFixed(2) || "N/A"}
                    </p>
                    <PriceChange
                      value={crypto.price_change_percentage_24h_in_currency}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 mb-1">Market Cap</p>
                    <p className="font-semibold text-gray-900">
                      {formatMarketCap(crypto.market_cap)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Volume (24h)</p>
                    <p className="font-semibold text-gray-900">
                      {formatVolume(crypto.total_volume)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 mb-1">Supply</p>
                    <p className="font-semibold text-gray-900">
                      {crypto.circulating_supply
                        ? `${(crypto.circulating_supply / 1e6).toFixed(1)}M`
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Load More Button */}
        {!isLoading &&
          filteredAndSortedData.length > 0 &&
          filteredAndSortedData.length < cryptoData.length && (
            <div className="text-center">
              <Button
                variant="outline"
                size="lg"
                onClick={() => setItemsToShow((prev) => prev + 20)}
              >
                Load More Cryptocurrencies
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}

export default CryptoExplorePage;
