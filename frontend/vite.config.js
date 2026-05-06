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
        target:
          "https://collabrix-cugaaubxb9hngqg9.southeastasia-01.azurewebsites.net",
        changeOrigin: true,
      
      },
    },
  },
});
