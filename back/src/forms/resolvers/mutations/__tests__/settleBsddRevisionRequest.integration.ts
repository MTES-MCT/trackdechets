import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSettleBsddRevisionRequestArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  formFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";

const SETTLE_BSDD_REVISION_REQUEST = `
  mutation SettleBsddRevisionRequest($id: ID!, $isAccepted: Boolean!) {
    settleBsddRevisionRequest(id: $id, isAccepted: $isAccepted) {
      id
      bsddId
      content {
        wasteDetails { code }
      }
      validations {
        company {
          siret
        }
        status
      }
      status
    }
  }
`;

describe("Mutation.settleBsddRevisionRequest", () => {
  afterEach(() => resetDatabase());

  it("should fail if revisionRequest doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate(SETTLE_BSDD_REVISION_REQUEST, {
      variables: {
        id: "inexistant revisionRequest",
        isAccepted: true
      }
    });

    expect(errors[0].message).toBe("Révision introuvable.");
  });

  it("should fail if user is not allowed on revisionRequest", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        content: {},
        comment: ""
      }
    });

    const { errors } = await mutate(SETTLE_BSDD_REVISION_REQUEST, {
      variables: {
        id: revisionRequest.id,
        isAccepted: true
      }
    });

    expect(errors[0].message).toBe(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision n'est plus approuvable."
    );
  });

  it("should fail if requester tries to approve its own revisionRequest", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: company.id,
        validations: { create: { companyId: companyOfSomeoneElse.id } },
        content: {},
        comment: ""
      }
    });

    const { errors } = await mutate(SETTLE_BSDD_REVISION_REQUEST, {
      variables: {
        id: revisionRequest.id,
        isAccepted: true
      }
    });

    expect(errors[0].message).toBe(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision n'est plus approuvable."
    );
  });

  it("should work if the only validator approves the revisionRequest", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: {},
        comment: ""
      }
    });

    const { data } = await mutate<Pick<Mutation, "settleBsddRevisionRequest">>(
      SETTLE_BSDD_REVISION_REQUEST,
      {
        variables: {
          id: revisionRequest.id,
          isAccepted: true
        }
      }
    );

    expect(data.settleBsddRevisionRequest.status).toBe("ACCEPTED");
  });

  it("should work if one of the validators approves the revisionRequest, but not mark the revisionRequest as accepted", async () => {
    const { company: secondCompany } = await userWithCompanyFactory("ADMIN");
    const { company: thirdCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: secondCompany.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: secondCompany.id,
        validations: {
          create: [{ companyId: company.id }, { companyId: thirdCompany.id }]
        },
        content: {},
        comment: ""
      }
    });

    const { data } = await mutate<Pick<Mutation, "settleBsddRevisionRequest">>(
      SETTLE_BSDD_REVISION_REQUEST,
      {
        variables: {
          id: revisionRequest.id,
          isAccepted: true
        }
      }
    );

    expect(data.settleBsddRevisionRequest.status).toBe("PENDING");

    expect(
      data.settleBsddRevisionRequest.validations.find(
        val => val.company.siret === company.siret
      ).status
    ).toBe("ACCEPTED");

    expect(
      data.settleBsddRevisionRequest.validations.find(
        val => val.company.siret === thirdCompany.siret
      ).status
    ).toBe("PENDING");
  });

  it("should mark the revisionRequest as refused if one of the validators refused the revisionRequest", async () => {
    const { company: secondCompany } = await userWithCompanyFactory("ADMIN");
    const { company: thirdCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: secondCompany.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: secondCompany.id,
        validations: {
          create: [{ companyId: company.id }, { companyId: thirdCompany.id }]
        },
        content: {},
        comment: ""
      }
    });

    const { data } = await mutate<Pick<Mutation, "settleBsddRevisionRequest">>(
      SETTLE_BSDD_REVISION_REQUEST,
      {
        variables: {
          id: revisionRequest.id,
          isAccepted: false
        }
      }
    );

    expect(
      data.settleBsddRevisionRequest.validations.find(
        val => val.company.siret === company.siret
      ).status
    ).toBe("REFUSED");
    expect(data.settleBsddRevisionRequest.status).toBe("REFUSED");
  });

  it("should work if only validator refuses the revisionRequest", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: {},
        comment: ""
      }
    });

    const { data } = await mutate<Pick<Mutation, "settleBsddRevisionRequest">>(
      SETTLE_BSDD_REVISION_REQUEST,
      {
        variables: {
          id: revisionRequest.id,
          isAccepted: false
        }
      }
    );

    expect(data.settleBsddRevisionRequest.status).toBe("REFUSED");
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
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: { wasteDetailsCode: "01 03 08" },
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "settleBsddRevisionRequest">,
      MutationSettleBsddRevisionRequestArgs
    >(SETTLE_BSDD_REVISION_REQUEST, {
      variables: {
        id: revisionRequest.id,
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
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        requestedById: companyOfSomeoneElse.id,
        validations: { create: { companyId: company.id } },
        content: { wasteDetailsCode: "01 03 08" },
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "settleBsddRevisionRequest">,
      MutationSettleBsddRevisionRequestArgs
    >(SETTLE_BSDD_REVISION_REQUEST, {
      variables: {
        id: revisionRequest.id,
        isAccepted: false
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsCode).not.toBe("01 03 08");
  });
});
