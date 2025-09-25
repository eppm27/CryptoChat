import React, { useState, useEffect } from "react";
import CreateTables from "../components/CreateTables.jsx";
import AddModal from "../components/AddModal.jsx";
import { fetchUserData } from "../services/userAPI.jsx";
import { Skeleton } from "@mui/material";

const SavedPage = () => {
  const [refreshKey, setRefreshKey] = useState(0);
  const [openModal, setOpenModal] = useState(false);
  const [savedPromptsData, setSavedPromptsData] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await fetchUserData();
        setUserData(user);
        setSavedPromptsData(user.savedPrompts);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    loadUserData();
  }, [refreshKey]);

  const addClicked = () => setOpenModal(true);
  const closeModal = () => setOpenModal(false);

  const handleAddedSuccessfully = () => {
    setRefreshKey((prev) => prev + 1); // table refresh
  };

  return (
    <div className="min-h-screen px-6 py-4 bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        {savedPromptsData ? (
          <>
            <h2 className="text-3xl font-bold text-customNavyBlue text-left">
              Saved Prompts
            </h2>
            {savedPromptsData.length > 0 && (
              <button
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 font-semibold rounded-lg shadow"
                onClick={addClicked}
              >
                Add New Prompt
              </button>
            )}
          </>
        ) : (
          <>
            <Skeleton variant="text" width={220} height={40} />
            <Skeleton variant="rectangular" width={140} height={40} />
          </>
        )}
      </div>

      {/* Saved Prompts Table */}
      {savedPromptsData ? (
        savedPromptsData.length === 0 ? (
          <div className="w-full border-2 border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center py-8 px-4 text-center gap-4 min-h-[650px]">
            <p className="text-gray-500 text-lg">You have no saved prompts</p>
            <button
              className="rounded-lg bg-customNavyBlue px-6 py-3 text-white font-semibold hover:bg-opacity-90 transition"
              onClick={addClicked}
            >
              Add prompts to Saved
            </button>
          </div>
        ) : (
          <CreateTables
            inputTableType="savedPage"
            userData={userData}
            onSuccess={handleAddedSuccessfully}
          />
        )
      ) : (
        <Skeleton variant="rectangular" height={600} sx={{ borderRadius: 2 }} />
      )}

      {/* Add Modal */}
      {openModal && (
        <AddModal
          closeModal={closeModal}
          onSuccess={handleAddedSuccessfully}
          modalType="savedPrompts"
        />
      )}
    </div>
  );
};

export default SavedPage;
