import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

export default function RoleRoute({ role, children }) {
  const userRole = useSelector((state) => state.auth.user?.role);

  if (userRole !== role) {
    return <Navigate to="/login" />;
  }

  return children;
}
