import { UserRole } from ".prisma/client";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  createBsffFicheInterventionInputMock,
  Mutation,
  MutationAddFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { generateFicheInterventionId } from "../../../converter";

const ADD_FICHE_INTERVENTION = `
  mutation AddFicheIntervention($id: ID!, $numero: String!, $input: BsffFicheInterventionInput!) {
    addFicheInterventionBsff(id: $id, numero: $numero, input: $input) {
      numero
    }
  }
`;

describe("Mutation.addFicheInterventionBsff", () => {
  it("should allow user to add a fiche d'intervention to a bsff", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(user);
    const { data } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        id: bsff.id,
        numero: "ABCDEFGHIJK",
        input: createBsffFicheInterventionInputMock({})
      }
    });

    expect(data.addFicheInterventionBsff.numero).toBeTruthy();
  });

  it("should disallow unauthenticated user to add a fiche d'intervention", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        id: "123",
        numero: "ABCDEFGHIJK",
        input: createBsffFicheInterventionInputMock({})
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

  it("should disallow user to add a fiche d'intervention to a bsff they are not part of", async () => {
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: "1".repeat(14)
      }
    });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        id: bsff.id,
        numero: "ABCDEFGHIJK",
        input: createBsffFicheInterventionInputMock({})
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
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        id: "123",
        numero: "ABCDEFGHIJK",
        input: createBsffFicheInterventionInputMock({})
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error when creating twice the same fiche d'intervention", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsffId = getReadableId(ReadableIdPrefix.FF);
    // the numero contains special characters on purpose
    const ficheInterventionNumero = "FI N°ABC DEF GHI";
    const ficheInterventionId = generateFicheInterventionId(
      bsffId,
      ficheInterventionNumero
    );
    const bsff = await prisma.bsff.create({
      data: {
        id: bsffId,
        emitterCompanySiret: company.siret,
        ficheInterventions: {
          create: {
            id: ficheInterventionId,
            numero: ficheInterventionNumero,
            kilos: 2,
            postalCode: "69000",
            ownerCompanyName: "Acme",
            ownerCompanySiret: "1".repeat(14),
            ownerCompanyAddress: "12 rue Albert Lyon 69000",
            ownerCompanyContact: "Carla Brownie",
            ownerCompanyMail: "carla.brownie@gmail.com",
            ownerCompanyPhone: "06"
          }
        }
      }
    });
    const { mutate } = makeClient(user);
    // mess up the numero by adding characters that must be stripped
    // we should still be able to match them
    const messedUpNumero = ficheInterventionNumero.split("").join(" ");
    const { errors } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        id: bsff.id,
        numero: messedUpNumero,
        input: createBsffFicheInterventionInputMock({})
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `La fiche d'intervention n°${messedUpNumero} est déjà lié au bordereau n°${bsff.id} et ne peut pas être créer à nouveau.`
      })
    ]);
  });
});
