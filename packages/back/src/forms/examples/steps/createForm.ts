import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createForm(company: string): WorkflowStep {
  return {
    description: `Les informations du BSDD sont remplies. Cette action peut-être effectuée
  par n'importe quel établissement apparaissant sur le BSDD. À ce stade il est toujours possible
  d'effectuer des modifications grâce à la mutation updateForm.`,
    mutation: mutations.createForm,
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
  };
}

export function createFormMultiModal(company: string): WorkflowStep {
  return {
    ...createForm(company),
    variables: ({ transporteur1, producteur, traiteur }) =>
      createForm(company).variables({
        transporteur: transporteur1,
        producteur,
        traiteur
      })
  };
}

export function createFormTempStorage(company: string): WorkflowStep {
  return {
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
  };
}
