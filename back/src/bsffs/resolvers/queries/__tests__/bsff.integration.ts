import { UserRole } from "@td/prisma";
import type { Query, QueryBsffArgs } from "@td/codegen-back";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  siretify,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  addBsffTransporter,
  createBsff,
  createBsffAfterOperation
} from "../../../__tests__/factories";
import { gql } from "graphql-tag";
import { fullBsff } from "../../../fragments";
import { ErrorCode } from "../../../../common/errors";

const GET_BSFF = gql`
  query GetBsff($id: ID!) {
    bsff(id: $id) {
      ...FullBsff
    }
  }
  ${fullBsff}
`;

describe("Query.bsff", () => {
  afterEach(resetDatabase);
  it("should disallow unauthenticated user", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter });

    const { query } = makeClient();
    const { errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("should allow the emitter to read their bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter });

    const { query } = makeClient(emitter.user);
    const { errors, data } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    expect(errors).toBeUndefined();

    expect(data.bsff).toEqual(
      expect.objectContaining({
        id: bsff.id
      })
    );
  });

  it("should throw an error not found if the bsff doesn't exist", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const { query } = makeClient(emitter.user);
    const { errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: "123"
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Le BSFF n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error not found if the bsff is deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter }, { data: { isDeleted: true } });

    const { query } = makeClient(emitter.user);
    const { errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Le BSFF n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  it("should allow access to draft bsff created by the user themselves", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter, destination },
      { data: { isDraft: true }, userId: destination.user.id }
    );

    // destination created this draft bsff and access is allowed
    const { query } = makeClient(destination.user);
    const { data } = await query<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.bsff).toEqual(
      expect.objectContaining({
        id: bsff.id
      })
    );
  });

  it("should throw an error when trying to access a draft bsff created by somebody else", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter, destination },
      { data: { isDraft: true }, userId: emitter.user.id }
    );

    // destination is on the bsff, but bsff is draft and created by emitter, destination user does not belong to  emitter company
    const { query } = makeClient(destination.user);
    const { errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: `Vous ne pouvez pas accéder à ce BSFF`
      })
    ]);
  });

  it("should allow admin user even if the user is not a contributor of the bsff", async () => {
    const { user } = await userWithCompanyFactory(
      UserRole.ADMIN,
      {},
      { isAdmin: true }
    );

    const otherEmitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter: otherEmitter });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.bsff).toEqual(
      expect.objectContaining({
        id: bsff.id
      })
    );
  });

  it("should throw an error not found if the user is not a contributor of the bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const otherEmitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter: otherEmitter });

    const { query } = makeClient(emitter.user);
    const { errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas accéder à ce BSFF"
      })
    ]);
  });

  it("should list the bsff's fiche d'interventions", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const ficheInterventionNumero = "0000001";
    const siret = siretify(3);
    const bsff = await createBsff(
      {
        emitter
      },
      {
        data: {
          ficheInterventions: {
            create: [
              {
                numero: ficheInterventionNumero,
                weight: 2,
                detenteurCompanyName: "Acme",
                detenteurCompanySiret: siret,
                detenteurCompanyAddress: "12 rue de la Tige, 69000",
                detenteurCompanyMail: "contact@gmail.com",
                detenteurCompanyPhone: "06",
                detenteurCompanyContact: "Jeanne Michelin",
                operateurCompanyName: "Clim'op",
                operateurCompanySiret: siret,
                operateurCompanyAddress: "12 rue de la Tige, 69000",
                operateurCompanyMail: "contact@climop.com",
                operateurCompanyPhone: "06",
                operateurCompanyContact: "Jean Dupont",
                postalCode: "69000"
              }
            ]
          }
        }
      }
    );

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.bsff).toEqual(
      expect.objectContaining({
        ficheInterventions: [
          expect.objectContaining({
            numero: ficheInterventionNumero
          })
        ]
      })
    );
  });

  it("should list the packagings regrouped in this BSFF", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const previousBsff = await createBsffAfterOperation(
      {
        emitter,
        transporter,
        destination
      },
      { packagingData: { operationCode: "R13" } }
    );
    const bsff = await createBsff(
      {
        emitter: destination
      },
      {
        previousPackagings: previousBsff.packagings,
        data: { type: "GROUPEMENT" }
      }
    );

    const { query } = makeClient(destination.user);
    const { data, errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    expect(errors).toBeUndefined();

    expect(data.bsff.grouping).toEqual([
      expect.objectContaining({ id: previousBsff.packagings[0].id })
    ]);
  });

  it("should return the packagings forwarded by this BSFF", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const forwardedBsff = await createBsffAfterOperation({
      emitter,
      transporter,
      destination
    });
    const bsff = await createBsff(
      {
        emitter: destination
      },
      {
        previousPackagings: forwardedBsff.packagings,
        data: { type: "REEXPEDITION" }
      }
    );
    const { query } = makeClient(destination.user);
    const { data, errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );
    expect(errors).toBeUndefined();

    expect(data.bsff.forwarding).toEqual([
      expect.objectContaining({ id: forwardedBsff.packagings[0].id })
    ]);
  });

  // Sentry error - Cannot return null for non-nullable field BsffWaste.code.
  // Si wasteDescription est défini mais pas wasteCode, on a une erreur car la définitio GraphQL est la suivante :
  // BsffWaste { code: String!, description: String, adr: String }
  it("should not return Bsff.waste when waste code is not present even if a description is present", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff(
      { emitter },
      { data: { wasteCode: null, wasteDescription: "fluide" } }
    );

    const { query } = makeClient(emitter.user);
    const { errors, data } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      GET_BSFF,
      {
        variables: {
          id: bsff.id
        }
      }
    );
    expect(errors).toBeUndefined();
    expect(data.bsff.waste).toBeNull();
  });

  it("should allow a foreign multi-modal transporter N>1 to read their BSFF", async () => {
    const transporter = await userWithCompanyFactory();
    const foreignTransporter = await userWithCompanyFactory("ADMIN", {
      siret: null,
      vatNumber: "IT13029381004"
    });
    const emitter = await userWithCompanyFactory("ADMIN");
    const bsff = await createBsff({ emitter, transporter });

    await addBsffTransporter({
      bsffId: bsff.id,
      transporter: foreignTransporter
    });

    const getBsffQuery = gql`
      query GetBsff($id: ID!) {
        bsff(id: $id) {
          id
        }
      }
    `;

    const { query } = makeClient(foreignTransporter.user);
    const { data, errors } = await query<Pick<Query, "bsff">, QueryBsffArgs>(
      getBsffQuery,
      {
        variables: {
          id: bsff.id
        }
      }
    );

    expect(errors).toBeUndefined();
    expect(data.bsff.id).toBe(bsff.id);
  });
});
