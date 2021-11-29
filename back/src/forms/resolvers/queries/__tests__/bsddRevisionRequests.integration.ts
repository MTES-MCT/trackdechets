import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const BSDD_REVISION_REQUESTS = `
  query BsddRevisionRequests($siret: String!) {
    bsddRevisionRequests(siret: $siret) {
      totalCount
      pageInfo {
        hasNextPage
        startCursor
      }
      edges {
        node {
          id
          bsdd {
            id
          }
          status
        }
      }
    }
  }
`;

describe("Mutation.bsddRevisionRequests", () => {
  afterEach(() => resetDatabase());

  it("should list every revisionRequest from and to company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: otherCompany } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const bsdd1 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const bsdd2 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: company.siret }
    });

    // 2 unsettled
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd1.id,
        authorId: otherCompany.id,
        approvals: { create: { approverSiret: company.siret } },
        content: {},
        comment: ""
      }
    });
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        authorId: company.id,
        approvals: { create: { approverSiret: otherCompany.siret } },
        content: {},
        comment: ""
      }
    });

    // 2 settled revisionRequests
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        authorId: company.id,
        approvals: {
          create: {
            approverSiret: otherCompany.siret,
            status: "ACCEPTED"
          }
        },
        content: {},
        comment: ""
      }
    });
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        authorId: company.id,
        approvals: {
          create: {
            approverSiret: otherCompany.siret,
            status: "REFUSED"
          }
        },
        content: {},
        comment: ""
      }
    });

    const { data } = await query<Pick<Query, "bsddRevisionRequests">>(
      BSDD_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(data.bsddRevisionRequests.totalCount).toBe(4);
    expect(data.bsddRevisionRequests.pageInfo.hasNextPage).toBe(false);
  });

  it("should fail if requesting a siret current user is not part of", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { company } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bsddRevisionRequests">>(
      BSDD_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(errors[0].message).toBe(
      `Vous n'êtes pas membre de l'entreprise portant le siret "${company.siret}".`
    );
  });
});
