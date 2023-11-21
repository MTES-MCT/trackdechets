module.exports = {
  preset: "../../jest.preset.js",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"]
  },
  testEnvironment: "node",
  testTimeout: 30000,
  testMatch: ["**/__tests__/**/?(*.)+(integration).[jt]s?(x)"],
  rootDir: "../src"
};
