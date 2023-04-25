module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/?(*.)+(integration|test|spec).[jt]s?(x)", ],
  rootDir: "./src",
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/$1",
    "^tests/(.*)$": "<rootDir>/../tests/$1"
  },
  setupFilesAfterEnv: ["../jest.setup.ts"],
  reporters: ["default", "github-actions"]
};
