import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createBsffTransporter(
  company: string,
  transporter: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: "Crée un transporteur qui peut ensuite être associé à un BSFF",
    mutation: mutations.createBsffTransporter,
    variables: context => ({
      input: fixtures.transporterInput({
        siret: context[transporter].siret,
        vatNumber: context[transporter].vatNumber
      })
    }),
    data: response => response.createBsffTransporter,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      bsffTransporters: [...(ctx.bsffTransporters ?? []), data.id]
    })
  };
}
