import { WorkflowStep } from "../../../common/workflow";
import fixtures from "../fixtures";
import mutations from "../mutations";

export function createBsda1ToGroup(company: string): WorkflowStep {
  return {
    description: `Les informations du BSDA sont remplies.
    Ici, comme c'est le groupement qui nous intéresse on remplit un une seule fois toutes les informations du bordereaux, même celles de réception.
    On n'a plus qu'à apposer les signatures sur le bordereau pour qu'il soit groupable.`,
    mutation: mutations.createBsda,
    variables: ({ producteur, worker, transporteur, traiteur }) => ({
      input: {
        emitter: fixtures.emitterInput(producteur.siret),
        worker: fixtures.workerInput(worker.siret),
        destination: fixtures.destinationToGroupInput(traiteur.siret),
        transporter: fixtures.transporterToGroupInput(transporteur.siret),
        waste: fixtures.wasteInput(),
        packagings: fixtures.packagingsInput(),
        weight: fixtures.weightInput()
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createBsda,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsda: data, bsda_1: data })
  };
}

export function createBsda2ToGroup(company: string): WorkflowStep {
  return {
    description: `Les informations du BSDA sont remplies.
    Ici, comme c'est le groupement qui nous intéresse on rempli un une seule fois toutes les informations du bordereaux, même celles de réception.
    On a plus qu'à apposer les signatures sur le bordereau pour qu'il soit groupable.`,
    mutation: mutations.createBsda,
    variables: ({ producteur, worker, transporteur, traiteur }) => ({
      input: {
        type: "OTHER_COLLECTIONS",
        emitter: fixtures.emitterInput(producteur.siret),
        worker: fixtures.workerInput(worker.siret),
        destination: fixtures.destinationToGroupInput(traiteur.siret),
        transporter: fixtures.transporterToGroupInput(transporteur.siret),
        waste: fixtures.wasteInput(),
        packagings: fixtures.packagingsInput(),
        weight: fixtures.weightInput()
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createBsda,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsda: data, bsda_2: data })
  };
}
