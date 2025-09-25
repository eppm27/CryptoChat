import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCryptoDetailsDatabase } from "../services/cryptoAPI";
import { Card, Badge, Skeleton, PriceChange } from "../ui";
import { cn } from "../utils/cn";

const CryptoExplorePage = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize] = useState(50);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rank");
  const [sortOrder, setSortOrder] = useState("asc");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await fetchCryptoDetailsDatabase();
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

  // Filter and sort data
  const filteredData = cryptoData
    .filter(crypto => 
      crypto.coin?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crypto.symbol?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];
      
      if (sortBy === 'price' || sortBy.includes('change')) {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

  // Pagination
  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredData.length / pageSize);

  const handleCryptoClick = (cryptoId) => {
    navigate(`/cryptoDetails/${cryptoId}`);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortButton = ({ field, label }) => (
    <button
      onClick={() => handleSort(field)}
      className={cn(
        "flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
        sortBy === field 
          ? "bg-primary-500 text-white" 
          : "bg-white text-neutral-700 hover:bg-neutral-100"
      )}
    >
      {label}
      {sortBy === field && (
        <span className="text-xs">
          {sortOrder === 'asc' ? '↑' : '↓'}
        </span>
      )}
    </button>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
        <div className="max-w-6xl mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <Skeleton className="h-8 w-3/4 mb-4" />
            <Skeleton className="h-10 w-full mb-4" />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-20 flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Cards Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-20 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-6 w-8" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-5 w-12" />
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-4">
            Crypto Market Explorer
          </h1>
          <p className="text-neutral-600 mb-6">
            Discover and track the top cryptocurrencies by market cap
          </p>

          {/* Search */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-neutral-400" viewBox="0 0 20 20" fill="none">
                <path d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a1 1 0 01-1.414 1.414l-3.329-3.328A7 7 0 012 9z" fill="currentColor"/>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search cryptocurrencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <SortButton field="rank" label="Rank" />
            <SortButton field="price" label="Price" />
            <SortButton field="change1h" label="1h %" />
            <SortButton field="change24h" label="24h %" />
            <SortButton field="change7d" label="7d %" />
          </div>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-neutral-600">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredData.length)} of {filteredData.length} cryptocurrencies
          </p>
        </div>

        {/* Crypto Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {paginatedData.map((crypto) => (
            <Card
              key={crypto.id}
              className="group hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] bg-white/80 backdrop-blur-sm"
              onClick={() => handleCryptoClick(crypto.id)}
            >
              <div className="p-4">
                {/* Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="relative">
                    <img
                      src={crypto.imageUrl}
                      alt={crypto.coin}
                      className="h-10 w-10 rounded-full"
                      onError={(e) => {
                        e.target.src = '/default-crypto-icon.png';
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-neutral-900 truncate">
                      {crypto.coin}
                    </h3>
                    <p className="text-sm text-neutral-500 uppercase">
                      {crypto.symbol}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    #{crypto.rank}
                  </Badge>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <p className="text-xl font-bold text-neutral-900">
                    ${parseFloat(crypto.price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: crypto.price < 1 ? 6 : 2
                    })}
                  </p>
                </div>

                {/* Changes */}
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500">1h</span>
                    <PriceChange value={crypto.change1h} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500">24h</span>
                    <PriceChange value={crypto.change24h} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-neutral-500">7d</span>
                    <PriceChange value={crypto.change7d} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPageNumber(Math.max(1, pageNumber - 1))}
              disabled={pageNumber === 1}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const page = Math.max(1, pageNumber - 2) + i;
                if (page > totalPages) return null;
                
                return (
                  <button
                    key={page}
                    onClick={() => setPageNumber(page)}
                    className={cn(
                      "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                      page === pageNumber
                        ? "bg-primary-500 text-white"
                        : "text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-50"
                    )}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPageNumber(Math.min(totalPages, pageNumber + 1))}
              disabled={pageNumber === totalPages}
              className="px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Empty State */}
        {filteredData.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-neutral-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.464.881-6.087 2.33l-.896-.897A7.96 7.96 0 014 12.015v.055c0-.018.008-.035.013-.055A7.979 7.979 0 016.332 4.99L7.172 5.83A6.954 6.954 0 0112 3a7.966 7.966 0 014.657 1.5l1.086-.543A4.002 4.002 0 0020 8.999V9a4 4 0 01-3.5 3.969" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No cryptocurrencies found
            </h3>
            <p className="text-neutral-600 mb-4">
              Try adjusting your search terms or filters
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSortBy("rank");
                setSortOrder("asc");
              }}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CryptoExplorePage;