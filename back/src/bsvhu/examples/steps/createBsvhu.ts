import mutations from "../mutations";
import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createBsvhu(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: `Création du BSVHU`,
    mutation: mutations.createBsvhu,
    variables: ({ producteur, transporteur, broyeur }) => ({
      input: {
        emitter: fixtures.emitterInput(producteur.siret),
        ...fixtures.wasteDetailsInput,
        transporter: fixtures.transporterInput(
          transporteur.siret?.length
            ? transporteur.siret
            : transporteur.vatNumber
        ),
        destination: fixtures.broyeurInput(broyeur.siret)
      }
    }),
    expected: { status: "INITIAL" },
    data: response => response.createBsvhu,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
