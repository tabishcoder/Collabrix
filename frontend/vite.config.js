import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss(),react()],
  build: {
    chunkSizeWarningLimit: 6000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@azure/communication-calling")) return "acs-calling";
          if (id.includes("@azure/communication-common")) return "acs-common";
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:3000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:3000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
