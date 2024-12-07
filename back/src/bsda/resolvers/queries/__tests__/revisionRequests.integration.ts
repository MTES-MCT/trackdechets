import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query, QueryBsdaRevisionRequestsArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { bsdaFactory } from "../../../__tests__/factories";

const BSDA_REVISION_REQUESTS = `
  query BsdaRevisionRequests($siret: String!, $where:BsdaRevisionRequestWhere) {
    bsdaRevisionRequests(siret: $siret, where: $where) {
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
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });
    await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: otherCompany.siret! } },
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
            approverSiret: otherCompany.siret!,
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
            approverSiret: otherCompany.siret!,
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
      `Vous n'avez pas la permission de lister les demandes de révision de l'établissement ${company.siret}`
    );
  });

  it("should filter based on status", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    // should be included
    const bsda1RevisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // should not be included
    await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "REFUSED"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<
      Pick<Query, "bsdaRevisionRequests">,
      QueryBsdaRevisionRequestsArgs
    >(BSDA_REVISION_REQUESTS, {
      variables: { siret: company.orgId, where: { status: "ACCEPTED" } }
    });

    expect(data.bsdaRevisionRequests.totalCount).toBe(1);
    expect(data.bsdaRevisionRequests.edges.map(_ => _.node)[0].id).toEqual(
      bsda1RevisionRequest.id
    );
  });

  it("should filter based on bsdaId", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsda1 = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const bsda2 = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    // should be included
    const bsda1RevisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda1.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // should not be included
    await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<
      Pick<Query, "bsdaRevisionRequests">,
      QueryBsdaRevisionRequestsArgs
    >(BSDA_REVISION_REQUESTS, {
      variables: { siret: company.orgId, where: { bsdaId: { _eq: bsda1.id } } }
    });

    expect(data.bsdaRevisionRequests.totalCount).toBe(1);
    expect(data.bsdaRevisionRequests.edges.map(_ => _.node)[0].id).toEqual(
      bsda1RevisionRequest.id
    );
  });
});
