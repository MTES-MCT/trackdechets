/* eslint @typescript-eslint/no-var-requires: "off" */
const { createBsvhu: createBsvhuMutation } = require("../mutations");
const fixtures = require("../fixtures");

const createBsvhu = company => ({
  description: `Création du BSVHU`,
  mutation: createBsvhuMutation,
  variables: ({ producteur, transporteur, broyeur }) => ({
    input: {
      emitter: fixtures.emitterInput(producteur.siret),
      ...fixtures.wasteDetailsInput,
      transporter: fixtures.transporterInput(transporteur.siret),
      destination: fixtures.broyeurInput(broyeur.siret)
    }
  }),
  expected: { status: "INITIAL" },
  data: response => response.createBsvhu,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  createBsvhu
};
