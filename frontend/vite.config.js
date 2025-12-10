import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
export default defineConfig({
  plugins: [tailwindcss(),react()],
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
