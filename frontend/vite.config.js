import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// for testing

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
  },
  server: {
    // proxy: {
    //   "/user": "http://localhost:3000", // Change 'backend' to 'localhost'
    //   "/auth": "http://localhost:3000",
    //   "/api": "http://localhost:3000",
    // },
    proxy: {
      '/user': 'http://backend:3000', // for docker setup
      '/auth': 'http://backend:3000',
      '/api': 'http://backend:3000',
    },
  },
});
