import { Navigate, Outlet, useLocation } from "react-router-dom";

import LoadingState from "../components/feedback/LoadingState.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

function ProtectedRoute() {
  const { authenticated, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-100">
        <LoadingState label="در حال بررسی نشست کاربری..." />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
