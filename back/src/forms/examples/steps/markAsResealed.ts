/* eslint @typescript-eslint/no-var-requires: "off" */
const fixtures = require("../fixtures");
const { markAsResealed } = require("../mutations");

module.exports = {
  markAsResealed: company => ({
    description: `Complète et valide les cadres 13 à 19`,
    mutation: markAsResealed,
    variables: ({ bsd, transporteur2 }) => ({
      id: bsd.id,
      resealedInfos: fixtures.resealedInfosInput(transporteur2.siret)
    }),
    expected: { status: "RESEALED" },
    data: response => response.markAsResealed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  })
};
