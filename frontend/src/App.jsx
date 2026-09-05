import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import React, { lazy, Suspense, useEffect } from "react";
import Navigation from "./components/Navigation.jsx";
import ScrollToTop from "./components/ScrollToTop";
import ProtectedRoute from "./components/ProtectedRoute";

const LoginPage = lazy(() => import("./pages/LoginPage.jsx"));
const Dashboard = lazy(() => import("./pages/DashboardPage.jsx"));
const WatchlistPage = lazy(() => import("./pages/WatchlistPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage.jsx"));
const SavedPage = lazy(() => import("./pages/SavedPage.jsx"));
const ChatPage = lazy(() => import("./pages/ChatPage.jsx"));
const ForgotPasswordPage = lazy(() => import("./pages/ForgotPasswordPage.jsx"));
const ResetPasswordPage = lazy(() => import("./pages/ResetPasswordPage.jsx"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const NewsPage = lazy(() => import("./pages/NewsPage"));
const ChatListPage = lazy(() => import("./pages/ChatlistPage.jsx"));
const CryptoDetailsPage = lazy(() => import("./pages/CryptoDetailsPage"));
const CryptoExplorePage = lazy(() => import("./pages/CryptoExplorePage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const protectedPage = (page) => <ProtectedRoute>{page}</ProtectedRoute>;

const PageLoading = () => (
  <div
    className="min-h-[60vh] flex items-center justify-center text-neutral-600"
    role="status"
    aria-live="polite"
  >
    Loading…
  </div>
);

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
        <Suspense fallback={<PageLoading />}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/dashboard" element={protectedPage(<Dashboard />)} />
            <Route path="/watchlist" element={protectedPage(<WatchlistPage />)} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/saved" element={protectedPage(<SavedPage />)} />
            <Route path="/chat" element={protectedPage(<ChatListPage />)} />
            <Route path="/chat/:chatId" element={protectedPage(<ChatPage />)} />
            <Route path="/forgot" element={<ForgotPasswordPage />} />
            <Route
              path="/password/reset/:userId/:token"
              element={<ResetPasswordPage />}
            />
            <Route path="/profile" element={protectedPage(<ProfilePage />)} />
            <Route path="/editProfile" element={protectedPage(<EditProfile />)} />
            <Route path="/wallet" element={protectedPage(<WalletPage />)} />
            <Route path="/news" element={protectedPage(<NewsPage />)} />
            <Route
              path="/cryptoDetails/:cryptoId"
              element={protectedPage(<CryptoDetailsPage />)}
            />
            <Route path="/cryptos" element={protectedPage(<CryptoExplorePage />)} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

export default App;
