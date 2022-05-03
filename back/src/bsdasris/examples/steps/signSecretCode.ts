import mutations from "../mutations";
import { WorkflowStep } from "../../../common/workflow";

export function signSecretCode(
  company: string,
  secretCode: number
): WorkflowStep {
  return {
    description: `Le transporteur signe le BSDASRI avec le code secret producteur`,
    mutation: mutations.signBsdasriEmissionWithSecretCode,
    variables: ({ bsd }) => ({
      id: bsd.id,
      input: {
        author: "Julien Dupond",
        securityCode: secretCode
      }
    }),
    expected: { status: "SIGNED_BY_PRODUCER" },
    data: response => response.signBsdasriEmissionWithSecretCode,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data, bsdasri1: data })
  };
}
