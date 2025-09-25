import React, { useEffect, useState } from "react";
import CreateTables from "../components/CreateTables.jsx";
import AddModal from "../components/AddModal.jsx";
import { fetchUserData } from "../services/userAPI.jsx";
import { Skeleton } from "@mui/material";

const WalletPage = () => {
  const [openModal, setOpenModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [walletData, setWalletData] = useState();
  const [userData, setUserData] = useState();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await fetchUserData();
        setWalletData(user.wallet);
        setUserData(user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadUserData();
  }, [refreshKey]);

  const newItem = () => setOpenModal(true);
  const closeModal = () => setOpenModal(false);
  const handleAddedSuccessfully = () => setRefreshKey((prev) => prev + 1);

  return (
    <div className="min-h-screen px-6 py-4 bg-gray-50">
      <div className="flex justify-between items-center mb-6">
        {isLoading ? (
          <>
            <Skeleton variant="text" width={250} height={50} />
            <Skeleton variant="rectangular" width={150} height={40} />
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-customNavyBlue text-left">
              My Crypto Wallet
            </h2>

            {walletData && walletData.length > 0 && (
              <button
                onClick={newItem}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 font-semibold rounded-lg shadow"
              >
                Add New Crypto
              </button>
            )}
          </>
        )}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton variant="rectangular" height={400} />
        </div>
      ) : (
        <>
          {walletData ? (
            walletData.length === 0 ? (
              <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-8 px-4 text-center gap-4 min-h-[650px]">
                <p className="text-gray-500 text-lg">Your wallet is empty</p>
                <button
                  className="rounded-lg bg-customNavyBlue px-6 py-3 text-white font-semibold hover:bg-opacity-90 transition"
                  onClick={newItem}
                >
                  Add Crypto to Wallet
                </button>
              </div>
            ) : (
              <CreateTables
                inputTableType="walletPage"
                userData={userData}
                onSuccess={handleAddedSuccessfully}
              />
            )
          ) : null}
        </>
      )}

      {openModal && (
        <AddModal
          closeModal={closeModal}
          onSuccess={handleAddedSuccessfully}
          modalType="wallet"
        />
      )}
    </div>
  );
};

export default WalletPage;
