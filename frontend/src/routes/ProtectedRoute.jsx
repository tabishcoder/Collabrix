import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";
import { fetchSpaces } from "../features/spaces/spaceSlice";
import WorkspaceGate from "../features/spaces/WorkspaceGate";

export default function ProtectedRoute() {
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((s) => s.auth);
  const { activeSpace, initialized } = useSelector((s) => s.spaces);

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

  if (!activeSpace) return <WorkspaceGate />;

  return <Outlet />;
}
