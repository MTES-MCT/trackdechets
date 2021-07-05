/* eslint @typescript-eslint/no-var-requires: "off" */
const { signBsdasri } = require("../mutations");

const signForProducer = company => ({
  description: `L'émetteur signe le BSDASRI`,
  mutation: signBsdasri,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      type: "EMISSION",
      author: "Dr Brun"
    }
  }),
  expected: { status: "SIGNED_BY_PRODUCER" },
  data: response => response.signBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  signForProducer
};
