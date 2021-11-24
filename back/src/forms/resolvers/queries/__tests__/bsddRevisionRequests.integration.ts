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
      id
      bsddId
      status
    }
  }
`;

describe("Mutation.bsddRevisionRequests", () => {
  afterEach(() => resetDatabase());

  it("should list unarchived revisionRequest from and to company", async () => {
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
        requestedById: otherCompany.id,
        validations: { create: { companyId: company.id } },
        content: {},
        comment: ""
      }
    });
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        requestedById: company.id,
        validations: { create: { companyId: otherCompany.id } },
        content: {},
        comment: ""
      }
    });

    // 2 settled revisionRequests
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd2.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
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
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            status: "REFUSED"
          }
        },
        content: {},
        comment: ""
      }
    });

    const { data } = await query<Pick<Query, "bsddRevisionRequests">>(BSDD_REVISION_REQUESTS, {
      variables: { siret: company.siret }
    });
    expect(data.bsddRevisionRequests.length).toBe(4);
  });

  it("should mark settled revisionRequests as so", async () => {
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

    // 1 settled revisionRequest and 1 unsettled
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd1.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
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
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            status: "PENDING"
          }
        },
        content: {},
        comment: ""
      }
    });

    const { data } = await query<Pick<Query, "bsddRevisionRequests">>(BSDD_REVISION_REQUESTS, {
      variables: { siret: company.siret }
    });

    expect(
      data.bsddRevisionRequests.find(revisionRequest => revisionRequest.bsddId === bsdd1.id).status
    ).toBe("ACCEPTED");
    expect(
      data.bsddRevisionRequests.find(revisionRequest => revisionRequest.bsddId === bsdd2.id).status
    ).toBe("PENDING");
  });

  it("should mark accepted revisionRequests as so", async () => {
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

    // 1 approved revisionRequest and one refused
    await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd1.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
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
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            status: "REFUSED"
          }
        },
        content: {},
        comment: ""
      }
    });

    const { data } = await query<Pick<Query, "bsddRevisionRequests">>(BSDD_REVISION_REQUESTS, {
      variables: { siret: company.siret }
    });

    expect(
      data.bsddRevisionRequests.find(revisionRequest => revisionRequest.bsddId === bsdd1.id).status
    ).toBe("ACCEPTED");
  });
});
