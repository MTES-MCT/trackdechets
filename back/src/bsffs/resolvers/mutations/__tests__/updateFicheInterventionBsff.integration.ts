import { Company, User, UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  Mutation,
  MutationUpdateFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  flattenFicheInterventionBsffInput,
  getFicheInterventionId
} from "../../../converter";
import { createBsff } from "../../../__tests__/factories";

const UPDATE_FICHE_INTERVENTION = `
  mutation UpdateFicheIntervention($id: ID!, $numero: String!, $input: BsffFicheInterventionInput!) {
    updateFicheInterventionBsff(id: $id, numero: $numero, input: $input) {
      numero
    }
  }
`;

const variables: Omit<MutationUpdateFicheInterventionBsffArgs, "id"> = {
  numero: "ABCDEFGHIJK",
  input: {
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
  let bsffId: string;
  let ficheInterventionId: string;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN);
    bsffId = getReadableId(ReadableIdPrefix.FF);
    ficheInterventionId = getFicheInterventionId(bsffId, variables.numero);

    await createBsff(
      {
        emitter
      },
      {
        id: bsffId,
        ficheInterventions: {
          create: [
            {
              id: ficheInterventionId,
              numero: variables.numero,
              ...flattenFicheInterventionBsffInput({
                ...variables.input,
                kilos: variables.input.kilos - 1
              })
            }
          ]
        }
      }
    );
  });

  it("should allow user to update a fiche d'intervention", async () => {
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsffId
      }
    });

    expect(data.updateFicheInterventionBsff.numero).toBeTruthy();
  });

  it("should disallow unauthenticated user to update a fiche d'intervention", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsffId
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

  it("should disallow user to update a fiche d'intervention on a bsff they are not part of", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsffId
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer un bordereau sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });

  it("should throw an error if the bsff doesn't exist", async () => {
    await prisma.bsffFicheIntervention.update({
      data: {
        Bsff: {
          disconnect: true
        }
      },
      where: {
        id: ficheInterventionId
      }
    });
    await prisma.bsff.delete({
      where: {
        id: bsffId
      }
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsffId
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le bordereau de fluides frigorigènes n°${bsffId} n'existe pas.`
      })
    ]);
  });

  it("should throw an error if the fiche d'intervention doesn't exist", async () => {
    await prisma.bsffFicheIntervention.delete({
      where: {
        id: ficheInterventionId
      }
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        ...variables
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `La fiche d'intervention n°${variables.numero} n'existe pas pour le bordereau n°${bsffId}.`
      })
    ]);
  });

  it("should disallow updating a fiche d'intervention from a bsff with a signature", async () => {
    await prisma.bsff.update({
      data: { emitterEmissionSignatureDate: new Date().toISOString() },
      where: { id: bsffId }
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsffId
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Il n'est pas possible d'éditer une fiche d'intervention après la signature de l'émetteur`
      })
    ]);
  });
});
