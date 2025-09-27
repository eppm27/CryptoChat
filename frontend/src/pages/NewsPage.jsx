import React, { useState, useEffect } from "react";
import { Card, Skeleton, Badge } from "../components/ui";
import { cn } from "../utils/cn";

const NewsPage = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }
        const data = await response.json();
        setNewsList(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  const categories = ["all", "bitcoin", "ethereum", "defi", "nft", "regulation"];
  
  const filteredNews = selectedCategory === "all" 
    ? newsList 
    : newsList.filter(article => 
        article.tickers?.some(ticker => 
          ticker.toLowerCase().includes(selectedCategory.toLowerCase())
        ) || 
        article.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        article.summary.toLowerCase().includes(selectedCategory.toLowerCase())
      );

  const formatTimeAgo = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const NewsCard = ({ article }) => (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 cursor-pointer bg-white/80 backdrop-blur-sm"
      onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 mb-2">
            {article.source && (
              <Badge variant="secondary" className="text-xs">
                {article.source}
              </Badge>
            )}
            {article._id && (
              <span className="text-xs text-neutral-500">
                {formatTimeAgo(article.publishedAt || article.createdAt)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-neutral-900 leading-tight group-hover:text-primary-600 transition-colors">
            {article.title}
          </h2>
          
          <p className="text-neutral-600 text-sm leading-relaxed line-clamp-3">
            {article.summary}
          </p>
        </div>

        {/* Tags */}
        {article.tickers && article.tickers.length > 0 && (
          <div className="mt-4 pt-3 border-t border-neutral-100">
            <div className="flex flex-wrap gap-1">
              {article.tickers.slice(0, 4).map((ticker) => (
                <span
                  key={ticker}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
                >
                  {ticker}
                </span>
              ))}
              {article.tickers.length > 4 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                  +{article.tickers.length - 4}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Read more indicator */}
        <div className="mt-4 flex items-center text-primary-600 text-sm font-medium">
          <span>Read more</span>
          <svg className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
    </Card>
  );

  const LoadingSkeleton = () => (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="mt-4 pt-3 border-t border-neutral-100">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-14" />
        </div>
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-2">
            Crypto News
          </h1>
          <p className="text-neutral-600 mb-6">
            Stay updated with the latest cryptocurrency news and market insights
          </p>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap",
                  selectedCategory === category
                    ? "bg-primary-500 text-white shadow-md"
                    : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
                )}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, idx) => (
              <LoadingSkeleton key={idx} />
            ))}
          </div>
        ) : error ? (
          <Card className="p-6 text-center">
            <div className="mx-auto h-16 w-16 text-danger-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              Failed to load news
            </h3>
            <p className="text-neutral-600 mb-4">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Try Again
            </button>
          </Card>
        ) : filteredNews.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="mx-auto h-16 w-16 text-neutral-400 mb-4">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">
              No news found
            </h3>
            <p className="text-neutral-600 mb-4">
              No articles found for the selected category. Try selecting a different category.
            </p>
            <button
              onClick={() => setSelectedCategory("all")}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              Show All News
            </button>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Featured Article */}
            {filteredNews.length > 0 && (
              <div className="mb-8">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Featured</h2>
                <Card 
                  className="group hover:shadow-xl transition-all duration-300 cursor-pointer bg-gradient-to-r from-primary-500 to-primary-600 text-white overflow-hidden"
                  onClick={() => window.open(filteredNews[0].url, '_blank', 'noopener,noreferrer')}
                >
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                      {filteredNews[0].source && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/20">
                          {filteredNews[0].source}
                        </Badge>
                      )}
                      <span className="text-primary-100 text-sm">
                        Featured Article
                      </span>
                    </div>
                    
                    <h2 className="text-xl lg:text-2xl font-bold mb-4 leading-tight">
                      {filteredNews[0].title}
                    </h2>
                    
                    <p className="text-primary-100 mb-6 leading-relaxed">
                      {filteredNews[0].summary}
                    </p>
                    
                    <div className="flex items-center text-white font-medium">
                      <span>Read Full Article</span>
                      <svg className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* News Grid */}
            <div className="space-y-4">
              {filteredNews.slice(1).map((article, index) => (
                <NewsCard key={article._id || article.url || index} article={article} />
              ))}
            </div>
          </div>
        )}

        {/* Load More */}
        {!loading && !error && filteredNews.length > 0 && (
          <div className="mt-8 text-center">
            <button className="px-6 py-3 bg-white border border-neutral-200 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors font-medium">
              Load More Articles
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewsPage;