import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe } from "./features/auth/authSlice";
import { fetchActiveTimer } from "./features/time/timeTrackingSlice";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((s) => s.auth.isAuthenticated);

  useEffect(() => {
    dispatch(getMe()); // Restore login on refresh
  }, [dispatch]);

  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchActiveTimer());
    }
  }, [dispatch, isAuthenticated]);

  return <AppRoutes />;
}
