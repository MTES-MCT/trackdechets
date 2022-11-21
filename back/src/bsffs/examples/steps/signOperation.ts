import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function signOperation(company: string): WorkflowStep {
  return {
    description: `Le destinataire signe l'opération des contenants présents sur le BSFF`,
    mutation: mutations.signBsff,
    variables: ({ bsff }) => ({
      id: bsff.id,
      input: {
        type: "OPERATION",
        author: "Jean Opération"
      }
    }),
    expected: { status: "INTERMEDIATELY_PROCESSED" },
    data: response => response.signBsff,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      bsff: data,
      initialBsffs: [...(ctx.initialBsffs ?? []), data]
    })
  };
}
