import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const BSDD_REVIEWS = `
  query BsddReviews($siret: String!) {
    bsddReviews(siret: $siret) {
      id
      bsddId
      isAccepted
      isSettled
    }
  }
`;

describe("Mutation.bsddReviews", () => {
  afterEach(() => resetDatabase());

  it("should list unarchived review from and to company", async () => {
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
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd1.id,
        requestedById: otherCompany.id,
        validations: { create: { companyId: company.id } },
        content: {}
      }
    });
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        requestedById: company.id,
        validations: { create: { companyId: otherCompany.id } },
        content: {}
      }
    });

    // 2 settled reviews
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            isAccepted: true,
            isSettled: true
          }
        },
        content: {}
      }
    });
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            isAccepted: false,
            isSettled: true
          }
        },
        content: {}
      }
    });

    const { data } = await query<Pick<Query, "bsddReviews">>(BSDD_REVIEWS, {
      variables: { siret: company.siret }
    });
    expect(data.bsddReviews.length).toBe(4);
  });

  it("should mark settled reviews as so", async () => {
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

    // 1 settled review and 1 unsettled
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd1.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            isAccepted: true,
            isSettled: true
          }
        },
        content: {}
      }
    });
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            isAccepted: false,
            isSettled: false
          }
        },
        content: {}
      }
    });

    const { data } = await query<Pick<Query, "bsddReviews">>(BSDD_REVIEWS, {
      variables: { siret: company.siret }
    });

    expect(
      data.bsddReviews.find(review => review.bsddId === bsdd1.id).isSettled
    ).toBe(true);
    expect(
      data.bsddReviews.find(review => review.bsddId === bsdd2.id).isSettled
    ).toBe(false);
  });

  it("should mark accepted reviews as so", async () => {
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

    // 1 approved review and one refused
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd1.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            isAccepted: true,
            isSettled: true
          }
        },
        content: {}
      }
    });
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        requestedById: company.id,
        validations: {
          create: {
            companyId: otherCompany.id,
            isAccepted: false,
            isSettled: true
          }
        },
        content: {}
      }
    });

    const { data } = await query<Pick<Query, "bsddReviews">>(BSDD_REVIEWS, {
      variables: { siret: company.siret }
    });

    expect(
      data.bsddReviews.find(review => review.bsddId === bsdd1.id).isAccepted
    ).toBe(true);
    expect(
      data.bsddReviews.find(review => review.bsddId === bsdd2.id).isAccepted
    ).toBe(false);
  });
});
