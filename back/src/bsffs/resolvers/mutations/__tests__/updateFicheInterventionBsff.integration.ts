import { Company, User, UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationUpdateFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { flattenFicheInterventionBsffInput } from "../../../converter";

const UPDATE_FICHE_INTERVENTION = `
  mutation UpdateFicheIntervention($id: ID!, $numero: String!, $input: BsffFicheInterventionInput!) {
    updateFicheInterventionBsff(id: $id, numero: $numero, input: $input) {
      id
    }
  }
`;

const variables: Omit<MutationUpdateFicheInterventionBsffArgs, "id"> = {
  input: {
    numero: "ABCDEFGHIJK",
    kilos: 2,
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

describe("Mutation.updateFicheInterventionBsff", () => {
  afterEach(resetDatabase);

  let emitter: { user: User; company: Company };
  let ficheInterventionId: string;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheIntervention = await prisma.bsffFicheIntervention.create({
      data: {
        ...flattenFicheInterventionBsffInput({
          ...variables.input,
          kilos: variables.input.kilos - 1
        })
      }
    });
    ficheInterventionId = ficheIntervention.id;
  });

  it("should allow user to update a fiche d'intervention", async () => {
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: ficheInterventionId
      }
    });

    expect(data.updateFicheInterventionBsff.id).toBe(ficheInterventionId);
  });

  it("should disallow unauthenticated user to update a fiche d'intervention", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: ficheInterventionId
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        extensions: {
          code: "UNAUTHENTICATED"
        }
      })
    ]);
  });

  it("should throw an error if the fiche d'intervention doesn't exist", async () => {
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: "abcdefgh"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `La fiche d'intervention n°abcdefgh n'existe pas.`
      })
    ]);
  });
});
