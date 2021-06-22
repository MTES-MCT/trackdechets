/* eslint @typescript-eslint/no-var-requires: "off" */
const fixtures = require("../fixtures");
const { markAsTempStored } = require("../mutations");

module.exports = {
  markAsTempStored: company => ({
    description: `Sur le lieu de l’entreposage provisoire : Les cadres 13 à 19 sont remplis
par l’exploitant de l’installation d’entreposage ou de reconditionnement, exceptés le cadre 14
  s’il a été renseigné par l’émetteur du bordereau lors de l’expédition du lot`,
    mutation: markAsTempStored,
    variables: ({ bsd }) => ({
      id: bsd.id,
      tempStoredInfos: fixtures.tempStoredInfosInput
    }),
    expected: { status: "TEMP_STORER_ACCEPTED" },
    data: response => response.markAsTempStored,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  })
};
