import { Company, Prisma, User, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import type {
  Mutation,
  MutationUpdateFicheInterventionBsffArgs
} from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { flattenFicheInterventionBsffInput } from "../../../converter";

import {
  createBsff,
  createFicheIntervention
} from "../../../__tests__/factories";
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
        siret: siretify(3),
        address: "12 rue de la Tige, 69000",
        mail: "contact@gmail.com",
        phone: "06",
        contact: "Jeanne Michelin"
      }
    },
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
      name: variables.input.operateur.company.name!
    });

    const ficheIntervention = await prisma.bsffFicheIntervention.create({
      data: {
        ...(flattenFicheInterventionBsffInput({
          ...variables.input,
          weight: variables.input.weight - 1
        }) as Prisma.BsffFicheInterventionCreateInput)
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
        extensions: expect.objectContaining({
          code: "UNAUTHENTICATED"
        })
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
        message: "Seul l'opérateur peut modifier une fiche d'intervention."
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

  it("should update detenteurCompanySirets when siret detenteur is updated", async () => {
    const detenteurAndOperateur = await userWithCompanyFactory(UserRole.ADMIN);

    const newDetenteur = await userWithCompanyFactory(UserRole.ADMIN);

    const ficheIntervention1 = await createFicheIntervention({
      operateur: detenteurAndOperateur,
      detenteur: detenteurAndOperateur
    });

    const bsff = await createBsff(
      { emitter: detenteurAndOperateur },
      {
        data: {
          isDraft: true,
          ficheInterventions: { connect: { id: ficheIntervention1.id } },
          detenteurCompanySirets: [detenteurAndOperateur.company.siret!]
        },
        userId: emitter.user.id
      }
    );

    const { mutate } = makeClient(detenteurAndOperateur.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "updateFicheInterventionBsff">,
      MutationUpdateFicheInterventionBsffArgs
    >(UPDATE_FICHE_INTERVENTION, {
      variables: {
        id: ficheIntervention1.id,

        input: {
          numero: "ABCDEFGHIJK",
          weight: 2,
          detenteur: {
            company: {
              name: "Nouveau détenteur",
              siret: newDetenteur.company.siret,
              address: "12 rue de la Tige, 69000",
              mail: "contact@gmail.com",
              phone: "06",
              contact: "Jeanne Michelin"
            }
          },
          operateur: {
            company: {
              name: "Clim'op",
              siret: detenteurAndOperateur.company.siret,
              address: "12 rue de la Tige, 69000",
              mail: "contact@climop.com",
              phone: "06",
              contact: "Dupont Jean"
            }
          },
          postalCode: "69000"
        }
      }
    });

    expect(errors).toBeUndefined();
    expect(data.updateFicheInterventionBsff.id).toBe(ficheIntervention1.id);

    const updatedBsff = await prisma.bsff.findUniqueOrThrow({
      where: { id: bsff.id }
    });
    expect(updatedBsff.detenteurCompanySirets).toEqual([
      newDetenteur.company.siret
    ]);
  });
});
