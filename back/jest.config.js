module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  testMatch: ["**/__tests__/**/?(*.)+(spec|test).[jt]s?(x)"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^integration-tests/(.*)$": "<rootDir>/integration-tests/$1"
  }
};
