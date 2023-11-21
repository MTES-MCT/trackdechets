import "../src/scss/index.scss";
import { MockedProvider } from "@apollo/client/testing"; // Use for Apollo Version 3+

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/
    }
  },
  apolloClient: {
    MockedProvider
  }
};

// Initialize global jest.fn override
window.jest = {
  fn: fnc => fnc
};
