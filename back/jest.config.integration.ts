/* eslint-disable */
export default {
  displayName: "back-integration",
  preset: "../jest.preset.js",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"]
  },
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/?(*.)+(integration).[jt]s?(x)"],
  testTimeout: 10000
};
