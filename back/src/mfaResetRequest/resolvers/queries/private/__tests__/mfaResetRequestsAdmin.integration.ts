import gql from "graphql-tag";
import { resetDatabase } from "../../../../../../integration-tests/helper";
import makeClient from "../../../../../__tests__/testClient";
import { adminFactory, userFactory } from "../../../../../__tests__/factories";
import { prisma, MfaResetRequestStatus } from "@td/prisma";
import { addHours } from "date-fns";

const MFA_RESET_REQUESTS_ADMIN = gql`
  query mfaResetRequestsAdmin($skip: Int, $first: Int) {
    mfaResetRequestsAdmin(skip: $skip, first: $first) {
      totalCount
      pageInfo {
        hasNextPage
        hasPreviousPage
      }
      edges {
        cursor
        node {
          id
          status
          note
          createdAt
          dueAt
          user {
            email
            name
          }
        }
      }
    }
  }
`;

describe("Query mfaResetRequestsAdmin", () => {
  afterEach(resetDatabase);

  it("un non super-admin ne peut pas lister les demandes", async () => {
    const user = await userFactory();
    const { query } = makeClient(user);
    const { errors } = await query(MFA_RESET_REQUESTS_ADMIN, {
      variables: {}
    });
    expect(errors).not.toBeUndefined();
    expect(errors![0].message).toMatch(/admin/i);
  });

  it("un utilisateur non connecté ne peut pas lister les demandes", async () => {
    const { query } = makeClient();
    const { errors } = await query(MFA_RESET_REQUESTS_ADMIN, {
      variables: {}
    });
    expect(errors).not.toBeUndefined();
  });

  it("un super-admin récupère la liste paginée", async () => {
    const admin = await adminFactory();
    const target = await userFactory({
      totpSeed: "S1",
      totpActivatedAt: new Date()
    });
    await prisma.mfaResetRequest.create({
      data: {
        userId: target.id,
        status: MfaResetRequestStatus.PENDING,
        dueAt: addHours(new Date(), 48)
      }
    });

    const { query } = makeClient(admin);
    const { data, errors } = await query(MFA_RESET_REQUESTS_ADMIN, {
      variables: { skip: 0, first: 10 }
    });

    expect(errors).toBeUndefined();
    expect(data!.mfaResetRequestsAdmin.totalCount).toBe(1);
    expect(data!.mfaResetRequestsAdmin.edges[0].node.user.email).toBe(
      target.email
    );
    expect(data!.mfaResetRequestsAdmin.edges[0].node.status).toBe("PENDING");
  });

  it("la pagination fonctionne correctement", async () => {
    const admin = await adminFactory();
    const targets = await Promise.all(
      Array.from({ length: 5 }, (_, index) =>
        userFactory({
          email: `mfa-reset-pagination-${index}@td.io`,
          totpSeed: `S${index}`,
          totpActivatedAt: new Date()
        })
      )
    );
    await Promise.all(
      targets.map(t =>
        prisma.mfaResetRequest.create({
          data: {
            userId: t.id,
            status: MfaResetRequestStatus.PENDING,
            dueAt: addHours(new Date(), 48)
          }
        })
      )
    );

    const { query } = makeClient(admin);
    const { data } = await query(MFA_RESET_REQUESTS_ADMIN, {
      variables: { skip: 0, first: 3 }
    });
    expect(data!.mfaResetRequestsAdmin.totalCount).toBe(5);
    expect(data!.mfaResetRequestsAdmin.edges.length).toBe(3);
    expect(data!.mfaResetRequestsAdmin.pageInfo.hasNextPage).toBe(true);
  });
});
