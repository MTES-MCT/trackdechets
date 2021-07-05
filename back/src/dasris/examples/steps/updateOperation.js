/* eslint @typescript-eslint/no-var-requires: "off" */
const { updateBsdasri } = require("../mutations");
const fixtures = require("../fixtures");

const updateOperation = company => ({
  description: `Les informations de l'opération sont complétées`,
  mutation: updateBsdasri,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: { operation: fixtures.operationInput }
  }),
  expected: { status: "RECEIVED" },
  data: response => response.updateBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  updateOperation
};
