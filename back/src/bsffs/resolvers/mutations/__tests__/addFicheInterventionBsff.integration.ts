import { UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import {
  Mutation,
  MutationAddFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { getFicheInterventionId } from "../../../converter";
import {
  createBsff,
  createBsffAfterEmission
} from "../../../__tests__/factories";

const ADD_FICHE_INTERVENTION = `
  mutation AddFicheIntervention($id: ID!, $numero: String!, $input: BsffFicheInterventionInput!) {
    addFicheInterventionBsff(id: $id, numero: $numero, input: $input) {
      numero
    }
  }
`;

const variables: Omit<MutationAddFicheInterventionBsffArgs, "id"> = {
  numero: "ABCDEFGHIJK",
  input: {
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

describe("Mutation.addFicheInterventionBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to add a fiche d'intervention to a bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter });
    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsff.id
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
        ...variables
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
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const { user } = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter });
    const { mutate } = makeClient(user);
    const { errors } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsff.id
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
        ...variables,
        id: "123"
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error when creating twice the same fiche d'intervention", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsffId = getReadableId(ReadableIdPrefix.FF);
    // the numero contains special characters on purpose
    const ficheInterventionNumero = "FI N°ABC DEF GHI";
    const ficheInterventionId = getFicheInterventionId(
      bsffId,
      ficheInterventionNumero
    );
    const bsff = await createBsff(
      {
        emitter,
        ficheInterventions: [
          {
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
        ]
      },
      {
        id: bsffId
      }
    );
    const { mutate } = makeClient(emitter.user);
    // mess up the numero by adding characters that must be stripped
    // we should still be able to match them
    const messedUpNumero = ficheInterventionNumero.split("").join(" ");
    const { errors } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsff.id,
        numero: messedUpNumero
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `La fiche d'intervention n°${messedUpNumero} est déjà lié au bordereau n°${bsff.id} et ne peut pas être créer à nouveau.`
      })
    ]);
  });

  it("should disallow adding a fiche d'intervention to a bsff with a signature", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsffAfterEmission({ emitter });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "addFicheInterventionBsff">,
      MutationAddFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        ...variables,
        id: bsff.id
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Il n'est pas possible d'ajouter une fiche d'intervention après la signature de l'émetteur`
      })
    ]);
  });
});
