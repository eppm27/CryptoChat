import React, { useEffect, useState } from "react";

const NewsPreview = () => {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch("/api/news");
        if (!response.ok) throw new Error("Failed to fetch news");
        const data = await response.json();
        setNewsList(data.slice(0, 3));
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return <p className="text-gray-500">Loading news...</p>;
  }

  return (
    <div className="space-y-3">
      {newsList.map((article) => (
        <a
          key={article._id || article.url}
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white shadow-md rounded-xl p-4 border border-gray-200 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex justify-between items-start">
            <h3 className="text-md font-semibold text-gray-800 leading-tight text-left">
              {article.title}
            </h3>
            {article.source && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-0.5 rounded">
                {article.source}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1 line-clamp-3 text-left">
            {article.summary}
          </p>
        </a>
      ))}
    </div>
  );
};

export default NewsPreview;
