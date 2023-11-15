/* eslint-disable */
export default {
  displayName: "cron-integration",
  preset: "../../jest.preset.js",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"]
  },
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/?(*.)+(integration).[jt]s?(x)"]
};
