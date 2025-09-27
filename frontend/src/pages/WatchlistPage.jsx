import React, { useEffect, useState } from "react";
import CreateTables from "../components/CreateTables.jsx";
import AddModal from "../components/AddModal.jsx";
import { fetchUserData } from "../services/userAPI.jsx";
import { Card, Button, Skeleton, Badge } from "../components/ui/index";

const WatchlistPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [watchlistData, setWatchlistData] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [userData, setUserData] = useState(null);

  const addClicked = () => setOpenModal(true);
  const closeModal = () => setOpenModal(false);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await fetchUserData();
        setWatchlistData(user.watchlist);
        setUserData(user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    loadUserData();
  }, [refreshKey]);

  const handleAddedSuccessfully = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {watchlistData ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <span className="text-2xl">👁️</span>
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Watchlist
                    </h1>
                    <p className="text-sm lg:text-base text-gray-600 mt-1">
                      Track your favorite cryptocurrencies
                    </p>
                    {watchlistData.length > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {watchlistData.length}{" "}
                        {watchlistData.length === 1 ? "crypto" : "cryptos"}{" "}
                        tracked
                      </Badge>
                    )}
                  </div>
                </div>
                {watchlistData.length > 0 && (
                  <Button onClick={addClicked} className="w-full sm:w-auto">
                    Add New Crypto
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
                <Skeleton className="h-10 w-32" />
              </>
            )}
          </div>
        </Card>

        {/* Watchlist Content */}
        {watchlistData ? (
          watchlistData.length === 0 ? (
            <Card className="p-8 lg:p-12 text-center bg-white/80 backdrop-blur-sm">
              <div className="space-y-4 lg:space-y-6">
                <div className="text-4xl lg:text-6xl mb-2 lg:mb-4">🔍</div>
                <div className="space-y-2">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                    Your watchlist is empty
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600 max-w-md mx-auto">
                    Start tracking cryptocurrencies by adding them to your
                    watchlist. Monitor prices, changes, and market trends in one
                    place.
                  </p>
                </div>
                <Button
                  onClick={addClicked}
                  size="lg"
                  className="mt-4 lg:mt-6 w-full sm:w-auto"
                >
                  Add Your First Crypto
                </Button>
              </div>
            </Card>
          ) : (
            <div className="lg:bg-white/80 lg:backdrop-blur-sm lg:rounded-xl lg:border lg:border-gray-200 lg:overflow-hidden">
              <CreateTables
                inputTableType="watchlistPage"
                userData={userData}
                onSuccess={handleAddedSuccessfully}
              />
            </div>
          )
        ) : (
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="space-y-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="flex items-center space-x-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Modal */}
        {openModal && (
          <AddModal
            closeModal={closeModal}
            onSuccess={handleAddedSuccessfully}
            modalType="watchlist"
            userData={userData}
          />
        )}
      </div>
    </div>
  );
};

export default WatchlistPage;
