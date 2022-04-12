import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createSynthesisBsdasri(company: string): WorkflowStep {
  return {
    description: `Le transporteur prépare un bordereau de synthèse dans lequel il associe l2 dasris qu'il vient de prendre en charge.
    Les données de l'émetteur ne sont pas attendues, elles seront renseignées en fonction des informations transporteur.
    Les information de volume et de packaging seront déduites des bordereaux initiaux associés`,
    mutation: mutations.createBsdasri,
    variables: ({ pred, transporteur, traiteur, ...ctx }) => {
      return {
        input: {
          ...fixtures.wasteInput,
          transporter: fixtures.transporterInput(transporteur.siret),
          destination: fixtures.destinationInput(traiteur.siret),
          synthesizing: [ctx.bsdasri1.id, ctx.bsdasri2.id]
        }
      };
    },
    expected: { status: "INITIAL" },
    data: response => response.createBsdasri,
    company,
    setContext: (ctx, data) => ({ ...ctx, bsd: data })
  };
}
