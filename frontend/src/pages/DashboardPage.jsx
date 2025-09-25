import React, { useEffect, useState, useMemo } from "react";
import addButton from "../assets/add-circle-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";
import CreateTables from "../components/CreateTables.jsx";
import CreateQuickStartPrompts from "../components/QuickStartPrompts.jsx";
import sendIcon from "../assets/plain-svgrepo-com.svg";
import { fetchUserData } from "../services/userAPI.jsx";
import NewsPreview from "../components/NewsPreview";
import { Skeleton } from "@mui/material";

const DashboardPage = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    document.title = "Dashboard Page";
    const loadUserData = async () => {
      try {
        const user = await fetchUserData();
        setUserData(user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    loadUserData();
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 px-2 py-4 space-y-1">
      {/* Greeting */}
      <div className="text-center">
        {userData ? (
          <>
            <h1 className="text-2xl font-bold text-gray-800">
              Welcome, {userData.firstName}
            </h1>
            <p className="text-md text-gray-500 mt-2">
              Start today’s financial journey here!
            </p>
          </>
        ) : (
          <>
            <Skeleton
              variant="text"
              width={200}
              height={30}
              sx={{ margin: "auto" }}
            />
            <Skeleton
              variant="text"
              width={250}
              height={20}
              sx={{ margin: "auto", marginTop: "8px" }}
            />
          </>
        )}
      </div>

      {/* Watchlist Section */}
      <section className="rounded-2xl p-4 sm:p-8 space-y-1">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-customNavyBlue">
            Watchlist
          </h2>
          {userData ? (
            userData.watchlist?.length > 0 ? (
              <img
                src={addButton}
                alt="Add"
                className="w-6 h-6 cursor-pointer hover:scale-110 transition"
                onClick={() => navigate("/watchlist")}
              />
            ) : (
              <Skeleton variant="circular" width={24} height={24} />
            )
          ) : (
            <Skeleton variant="circular" width={24} height={24} />
          )}
        </div>
        {userData ? (
          userData.watchlist?.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl text-center py-10">
              <p className="text-gray-500 mb-4">Your watchlist is empty</p>
              <button
                className="bg-customNavyBlue text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
                onClick={() => navigate("/watchlist")}
              >
                Add to Watchlist
              </button>
            </div>
          ) : (
            <CreateTables inputTableType="watchlist" userData={userData} />
          )
        ) : (
          <Skeleton
            variant="rectangular"
            height={150}
            sx={{ borderRadius: 2 }}
          />
        )}
      </section>

      {/* Saved Prompts Section */}
      <section className="rounded-2xl p-4 sm:p-8 space-y-1">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-customNavyBlue">Saved</h2>
          {userData ? (
            userData.savedPrompts?.length > 0 ? (
              <img
                src={addButton}
                alt="Add"
                className="w-6 h-6 cursor-pointer hover:scale-110 transition"
                onClick={() => navigate("/saved")}
              />
            ) : (
              <Skeleton variant="circular" width={24} height={24} />
            )
          ) : (
            <Skeleton variant="circular" width={24} height={24} />
          )}
        </div>
        {userData ? (
          userData.savedPrompts?.length === 0 ? (
            <div className="border-2 border-dashed rounded-xl text-center py-10">
              <p className="text-gray-500 mb-4">No saved prompts yet</p>
              <button
                className="bg-customNavyBlue text-white px-6 py-2 rounded-lg hover:bg-opacity-90"
                onClick={() => navigate("/saved")}
              >
                Add to Saved
              </button>
            </div>
          ) : (
            <CreateTables inputTableType="savedPrompt" userData={userData} />
          )
        ) : (
          <Skeleton
            variant="rectangular"
            height={150}
            sx={{ borderRadius: 2 }}
          />
        )}
      </section>

      {/* News Section */}
      <section className="rounded-2xl p-4 sm:p-8 space-y-1">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-customNavyBlue">
            Latest News
          </h2>
          {userData ? (
            <button
              onClick={() => navigate("/news")}
              className="text-sm text-blue-600 hover:underline"
            >
              View All
            </button>
          ) : (
            <Skeleton variant="text" width={80} />
          )}
        </div>
        {userData ? (
          <NewsPreview />
        ) : (
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ borderRadius: 2 }}
          />
        )}
      </section>

      {/* Floating Chat Button */}
      <button
        onClick={handleNewChat}
        className="fixed bottom-6 right-6 bg-yellow-400 hover:bg-yellow-500 text-white p-4 rounded-full shadow-lg transition"
        title="Start new chat"
      >
        <img src={sendIcon} alt="Go to Chat" className="w-6 h-6" />
      </button>

      {/* Quick Start Prompts */}
      <div className="flex flex-col mt-4 px-4">
        <div className="flex flex-row justify-between w-full pb-1 items-center">
          <h2 className="text-xl font-semibold text-customNavyBlue mb-2">
            Quick Start
          </h2>
        </div>
        {userData ? (
          quickStartPrompts
        ) : (
          <Skeleton
            variant="rectangular"
            height={200}
            sx={{ borderRadius: 2 }}
          />
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
