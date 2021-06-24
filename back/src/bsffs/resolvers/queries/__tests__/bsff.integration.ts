import { UserRole } from ".prisma/client";
import { Query, QueryBsffArgs } from "../../../../generated/graphql/types";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsff,
  createBsffAfterOperation
} from "../../../__tests__/factories";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { getFicheInterventionId } from "../../../converter";

const GET_BSFF = `
  query GetBsff($id: ID!) {
    bsff(id: $id) {
      id
      ficheInterventions {
        numero
      }
      bsffs {
        id
      }
    }
  }
`;

describe("Query.bsff", () => {
  afterEach(resetDatabase);

  it("should allow the emitter to read their bsff", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter });

    const { query } = makeClient(emitter.user);
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
        message: "Le bordereau de fluides frigorigènes n°123 n'existe pas."
      })
    ]);
  });

  it("should throw an error not found if the bsff is deleted", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const bsff = await createBsff({ emitter }, { isDeleted: true });

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
        message: `Le bordereau de fluides frigorigènes n°${bsff.id} n'existe pas.`
      })
    ]);
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
        message: `Le bordereau de fluides frigorigènes n°${bsff.id} n'existe pas.`
      })
    ]);
  });

  it("should list the bsff's fiche d'interventions", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const bsffId = getReadableId(ReadableIdPrefix.FF);
    const ficheInterventionNumero = "0000001";
    const ficheInterventionId = getFicheInterventionId(
      bsffId,
      ficheInterventionNumero
    );
    const bsff = await createBsff(
      {
        emitter
      },
      {
        id: bsffId,
        ficheInterventions: {
          create: [
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
          {
            numero: ficheInterventionNumero
          }
        ]
      })
    );
  });

  it("should list the bsff's associated bsffs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsffToAssociate = await createBsffAfterOperation({
      emitter,
      transporter,
      destination
    });
    const bsff = await createBsff(
      {
        emitter: destination
      },
      {
        bsffs: {
          connect: {
            id: bsffToAssociate.id
          }
        }
      }
    );

    const { query } = makeClient(destination.user);
    const { data } = await query<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.bsff).toEqual(
      expect.objectContaining({
        bsffs: [
          {
            id: bsffToAssociate.id
          }
        ]
      })
    );
  });
});
