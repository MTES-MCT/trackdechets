import { resetDatabase } from "../../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdaFactory } from "../../../../__tests__/factories";
import prisma from "../../../../../prisma";
import {
  Mutation,
  MutationSubmitBsdaRevisionRequestApprovalArgs
} from "../../../../../generated/graphql/types";

const SUBMIT_BSDA_REVISION_REQUEST_APPROVAL = `
  mutation SubmitBsdaRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitBsdaRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
      bsda {
        id
      }
      content {
        waste { code }
      }
      approvals {
        approverSiret
        status
      }
      status
    }
  }
`;

describe("Mutation.submitBsdaRevisionRequestApproval", () => {
  afterEach(() => resetDatabase());

  it("should fail if revisionRequest doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: "inexistant revisionRequest",
        isApproved: true
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

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        comment: ""
      }
    });

    const { errors } = await mutate(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(errors[0].message).toBe(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision a déjà été approuvée."
    );
  });

  it("should fail if requester tries to approve its own revisionRequest", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: companyOfSomeoneElse.siret } },
        comment: ""
      }
    });

    const { errors } = await mutate(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(errors[0].message).toBe(
      "Vous n'êtes pas destinataire de cette révision, ou alors cette révision a déjà été approuvée."
    );
  });

  it("should work if the only approver approves the revisionRequest", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitBsdaRevisionRequestApproval.status).toBe("ACCEPTED");
  });

  it("should work if one of the approvers approves the revisionRequest, but not mark the revisionRequest as accepted", async () => {
    const { company: secondCompany } = await userWithCompanyFactory("ADMIN");
    const { company: thirdCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: secondCompany.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: secondCompany.id,
        approvals: {
          create: [
            { approverSiret: company.siret },
            { approverSiret: thirdCompany.siret }
          ]
        },
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitBsdaRevisionRequestApproval.status).toBe("PENDING");

    expect(
      data.submitBsdaRevisionRequestApproval.approvals.find(
        val => val.approverSiret === company.siret
      ).status
    ).toBe("ACCEPTED");

    expect(
      data.submitBsdaRevisionRequestApproval.approvals.find(
        val => val.approverSiret === thirdCompany.siret
      ).status
    ).toBe("PENDING");
  });

  it("should mark the revisionRequest as refused if one of the approvers refused the revisionRequest", async () => {
    const { company: secondCompany } = await userWithCompanyFactory("ADMIN");
    const { company: thirdCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: secondCompany.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: secondCompany.id,
        approvals: {
          create: [
            { approverSiret: company.siret },
            { approverSiret: thirdCompany.siret }
          ]
        },
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    expect(
      data.submitBsdaRevisionRequestApproval.approvals.find(
        val => val.approverSiret === company.siret
      ).status
    ).toBe("REFUSED");
    expect(data.submitBsdaRevisionRequestApproval.status).toBe("REFUSED");
  });

  it("should work if only validator refuses the revisionRequest", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    expect(data.submitBsdaRevisionRequestApproval.status).toBe("REFUSED");
  });

  it("should edit bsda accordingly when accepted", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    expect(bsda.wasteCode).not.toBe("01 03 08");
    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        wasteCode: "01 03 08",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdaRevisionRequestApprovalArgs
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id }
    });

    expect(updatedBsda.wasteCode).toBe("01 03 08");
  });

  it("should not edit bsda when refused", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    expect(bsda.wasteCode).not.toBe("01 03 08");
    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        wasteCode: "01 03 08",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdaRevisionRequestApprovalArgs
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    const updatedBsda = await prisma.bsda.findUnique({
      where: { id: bsda.id }
    });

    expect(updatedBsda.wasteCode).not.toBe("01 03 08");
  });
});
