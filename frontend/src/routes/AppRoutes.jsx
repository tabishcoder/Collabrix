import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

import Login from "../features/auth/Login";
import Register from "../features/auth/Register";
import VerifyOtp from "../features/auth/VerifyOtp";
import Dashboard from "../features/dashboard/Dashboard";

import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoutes";
import ForgotPasswordRequest from "../features/auth/ForgotPasswordRequest.jsx";
import ResetPassword from "../features/auth/ResetPassword.jsx";
import PublicLayout from "../layouts/PublicLayout.jsx";
import AppLayout from "../layouts/AppLayout.jsx";

export default function AppRoutes() {
  const { loading } = useSelector((state) => state.auth);

  // Show loading screen while auth status is being checked
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Checking authentication...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public routes (login/register/verify-otp) */}
      <Route element={<PublicLayout/>}>
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPasswordRequest />} />
          <Route path="/verify-otp/:userId" element={<VerifyOtp />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>
      </Route>

      {/* Protected routes (dashboard) */}
      <Route element={<AppLayout/>}>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>
      </Route>

      {/* Catch-all: redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
