import React, { useState, useEffect } from "react";
import { Skeleton } from "@mui/material";

const NewsPage = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  return (
    <div className="px-8 py-6 min-h-screen bg-gray-50">
      <h2 className="text-3xl font-bold text-customNavyBlue mb-6 text-left">
        Latest News
      </h2>

      {loading ? (
        <div className="flex flex-col gap-6">
          {[...Array(3)].map((_, idx) => (
            <div
              key={idx}
              className="bg-white shadow-md rounded-2xl p-4 border border-gray-200"
            >
              <Skeleton variant="text" width="30%" height={20} />
              <Skeleton variant="text" width="80%" height={28} sx={{ marginTop: 2 }} />
              <Skeleton variant="text" width="90%" height={20} sx={{ marginTop: 1 }} />
              <Skeleton variant="rectangular" height={24} width="50%" sx={{ marginTop: 3, borderRadius: 2 }} />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {newsList.map((article) => (
            <a
              key={article._id || article.url}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block bg-white shadow-md rounded-2xl p-4 border border-gray-200 hover:shadow-lg transition cursor-pointer"
            >
              <div className="flex justify-end mb-1">
                {article.source && (
                  <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    {article.source}
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold text-gray-800 text-left leading-tight">
                  {article.title}
                </h3>
                <p className="text-gray-600 mt-1 text-left leading-tight">
                  {article.summary}
                </p>
              </div>

              {article.tickers && article.tickers.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1">
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
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsPage;
