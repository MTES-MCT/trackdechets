/* eslint @typescript-eslint/no-var-requires: "off" */
const { signBsvhu } = require("../mutations");

const signTransport = company => ({
  description: `Le producteur procède ensuite à la signature`,
  mutation: signBsvhu,
  variables: ({ bsd }) => ({
    id: bsd.id,
    input: {
      type: "TRANSPORT",
      author: "Patrick"
    }
  }),
  expected: { status: "SENT" },
  data: response => response.signBsvhu,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  signTransport
};
