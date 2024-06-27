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
          packagings: fixtures.packagingsFixtures(),
          waste: fixtures.wasteFixture(),
          weight: fixtures.weightFixture(),
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

export function createBsffWithTransporters(
  company: string,
  fixtures = defaultFixtures
): WorkflowStep {
  return {
    ...createBsff(company),
    description:
      "Crée un BSFF en associant une liste de transporteurs dans un ordre donné",
    variables: ({ operateur, traiteur, bsffTransporters }) => ({
      input: {
        type: "TRACER_FLUIDE",
        emitter: fixtures.operateurInput(operateur.siret),
        packagings: fixtures.packagingsFixtures(),
        waste: fixtures.wasteFixture(),
        weight: fixtures.weightFixture(),
        destination: fixtures.traiteurInput(traiteur.siret),
        transporters: bsffTransporters
      }
    })
  };
}
