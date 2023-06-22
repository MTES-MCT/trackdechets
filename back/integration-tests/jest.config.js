module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testTimeout: 30000,
  testMatch: ["**/__tests__/**/?(*.)+(integration).[jt]s?(x)"],
  rootDir: "../src",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/$1",
    "^integration-tests/(.*)$": "<rootDir>/../integration-tests/$1"
  },
  setupFilesAfterEnv: ["../integration-tests/jest.setup.ts"],
  globals: {
    'ts-jest': {
      isolatedModules: true
    }
  }
};
