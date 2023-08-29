import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function switchAppendixContext(company: string): WorkflowStep {
  return {
    description: `Technical - Update ids`,
    mutation: mutations.updateForm,
    variables: ({ chapeau }) => ({
      updateFormInput: { id: chapeau.id }
    }),
    expected: { status: "SENT" },
    data: response => response.updateForm,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data }),
    hideInDoc: true
  };
}

export function groupAppendix1Producer(company: string): WorkflowStep {
  return {
    description: `Le collecteur annexe le bordereau d'annexe 1 au chapeau. Dans l'input, inutile de préciser la fraction de bordereau utilisée.
    Cette fraction n'est utile qu'aux annexes 2. Dans le cas d'un annexe 1 l'entièreté du bordereau est forcément annexée.`,
    mutation: mutations.updateForm,
    variables: ({ bsd, chapeau }) => ({
      updateFormInput: {
        id: chapeau.id,
        grouping: {
          form: {
            id: bsd.id
          }
        }
      }
    }),
    expected: { status: "SEALED" },
    data: response => response.updateForm,
    company
  };
}

export function updateFormTransporters(company: string): WorkflowStep {
  return {
    description: "Un transporteur est ajouté",
    mutation: mutations.updateForm,
    variables: ({ bsd, updatedFormTransporters }) => ({
      updateFormInput: {
        id: bsd.id,
        transporters: updatedFormTransporters
      }
    }),
    data: response => response.updateForm,
    company
  };
}
