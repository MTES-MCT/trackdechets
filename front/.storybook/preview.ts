import "../src/scss/index.scss";
import "../public/dsfr/utility/icons/icons.min.css";
import "../public/dsfr/dsfr.min.css";
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
export const tags = ["autodocs"];
