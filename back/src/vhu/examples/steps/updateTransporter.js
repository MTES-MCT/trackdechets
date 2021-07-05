/* eslint @typescript-eslint/no-var-requires: "off" */
const { updateBsvhu } = require("../mutations");
const fixtures = require("../fixtures");

const updateTransporter = company => ({
  description: `Le transporteur complète ensuite ses données`,
  mutation: updateBsvhu,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: { transporter: { recepisse: fixtures.receiptInput } }
  }),
  expected: { status: "SIGNED_BY_PRODUCER" },
  data: response => response.updateBsvhu,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  updateTransporter
};
