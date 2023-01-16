import "@dataesr/react-dsfr/dist/index.min.cjs.js";

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};

// Initialize global jest.fn override
window.jest = {
  fn: fnc => fnc,
};
