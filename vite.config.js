import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: {
      ignored: [
        "**/apps/ml-service/model.pkl",
        "**/apps/ml-service/user_preferences_*.json",
        "**/apps/ml-service/__pycache__/**",
        "**/apps/ml-service/*.pyc",
        "**/ml-service/model.pkl",
        "**/ml-service/user_preferences_*.json",
        "**/ml-service/__pycache__/**",
        "**/ml-service/*.pyc",
      ],
    },
  },
});
