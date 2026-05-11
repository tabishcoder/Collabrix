import { Navigate, Outlet } from "react-router-dom";
import { useSelector } from "react-redux";
import { isPlatformAdmin } from "../utils/roles";

export default function PlatformAdminRoute() {
  const user = useSelector((s) => s.auth.user);
  if (!isPlatformAdmin(user)) {
    return <Navigate to="/welcome" replace />;
  }
  return <Outlet />;
}
