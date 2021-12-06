import { WorkflowStep } from "../../../common/workflow";
import { BsdaSignatureType } from "../../../generated/graphql/types";
import mutations from "../mutations";

export function signBsda(
  company: string,
  type: BsdaSignatureType
): WorkflowStep {
  return {
    description: `L'entreprise ${company} appose une signature sur le BSDA de type ${type}.`,
    mutation: mutations.createBsda,
    variables: () => ({
      input: {
        author: "Jean Responsable",
        type
      }
    }),
    expected: { status: "DRAFT" },
    data: response => response.createForm,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
