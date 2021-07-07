/* eslint @typescript-eslint/no-var-requires: "off" */
const {
  signedByTransporter: signedByTransporterMutation
} = require("../mutations");
const fixtures = require("../fixtures");

const signedByTransporter = company => ({
  description: `Le transporteur et le producteur signe l'enlèvement à partir du
  compte du transporteur. Le producteur est authentifié grâce
  à son code de signature.`,
  mutation: signedByTransporterMutation,
  variables: ({ bsd, producteur }) => ({
    id: bsd.id,
    signingInfo: fixtures.signingInfoInput(producteur.securityCode)
  }),
  expected: { status: "SENT" },
  data: response => response.signedByTransporter,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

const signedByTransporterAfterTempStorage = company => ({
  ...signedByTransporter(company),
  variables: ({ bsd, ttr } = { bsd: { id: "ID_BSD" } }) => ({
    id: bsd.id,
    signingInfo: fixtures.signingInfoInput(ttr.securityCode)
  }),
  expected: { status: "RESENT" }
});

module.exports = {
  signedByTransporter,
  signedByTransporterAfterTempStorage
};
