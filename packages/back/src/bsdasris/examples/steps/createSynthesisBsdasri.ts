import mutations from "../mutations";
import fixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";

export function createSynthesisBsdasri(company: string): WorkflowStep {
  return {
    description: `Le transporteur a collecté les deux bordereaux initiaux.\n
    Il prépare un bordereau de synthèse dans lequel il associe les deux qu'il vient de prendre en charge.\n
    Les données de l'émetteur ne sont pas attendues, elles seront renseignées en fonction des informations transporteur.\n
    Les information de volume et de packaging seront déduites des bordereaux initiaux associés.\n
    Dès qu'un dasri est associé à un bsd de synthèse, il n'est plus modifiable directement.\n
    Le bordereau est en statut INITIAL (pas de brouillon sur le dasri de synthèse). \n
    Le transporteur peut modifier son bordereau de synthèse, notamment modifier les identifiants des bsds associés.\n
    Une fois finalisé, il va signer le bsd de synthèse, ce qui verrouillera les champs transporteur et les bsd associés.\n
    Le bsd de synthèse va suivre son cycle de vie jusq'au traitement.\n
    Les information de réception et de traitement son répercutées sur les bsd initiaux.\n`,
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
