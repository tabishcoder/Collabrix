import api from "../../services/api";

export const registerApi = (data) => api.post("/auth/register", data);

export const loginApi = (data) => api.post("/auth/login", data);

export const verifyOtpApi = (data) => api.post("/auth/verify-otp", data);

export const resendOtpApi = (data) => api.post("/auth/resend-otp", data);

export const logoutApi = () => api.post("/auth/logout");

export const getMeApi = () => api.get("/users/me");

export const requestResetPasswordApi = (data) =>
  api.post("/auth/request-reset-password", data);

export const resetPasswordApi = (data) =>
  api.post("/auth/reset-password", data);
