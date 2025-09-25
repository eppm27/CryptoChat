import { defineConfig } from "vitest/config";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["frontend/**/*.test.{js,ts,jsx,tsx}"],
    mockReset: true,
    setupFiles: [resolve(__dirname, "./vitest.setup.js")],
    deps: {
      inline: [/@mui\/.*/], // Inline MUI dependencies to better handle them
    },

    moduleNameMapper: {
      // Handle CSS imports
      "\\.(css|less|scss)$": resolve(
        __dirname,
        "frontend/__mocks__/styleMock.js"
      ),
      // Handle specific MUI imports
      "@mui/x-data-grid/esm/index.css": resolve(
        __dirname,
        "frontend/__mocks__/styleMock.js"
      ),
    },
    transformMode: {
      web: [/\.[jt]sx?$/],
    },
    coverage: {
      coverage: {
        provider: "v8", // Use v8 for coverage
        reporter: ["text", "html"], // Output formats
        include: ["src/**/*.{js,jsx,ts,tsx}"], // Files to include
        exclude: ["node_modules", "tests"], // Files to exclude
      },
    },
  },
});
