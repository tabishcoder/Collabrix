import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import LandingPage from "../features/marketing/LandingPage";

/** `/` — guests see marketing; signed-in users go straight to the app shell. */
export default function HomeEntry() {
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  if (isAuthenticated) return <Navigate to="/welcome" replace />;

  return <LandingPage />;
}
