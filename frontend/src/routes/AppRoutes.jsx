import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Login           from "../features/auth/pages/Login";
import Register        from "../features/auth/pages/Register";
import VerifyOtp       from "../features/auth/pages/VerifyOtp";
import ForgotPassword  from "../features/auth/pages/ForgotPassword.jsx";
import ResetPassword   from "../features/auth/pages/ResetPassword.jsx";

import Dashboard       from "../features/dashboard/Dashboard";
import ProjectsPage    from "../features/projects/ProjectsPage.jsx";
import TasksBoard      from "../features/tasks/TasksBoard.jsx";
import JoinWorkspace   from "../features/invites/JoinWorkspace.jsx";

import ProtectedRoute  from "./ProtectedRoute";
import PublicRoute     from "./PublicRoutes";
import PublicLayout    from "../layouts/PublicLayout.jsx";
import AppLayout       from "../layouts/AppLayout.jsx";
import { AuthLoadingSkeleton } from "../components/ui/Skeleton";

export default function AppRoutes() {
  const { loading } = useSelector((state) => state.auth);

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Workspace invite (public – works logged-in or out) */}
      <Route path="/join-workspace" element={<JoinWorkspace />} />

      {/* Public auth routes */}
      <Route element={<PublicLayout />}>
        <Route element={<PublicRoute />}>
          <Route path="/login"            element={<Login />} />
          <Route path="/register"         element={<Register />} />
          <Route path="/forgot-password"  element={<ForgotPassword />} />
          <Route path="/verify-otp/:userId" element={<VerifyOtp />} />
          <Route path="/reset-password"   element={<ResetPassword />} />
        </Route>
      </Route>

      {/* Protected app routes */}
      <Route element={<AppLayout />}>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Projects */}
          <Route path="/projects" element={<ProjectsPage />}>
            <Route
              index
              element={
                <div className="p-6 text-[var(--color-text-secondary)]">
                  Select a project from the{" "}
                  <span className="font-medium text-[var(--color-text-primary)]">Project</span>{" "}
                  menu in the header.
                </div>
              }
            />
            <Route path=":projectId"        element={<TasksBoard />} />
            <Route path=":projectId/board"  element={<TasksBoard />} />
          </Route>

          {/* Modules – real implementations to come */}
          <Route path="/chats"    element={<Dashboard />} />
          <Route path="/meetings" element={<Dashboard />} />
          <Route path="/aibot"    element={<Dashboard />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
