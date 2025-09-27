import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import CreateTables from "../components/CreateTables.jsx";
import CreateQuickStartPrompts from "../components/QuickStartPrompts.jsx";
import { fetchUserData } from "../services/userAPI.jsx";
import NewsPreview from "../components/NewsPreview";
import { Button, Card, Skeleton, GlassCard } from "../components/ui/index";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleNewChat = async () => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to create a new chat");

      const newChat = await response.json();
      navigate(`/chat/${newChat.chat._id}`, {
        state: { isNewChat: true, justCreated: true },
      });
    } catch (err) {
      console.error("Error creating new chat:", err);
    }
  };

  // Icons
  const PlusIcon = () => (
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
        d="M12 6v6m0 0v6m0-6h6m-6 0H6"
      />
    </svg>
  );

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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Welcome Section */}
        <div className="text-center space-y-4">
          {userData ? (
            <>
              <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">
                Welcome back, {userData.firstName}! 👋
              </h1>
              <p className="text-neutral-600 text-lg">
                Ready to explore the crypto markets today?
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-8 w-64 mx-auto" />
              <Skeleton className="h-6 w-80 mx-auto" />
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            hover
            className="p-6 cursor-pointer bg-gradient-to-r from-primary-500 to-primary-600 text-white"
            onClick={handleNewChat}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <ChatIcon />
              </div>
              <div>
                <h3 className="font-semibold">New Chat</h3>
                <p className="text-primary-100 text-sm">Start analyzing</p>
              </div>
            </div>
          </Card>

          <Card
            hover
            className="p-6 cursor-pointer"
            onClick={() => navigate("/watchlist")}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-success-100 rounded-xl flex items-center justify-center text-success-600">
                <TrendingUpIcon />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Watchlist</h3>
                <p className="text-neutral-600 text-sm">Track favorites</p>
              </div>
            </div>
          </Card>

          <Card
            hover
            className="p-6 cursor-pointer"
            onClick={() => navigate("/saved")}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary-100 rounded-xl flex items-center justify-center text-secondary-600">
                <BookmarkIcon />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">Saved</h3>
                <p className="text-neutral-600 text-sm">Your bookmarks</p>
              </div>
            </div>
          </Card>

          <Card
            hover
            className="p-6 cursor-pointer"
            onClick={() => navigate("/news")}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-xl flex items-center justify-center text-yellow-600">
                <NewsIcon />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900">News</h3>
                <p className="text-neutral-600 text-sm">Stay updated</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Watchlist Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center space-x-2">
                  <TrendingUpIcon />
                  <span>Your Watchlist</span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/watchlist")}
                  icon={<PlusIcon />}
                >
                  Manage
                </Button>
              </div>

              {userData ? (
                userData.watchlist?.length > 0 ? (
                  <CreateTables
                    inputTableType="watchlist"
                    userData={userData}
                    editMode={false}
                    onSuccess={() => {}}
                  />
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-neutral-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <TrendingUpIcon />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                      No watchlist items yet
                    </h3>
                    <p className="text-neutral-600 mb-4">
                      Start by adding some cryptocurrencies to your watchlist
                    </p>
                    <Button onClick={() => navigate("/cryptos")}>
                      Explore Cryptos
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center space-x-4">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-4 w-20" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Quick Start Prompts */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-neutral-900 mb-6 flex items-center space-x-2">
                <ChatIcon />
                <span>Quick Start Prompts</span>
              </h2>
              <div className="space-y-4">{quickStartPrompts}</div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Wallet Section */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900">
                  Portfolio
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/wallet")}
                >
                  View All
                </Button>
              </div>

              {userData ? (
                userData.wallet?.length > 0 ? (
                  <CreateTables
                    inputTableType="wallet"
                    userData={userData}
                    editMode={false}
                    onSuccess={() => {}}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                    </div>
                    <h3 className="font-semibold text-neutral-900 mb-1">
                      Empty Portfolio
                    </h3>
                    <p className="text-neutral-600 text-sm mb-3">
                      Add your crypto holdings
                    </p>
                    <Button size="sm" onClick={() => navigate("/wallet")}>
                      Add Holdings
                    </Button>
                  </div>
                )
              ) : (
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-2 w-12" />
                      </div>
                      <Skeleton className="h-3 w-12" />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* News Preview */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-neutral-900 flex items-center space-x-2">
                  <NewsIcon />
                  <span>Latest News</span>
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/news")}
                >
                  See All
                </Button>
              </div>
              <NewsPreview />
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
