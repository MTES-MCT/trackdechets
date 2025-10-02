import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createBsvhuTransporter(
  company: string,
  transporter: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description:
      "Crée un transporteur qui peut ensuite être associé à un BSVHU",
    mutation: mutations.createBsvhuTransporter,
    variables: context => ({
      input: fixtures.transporterInput(context[transporter].siret)
    }),
    data: response => response.createBsvhuTransporter,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      bsvhuTransporters: [...(ctx.bsvhuTransporters ?? []), data.id]
    })
  };
}
