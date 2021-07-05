/* eslint @typescript-eslint/no-var-requires: "off" */
const { signBsdasri } = require("../mutations");

const signTransport = company => ({
  description: `Le transporteur signe le BSDASRI`,
  mutation: signBsdasri,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      type: "TRANSPORT",
      author: "John"
    }
  }),
  expected: { status: "SENT" },
  data: response => response.signBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  signTransport
};
