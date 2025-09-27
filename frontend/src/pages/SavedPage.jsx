import React, { useState, useEffect } from "react";
import CreateTables from "../components/CreateTables.jsx";
import AddModal from "../components/AddModal.jsx";
import { fetchUserData } from "../services/userAPI.jsx";
import { Card, Button, Skeleton, Badge } from "../components/ui/index";

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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="p-6 bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            {savedPromptsData ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <span className="text-2xl">💾</span>
                  </div>
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      Saved Prompts
                    </h1>
                    <p className="text-sm lg:text-base text-gray-600 mt-1">
                      Your collection of favorite AI prompts
                    </p>
                    {savedPromptsData.length > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {savedPromptsData.length}{" "}
                        {savedPromptsData.length === 1 ? "prompt" : "prompts"}{" "}
                        saved
                      </Badge>
                    )}
                  </div>
                </div>
                {savedPromptsData.length > 0 && (
                  <Button onClick={addClicked} className="w-full sm:w-auto">
                    Add New Prompt
                  </Button>
                )}
              </>
            ) : (
              <>
                <div className="flex items-center gap-3 flex-1">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-8 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                </div>
                <Skeleton className="h-10 w-36" />
              </>
            )}
          </div>
        </Card>

        {/* Saved Prompts Table */}
        {savedPromptsData ? (
          savedPromptsData.length === 0 ? (
            <Card className="p-8 lg:p-12 text-center bg-white/80 backdrop-blur-sm">
              <div className="space-y-4 lg:space-y-6">
                <div className="text-4xl lg:text-6xl mb-2 lg:mb-4">📝</div>
                <div className="space-y-2">
                  <h3 className="text-lg lg:text-xl font-semibold text-gray-900">
                    No saved prompts yet
                  </h3>
                  <p className="text-sm lg:text-base text-gray-600 max-w-md mx-auto">
                    Save your favorite AI prompts for quick access. Build a
                    personal library of useful conversations and queries.
                  </p>
                </div>
                <Button
                  onClick={addClicked}
                  size="lg"
                  className="mt-4 lg:mt-6 w-full sm:w-auto"
                >
                  Save Your First Prompt
                </Button>
              </div>
            </Card>
          ) : (
            <div className="lg:bg-white/80 lg:backdrop-blur-sm lg:rounded-xl lg:border lg:border-gray-200 lg:overflow-hidden">
              <CreateTables
                inputTableType="savedPage"
                userData={userData}
                onSuccess={handleAddedSuccessfully}
              />
            </div>
          )
        ) : (
          <Card className="p-6 bg-white/80 backdrop-blur-sm">
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex items-start space-x-4 p-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                    <div className="flex items-center space-x-2 mt-2">
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-8 rounded" />
                    <Skeleton className="h-8 w-8 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Add Modal */}
        {openModal && (
          <AddModal
            closeModal={closeModal}
            onSuccess={handleAddedSuccessfully}
            modalType="savedPrompts"
            userData={userData}
          />
        )}
      </div>
    </div>
  );
};

export default SavedPage;
