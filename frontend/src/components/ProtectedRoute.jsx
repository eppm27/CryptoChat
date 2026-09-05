import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { fetchUserData } from "../services/userAPI";
import { isDemoMode } from "../demo/demoStore";

const ProtectedRoute = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState(isDemoMode() ? "allowed" : "checking");

  useEffect(() => {
    if (isDemoMode()) return;
    let active = true;
    fetchUserData()
      .then(() => active && setStatus("allowed"))
      .catch(() => active && setStatus("denied"));
    return () => { active = false; };
  }, []);

  if (status === "checking") {
    return <div className="min-h-[60vh] flex items-center justify-center text-neutral-600" role="status">Checking your session…</div>;
  }
  if (status === "denied") {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }
  return children;
};

export default ProtectedRoute;
