import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationCreateFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const ADD_FICHE_INTERVENTION = `
  mutation CreateFicheIntervention($input: BsffFicheInterventionInput!) {
    createFicheInterventionBsff(input: $input) {
      numero
    }
  }
`;

const variables: MutationCreateFicheInterventionBsffArgs = {
  input: {
    numero: "ABCDEFGHIJK",
    weight: 1,
    detenteur: {
      company: {
        name: "Acme",
        siret: "1".repeat(14),
        address: "12 rue de la Tige, 69000",
        mail: "contact@gmail.com",
        phone: "06",
        contact: "Jeanne Michelin"
      }
    },
    operateur: {
      company: {
        name: "Clim'op",
        siret: "2".repeat(14),
        address: "12 rue de la Tige, 69000",
        mail: "contact@climop.com",
        phone: "06",
        contact: "Dupont Jean"
      }
    },
    postalCode: "69000"
  }
};

describe("Mutation.createFicheInterventionBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to create a fiche d'intervention", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: variables.input.operateur.company.siret,
      name: variables.input.operateur.company.name
    });
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables
    });

    expect(errors).toBeUndefined();
    expect(data.createFicheInterventionBsff.numero).toBe(
      variables.input.numero
    );
  });

  it("should disallow unauthenticated user to create a fiche d'intervention", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: {
          code: "UNAUTHENTICATED"
        }
      })
    ]);
  });

  it("should disallow user to create a fiche d'intervention for a company they are not part of", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous devez être membre de l'entreprise au SIRET ${variables.input.operateur.company.siret} pour pouvoir éditer une fiche d'intervention en son nom.`
      })
    ]);
  });
});
