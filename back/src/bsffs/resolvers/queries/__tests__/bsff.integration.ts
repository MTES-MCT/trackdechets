import { UserRole } from "@prisma/client";
import { Query, QueryBsffArgs } from "../../../../generated/graphql/types";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  createBsff,
  createBsffAfterOperation
} from "../../../__tests__/factories";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { gql } from "apollo-server-express";
import { fullBsff } from "../../../fragments";

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
    const bsff = await createBsff(
      {
        emitter
      },
      {
        id: bsffId,
        ficheInterventions: {
          create: [
            {
              numero: ficheInterventionNumero,
              weight: 2,
              detenteurCompanyName: "Acme",
              detenteurCompanySiret: "1".repeat(14),
              detenteurCompanyAddress: "12 rue de la Tige, 69000",
              detenteurCompanyMail: "contact@gmail.com",
              detenteurCompanyPhone: "06",
              detenteurCompanyContact: "Jeanne Michelin",
              operateurCompanyName: "Clim'op",
              operateurCompanySiret: "2".repeat(14),
              operateurCompanyAddress: "12 rue de la Tige, 69000",
              operateurCompanyMail: "contact@climop.com",
              operateurCompanyPhone: "06",
              operateurCompanyContact: "Jean Dupont",
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
          expect.objectContaining({
            numero: ficheInterventionNumero
          })
        ]
      })
    );
  });

  it("should list the BSFFs regrouped in this one", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const previousBsff = await createBsffAfterOperation({
      emitter,
      transporter,
      destination
    });
    const bsff = await createBsff(
      {
        emitter: destination
      },
      {
        grouping: { connect: [{ id: previousBsff.id }] }
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
        grouping: [expect.objectContaining({ id: previousBsff.id })]
      })
    );
  });

  it("should return the BSFF this one has been grouped into", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffAfterOperation({
      emitter,
      transporter,
      destination
    });
    const nextBsff = await createBsff(
      {
        emitter: destination
      },
      { grouping: { connect: [{ id: bsff.id }] } }
    );

    const { query } = makeClient(destination.user);
    const { data } = await query<Pick<Query, "bsff">, QueryBsffArgs>(GET_BSFF, {
      variables: {
        id: bsff.id
      }
    });

    expect(data.bsff).toEqual(
      expect.objectContaining({
        groupedIn: expect.objectContaining({ id: nextBsff.id })
      })
    );
  });

  it("should return the BSFF forwarded by this one", async () => {
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
        forwarding: {
          connect: {
            id: forwardedBsff.id
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
        forwarding: { id: forwardedBsff.id }
      })
    );
  });

  it("should return the BSFF this one has been forwarded in", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const transporter = await userWithCompanyFactory(UserRole.ADMIN);
    const destination = await userWithCompanyFactory(UserRole.ADMIN);

    const bsff = await createBsffAfterOperation({
      emitter,
      transporter,
      destination
    });
    const nextBsff = await createBsff(
      {
        emitter: destination
      },
      {
        forwarding: {
          connect: {
            id: bsff.id
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
        forwardedIn: { id: nextBsff.id }
      })
    );
  });
});
