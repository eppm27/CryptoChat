import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultImage from "../assets/default-pfp.png";
import { logoutUser, fetchUserData } from "../services/userAPI";
import CreateTables from "../components/CreateTables.jsx";
import { Skeleton } from "@mui/material";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  useEffect(() => {
    // fetch user data
    const loadUserData = async () => {
      try {
        const user = await fetchUserData();
        setUserData(user);
      } catch (err) {
        console.error("Error fetching user data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  return (
    <div className="flex flex-col items-center px-8 pb-8 bg-gray-50 min-h-screen">
      {isLoading ? (
        <Skeleton
          variant="circular"
          width={160}
          height={160}
          className="mt-8 mb-4"
        />
      ) : (
        <img
          src={DefaultImage}
          alt="Profile"
          className="rounded-full w-1/3 mt-8 border-gray-500 border-2 mb-4"
        />
      )}

      {isLoading ? (
        <div className="flex flex-col items-center gap-2 mb-4">
          <Skeleton variant="text" width={200} height={30} />
          <Skeleton variant="text" width={250} height={25} />
        </div>
      ) : (
        <>
          <p className="font-bold text-2xl">{`${userData.firstName} ${userData.lastName}`}</p>
          <p className="text-large mb-4">{userData.email}</p>
        </>
      )}

      {isLoading ? (
        <Skeleton
          variant="rectangular"
          width={100}
          height={40}
          className="mb-4"
        />
      ) : (
        <button
          className="bg-gray-300 border h-8 w-24 rounded-md mb-4"
          onClick={() => navigate("/editProfile")}
        >
          Edit Profile
        </button>
      )}

      <div className="flex flex-col w-full">
        <div className="flex flex-row justify-between items-center mt-4 mb-2">
          {isLoading ? (
            <>
              <Skeleton variant="text" width={200} height={30} />
              <Skeleton variant="rectangular" width={80} height={30} />
            </>
          ) : (
            <>
              <p className="font-semibold text-xl text-gray-800">
                Crypto Wallet:
              </p>
              <button
                className="bg-gray-300 border h-8 w-20 rounded-md"
                onClick={() => navigate("/wallet")}
              >
                Edit
              </button>
            </>
          )}
        </div>

        {isLoading ? (
          <Skeleton variant="rectangular" height={300} />
        ) : (
          <CreateTables inputTableType="walletProfile" userData={userData} />
        )}
      </div>

      {isLoading ? (
        <Skeleton
          variant="rectangular"
          width="100%"
          height={60}
          className="mt-20"
        />
      ) : (
        <button
          className="bg-gray-500 mt-20 text-white font-bold text-2xl w-full h-16 rounded-lg shadow-md hover:bg-[#1e3a8a] active:bg-[#162d6a] transition"
          onClick={handleLogout}
        >
          Logout
        </button>
      )}
    </div>
  );
};

export default ProfilePage;
