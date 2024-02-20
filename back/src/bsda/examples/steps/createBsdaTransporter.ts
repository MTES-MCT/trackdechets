import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createBsdaTransporter(
  company: string,
  transporter: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: "Crée un transporteur qui peut ensuite être associé à un BSDA",
    mutation: mutations.createBsdaTransporter,
    variables: context => ({
      input: fixtures.transporterInput(context[transporter].siret)
    }),
    data: response => response.createBsdaTransporter,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      bsdaTransporters: [...(ctx.bsdaTransporters ?? []), data.id]
    })
  };
}
