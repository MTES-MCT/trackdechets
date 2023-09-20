module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest"]
  },
  testEnvironment: "node",
  testTimeout: 30000,
  testMatch: ["**/__tests__/**/?(*.)+(integration).[jt]s?(x)"],
  rootDir: "../src",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/$1",
    "^integration-tests/(.*)$": "<rootDir>/../integration-tests/$1"
  }
};
