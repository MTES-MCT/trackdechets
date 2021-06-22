/* eslint @typescript-eslint/no-var-requires: "off" */
const { markAsSealed } = require("../mutations");

module.exports = {
  markAsSealed: company => ({
    description: "Le producteur de déchet valide les données du bordereau",
    mutation: markAsSealed,
    variables: ({ bsd }) => ({ id: bsd.id }),
    expected: { status: "SEALED" },
    data: response => response.markAsSealed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  })
};
