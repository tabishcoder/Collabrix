import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Login           from "../features/auth/pages/Login";
import Register        from "../features/auth/pages/Register";
import VerifyOtp       from "../features/auth/pages/VerifyOtp";
import ForgotPassword  from "../features/auth/pages/ForgotPassword.jsx";
import ResetPassword   from "../features/auth/pages/ResetPassword.jsx";

import WorkspaceDashboard from "../features/dashboard/WorkspaceDashboard";
import PlatformAdminRoute from "./PlatformAdminRoute";
import AdminLayout from "../features/admin/AdminLayout";
import AdminDashboardPage from "../features/admin/AdminDashboardPage";
import AdminUsersPage from "../features/admin/AdminUsersPage";
import AdminWorkspacesPage from "../features/admin/AdminWorkspacesPage";
import AdminWorkspaceDetailPage from "../features/admin/AdminWorkspaceDetailPage";
import AdminAnalyticsPage from "../features/admin/AdminAnalyticsPage";
import ProjectsPage    from "../features/projects/ProjectsPage.jsx";
import TasksBoard      from "../features/tasks/TasksBoard.jsx";
import ChatsPage       from "../features/modules/ChatsPage.jsx";
import MeetingsPage    from "../features/modules/MeetingsPage.jsx";
import MeetingRoomPage from "../features/meetings/MeetingRoomPage.jsx";
import AIAssistantPage from "../features/modules/AIAssistantPage.jsx";
import JoinWorkspace   from "../features/invites/JoinWorkspace.jsx";
import ProfilePage     from "../features/profile/ProfilePage.jsx";
import SettingsPage    from "../features/settings/SettingsPage.jsx";
import FaqPage         from "../features/help/FaqPage.jsx";

import ProtectedRoute  from "./ProtectedRoute";
import PublicRoute     from "./PublicRoutes";
import PublicLayout    from "../layouts/PublicLayout.jsx";
import AppLayout       from "../layouts/AppLayout.jsx";
import FeatureGate     from "./FeatureGate";
import HomeEntry       from "./HomeEntry";
import { AuthLoadingSkeleton } from "../components/ui/Skeleton";

export default function AppRoutes() {
  const { loading } = useSelector((state) => state.auth);

  if (loading) {
    return <AuthLoadingSkeleton />;
  }

  return (
    <Routes>
      {/* Marketing landing for guests; signed-in users bounce to the app */}
      <Route path="/" element={<HomeEntry />} />

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
          <Route element={<FeatureGate />}>
            <Route path="/dashboard" element={<WorkspaceDashboard />} />
            <Route path="/welcome" element={<WorkspaceDashboard />} />

            <Route path="/admin" element={<PlatformAdminRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboardPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="workspaces" element={<AdminWorkspacesPage />} />
                <Route path="workspaces/:workspaceId" element={<AdminWorkspaceDetailPage />} />
                <Route path="analytics" element={<AdminAnalyticsPage />} />
              </Route>
            </Route>

            {/* Projects — boards are lg+ only (FeatureGate); routes remain for deep links */}
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
            <Route path="/meetings/:meetingId" element={<MeetingRoomPage />} />
            <Route path="/aibot"    element={<AIAssistantPage />} />

            {/* User */}
            <Route path="/profile"  element={<ProfilePage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/help/faq" element={<FaqPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
