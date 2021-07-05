/* eslint @typescript-eslint/no-var-requires: "off" */
const { signBsdasri } = require("../mutations");

const signOperation = company => ({
  description: `Le traiteur signe les informations de l'opération`,
  mutation: signBsdasri,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      type: "OPERATION",
      author: "John"
    }
  }),
  expected: { status: "PROCESSED" },
  data: response => response.signBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  signOperation
};
