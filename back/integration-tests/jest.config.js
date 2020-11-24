module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/?(*.)+(integration).[jt]s?(x)"],
  rootDir: "../src",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/$1",
    "^integration-tests/(.*)$": "<rootDir>/../integration-tests/$1"
  }
};
