import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSettleBsddReviewArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const SETTLE_BSDD_REVIEW = `
  mutation SettleBsddReview($id: ID!, $isAccepted: Boolean!) {
    settleBsddReview(id: $id, isAccepted: $isAccepted) {
      id
      bsddId
      content {
        wasteDetails { code }
      }
      isAccepted
      isSettled
    }
  }
`;

describe("Mutation.settleBsddReview", () => {
  afterEach(() => resetDatabase());

  it("should fail if review doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate(SETTLE_BSDD_REVIEW, {
      variables: {
        id: "inexistant review",
        isAccepted: true
      }
    });

    expect(errors[0].message).toBe("Révision introuvable.");
  });

  it("should fail if user is not allowed on review", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const review = await prisma.bsddReview.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        content: {}
      }
    });

    const { errors } = await mutate(SETTLE_BSDD_REVIEW, {
      variables: {
        id: review.id,
        isAccepted: true
      }
    });

    expect(errors[0].message).toBe(
      "Vous n'êtes pas destinataire de cette révision."
    );
  });

  it("should fail if requester tries to approve its own review", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const review = await prisma.bsddReview.create({
      data: {
        bsddId: bsdd.id,
        requestedById: company.id,
        validations: { create: { companyId: companyOfSomeoneElse.id } },
        content: {}
      }
    });

    const { errors } = await mutate(SETTLE_BSDD_REVIEW, {
      variables: {
        id: review.id,
        isAccepted: true
      }
    });

    expect(errors[0].message).toBe(
      "Vous n'êtes pas destinataire de cette révision."
    );
  });

  it("should work if one of the validators approves the review", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const review = await prisma.bsddReview.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: {}
      }
    });

    const { data } = await mutate<Pick<Mutation, "settleBsddReview">>(
      SETTLE_BSDD_REVIEW,
      {
        variables: {
          id: review.id,
          isAccepted: true
        }
      }
    );

    expect(data.settleBsddReview.isAccepted).toBe(true);
    expect(data.settleBsddReview.isSettled).toBe(true);
  });

  it("should work if only validator refuses the review", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const review = await prisma.bsddReview.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: {}
      }
    });

    const { data } = await mutate<Pick<Mutation, "settleBsddReview">>(
      SETTLE_BSDD_REVIEW,
      {
        variables: {
          id: review.id,
          isAccepted: false
        }
      }
    );

    expect(data.settleBsddReview.isAccepted).toBe(false);
    expect(data.settleBsddReview.isSettled).toBe(true);
  });

  it("should edit bsdd accordingly when accepted", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    expect(bsdd.wasteDetailsCode).not.toBe("01 03 08");
    const review = await prisma.bsddReview.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: { wasteDetailsCode: "01 03 08" }
      }
    });

    await mutate<
      Pick<Mutation, "settleBsddReview">,
      MutationSettleBsddReviewArgs
    >(SETTLE_BSDD_REVIEW, {
      variables: {
        id: review.id,
        isAccepted: true
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsCode).toBe("01 03 08");
  });

  it("should not edit bsdd when refused", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    expect(bsdd.wasteDetailsCode).not.toBe("01 03 08");
    const review = await prisma.bsddReview.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: { wasteDetailsCode: "01 03 08" }
      }
    });

    await mutate<
      Pick<Mutation, "settleBsddReview">,
      MutationSettleBsddReviewArgs
    >(SETTLE_BSDD_REVIEW, {
      variables: {
        id: review.id,
        isAccepted: false
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsCode).not.toBe("01 03 08");
  });
});
