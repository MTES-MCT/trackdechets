/* eslint-disable */
export default {
  displayName: "back",
  preset: "../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]sx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
  },
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)"],
  reporters: ["default", "github-actions"]
};
