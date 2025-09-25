import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { useEffect } from "react";
import LoginPage from "./pages/LoginPage.jsx";
import Dashboard from "./pages/DashboardPage.jsx";
import WatchlistPage from "./pages/WatchlistPage";
import RegisterPage from "./pages/RegisterPage.jsx";
import SavedPage from "./pages/SavedPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import Navigation from "./components/Navigation.jsx";
import ProfilePage from "./pages/ProfilePage";
import EditProfile from "./pages/EditProfile";
import WalletPage from "./pages/WalletPage";
import NewsPage from "./pages/NewsPage";
import ChatListPage from "./pages/ChatlistPage.jsx";
import CryptoDetailsPage from "./pages/CryptoDetailsPage";
import CryptoExplorePage from "./pages/CryptoExplorePage";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  useEffect(() => {
    document.title = "CryptoChat";
  }, []);

  return (
    <BrowserRouter>
       <ScrollToTop /> 
      <Main />  
    </BrowserRouter>
  );
}

function Main() {
  const location = useLocation();
  const noNavRoutes = ["/", "/register", "/forgot"];

  return (
    <div className="min-h-screen bg-neutral-50">
      {!noNavRoutes.includes(location.pathname) && <Navigation />}

      <div
        className={`${
          !noNavRoutes.includes(location.pathname) 
            ? "pt-16 pb-20 md:pt-20 md:pb-4" 
            : ""
        }`}
      >
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/chat" element={<ChatListPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route
            path="/password/reset/:userId/:token"
            element={<ResetPasswordPage />}
          />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/editProfile" element={<EditProfile />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/news" element={<NewsPage />} />
          <Route
            path="/cryptoDetails/:cryptoId"
            element={<CryptoDetailsPage />}
          />
          <Route path="/cryptos" element={<CryptoExplorePage />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
