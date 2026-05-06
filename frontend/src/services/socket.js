import { io } from "socket.io-client";

let socket;

/** Base URL for Socket.IO (same host as API, without `/api`). */
function socketBaseUrl() {
  const api = import.meta.env.VITE_API_URL || "";
  if (api) {
    return api.replace(/\/?api\/?$/i, "") || window.location.origin;
  }
  return window.location.origin;
}

export function getSocket() {
  if (!socket) {
    socket = io(socketBaseUrl(), {
      withCredentials: true,
      transports: ["websocket", "polling"],
      autoConnect: true,
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = undefined;
  }
}
