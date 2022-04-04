// Babel Config, used for Jest
module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "usage",
        corejs: "3.21"
      }
    ],
    "@babel/preset-react",
    "@babel/preset-typescript"
  ],
  plugins: [importMetaToProcessPlugin]
};

function importMetaToProcessPlugin() {
  return {
    visitor: {
      MetaProperty(path) {
        path.replaceWithSourceString("process");
      }
    }
  };
}
