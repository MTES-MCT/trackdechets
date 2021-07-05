/* eslint @typescript-eslint/no-var-requires: "off" */
const { updateBsvhu } = require("../mutations");
const fixtures = require("../fixtures");

const updateDestination = company => ({
  description: `Le broyeur édite ses données`,
  mutation: updateBsvhu,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      destination: {
        reception: fixtures.receptionInput,
        operation: fixtures.operationInput
      }
    }
  }),
  expected: { status: "SENT" },
  data: response => response.updateBsvhu,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  updateDestination
};
