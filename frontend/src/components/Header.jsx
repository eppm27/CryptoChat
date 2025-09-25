import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const location = useLocation();
  const currentPage = location.pathname;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  const baseMenuSets = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/chat", label: "Chats" },
    { path: "/watchlist", label: "Watchlist" },
    { path: "/saved", label: "Saved" },
    { path: "/wallet", label: "Wallet" },
    { path: "/news", label: "News" },
    { path: "/cryptos", label: "Explore" },
  ];

  const getMenuSet = (currentPage) => {
    if (/^\/chat\/[^/]+$/.test(currentPage)) {
      return baseMenuSets.filter((item) => item.path !== "/chat");
    }

    return baseMenuSets.filter((item) => item.path !== currentPage);
  };

  const pageTitles = {
    "/chat": "Chatlist",
    "/saved": "Saved",
    "/watchlist": "Watchlist",
    "/profile": "Profile",
    "/editProfile": "Profile Details",
    "/wallet": "Wallet",
    "/news": "News",
    "/cryptos": "Explore",
  };

  const getPageTitle = (currentPage) => {
    if (/^\/chat\/[^/]+$/.test(currentPage)) {
      return "Chat";
    }

    if (/^\/cryptoDetails\/[^/]+$/.test(currentPage)) {
      return "Details";
    }

    return pageTitles[currentPage] || "Dashboard";
  };

  const headerTitle = getPageTitle(currentPage);

  return (
    <header className="bg-customNavyBlue text-white px-6 py-4 shadow-md fixed z-[999] w-full">
      <div className="flex items-center justify-between relative">
        {/* Left: Hamburger */}
        <button
          onClick={toggleMenu}
          className="hover:bg-white hover:bg-opacity-10 p-2 rounded-full transition"
          aria-label="Toggle Menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="28"
            viewBox="0 -960 960 960"
            width="28"
            fill="#FFFFFF"
          >
            <path d="M120-240v-66.67h720V-240H120Zm0-206.67v-66.66h720v66.66H120Zm0-206.66V-720h720v66.67H120Z" />
          </svg>
        </button>

        {/* Center: Page Title */}
        <h1 className="text-xl font-semibold tracking-wide">
          {headerTitle || "Dashboard"}
        </h1>

        {/* Right: Profile Icon */}
        <div
          className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center shadow-inner"
          onClick={() => navigate("/profile")}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="28"
            viewBox="0 -960 960 960"
            width="28"
            fill="#FFFFFF"
          >
            <path d="M480-315.33q-60 0-113.17 22.5-53.16 22.5-94.33 61.5h415q-41.17-39-94.33-61.5Q540-315.33 480-315.33ZM480-426q41 0 70.5-29.5T580-526q0-41-29.5-70.5T480-626q-41 0-70.5 29.5T380-526q0 41 29.5 70.5T480-426ZM480-80q-82 0-155-31.5T198-197.5Q143-252 111.5-324.5T80-480q0-82 31.5-155t86.5-127q55-54 128-85.5T480-880q82 0 155 31.5T762-762.5q55 54.5 86.5 127T880-480q0 82-31.5 155.5T762-197.5q-55 53.5-128 85T480-80Z" />
          </svg>
        </div>
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          className="absolute top-full left-0 mt-2 ml-2 bg-white text-gray-800 rounded-lg w-52 shadow-superdark border border-gray-200 z-[999] animate-fade-in"
          data-testid="dropdown-menu"
        >
          <ul className="divide-y divide-gray-200">
            {getMenuSet(currentPage).map((term) => (
              <li key={term.path}>
                <Link
                  to={term.path}
                  className="block px-4 py-3 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {term.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
};

export default Header;
