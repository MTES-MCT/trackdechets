import { UserRole } from ".prisma/client";
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
    kilos: 1,
    owner: {
      company: {
        name: "Acme",
        siret: "1".repeat(14),
        address: "12 rue de la Tige, 69000",
        mail: "contact@gmail.com",
        phone: "06",
        contact: "Jeanne Michelin"
      }
    },
    postalCode: "69000"
  }
};

describe("Mutation.createFicheInterventionBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to create a fiche d'intervention", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables
    });

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
});
