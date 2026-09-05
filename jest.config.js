module.exports = {
  displayName: "backend",
  testEnvironment: "node",
  testMatch: ["<rootDir>/tests/backend/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  moduleDirectories: ["node_modules", "<rootDir>/backend/node_modules"],
};
