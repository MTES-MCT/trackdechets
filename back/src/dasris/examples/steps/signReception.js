/* eslint @typescript-eslint/no-var-requires: "off" */
const { signBsdasri } = require("../mutations");

const signReception = company => ({
  description: `Le traiteur signe les informations de réception`,
  mutation: signBsdasri,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      type: "RECEPTION",
      author: "Bob"
    }
  }),
  expected: { status: "RECEIVED" },
  data: response => response.signBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  signReception
};
