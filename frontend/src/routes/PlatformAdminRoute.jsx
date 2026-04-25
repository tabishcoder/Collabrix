import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { isPlatformAdmin } from "../utils/roles";
import PlatformAdminDashboard from "../features/dashboard/PlatformAdminDashboard";

export default function PlatformAdminRoute() {
  const user = useSelector((s) => s.auth.user);
  if (!isPlatformAdmin(user)) {
    return <Navigate to="/dashboard" replace />;
  }
  return <PlatformAdminDashboard />;
}
