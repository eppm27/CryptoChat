import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";
// for testing

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "happy-dom",
  },
  server: {
    proxy: {
      '/user': process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
      '/auth': process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
      '/api': process.env.VITE_PROXY_TARGET || 'http://localhost:3000',
    },
  },
});
