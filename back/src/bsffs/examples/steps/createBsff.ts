import defaultFixtures from "../fixtures";
import { WorkflowStep } from "../../../common/workflow";
import mutations from "../mutations";

export function createBsff(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    description: `L'opérateur crée un BSFF`,
    mutation: mutations.createBsff,
    variables: ({ operateur, transporteur, ttr, ficheInterventions }) => {
      return {
        input: {
          type: "COLLECTE_PETITES_QUANTITES",
          emitter: fixtures.operateurInput(operateur.siret),
          packagings: [
            { type: "BOUTEILLE", volume: 1, numero: "1", weight: 1 }
          ],
          waste: {
            code: "14 06 01*",
            description: "R404A",
            adr: "UN 1078, Gaz frigorifique NSA (Gaz réfrigérant, NSA), 2.2 (C/E)"
          },
          weight: {
            value: 1,
            isEstimate: true
          },
          transporter: fixtures.transporterInput(
            transporteur.siret?.length
              ? transporteur.siret
              : transporteur.vatNumber
          ),
          destination: fixtures.ttrInput(ttr.siret),
          ficheInterventions: ficheInterventions.map(fi => fi.id)
        }
      };
    },
    expected: { status: "INITIAL" },
    data: response => response.createBsff,
    company,
    setContext: (ctx, data) => ({
      ...ctx,
      bsff: data,
      packagings: data.packagings
    })
  };
}
