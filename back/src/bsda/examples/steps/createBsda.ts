import { WorkflowStep } from "../../../common/workflow";
import fixtures from "../fixtures";
import mutations from "../mutations";

export function createBsda(company: string): WorkflowStep {
  return {
    description: `Les informations du BSDA sont remplies. Cette action peut-être effectuée
    par n'importe quel établissement apparaissant sur le BSDA. À ce stade il est toujours possible
    d'effectuer des modifications grâce à la mutation updateBsda.`,
    mutation: mutations.createBsda,
    variables: ({ producteur, worker, transporteur, traiteur }) => ({
      input: {
        emitter: fixtures.emitterInput(producteur.siret),
        worker: fixtures.workerInput(worker.siret),
        destination: fixtures.destinationInput(traiteur.siret),
        transporter: fixtures.transporterInput(transporteur.siret),
        waste: fixtures.wasteInput,
        packagings: fixtures.packagingsInput,
        weight: fixtures.weightInput
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createForm,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
