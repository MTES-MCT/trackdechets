import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";

const BSDA_REVISION_REQUESTS = `
  query BsdaRevisionRequests($siret: String!) {
    bsdaRevisionRequests(siret: $siret) {
      totalCount
      pageInfo {
        hasNextPage
        startCursor
      }
      edges {
        node {
          id
          bsda {
            id
          }
          status
        }
      }
    }
  }
`;

describe("Mutation.bsdaRevisionRequests", () => {
  afterEach(() => resetDatabase());

  it("should list every revisionRequest from and to company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: otherCompany } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const bsda1 = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });
    const bsda2 = await bsdaFactory({
      opt: { destinationCompanySiret: company.siret }
    });

    // 2 unsettled
    await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda1.id,
        authoringCompanyId: otherCompany.id,
        approvals: { create: { approverSiret: company.siret } },
        comment: ""
      }
    });
    await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: otherCompany.siret } },
        comment: ""
      }
    });

    // 2 settled revisionRequests
    await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda2.id,
        authoringCompanyId: company.id,
        approvals: {
          create: {
            approverSiret: otherCompany.siret,
            status: "ACCEPTED"
          }
        },
        comment: ""
      }
    });
    await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda2.id,
        authoringCompanyId: company.id,
        approvals: {
          create: {
            approverSiret: otherCompany.siret,
            status: "REFUSED"
          }
        },
        comment: ""
      }
    });

    const { data } = await query<Pick<Query, "bsdaRevisionRequests">>(
      BSDA_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(data.bsdaRevisionRequests.totalCount).toBe(4);
    expect(data.bsdaRevisionRequests.pageInfo.hasNextPage).toBe(false);
  });

  it("should fail if requesting a siret current user is not part of", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { company } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bsdaRevisionRequests">>(
      BSDA_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(errors[0].message).toBe(
      `Vous n'êtes pas membre de l'entreprise portant le siret "${company.siret}".`
    );
  });
});
