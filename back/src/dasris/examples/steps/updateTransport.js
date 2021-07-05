/* eslint @typescript-eslint/no-var-requires: "off" */
const { updateBsdasri } = require("../mutations");
const fixtures = require("../fixtures");

const updateTransport = company => ({
  description: `Les informations de transport sont complétées`,
  mutation: updateBsdasri,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: { transport: fixtures.transportInput }
  }),
  expected: { status: "SIGNED_BY_PRODUCER" },
  data: response => response.updateBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  updateTransport
};
