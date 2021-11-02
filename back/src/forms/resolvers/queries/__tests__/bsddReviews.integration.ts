import { resetDatabase } from "../../../../../integration-tests/helper";
import { Query } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const BSDD_REVIEWS = `
  mutation BsddReviews($siret: String!) {
    bsddReviews(siret: $siret) {
      id
      bsddId
      content
      isAccepted
      isArchived
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
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd1.id,
        fromCompanyId: otherCompany.id,
        toCompanyId: company.id,
        content: {}
      }
    });

    const bsdd2 = await formFactory({
      ownerId: user.id,
      opt: { recipientCompanySiret: company.siret }
    });
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        fromCompanyId: company.id,
        toCompanyId: otherCompany.id,
        content: {}
      }
    });

    // 2 archived reviews
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        fromCompanyId: company.id,
        toCompanyId: otherCompany.id,
        content: {},
        isAccepted: true,
        isArchived: true
      }
    });
    await prisma.bsddReview.create({
      data: {
        bsddId: bsdd2.id,
        fromCompanyId: company.id,
        toCompanyId: otherCompany.id,
        content: {},
        isAccepted: false,
        isArchived: true
      }
    });

    const { data } = await query<Pick<Query, "bsddReviews">>(BSDD_REVIEWS, {
      variables: { siret: company.siret }
    });

    expect(data.bsddReviews.length).toBe(2);
  });
});
