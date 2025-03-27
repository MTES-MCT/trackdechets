module.exports = {
  displayName: "front",
  preset: "../jest.preset.js",
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest"
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "html"],
  moduleNameMapper: {
    "^.+\\.(css|less|scss)$": "identity-obj-proxy",
    "^.+.(svg)$": "jest-transform-stub"
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "./jest.setup.js"
  ],
  transformIgnorePatterns: [
    "node_modules/(?!@codegouvfr/react-dsfr|copy-text-to-clipboard)"
  ]
};
