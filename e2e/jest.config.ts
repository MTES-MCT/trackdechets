/* eslint-disable */
export default {
  displayName: "e2e",
  preset: "../jest.preset.js",
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.spec.json" }]
  },
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../coverage/e2e"
};
