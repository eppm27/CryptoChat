module.exports = {
    projects: [
      {
        displayName: "backend",
        testEnvironment: "node",
        testMatch: ["<rootDir>/tests/backend/**/*.test.js"],
        setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      },
      {
        displayName: "frontend",
        testEnvironment: "jsdom",
        testMatch: ["<rootDir>/tests/frontend/**/*.test.jsx"],
        setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
      },
    ],
    transform: {
      "^.+\\.[jt]sx?$": "babel-jest",
    },
  };
