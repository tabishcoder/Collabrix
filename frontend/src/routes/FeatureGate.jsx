import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useViewport } from "../hooks/useViewport";
import { isPlatformAdmin } from "../utils/roles";

/**
 * Enforces:
 * - No workspace → only dashboard / profile / settings
 * - < 360px → allow only dashboard (UX alert overlay is shown by AppLayout)
 * - 360..1023 → only overview + chats/meetings/aibot (no boards/projects/tasks UI)
 * - >= 1024 → full app
 */
export default function FeatureGate() {
  const location = useLocation();
  const { isTiny, isBetween, isLgUp } = useViewport();
  const activeSpace = useSelector((s) => s.spaces.activeSpace);
  const user = useSelector((s) => s.auth.user);
  const platformAdmin = isPlatformAdmin(user);

  const path = location.pathname || "/";

  // Tiny screens: keep it simple (dashboard only).
  if (isTiny) {
    const allowTiny =
      path === "/dashboard" ||
      path === "/welcome" ||
      (platformAdmin && path === "/admin");
    return allowTiny ? <Outlet /> : <Navigate to="/welcome" replace />;
  }

  // No workspace: only allow the welcome/dashboard + account pages.
  if (!activeSpace) {
    const allowNoWorkspace =
      path === "/dashboard" ||
      path === "/welcome" ||
      path === "/profile" ||
      path === "/settings" ||
      path === "/help/faq" ||
      (platformAdmin && path === "/admin");
    return allowNoWorkspace ? <Outlet /> : <Navigate to="/welcome" replace />;
  }

  // Medium screens: hide boards/projects; allow only key modules + overview.
  if (isBetween) {
    const allowBetween =
      path === "/dashboard" ||
      path === "/welcome" ||
      path.startsWith("/chats") ||
      path.startsWith("/meetings") ||
      path.startsWith("/aibot") ||
      path === "/profile" ||
      path === "/settings" ||
      path === "/help/faq";
    return allowBetween ? <Outlet /> : <Navigate to="/welcome" replace />;
  }

  // Large screens: full app.
  if (isLgUp) return <Outlet />;

  return <Outlet />;
}

