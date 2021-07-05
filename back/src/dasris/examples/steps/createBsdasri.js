/* eslint @typescript-eslint/no-var-requires: "off" */
const { createBsdasri: createBsdasriMutation } = require("../mutations");
const fixtures = require("../fixtures");

const createBsdasri = company => ({
  description: `Les informations du BSDASRI (PRED, transporteur, destinataire, déchets) sont remplies.`,
  mutation: createBsdasriMutation,
  variables: ({ pred, transporteur, traiteur }) => ({
    input: {
      emitter: fixtures.emitterInput(pred.siret),
      emission: fixtures.emissionInput,
      recipient: fixtures.recipientInput(traiteur.siret),
      transporter: fixtures.transporterInput(transporteur.siret)
    }
  }),
  expected: { status: "INITIAL" },
  data: response => response.createBsdasri,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

module.exports = {
  createBsdasri
};
