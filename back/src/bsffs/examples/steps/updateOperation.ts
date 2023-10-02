import { WorkflowStep } from "../../../common/workflow";
import fixtures from "../fixtures";
import mutations from "../mutations";

export function updateOperationD13(
  company: string,
  { packagingIdx }
): WorkflowStep {
  return {
    description: `Les informations sur l'opération effectuée (D13) sur le contenant sont complétées`,
    mutation: mutations.updateBsffPackaging,
    variables: ({ packagings, traiteur }) => ({
      id: packagings[packagingIdx].id,
      input: {
        operation: {
          date: "2022-11-05",
          code: "D13",
          description: "Regroupement",
          nextDestination: fixtures.nextDestinationInput(traiteur.siret)
        }
      }
    }),
    expected: { acceptation: { date: "2022-11-04T00:00:00.000Z" } },
    data: response => response.updateBsffPackaging,
    company
  };
}

export function updateOperationR2(
  company: string,
  { packagingIdx }
): WorkflowStep {
  return {
    description: `Les informations sur l'opération effectuée (R2) sur le contenant sont complétées`,
    mutation: mutations.updateBsffPackaging,
    variables: ({ packagings }) => ({
      id: packagings[packagingIdx].id,
      input: {
        operation: {
          date: "2022-11-05",
          code: "R2",
          mode: "REUTILISATION",
          description: "Régénération"
        }
      }
    }),
    expected: { acceptation: { date: "2022-11-04T00:00:00.000Z" } },
    data: response => response.updateBsffPackaging,
    company
  };
}

export function updateOperationR12(
  company: string,
  { packagingIdx }
): WorkflowStep {
  return {
    description: `Les informations sur l'opération effectuée (R12) sur le contenant sont complétées`,
    mutation: mutations.updateBsffPackaging,
    variables: ({ packagings, destructeur }) => ({
      id: packagings[packagingIdx].id,
      input: {
        operation: {
          date: "2022-11-05",
          code: "R12",
          description: "Reconditionnement",
          nextDestination: fixtures.nextDestinationInput(destructeur.siret)
        }
      }
    }),
    expected: { acceptation: { date: "2022-11-04T00:00:00.000Z" } },
    data: response => response.updateBsffPackaging,
    company
  };
}
