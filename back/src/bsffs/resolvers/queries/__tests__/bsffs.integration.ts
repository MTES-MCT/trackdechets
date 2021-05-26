import { UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { Query, QueryBsffsArgs } from "../../../../generated/graphql/types";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { OPERATION_CODES, OPERATION_QUALIFICATIONS } from "../../../constants";
import { getFicheInterventionId } from "../../../converter";
import { createBsff } from "../../../__tests__/factories";

const GET_BSFFS = `
  query GetBsffs($after: ID, $first: Int, $before: ID, $last: Int, $where: BsffWhere) {
    bsffs(after: $after, first: $first, before: $before, last: $last, where: $where) {
      edges {
        node {
          id
          ficheInterventions {
            numero
          }
        }
      }
    }
  }
`;

describe("Query.bsffs", () => {
  afterEach(resetDatabase);

  it("should return bsffs associated with the user company", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff({ emitter });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should not return bsffs not associated with the user company", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff({ emitter });
    await createBsff();

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should return bsffs associated for user with several companies", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    const otherCompany = await companyAssociatedToExistingUserFactory(
      emitter.user,
      UserRole.ADMIN
    );

    await createBsff({ emitter });
    await createBsff({
      emitter: { user: emitter.user, company: otherCompany }
    });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(2);
  });

  it.each(["emitter", "transporter", "destination"])(
    "should filter bsffs where user appears as %s",
    async role => {
      const userAndCompany = await userWithCompanyFactory(UserRole.ADMIN);

      await createBsff({ emitter: userAndCompany });
      await createBsff({ transporter: userAndCompany });
      await createBsff({ destination: userAndCompany });

      const { query } = makeClient(userAndCompany.user);
      const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
        GET_BSFFS,
        {
          variables: {
            where: {
              [role]: {
                company: {
                  siret: userAndCompany.company.siret
                }
              }
            }
          }
        }
      );

      expect(data.bsffs.edges.length).toBe(1);
    }
  );

  it("should not return deleted bsffs", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff({ emitter }, { isDeleted: true });

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(0);
  });

  it("should list the fiche d'interventions", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);

    const bsffId = getReadableId(ReadableIdPrefix.FF);
    const ficheInterventionNumero = "0000001";
    await createBsff(
      {
        emitter,
        ficheInterventions: [
          {
            id: getFicheInterventionId(bsffId, ficheInterventionNumero),
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

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges[0].node).toEqual(
      expect.objectContaining({
        ficheInterventions: [
          {
            numero: ficheInterventionNumero
          }
        ]
      })
    );
  });

  it("should filter bsffs with a given operation code", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.D10,
        destinationOperationQualification: OPERATION_QUALIFICATIONS.INCINERATION
      }
    );
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.R12,
        destinationOperationQualification:
          OPERATION_QUALIFICATIONS.RECONDITIONNEMENT
      }
    );

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            destination: {
              operation: {
                code: "D10"
              }
            }
          }
        }
      }
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should filter bsffs with a given operation qualification", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.D10,
        destinationOperationQualification: OPERATION_QUALIFICATIONS.INCINERATION
      }
    );
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.R12,
        destinationOperationQualification:
          OPERATION_QUALIFICATIONS.RECONDITIONNEMENT
      }
    );

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            destination: {
              operation: {
                qualification: "INCINERATION"
              }
            }
          }
        }
      }
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should filter bsffs with a given operation code and qualification", async () => {
    const emitter = await userWithCompanyFactory(UserRole.ADMIN);
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.R12,
        destinationOperationQualification:
          OPERATION_QUALIFICATIONS.RECONDITIONNEMENT
      }
    );
    await createBsff(
      { emitter },
      {
        destinationOperationCode: OPERATION_CODES.R12,
        destinationOperationQualification: OPERATION_QUALIFICATIONS.GROUPEMENT
      }
    );

    const { query } = makeClient(emitter.user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS,
      {
        variables: {
          where: {
            destination: {
              operation: {
                code: "R12",
                qualification: "RECONDITIONNEMENT"
              }
            }
          }
        }
      }
    );

    expect(data.bsffs.edges.length).toBe(1);
  });
});
