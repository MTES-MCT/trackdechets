import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signSecretCodeEcoOrganisme(
  company: string,
  secretCode: number
): WorkflowStep {
  return {
    description: `Le transporteur signe le BSDASRI avec le code secret éco-organisme`,
    mutation: mutations.signBsdasriEmissionWithSecretCode,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        author: "Michel Martin",
        securityCode: secretCode,
        signatureAuthor: "ECO_ORGANISME"
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.signBsdasriEmissionWithSecretCode,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data, bsdasri1: data })
  };
}
