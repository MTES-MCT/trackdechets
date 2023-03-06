import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSubmitFormRevisionRequestApprovalArgs
} from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  destinationFactory,
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { Status } from "@prisma/client";
import { MARK_AS_SEALED } from "./markAsSealed.integration";

const SUBMIT_BSDD_REVISION_REQUEST_APPROVAL = `
  mutation SubmitFormRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitFormRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
      form {
        id
      }
      content {
        wasteDetails { code }
      }
      approvals {
        approverSiret
        status
      }
      status
    }
  }
`;

describe("Mutation.submitFormRevisionRequestApproval", () => {
  afterEach(() => resetDatabase());

  it("should fail if revisionRequest doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
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

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        comment: ""
      }
    });

    const { errors } = await mutate(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
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

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: companyOfSomeoneElse.siret } },
        comment: ""
      }
    });

    const { errors } = await mutate(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
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

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");
  });

  it("should work if one of the approvers approves the revisionRequest, but not mark the revisionRequest as accepted", async () => {
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
      Pick<Mutation, "submitFormRevisionRequestApproval">
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitFormRevisionRequestApproval.status).toBe("PENDING");

    expect(
      data.submitFormRevisionRequestApproval.approvals.find(
        val => val.approverSiret === company.siret
      ).status
    ).toBe("ACCEPTED");

    expect(
      data.submitFormRevisionRequestApproval.approvals.find(
        val => val.approverSiret === thirdCompany.siret
      ).status
    ).toBe("PENDING");
  });

  it("should mark the revisionRequest as refused if one of the approvers refused the revisionRequest", async () => {
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
      Pick<Mutation, "submitFormRevisionRequestApproval">
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    expect(
      data.submitFormRevisionRequestApproval.approvals.find(
        val => val.approverSiret === company.siret
      ).status
    ).toBe("REFUSED");
    expect(data.submitFormRevisionRequestApproval.status).toBe("REFUSED");
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
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    expect(data.submitFormRevisionRequestApproval.status).toBe("REFUSED");
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
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        wasteDetailsCode: "01 03 08",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsCode).toBe("01 03 08");
  });

  it("should update BSDD accordingly when there is a temporary storage", async () => {
    const { company: ttr } = await userWithCompanyFactory("ADMIN");
    const { company: exutoire } = await userWithCompanyFactory("ADMIN");
    const { user, company: emitter } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emitter.siret,
        recipientCompanySiret: ttr.siret
      },
      forwardedInOpts: {
        recipientCompanySiret: exutoire.siret,
        processingOperationDone: "D 1",
        processingOperationDescription: "Incinération"
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: exutoire.id,
        approvals: { create: { approverSiret: emitter.siret } },
        recipientCap: "TTR CAP",
        processingOperationDone: "R 3",
        quantityReceived: 50,
        processingOperationDescription: "Recyclage",
        temporaryStorageDestinationCap: "EXUTOIRE CAP",
        temporaryStorageTemporaryStorerQuantityReceived: 40,
        comment: "Changement opération"
      }
    });

    await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id },
      include: { forwardedIn: true }
    });

    expect(updatedBsdd.recipientCap).toEqual("TTR CAP");
    expect(updatedBsdd.forwardedIn.recipientCap).toEqual("EXUTOIRE CAP");
    expect(updatedBsdd.quantityReceived).toEqual(40);
    expect(updatedBsdd.forwardedIn.processingOperationDone).toBe("R 3");
    expect(updatedBsdd.forwardedIn.processingOperationDescription).toBe(
      "Recyclage"
    );
    expect(updatedBsdd.forwardedIn.wasteDetailsQuantity).toEqual(40);
    expect(updatedBsdd.forwardedIn.quantityReceived).toBe(50);
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
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        wasteDetailsCode: "01 03 08",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsCode).not.toBe("01 03 08");
  });

  it("should change the bsdd status when accepted, if the operation code is now a groupement one", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "PROCESSED"
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        processingOperationDone: "R 13",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.status).toBe("AWAITING_GROUP");
  });

  it("should change the bsdd status when accepted, if the operation code is now a final one", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "AWAITING_GROUP"
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        processingOperationDone: "D 5",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.status).toBe("PROCESSED");
  });

  it("should change the bsdd status to CANCELED, if the operation code is now a final one", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "AWAITING_GROUP"
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret } },
        isCanceled: true,
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.status).toBe(Status.CANCELED);
  });

  it("should free BSD from group if group parent BSD is canceled", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const destination = await destinationFactory();

    const appendix2 = await formFactory({
      ownerId: user.id,
      opt: { status: "AWAITING_GROUP", quantityReceived: 1 }
    });

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: appendix2.quantityReceived
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    const appendix2grouped = await prisma.form.findUnique({
      where: { id: appendix2.id }
    });
    expect(appendix2grouped.status).toEqual("GROUPED");

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: form.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret } },
        isCanceled: true,
        comment: "test cancel"
      }
    });

    await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdd = await prisma.form.findUnique({
      where: { id: appendix2.id }
    });

    expect(updatedBsdd.status).toBe(Status.AWAITING_GROUP);

    const groupement = await prisma.formGroupement.findMany({
      where: { nextFormId: form.id }
    });

    expect(groupement.length).toEqual(0);
  });
});
