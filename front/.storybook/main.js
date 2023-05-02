const {
  loadConfigFromFile,
  mergeConfig
} = require("vite");
const path = require("path");
module.exports = {
  stories: ["../src/**/*.stories.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)", "../src/stories/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: ["@storybook/addon-links", "@storybook/addon-essentials", "@storybook/addon-interactions", "@storybook/addon-a11y", "storybook-addon-apollo-client", "@storybook/addon-mdx-gfm"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  core: {
    disableTelemetry: true
  },
  features: {
    storyStoreV7: true
  },
  async viteFinal(config) {
    const {
      config: userConfig
    } = await loadConfigFromFile(path.resolve(__dirname, "../vite.config.ts"));
    return mergeConfig(config, {
      ...userConfig,
      // manually specify plugins to avoid conflict
      plugins: []
    });
  },
  docs: {
    autodocs: true
  }
};