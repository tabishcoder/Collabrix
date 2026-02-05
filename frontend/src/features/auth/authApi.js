import api from "../../services/api";

export const registerApi = (data)=> api.post("/auth/register" , data);


export const loginApi = (data) => api.post("/auth/register", data);

export const logoutApi = ()=> api.post("/auth/logout");

export const verifyOtpApi = (data) => api.post("/auth/verify-otp", data);

export const resentOtpApi = (data) => api.post("/auth/resend-otp", data);

export const getMeApi = (data) => api.get("/users/me",  data);

export const requestResetPasswordApi = (data) =>
  api.post("auth/request-reset-password", data);

export const restPasswordApi = (data) =>
  api.post("auth/request-reset-password", data);

