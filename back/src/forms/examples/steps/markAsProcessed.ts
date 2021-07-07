/* eslint @typescript-eslint/no-var-requires: "off" */
const { markAsProcessed } = require("../mutations");
const fixtures = require("../fixtures");

module.exports = {
  markAsProcessed: company => ({
    description: `L'opération d'élimination / valorisation est effectuée
    par l'installation de destination prévue`,
    mutation: markAsProcessed,
    variables: ({ bsd }) => ({
      id: bsd.id,
      processedInfo: fixtures.processedInfoInput
    }),
    expected: { status: "PROCESSED" },
    data: response => response.markAsProcessed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  })
};
