import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DefaultImage from "../assets/default-pfp.png";
import { logoutUser, fetchUserData } from "../services/userAPI";
import { Card, Button, Skeleton, Badge } from "../components/ui";
import { cn } from "../utils/cn";

const ProfilePage = () => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card className="p-4 text-center">
      <div
        className={cn(
          "mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-3",
          color === "primary" && "bg-primary-100 text-primary-600",
          color === "success" && "bg-success-100 text-success-600",
          color === "secondary" && "bg-secondary-100 text-secondary-600"
        )}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-sm text-neutral-600">{title}</p>
    </Card>
  );

  const QuickAction = ({
    title,
    description,
    icon,
    onClick,
    variant = "default",
  }) => (
    <Card
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 hover:shadow-lg",
        "bg-white/80 backdrop-blur-sm group"
      )}
      onClick={onClick}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            variant === "danger"
              ? "bg-danger-100 text-danger-600"
              : "bg-primary-100 text-primary-600"
          )}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
            {title}
          </h3>
          <p className="text-sm text-neutral-600">{description}</p>
        </div>
        <svg
          className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </div>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
        <div className="max-w-2xl mx-auto">
          {/* Profile Header Skeleton */}
          <Card className="p-6 mb-6 text-center">
            <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
            <Skeleton className="h-6 w-48 mx-auto mb-2" />
            <Skeleton className="h-4 w-64 mx-auto mb-4" />
            <Skeleton className="h-10 w-32 mx-auto" />
          </Card>

          {/* Stats Skeleton */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-4 text-center">
                <Skeleton className="w-12 h-12 rounded-full mx-auto mb-3" />
                <Skeleton className="h-6 w-8 mx-auto mb-1" />
                <Skeleton className="h-4 w-16 mx-auto" />
              </Card>
            ))}
          </div>

          {/* Actions Skeleton */}
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-primary-50/30 p-4 pb-20 lg:pb-4">
      <div className="max-w-2xl mx-auto">
        {/* Profile Header */}
        <Card className="p-6 mb-6 text-center bg-white/80 backdrop-blur-sm">
          <div className="relative inline-block mb-4">
            <img
              src={userData?.profileImage || DefaultImage}
              alt="Profile"
              className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
            />
            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-success-500 rounded-full border-2 border-white"></div>
          </div>

          <h1 className="text-2xl font-bold text-neutral-900 mb-1">
            {userData
              ? `${userData.firstName} ${userData.lastName}`
              : "User Name"}
          </h1>
          <p className="text-neutral-600 mb-4">{userData?.email}</p>

          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary">
              Member since{" "}
              {new Date(userData?.createdAt || Date.now()).getFullYear()}
            </Badge>
          </div>

          <Button
            variant="outline"
            onClick={() => navigate("/editProfile")}
            className="gap-2"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Edit Profile
          </Button>
        </Card>

        {/* Settings Section */}
        <Card className="p-4 mb-6">
          <h3 className="font-semibold text-neutral-900 mb-4">
            Account Settings
          </h3>
          <div className="space-y-3">
            <button
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left"
              onClick={() => navigate("/editProfile")}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-neutral-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <span className="text-neutral-700">Account Information</span>
              </div>
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-neutral-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5V7a9.5 9.5 0 0119 0v10z"
                    />
                  </svg>
                </div>
                <span className="text-neutral-700">Notifications</span>
              </div>
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>

            <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-50 transition-colors text-left">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-neutral-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <span className="text-neutral-700">Privacy & Security</span>
              </div>
              <svg
                className="w-4 h-4 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </Card>

        {/* Logout */}
        <Card className="p-4">
          <Button
            variant="danger"
            size="lg"
            className="w-full"
            onClick={() => setShowLogoutConfirm(true)}
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </Button>
        </Card>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2 text-center">
                Sign Out
              </h3>
              <p className="text-neutral-600 text-center mb-6">
                Are you sure you want to sign out of your account?
              </p>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleLogout}
                >
                  Sign Out
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
