import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMe } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";
import Navbar from "./components/Navbar/Navbar";

export default function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading } = useSelector((state) => state.auth);


  useEffect(() => {
    dispatch(getMe()); // Restore login on refresh
  }, [dispatch]);

  return (
    <>
      {isAuthenticated && <Navbar />}
      <AppRoutes />
    </>
  );
}
