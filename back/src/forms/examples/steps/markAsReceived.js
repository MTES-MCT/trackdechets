/* eslint @typescript-eslint/no-var-requires: "off" */
const { markAsReceived } = require("../mutations");
const fixtures = require("../fixtures");

module.exports = {
  markAsReceived: company => ({
    description: `Le déchet est receptionné et accepté
    sur l'installation de destination prévue`,
    mutation: markAsReceived,
    variables: ({ bsd }) => ({
      id: bsd.id,
      receivedInfo: fixtures.receivedInfoInput
    }),
    expected: { status: "ACCEPTED" },
    data: response => response.markAsReceived,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  })
};
