/* eslint @typescript-eslint/no-var-requires: "off" */
const { signBsvhu } = require("../mutations");

const signForProducer = company => ({
  description: `Le producteur procède ensuite à la signature`,
  mutation: signBsvhu,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      type: "EMISSION",
      author: "Jean VHU"
    }
  }),
  expected: { status: "SIGNED_BY_PRODUCER" },
  data: response => response.signBsvhu,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  signForProducer
};
