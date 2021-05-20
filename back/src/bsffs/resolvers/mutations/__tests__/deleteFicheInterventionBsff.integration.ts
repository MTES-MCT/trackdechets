import { Company, User, UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  Mutation,
  MutationDeleteFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { getFicheInterventionId } from "../../../converter";
import { createBsff } from "../../../__tests__/factories";

const DELETE_FICHE_INTERVENTION = `
  mutation DeleteFicheIntervention($id: ID!, $numero: String!) {
    deleteFicheInterventionBsff(id: $id, numero: $numero) {
      numero
    }
  }
`;

describe("Mutation.deleteFicheInterventionBsff", () => {
  afterEach(resetDatabase);

  let emitter: { user: User; company: Company };
  let bsffId: string;
  let ficheInterventionNumero: string;
  let ficheInterventionId: string;

  beforeEach(async () => {
    emitter = await userWithCompanyFactory(UserRole.ADMIN);
    bsffId = getReadableId(ReadableIdPrefix.FF);
    ficheInterventionNumero = "ABCDEFGHIJK";
    ficheInterventionId = getFicheInterventionId(
      bsffId,
      ficheInterventionNumero
    );

    await createBsff(
      {
        emitter,
        ficheInterventions: [
          {
            id: ficheInterventionId,
            numero: ficheInterventionNumero,
            kilos: 2,
            ownerCompanyName: "Acme",
            ownerCompanySiret: "1".repeat(14),
            ownerCompanyAddress: "12 rue de la Tige, 69000",
            ownerCompanyMail: "contact@gmail.com",
            ownerCompanyPhone: "06",
            ownerCompanyContact: "Jeanne Michelin",
            postalCode: "69000"
          }
        ]
      },
      { id: bsffId }
    );
  });

  it("should allow user to delete a fiche d'intervention", async () => {
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "deleteFicheInterventionBsff">,
      MutationDeleteFicheInterventionBsffArgs
    >(DELETE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        numero: ficheInterventionNumero
      }
    });

    expect(data.deleteFicheInterventionBsff.numero).toBeTruthy();
  });

  it("should disallow unauthenticated user to delete a fiche d'intervention", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "deleteFicheInterventionBsff">,
      MutationDeleteFicheInterventionBsffArgs
    >(DELETE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        numero: ficheInterventionNumero
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

  it("should disallow user to delete a fiche d'intervention on a bsff they are not part of", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);

    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteFicheInterventionBsff">,
      MutationDeleteFicheInterventionBsffArgs
    >(DELETE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        numero: ficheInterventionNumero
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
      Pick<Mutation, "deleteFicheInterventionBsff">,
      MutationDeleteFicheInterventionBsffArgs
    >(DELETE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        numero: ficheInterventionNumero
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
      Pick<Mutation, "deleteFicheInterventionBsff">,
      MutationDeleteFicheInterventionBsffArgs
    >(DELETE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        numero: ficheInterventionNumero
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `La fiche d'intervention n°${ficheInterventionNumero} n'existe pas pour le bordereau n°${bsffId}.`
      })
    ]);
  });

  it("should disallow deleting a fiche d'intervention from a bsff with a signature", async () => {
    await prisma.bsff.update({
      data: { emitterEmissionSignatureDate: new Date().toISOString() },
      where: { id: bsffId }
    });

    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "deleteFicheInterventionBsff">,
      MutationDeleteFicheInterventionBsffArgs
    >(DELETE_FICHE_INTERVENTION, {
      variables: {
        id: bsffId,
        numero: ficheInterventionNumero
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Il n'est pas possible d'éditer une fiche d'intervention après la signature de l'émetteur`
      })
    ]);
  });
});
