/* eslint-disable */
export default {
  displayName: "back",
  preset: "../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"]
  },
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)"],
  reporters: ["default", "github-actions"]
};
