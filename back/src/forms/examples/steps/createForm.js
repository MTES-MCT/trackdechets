/* eslint @typescript-eslint/no-var-requires: "off" */
const { createForm: createFormMutation } = require("../mutations");
const fixtures = require("../fixtures");

const createForm = company => ({
  description: `Les informations du BSDD sont remplies. Cette action peut-être effectuée
par n'importe quel établissement apparaissant sur le BSDD. À ce stade il est toujours possible
d'effectuer des modifications grâce à la mutation updateForm.`,
  mutation: createFormMutation,
  variables: ({ producteur, transporteur, traiteur }) => ({
    createFormInput: {
      emitter: fixtures.emitterInput(producteur.siret),
      recipient: fixtures.recipientInput(traiteur.siret),
      transporter: fixtures.transporterInput(transporteur.siret),
      wasteDetails: fixtures.wasteDetailsInput
    }
  }),
  expected: { status: "DRAFT" },
  data: response => response.createForm,
  company,
  setContext: (ctx, data) => ({ ...ctx, bsd: data })
});

const createFormMultiModal = company => ({
  ...createForm(company),
  variables: ({ transporteur1, ...ctx }) =>
    createForm(company).variables({
      transporteur: transporteur1,
      ...ctx
    })
});

const createFormTempStorage = company => ({
  ...createForm(company),
  variables: ({ producteur, ttr, transporteur1, traiteur }) => ({
    createFormInput: {
      emitter: fixtures.emitterInput(producteur.siret),
      recipient: fixtures.recipientIsTempStorageInput(ttr.siret),
      transporter: fixtures.transporterInput(transporteur1.siret),
      wasteDetails: fixtures.wasteDetailsInput,
      temporaryStorageDetail: {
        destination: fixtures.recipientInput(traiteur.siret)
      }
    }
  })
});

module.exports = {
  createForm,
  createFormMultiModal,
  createFormTempStorage
};
