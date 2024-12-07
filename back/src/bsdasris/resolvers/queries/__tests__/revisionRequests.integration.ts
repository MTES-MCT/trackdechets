import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query, QueryBsdasriRevisionRequestsArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../__tests__/factories";

const BSDASRI_REVISION_REQUESTS = `
  query BsdaRevisionRequests($siret: String!, $where:BsdasriRevisionRequestWhere) {
    bsdasriRevisionRequests(siret: $siret, where: $where) {
      totalCount
      pageInfo {
        hasNextPage
        startCursor
      }
      edges {
        node {
          id
          bsdasri {
            id
          }
          status
        }
      }
    }
  }
`;

describe("Mutation.bsdasriRevisionRequests", () => {
  afterEach(() => resetDatabase());

  it("should list every revisionRequest from and to company", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: otherCompany } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const bsdasri1 = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });
    const bsdasri2 = await bsdasriFactory({
      opt: { destinationCompanySiret: company.siret }
    });

    // 2 unsettled
    await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri1.id,
        authoringCompanyId: otherCompany.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });
    await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: otherCompany.siret! } },
        comment: ""
      }
    });

    // 2 settled revisionRequests
    await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri2.id,
        authoringCompanyId: company.id,
        approvals: {
          create: {
            approverSiret: otherCompany.siret!,
            status: "ACCEPTED"
          }
        },
        comment: ""
      }
    });
    await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri2.id,
        authoringCompanyId: company.id,
        approvals: {
          create: {
            approverSiret: otherCompany.siret!,
            status: "REFUSED"
          }
        },
        comment: ""
      }
    });

    const { data } = await query<Pick<Query, "bsdasriRevisionRequests">>(
      BSDASRI_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(data.bsdasriRevisionRequests.totalCount).toBe(4);
    expect(data.bsdasriRevisionRequests.pageInfo.hasNextPage).toBe(false);
  });

  it("should fail if requesting a siret current user is not part of", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { company } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "bsdasriRevisionRequests">>(
      BSDASRI_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(errors[0].message).toBe(
      `Vous n'avez pas la permission de lister les demandes de révision de l'établissement ${company.siret}`
    );
  });

  it("should filter based on status", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    // should be included
    const bsdasri1RevisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // should not be included
    await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "REFUSED"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<
      Pick<Query, "bsdasriRevisionRequests">,
      QueryBsdasriRevisionRequestsArgs
    >(BSDASRI_REVISION_REQUESTS, {
      variables: { siret: company.orgId, where: { status: "ACCEPTED" } }
    });

    expect(data.bsdasriRevisionRequests.totalCount).toBe(1);
    expect(data.bsdasriRevisionRequests.edges.map(_ => _.node)[0].id).toEqual(
      bsdasri1RevisionRequest.id
    );
  });

  it("should filter based on bsdasriId", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdasri1 = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const bsdasri2 = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    // should be included
    const bsdasri1RevisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri1.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // should not be included
    await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<
      Pick<Query, "bsdasriRevisionRequests">,
      QueryBsdasriRevisionRequestsArgs
    >(BSDASRI_REVISION_REQUESTS, {
      variables: {
        siret: company.orgId,
        where: { bsdasriId: { _eq: bsdasri1.id } }
      }
    });

    expect(data.bsdasriRevisionRequests.totalCount).toBe(1);
    expect(data.bsdasriRevisionRequests.edges.map(_ => _.node)[0].id).toEqual(
      bsdasri1RevisionRequest.id
    );
  });
});
