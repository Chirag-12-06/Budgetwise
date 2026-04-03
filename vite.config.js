import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/ml-service/model.pkl",
        "**/ml-service/user_preferences_*.json",
        "**/ml-service/__pycache__/**",
        "**/ml-service/*.pyc",
      ],
    },
  },
});
