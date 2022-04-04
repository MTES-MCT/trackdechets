module.exports = {
  moduleDirectories: ["node_modules", "src"],
  moduleNameMapper: {
    "^.+\\.(css|less|scss)$": "identity-obj-proxy"
  },
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [
    "@testing-library/jest-dom/extend-expect",
    "./jest.setup.js"
  ]
};
