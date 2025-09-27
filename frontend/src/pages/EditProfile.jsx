import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultImage from "../assets/default-pfp.png";
import { fetchUserData, updateUserInfo } from "../services/userAPI";
import { message } from "antd";
import { Skeleton } from "@mui/material";

const EditProfile = () => {
  const navigate = useNavigate();
  const [pfp, setPfp] = useState();
  const [userData, setUserData] = useState();
  const [isLoading, setIsLoading] = useState(true);

  const saveUpdate = () => {
    const saveUpdateContent = async () => {
      try {
        const successMessage = await updateUserInfo({
          firstName: userData.firstName,
          lastName: userData.lastName,
          pfp: pfp,
        });
        message.success(successMessage);
      } catch (err) {
        console.error("update failed:", err);
      }
    };

    saveUpdateContent();
    navigate("/profile");
  };

  useEffect(() => {
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
    setPfp(DefaultImage);
  }, []);

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl px-8 py-10 w-full max-w-md flex flex-col items-center gap-6 border border-gray-200">
        {/* Info Section */}
        <div className="w-full flex flex-col gap-4">
          <div>
            <label className="block text-gray-600 text-sm font-medium mb-1">
              Name
            </label>
            {isLoading ? (
              <Skeleton variant="rectangular" width="100%" height={45} />
            ) : (
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  value={userData?.firstName || ""}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
                <input
                  type="text"
                  value={userData?.lastName || ""}
                  onChange={(e) =>
                    setUserData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                />
              </div>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 w-full mt-4">
          {isLoading ? (
            <>
              <Skeleton variant="rectangular" height={45} width="100%" />
              <Skeleton variant="rectangular" height={45} width="100%" />
            </>
          ) : (
            <>
              <button
                className="w-full py-2 px-4 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
                onClick={saveUpdate}
              >
                Save Changes
              </button>
              <button
                className="w-full py-2 px-4 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 transition"
                onClick={() => navigate("/profile")}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
