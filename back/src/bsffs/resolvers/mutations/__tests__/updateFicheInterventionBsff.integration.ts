import { Company, User, UserRole } from "@prisma/client";
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
  mutation UpdateFicheIntervention($id: ID!, $input: BsffFicheInterventionInput!) {
    updateFicheInterventionBsff(id: $id, input: $input) {
      id
    }
  }
`;

const variables: Omit<MutationUpdateFicheInterventionBsffArgs, "id"> = {
  input: {
    numero: "ABCDEFGHIJK",
    weight: 2,
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

describe("Mutation.updateFicheInterventionBsff", () => {
  afterEach(resetDatabase);

  let emitter: { user: User; company: Company };
  let ficheInterventionId: string;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: variables.input.operateur.company.siret,
      name: variables.input.operateur.company.name
    });

    const ficheIntervention = await prisma.bsffFicheIntervention.create({
      data: {
        ...flattenFicheInterventionBsffInput({
          ...variables.input,
          weight: variables.input.weight - 1
        })
      }
    });
    ficheInterventionId = ficheIntervention.id;
  });

  it("should allow user to update a fiche d'intervention", async () => {
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: ficheInterventionId
      }
    });

    expect(errors).toBeUndefined();
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

  it("should disallow user to update a fiche d'intervention for a company they are not part of", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);
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
        message: `Vous devez être membre de l'entreprise au SIRET ${variables.input.operateur.company.siret} pour pouvoir éditer une fiche d'intervention en son nom.`
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
