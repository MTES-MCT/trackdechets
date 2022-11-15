import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function updateTransport(company: string): WorkflowStep {
  return {
    description: `Les informations sur le transport sont complétées`,
    mutation: mutations.updateBsff,
    variables: ({ bsff }) => ({
      id: bsff.id,
      input: {
        transporter: {
          transport: {
            takenOverAt: "2022-11-02",
            mode: "ROAD",
            plates: "BG-007-FR"
          }
        }
      }
    }),
    expected: { status: "SIGNED_BY_EMITTER" },
    data: response => response.updateBsff,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsff: data })
  };
}
