import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createGroupingBsdasri(company: string): WorkflowStep {
  return {
    description: `L'installation qui dispose des dasri en AWAITING_GROUP crée un dasri de groupement.
    Le bordereau va suivre son cycle de vie jusqu'au destinataire final`,
    mutation: mutations.createBsdasri,
    variables: ({ traiteur, transporteur, traiteurFinal, ...ctx }) => {
      return {
        input: {
          ...fixtures.wasteInput,

          emitter: {
            ...fixtures.emitterInput(traiteur.siret),
            emission: fixtures.emissionInput
          },
          transporter: fixtures.transporterInput(transporteur.siret),
          destination: fixtures.destinationInput(traiteurFinal.siret),
          grouping: [ctx.bsdasri1.id, ctx.bsdasri2.id]
        }
      };
    },
    expected: { status: "INITIAL" },
    data: response => response.createBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
