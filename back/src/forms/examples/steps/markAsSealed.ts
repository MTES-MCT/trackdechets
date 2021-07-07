/* eslint @typescript-eslint/no-var-requires: "off" */
const { markAsSealed } = require("../mutations");

module.exports = {
  markAsSealed: company => ({
    description: `Valide les données présentes sur le BSDD avant envoi. Cette action
peut-être effectuée par n'importe quelle établissement apparaissant sur le BSDD. À ce stade
il est encore possible de de modifier le BSDD grâce à la mutation updateForm`,
    mutation: markAsSealed,
    variables: ({ bsd }) => ({ id: bsd.id }),
    expected: { status: "SEALED" },
    data: response => response.markAsSealed,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  })
};
