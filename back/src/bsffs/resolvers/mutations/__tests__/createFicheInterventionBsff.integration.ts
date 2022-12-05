import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  BsffFicheInterventionInput,
  Mutation,
  MutationCreateFicheInterventionBsffArgs
} from "../../../../generated/graphql/types";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const ADD_FICHE_INTERVENTION = `
  mutation CreateFicheIntervention($input: BsffFicheInterventionInput!) {
    createFicheInterventionBsff(input: $input) {
      numero
      detenteur {
        isPrivateIndividual
        company {
          siret
          name
          contact
          address
          phone
        }
      }
    }
  }
`;

const ficheInterventionInput: BsffFicheInterventionInput = {
  numero: "ABCDEFGHIJK",
  weight: 1,
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
  detenteur: {
    company: {
      name: "Acme",
      siret: "3".repeat(14),
      address: "12 rue de la Tige, 69000",
      mail: "contact@gmail.com",
      phone: "06",
      contact: "Jeanne Michelin"
    }
  },
  postalCode: "69000"
};

describe("Mutation.createFicheInterventionBsff", () => {
  afterEach(resetDatabase);

  it("should allow user to create a fiche d'intervention with a company detenteur", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: ficheInterventionInput.operateur.company.siret,
      name: ficheInterventionInput.operateur.company.name
    });
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        input: {
          ...ficheInterventionInput,
          detenteur: {
            isPrivateIndividual: true,
            company: {
              name: "Particulier",
              address: "Quelque part",
              phone: "00 00 00 00 00",
              mail: "john.snow@trackdechets.fr"
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.createFicheInterventionBsff.numero).toBe(
      ficheInterventionInput.numero
    );
  });

  it("should allow user to create a fiche d'intervention with a private individual detenteur", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: ficheInterventionInput.operateur.company.siret,
      name: ficheInterventionInput.operateur.company.name
    });
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        input: {
          ...ficheInterventionInput,
          detenteur: {
            isPrivateIndividual: true,
            company: {
              ...ficheInterventionInput.detenteur.company,
              siret: undefined,
              contact: undefined
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.createFicheInterventionBsff.detenteur.isPrivateIndividual).toBe(
      true
    );
    expect(data.createFicheInterventionBsff.detenteur.company.siret).toBeNull();
  });

  it("should disallow unauthenticated user to create a fiche d'intervention", async () => {
    const { mutate } = makeClient();
    const { errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: { input: ficheInterventionInput }
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
      variables: { input: ficheInterventionInput }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas éditer une fiche d'intervention sur lequel le SIRET de votre entreprise n'apparaît pas."
      })
    ]);
  });
});
