import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { fetchSpaces } from "../features/spaces/spaceSlice";
import { isPlatformAdmin } from "../utils/roles";

export default function ProtectedRoute() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { isAuthenticated, user } = useSelector((s) => s.auth);
  const { activeSpace, initialized } = useSelector((s) => s.spaces);
  const adminBypassGate = isPlatformAdmin(user) && !activeSpace;

  useEffect(() => {
    if (isAuthenticated && !initialized) {
      dispatch(fetchSpaces());
    }
  }, [dispatch, isAuthenticated, initialized]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!initialized) {
    return (
      <div className="h-screen flex items-center justify-center text-[var(--color-text-primary)]">
        Checking workspace...
      </div>
    );
  }

  // If the user has no workspace selected / available, keep them on the dashboard (welcome/overview).
  if (!activeSpace && !adminBypassGate) {
    const allowWithoutWorkspace = new Set([
      "/dashboard",
      "/welcome",
      "/profile",
      "/settings",
      "/help/faq",
    ]);
    return allowWithoutWorkspace.has(location.pathname)
      ? <Outlet />
      : <Navigate to="/welcome" replace />;
  }

  return <Outlet />;
}
