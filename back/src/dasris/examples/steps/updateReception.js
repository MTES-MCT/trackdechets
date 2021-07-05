/* eslint @typescript-eslint/no-var-requires: "off" */
const { updateBsdasri } = require("../mutations");
const fixtures = require("../fixtures");

const updateReception = company => ({
  description: `Les informations de réception sont complétées`,
  mutation: updateBsdasri,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: { reception: fixtures.receptionInput }
  }),
  expected: { status: "SENT" },
  data: response => response.updateBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  updateReception
};
