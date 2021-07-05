/* eslint @typescript-eslint/no-var-requires: "off" */
const { signBsvhu } = require("../mutations");

const signOperation = company => ({
  description: `Le broyeur procède ensuite à la signature`,
  mutation: signBsvhu,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      type: "OPERATION",
      author: "Henri Broyeur"
    }
  }),
  expected: { status: "PROCESSED" },
  data: response => response.signBsvhu,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  signOperation
};
