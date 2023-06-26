module.exports = {
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "^.+\\.(css|less|scss)$": "identity-obj-proxy",
    "^.+.(svg)$": "jest-transform-stub",
    // Force module uuid to resolve with the CJS entry point, because Jest does not support package.json.exports. See https://github.com/uuidjs/uuid/issues/451
    // not required with UUID v9, so it can be removed after @dataesr/react-dsfr upgrade
    uuid: require.resolve("uuid"),
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "./jest.setup.js",
  ],
  transformIgnorePatterns: ["node_modules/(?!@codegouvfr/react-dsfr)"],
};
