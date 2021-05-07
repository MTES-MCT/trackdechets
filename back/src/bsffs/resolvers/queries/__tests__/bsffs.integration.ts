import { UserRole } from ".prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import getReadableId, { ReadableIdPrefix } from "../../../../forms/readableId";
import { Query, QueryBsffsArgs } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  userWithCompanyFactory,
  companyAssociatedToExistingUserFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const GET_BSFFS = `
  query GetBsffs($after: ID, $first: Int, $before: ID, $last: Int, $where: BsffWhere) {
    bsffs(after: $after, first: $first, before: $before, last: $last, where: $where) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

describe("Query.bsffs", () => {
  afterEach(resetDatabase);

  it("should return bsffs associated with the user company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should not return bsffs not associated with the user company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret
      }
    });
    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: "1".repeat(14)
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(1);
  });

  it("should return bsffs associated for user with several companies", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    const otherCompany = await companyAssociatedToExistingUserFactory(
      user,
      UserRole.ADMIN
    );

    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret
      }
    });
    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: otherCompany.siret
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(2);
  });

  it.each(["emitter", "transporter", "destination"])(
    "should filter bsffs where user appears as %s",
    async role => {
      const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);

      await prisma.bsff.create({
        data: {
          id: getReadableId(ReadableIdPrefix.FF),
          emitterCompanySiret: company.siret
        }
      });
      await prisma.bsff.create({
        data: {
          id: getReadableId(ReadableIdPrefix.FF),
          transporterCompanySiret: company.siret
        }
      });
      await prisma.bsff.create({
        data: {
          id: getReadableId(ReadableIdPrefix.FF),
          destinationCompanySiret: company.siret
        }
      });

      const { query } = makeClient(user);
      const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
        GET_BSFFS,
        {
          variables: {
            where: {
              [role]: {
                company: {
                  siret: company.siret
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
    const { user, company } = await userWithCompanyFactory(UserRole.ADMIN);
    await prisma.bsff.create({
      data: {
        id: getReadableId(ReadableIdPrefix.FF),
        emitterCompanySiret: company.siret,
        isDeleted: true
      }
    });

    const { query } = makeClient(user);
    const { data } = await query<Pick<Query, "bsffs">, QueryBsffsArgs>(
      GET_BSFFS
    );

    expect(data.bsffs.edges.length).toBe(0);
  });
});
