import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createFormTransporter(
  company: string,
  transporter: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: "Crée un transporteur qui peut ensuite être associé à un BSDD",
    mutation: mutations.createFormTransporter,
    variables: context => ({
      input: fixtures.transporterInput(context[transporter].siret)
    }),
    data: response => response.createFormTransporter,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      formTransporters: [...(ctx.formTransporters ?? []), data.id]
    })
  };
}
