import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { getMe } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getMe()); // Restore login on refresh
  }, [dispatch]);

  return <AppRoutes />  
}
