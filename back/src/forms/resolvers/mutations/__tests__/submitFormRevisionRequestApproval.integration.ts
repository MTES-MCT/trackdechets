import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  Mutation,
  MutationSignEmissionFormArgs,
  MutationSubmitFormRevisionRequestApprovalArgs
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  destinationFactory,
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { EmitterType, Status } from "@prisma/client";
import { NON_CANCELLABLE_BSDD_STATUSES } from "../createFormRevisionRequest";
import { MARK_AS_SEALED, SIGN_EMISSION_FORM } from "./mutations";
import getReadableId from "../../../readableId";

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
  afterEach(resetDatabase);

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
        approvals: { create: { approverSiret: companyOfSomeoneElse.siret! } },
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
        approvals: { create: { approverSiret: company.siret! } },
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
  it("when an eco-organisme is on the bsdd, its approval should auto-approve the emitter's approval", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { company: emittercompany } = await userWithCompanyFactory("ADMIN");
    const { user, company: ecoOrganismecompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emittercompany.siret,
        ecoOrganismeSiret: ecoOrganismecompany.siret
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: recipientCompany.id,
        approvals: {
          create: [
            { approverSiret: emittercompany.siret! },
            { approverSiret: ecoOrganismecompany.siret! }
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

    expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

    const emitterApproval = await prisma.bsddRevisionRequestApproval.findFirst({
      where: {
        revisionRequestId: revisionRequest.id,
        approverSiret: emittercompany.siret!
      }
    });
    expect(emitterApproval?.status).toBe("ACCEPTED");
    expect(emitterApproval?.comment).toBe("Auto approval");
    const ecoOrgApproval = await prisma.bsddRevisionRequestApproval.findFirst({
      where: {
        revisionRequestId: revisionRequest.id,
        approverSiret: ecoOrganismecompany.siret!
      }
    });
    expect(ecoOrgApproval?.status).toBe("ACCEPTED");
  });
  it("when an eco-organisme is on the bsdd, emitter's approval should auto-approve the eco-orgaisme's approval", async () => {
    const { company: recipientCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company: emittercompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { company: ecoOrganismecompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: emittercompany.siret,
        ecoOrganismeSiret: ecoOrganismecompany.siret
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: recipientCompany.id,
        approvals: {
          create: [
            { approverSiret: emittercompany.siret! },
            { approverSiret: ecoOrganismecompany.siret! }
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
    expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

    const emitterApproval = await prisma.bsddRevisionRequestApproval.findFirst({
      where: {
        revisionRequestId: revisionRequest.id,
        approverSiret: emittercompany.siret!
      }
    });
    expect(emitterApproval?.status).toBe("ACCEPTED");
    const ecoOrgApproval = await prisma.bsddRevisionRequestApproval.findFirst({
      where: {
        revisionRequestId: revisionRequest.id,
        approverSiret: ecoOrganismecompany.siret!
      }
    });
    expect(ecoOrgApproval?.status).toBe("ACCEPTED");
    expect(ecoOrgApproval?.comment).toBe("Auto approval");
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
            { approverSiret: company.siret! },
            { approverSiret: thirdCompany.siret! }
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
      )!.status
    ).toBe("ACCEPTED");

    expect(
      data.submitFormRevisionRequestApproval.approvals.find(
        val => val.approverSiret === thirdCompany.siret
      )!.status
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
            { approverSiret: company.siret! },
            { approverSiret: thirdCompany.siret! }
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
      )!.status
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
        approvals: { create: { approverSiret: company.siret! } },
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
        approvals: { create: { approverSiret: company.siret! } },
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsCode).toBe("01 03 08");
  });
  it("should set pop from true to false", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        wasteDetailsPop: true
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteDetailsPop: false,
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsPop).toBe(false);
  });
  it("should set pop from false to true", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        wasteDetailsPop: false
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteDetailsPop: true,
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsPop).toBe(true);
  });

  it.each([true, false])(
    "should leave pop unchanged (%p)",
    async initialPopValue => {
      const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const { mutate } = makeClient(user);

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: companyOfSomeoneElse.siret,
          wasteDetailsPop: initialPopValue
        }
      });

      const revisionRequest = await prisma.bsddRevisionRequest.create({
        data: {
          bsddId: bsdd.id,
          authoringCompanyId: companyOfSomeoneElse.id,
          approvals: { create: { approverSiret: company.siret! } },
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

      const updatedBsdd = await prisma.form.findUniqueOrThrow({
        where: { id: bsdd.id }
      });

      expect(updatedBsdd.wasteDetailsPop).toBe(initialPopValue);
    }
  );
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
        approvals: { create: { approverSiret: emitter.siret! } },
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id },
      include: { forwardedIn: true }
    });

    expect(updatedBsdd.recipientCap).toEqual("TTR CAP");
    expect(updatedBsdd.forwardedIn!.recipientCap).toEqual("EXUTOIRE CAP");
    expect(updatedBsdd.quantityReceived).toEqual(40);
    expect(updatedBsdd.forwardedIn!.processingOperationDone).toBe("R 3");
    expect(updatedBsdd.forwardedIn!.processingOperationDescription).toBe(
      "Recyclage"
    );
    expect(updatedBsdd.forwardedIn!.wasteDetailsQuantity).toEqual(40);
    expect(updatedBsdd.forwardedIn!.quantityReceived).toBe(50);
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
        approvals: { create: { approverSiret: company.siret! } },
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
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
        approvals: { create: { approverSiret: company.siret! } },
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
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
        approvals: { create: { approverSiret: company.siret! } },
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.status).toBe("PROCESSED");
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
        emitterType: "APPENDIX2",
        emitterCompanySiret: company.siret,
        recipientCompanySiret: destination.siret,
        grouping: {
          create: {
            initialFormId: appendix2.id,
            quantity: appendix2.quantityReceived!
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_SEALED, {
      variables: { id: form.id }
    });

    // Sign by producer, cause can't cancel a draft BSD
    await mutate<
      Pick<Mutation, "signEmissionForm">,
      MutationSignEmissionFormArgs
    >(SIGN_EMISSION_FORM, {
      variables: {
        id: form.id,
        input: {
          emittedAt: new Date().toISOString() as unknown as Date,
          emittedBy: "Producer",
          quantity: 1
        }
      }
    });

    const appendix2grouped = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2.id }
    });
    expect(appendix2grouped.status).toEqual("GROUPED");

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: form.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: company.siret! } },
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

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: appendix2.id }
    });

    expect(updatedBsdd.status).toBe(Status.AWAITING_GROUP);

    const groupement = await prisma.formGroupement.findMany({
      where: { nextFormId: form.id }
    });

    expect(groupement.length).toEqual(0);
  });

  it.each(NON_CANCELLABLE_BSDD_STATUSES)(
    "should fail if request is about cancelation & the BSDD has a non-cancellable status",
    async (status: Status) => {
      const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const { mutate } = makeClient(user);

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: { status, emitterCompanySiret: companyOfSomeoneElse.siret }
      });

      const revisionRequest = await prisma.bsddRevisionRequest.create({
        data: {
          isCanceled: true,
          bsddId: bsdd.id,
          authoringCompanyId: companyOfSomeoneElse.id,
          approvals: { create: { approverSiret: company.siret! } },
          comment: ""
        }
      });

      const { errors } = await mutate<
        Pick<Mutation, "submitFormRevisionRequestApproval">
      >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      });
      expect(errors[0].message).toBe(
        "Impossible d'annuler un bordereau qui a été réceptionné sur l'installation de destination."
      );
    }
  );

  it("should edit appendix 1 details when revision is accepted on container", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const appendix1_item = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.RECEIVED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: companyOfSomeoneElse.siret,
        wasteDetailsCode: "15 01 10*",
        owner: { connect: { id: user.id } },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: company.siret
          }
        }
      }
    });

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.RECEIVED,
        emitterType: EmitterType.APPENDIX1,
        emitterCompanySiret: company.siret,
        emitterCompanyName: company.name,
        recipientCompanySiret: company.siret,
        grouping: {
          create: { initialFormId: appendix1_item.id, quantity: 0 }
        },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: company.siret
          }
        }
      }
    });

    const newWasteCode = "19 08 10*";
    expect(appendix1_item.wasteDetailsCode).not.toBe(newWasteCode);
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteDetailsCode: newWasteCode,
        comment: "Change waste code on appendix1 container"
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

    const updatedAppendix1 = await prisma.form.findUniqueOrThrow({
      where: { id: appendix1_item.id }
    });
    expect(updatedAppendix1.wasteDetailsCode).toBe(newWasteCode);
  });

  it("should change the operation code & mode", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        processingOperationDone: "R 1",
        destinationOperationMode: "VALORISATION_ENERGETIQUE"
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        processingOperationDone: "R 4",
        destinationOperationMode: "RECYCLAGE",
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.processingOperationDone).toBe("R 4");
    expect(updatedBsdd.destinationOperationMode).toBe("RECYCLAGE");
  });

  it("if the waste code changes from dangerous to non-dangerous, wasteDetailsIsDangerous should be updated", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        wasteDetailsCode: "19 08 10*", // dangerous
        wasteDetailsIsDangerous: true
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteDetailsCode: "19 08 09", // non-dangerous
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

    const updatedBsdd = await prisma.form.findFirst({ where: { id: bsdd.id } });
    expect(updatedBsdd?.wasteDetailsIsDangerous).toBeFalsy();
  });

  it("if the waste code changes from non-dangerous to dangerous, wasteDetailsIsDangerous should be updated", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        wasteDetailsCode: "19 08 09", // non-dangerous
        wasteDetailsIsDangerous: false
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteDetailsCode: "19 08 10*", // dangerous
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

    const updatedBsdd = await prisma.form.findFirst({ where: { id: bsdd.id } });
    expect(updatedBsdd?.wasteDetailsIsDangerous).toBeTruthy();
  });

  // TODO
  // TODO
  // TODO
  // TODO
  // TODO: update status as well!
  // TODO: ré-indexer!
  // TODO: sql pour fix en prod notraceability=true
  it("if operation code changes to final one > should reset noTraceability and nextDestination", async () => {
    // Given
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const nextDestination = await companyFactory({
      address: "Address",
      contact: "Contact",
      contactEmail: "contact@mail.com",
      name: "Name",
      contactPhone: "0600000000",
      vatNumber: "VAT"
    });
    const { mutate } = makeClient(user);

    const bsdd = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.NO_TRACEABILITY,
        emitterCompanySiret: companyOfSomeoneElse.siret,
        wasteDetailsCode: "19 08 10*",
        wasteDetailsIsDangerous: true,
        processingOperationDone: "D9",
        destinationOperationMode: "ELIMINATION",
        noTraceability: true,
        nextDestinationCompanyAddress: nextDestination.address,
        nextDestinationCompanyContact: nextDestination.contact,
        nextDestinationCompanyCountry: "FR",
        nextDestinationCompanyMail: nextDestination.contactEmail,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanyPhone: nextDestination.contactPhone,
        nextDestinationCompanySiret: nextDestination.siret,
        nextDestinationCompanyVatNumber: nextDestination.vatNumber,
        nextDestinationNotificationNumber: nextDestination.contactPhone
      }
    });

    // When
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        processingOperationDone: "D9F", // final
        destinationOperationMode: "ELIMINATION",
        comment: "Yolo"
      }
    });
    const { data, errors } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

    const updatedBsdd = await prisma.form.findFirst({ where: { id: bsdd.id } });

    expect(updatedBsdd?.processingOperationDone).toBe("D9F");

    // Status
    expect(updatedBsdd?.status).toBe(Status.PROCESSED);

    // No treaceability should be false
    expect(updatedBsdd?.noTraceability).toBe(false);

    // Next destination should be null
    expect(updatedBsdd?.nextDestinationCompanyName).toBe("");
    expect(updatedBsdd?.nextDestinationCompanySiret).toBe("");
    expect(updatedBsdd?.nextDestinationCompanyAddress).toBe("");
    expect(updatedBsdd?.nextDestinationCompanyContact).toBe("");
    expect(updatedBsdd?.nextDestinationCompanyPhone).toBe("");
    expect(updatedBsdd?.nextDestinationCompanyMail).toBe("");
    expect(updatedBsdd?.nextDestinationCompanyCountry).toBe("");
    expect(updatedBsdd?.nextDestinationCompanyVatNumber).toBe("");
    expect(updatedBsdd?.nextDestinationNotificationNumber).toBe("");
  });
});
