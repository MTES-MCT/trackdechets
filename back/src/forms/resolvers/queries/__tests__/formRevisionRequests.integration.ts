import { resetDatabase } from "../../../../../integration-tests/helper";
import type { Query, QueryFormRevisionRequestsArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const FORM_REVISION_REQUESTS = `
  query FormRevisionRequests($siret: String!, $where:FormRevisionRequestWhere) {
    formRevisionRequests(siret: $siret, where: $where) {
      totalCount
      pageInfo {
        hasNextPage
        startCursor
      }
      edges {
        node {
          id
          content {
            wasteDetails {
              packagingInfos {
                volume
                identificationNumbers
              }
            }
          }
          form {
            id
            intermediaries {
              name
            }
          }
          status
        }
      }
    }
  }
`;

describe("Mutation.formRevisionRequests", () => {
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
        authoringCompanyId: otherCompany.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: otherCompany.siret! } },
        comment: ""
      }
    });

    // 2 settled revisionRequests
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
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
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
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

    const { data } = await query<Pick<Query, "formRevisionRequests">>(
      FORM_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(data.formRevisionRequests.totalCount).toBe(4);
    expect(data.formRevisionRequests.pageInfo.hasNextPage).toBe(false);
  });

  it("should return revision request of foreign transporter", async () => {
    const vatNumber = "IT13029381004";
    const { user, company: foreignTransporter } = await userWithCompanyFactory(
      "ADMIN",
      { siret: null, vatNumber, orgId: vatNumber }
    );
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );

    const { query } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterType: "APPENDIX1_PRODUCER",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: destinationCompany.siret,
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: null,
            transporterCompanyVatNumber: foreignTransporter.vatNumber
          }
        }
      }
    });

    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: foreignTransporter.id,
        approvals: {
          createMany: {
            data: [{ approverSiret: emitterCompany.siret! }]
          }
        },
        comment: ""
      }
    });

    const { data, errors } = await query<Pick<Query, "formRevisionRequests">>(
      FORM_REVISION_REQUESTS,
      {
        variables: { siret: foreignTransporter.vatNumber }
      }
    );

    expect(errors).toBeUndefined();

    expect(data.formRevisionRequests.totalCount).toBe(1);
  });

  it("should list every revisionRequest related to eco-organismes", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: otherCompany } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const bsdd1 = await formFactory({
      ownerId: user.id,
      opt: { ecoOrganismeSiret: company.siret }
    });
    const bsdd2 = await formFactory({
      ownerId: user.id,
      opt: { ecoOrganismeSiret: company.siret }
    });

    // 2 unsettled
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd1.id,
        authoringCompanyId: otherCompany.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: otherCompany.siret! } },
        comment: ""
      }
    });

    // 2 settled revisionRequests
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
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
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
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

    const { data } = await query<Pick<Query, "formRevisionRequests">>(
      FORM_REVISION_REQUESTS,
      {
        variables: { siret: company.siret }
      }
    );

    expect(data.formRevisionRequests.totalCount).toBe(4);
    expect(data.formRevisionRequests.pageInfo.hasNextPage).toBe(false);
  });

  it("should fail if requesting a siret current user is not part of", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { company } = await userWithCompanyFactory("ADMIN");
    const { query } = makeClient(user);

    const { errors } = await query<Pick<Query, "formRevisionRequests">>(
      FORM_REVISION_REQUESTS,
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

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    // should be included
    const bsdd1RevisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // should not be included
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "REFUSED"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<
      Pick<Query, "formRevisionRequests">,
      QueryFormRevisionRequestsArgs
    >(FORM_REVISION_REQUESTS, {
      variables: { siret: company.orgId, where: { status: "ACCEPTED" } }
    });

    expect(data.formRevisionRequests.totalCount).toBe(1);
    expect(data.formRevisionRequests.edges.map(_ => _.node)[0].id).toEqual(
      bsdd1RevisionRequest.id
    );
  });

  it("should filter based on bsddId", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd1 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const bsdd2 = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    // should be included
    const bsdd1RevisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd1.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    // should not be included
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<
      Pick<Query, "formRevisionRequests">,
      QueryFormRevisionRequestsArgs
    >(FORM_REVISION_REQUESTS, {
      variables: { siret: company.orgId, where: { bsddId: { _eq: bsdd1.id } } }
    });

    expect(data.formRevisionRequests.totalCount).toBe(1);
    expect(data.formRevisionRequests.edges.map(_ => _.node)[0].id).toEqual(
      bsdd1RevisionRequest.id
    );
  });

  it("should work if the revised form has intermediaries that are requested in the query", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { company: intermediary } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: {
            siret: intermediary.siret!,
            name: intermediary.name,
            address: intermediary.address,
            contact: "John Doe"
          }
        }
      }
    });

    const bsdd1RevisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED"
      }
    });

    const { query } = makeClient(user);

    const { data } = await query<
      Pick<Query, "formRevisionRequests">,
      QueryFormRevisionRequestsArgs
    >(FORM_REVISION_REQUESTS, {
      variables: { siret: company.orgId, where: { bsddId: { _eq: bsdd.id } } }
    });

    expect(data.formRevisionRequests.totalCount).toBe(1);
    expect(data.formRevisionRequests.edges.map(_ => _.node)[0].id).toEqual(
      bsdd1RevisionRequest.id
    );
  });

  it("[2025.03.1 hotfix] should display legacy revision requests on packagings without identification numbers", async () => {
    const { user, company } = await userWithCompanyFactory("ADMIN");

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });

    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        status: "ACCEPTED",
        // legacy packagingInfos payload
        wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }]
      }
    });

    const { query } = makeClient(user);

    const { errors } = await query<
      Pick<Query, "formRevisionRequests">,
      QueryFormRevisionRequestsArgs
    >(FORM_REVISION_REQUESTS, {
      variables: { siret: company.orgId, where: { bsddId: { _eq: bsdd.id } } }
    });

    expect(errors).toBeUndefined();
  });
});
