module.exports = {
  parser: "@typescript-eslint/parser",
  extends: [
    "plugin:@typescript-eslint/recommended",
    "plugin:prettier/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript"
  ],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: "module"
  },
  plugins: ["no-only-tests"],
  rules: {
    "prettier/prettier": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        ignoreRestSiblings: true
      }
    ],
    "no-only-tests/no-only-tests": "error",
    "import/no-extraneous-dependencies": [
      "error",
      {
        devDependencies: ["src/scripts/**", "**/__tests__/**"]
      }
    ]
  },
  overrides: [
    {
      files: ["*.integration.ts", "*.test.ts"],
      rules: {
        "@typescript-eslint/no-var-requires": "off"
      }
    }
  ]
};
