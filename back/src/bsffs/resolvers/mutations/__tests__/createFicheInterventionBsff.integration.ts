import { UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  BsffFicheInterventionInput,
  Mutation,
  MutationCreateFicheInterventionBsffArgs
} from "@td/codegen-back";
import {
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { sirenifyBsffFicheInterventionInput } from "../../../sirenify";

jest.mock("../../../sirenify");
(sirenifyBsffFicheInterventionInput as jest.Mock).mockImplementation(input =>
  Promise.resolve(input)
);

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
      siret: siretify(2),
      address: "12 rue de la Tige, 69000",
      mail: "contact@climop.com",
      phone: "06",
      contact: "Dupont Jean"
    }
  },
  detenteur: {
    isPrivateIndividual: false,
    company: {
      name: "Acme",
      siret: siretify(3),
      address: "12 rue de la Tige, 69000",
      mail: "contact@gmail.com",
      phone: "06",
      contact: "Jeanne Michelin"
    }
  },
  postalCode: "69000"
};

describe("Mutation.createFicheInterventionBsff", () => {
  afterEach(async () => {
    await resetDatabase();
    (sirenifyBsffFicheInterventionInput as jest.Mock).mockClear();
  });

  it("should allow user to create a fiche d'intervention with a company detenteur", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: ficheInterventionInput.operateur.company.siret,
      name: ficheInterventionInput.operateur.company.name!
    });
    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        input: ficheInterventionInput
      }
    });

    expect(errors).toBeUndefined();
    expect(data.createFicheInterventionBsff.numero).toBe(
      ficheInterventionInput.numero
    );
    // check input is sirenified
    expect(
      sirenifyBsffFicheInterventionInput as jest.Mock
    ).toHaveBeenCalledTimes(1);
  });

  it("should throw error if detenteur company info is missing", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: ficheInterventionInput.operateur.company.siret,
      name: ficheInterventionInput.operateur.company.name!
    });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        input: {
          ...ficheInterventionInput,
          detenteur: {
            company: {
              ...ficheInterventionInput.detenteur.company,
              siret: undefined,
              contact: undefined,
              mail: undefined,
              phone: undefined
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le SIRET de l'entreprise détentrice de l'équipement est requis\n" +
          "Le nom du contact de l'entreprise détentrice de l'équipement est requis\n" +
          "Le numéro de téléphone de l'entreprise détentrice de l'équipement est requis\n" +
          "L'adresse email de l'entreprise détentrice de l'équipement est requis"
      })
    ]);
  });

  it("should allow user to create a fiche d'intervention with a private individual detenteur", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: ficheInterventionInput.operateur.company.siret,
      name: ficheInterventionInput.operateur.company.name!
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
              contact: undefined,
              mail: undefined,
              phone: undefined
            }
          }
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(
      data.createFicheInterventionBsff.detenteur!.isPrivateIndividual
    ).toBe(true);
    expect(
      data.createFicheInterventionBsff.detenteur!.company!.siret
    ).toBeNull();
  });

  it("should throw error if detenteur private individual info is missing", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN, {
      siret: ficheInterventionInput.operateur.company.siret,
      name: ficheInterventionInput.operateur.company.name!
    });
    const { mutate } = makeClient(emitter.user);
    const { errors } = await mutate<
      Pick<Mutation, "createFicheInterventionBsff">,
      MutationCreateFicheInterventionBsffArgs
    >(ADD_FICHE_INTERVENTION, {
      variables: {
        input: {
          ...ficheInterventionInput,
          detenteur: {
            isPrivateIndividual: true,
            company: {
              name: undefined,
              address: undefined,
              siret: undefined,
              contact: undefined,
              mail: undefined,
              phone: undefined
            }
          }
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le nom du détenteur de l'équipement (particulier) est requis\n" +
          "L'adresse du détenteur de l'équipement (particulier) est requise"
      })
    ]);
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
        extensions: expect.objectContaining({
          code: "UNAUTHENTICATED"
        })
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
        message: "Seul l'opérateur peut créer une fiche d'intervention."
      })
    ]);
  });
});
