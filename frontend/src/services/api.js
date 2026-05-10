import axios from "axios";
import {
  setAuthTokens,
  setAccessTokenOnly,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
} from "./authTokens";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const access = getAccessToken();
  if (access) {
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// ------------------------------
// Refresh control state
// ------------------------------
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    const url = response.config?.url || "";
    const d = response.data;
    if (url.includes("/auth/login") && d?.accessToken && d?.refreshToken) {
      setAuthTokens(d.accessToken, d.refreshToken);
    } else if (url.includes("/auth/refresh") && d?.accessToken) {
      setAccessTokenOnly(d.accessToken);
    } else if (url.includes("/auth/logout") && d?.clearedTokens) {
      clearAuthTokens();
    }
    return response;
  },

  async (error) => {
    const originalRequest = error.config;

    if (!error.response) {
      return Promise.reject(error);
    }

    if (error.response.status === 402) {
      clearAuthTokens();
      return Promise.reject(error);
    }

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !String(originalRequest.url || "").includes("/auth/refresh")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        const rt = getRefreshToken();
        await api.post("/auth/refresh", rt ? { refreshToken: rt } : {});

        processQueue(null);

        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearAuthTokens();

        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
