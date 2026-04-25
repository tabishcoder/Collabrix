import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Login           from "../features/auth/pages/Login";
import Register        from "../features/auth/pages/Register";
import VerifyOtp       from "../features/auth/pages/VerifyOtp";
import ForgotPassword  from "../features/auth/pages/ForgotPassword.jsx";
import ResetPassword   from "../features/auth/pages/ResetPassword.jsx";

import WorkspaceDashboard from "../features/dashboard/WorkspaceDashboard";
import PlatformAdminRoute from "./PlatformAdminRoute";
import ProjectsPage    from "../features/projects/ProjectsPage.jsx";
import TasksBoard      from "../features/tasks/TasksBoard.jsx";
import ChatsPage       from "../features/modules/ChatsPage.jsx";
import MeetingsPage    from "../features/modules/MeetingsPage.jsx";
import AIAssistantPage from "../features/modules/AIAssistantPage.jsx";
import JoinWorkspace   from "../features/invites/JoinWorkspace.jsx";
import ProfilePage     from "../features/profile/ProfilePage.jsx";
import SettingsPage    from "../features/settings/SettingsPage.jsx";

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
          <Route path="/dashboard" element={<WorkspaceDashboard />} />
          <Route path="/admin" element={<PlatformAdminRoute />} />

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

          {/* Modules – scoped to active project (header picker) */}
          <Route path="/chats"    element={<ChatsPage />} />
          <Route path="/meetings" element={<MeetingsPage />} />
          <Route path="/aibot"    element={<AIAssistantPage />} />

          {/* User */}
          <Route path="/profile"  element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
