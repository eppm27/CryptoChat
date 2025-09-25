import React, { useEffect, useState } from "react";
import CreateTables from "../components/CreateTables.jsx";
import AddModal from "../components/AddModal.jsx";
import { fetchUserData } from "../services/userAPI.jsx";
import { Skeleton } from "@mui/material";

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
    <div className="min-h-screen pt-4 bg-gray-50 px-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {watchlistData ? (
          <>
            <h2 className="text-3xl font-bold text-customNavyBlue">
              Watchlist
            </h2>
            {watchlistData.length > 0 && (
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 font-semibold rounded-lg shadow"
                onClick={addClicked}
              >
                Add New Crypto
              </button>
            )}
          </>
        ) : (
          <>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="rectangular" width={120} height={40} />
          </>
        )}
      </div>

      {/* Watchlist Content */}
      {watchlistData ? (
        watchlistData.length === 0 ? (
          <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-8 px-4 text-center gap-4 min-h-[650px]">
            <p className="text-gray-500 text-lg">
              Your watchlist is currently empty
            </p>
            <button
              className="rounded-lg bg-customNavyBlue px-6 py-3 text-white font-semibold hover:bg-opacity-90 transition"
              onClick={addClicked}
            >
              Add items to Watchlist
            </button>
          </div>
        ) : (
          <CreateTables
            inputTableType="watchlistPage"
            userData={userData}
            onSuccess={handleAddedSuccessfully}
          />
        )
      ) : (
        <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2 }} />
      )}

      {/* Modal */}
      {openModal && (
        <AddModal
          closeModal={closeModal}
          onSuccess={handleAddedSuccessfully}
          modalType="watchlist"
        />
      )}
    </div>
  );
};

export default WatchlistPage;
