import { WorkflowStep } from "../../../common/workflow";
import queries from "../queries";

export function bsffPackagings(company: string): WorkflowStep {
  return {
    description:
      "Le centre de tri transit regroupement effectue une requête" +
      " pour obtenir la liste des contenants éligibles au regroupement",
    query: queries.bsffPackagings,
    variables: ({ ttr }) => ({
      where: {
        operation: {
          code: { _in: ["R12", "D13"] },
          noTraceability: false
        },
        bsff: {
          destination: { company: { siret: { _eq: ttr.siret } } }
        },
        nextBsff: null
      }
    }),
    data: response => response.bsffPackagings.edges.map(edge => edge.node),
    company
  };
}
