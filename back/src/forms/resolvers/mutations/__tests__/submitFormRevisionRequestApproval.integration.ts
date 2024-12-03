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
import {
  CompanyType,
  EmitterType,
  RevisionRequestStatus,
  Status,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import { NON_CANCELLABLE_BSDD_STATUSES } from "../createFormRevisionRequest";
import { MARK_AS_SEALED, SIGN_EMISSION_FORM } from "./mutations";
import { operationHooksQueue } from "../../../../queue/producers/operationHook";
import getReadableId from "../../../readableId";
import { operationHook } from "../../../operationHook";
import { waitForJobsCompletion } from "../../../../queue/helpers";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";

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
    expect(updatedBsdd.quantityReceived?.toNumber()).toEqual(40);
    expect(updatedBsdd.forwardedIn!.processingOperationDone).toBe("R 3");
    expect(updatedBsdd.forwardedIn!.processingOperationDescription).toBe(
      "Recyclage"
    );
    expect(updatedBsdd.forwardedIn!.wasteDetailsQuantity?.toNumber()).toEqual(
      40
    );
    expect(updatedBsdd.forwardedIn!.quantityReceived?.toNumber()).toBe(50);
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
            quantity: appendix2.quantityReceived!.toNumber()
          }
        }
      }
    });

    const { mutate } = makeClient(user);

    const mutateFn1 = () =>
      mutate(MARK_AS_SEALED, {
        variables: { id: form.id }
      });

    await waitForJobsCompletion({
      fn: mutateFn1,
      queue: updateAppendix2Queue,
      expectedJobCount: 1
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

    const mutateFn2 = () =>
      mutate<
        Pick<Mutation, "submitFormRevisionRequestApproval">,
        MutationSubmitFormRevisionRequestApprovalArgs
      >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      });

    await waitForJobsCompletion({
      fn: mutateFn2,
      queue: updateAppendix2Queue,
      expectedJobCount: 1
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

  it("should udate appendix 1 parent's quantity if revision modified child's quantity", async () => {
    // Given
    const { company: childAppendixEmitter } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user: parentAppendixUser, company: parentAppendixEmitter } =
      await userWithCompanyFactory("ADMIN");
    const { company: transporter } = await userWithCompanyFactory("ADMIN");

    const appendix1Child = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.RECEIVED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: childAppendixEmitter.siret,
        wasteDetailsCode: "15 01 10*",
        wasteDetailsQuantity: 10,
        owner: { connect: { id: parentAppendixUser.id } },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret
          }
        }
      }
    });

    const appendix1Parent = await formFactory({
      ownerId: parentAppendixUser.id,
      opt: {
        status: Status.SENT,
        emitterType: EmitterType.APPENDIX1,
        emitterCompanySiret: parentAppendixEmitter.siret,
        emitterCompanyName: parentAppendixEmitter.name,
        recipientCompanySiret: parentAppendixEmitter.siret,
        wasteDetailsQuantity: 10,
        grouping: {
          create: { initialFormId: appendix1Child.id, quantity: 0 }
        },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret
          }
        }
      }
    });

    // When
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: appendix1Child.id,
        authoringCompanyId: childAppendixEmitter.id,
        approvals: { create: { approverSiret: parentAppendixEmitter.siret! } },
        wasteDetailsQuantity: 6.8,
        comment: "Changing quantity from 10 to 6.8"
      }
    });

    const { mutate } = makeClient(parentAppendixUser);
    const { data, errors } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.submitFormRevisionRequestApproval.status).toBe(
      RevisionRequestStatus.ACCEPTED
    );

    const updatedAppendix1Child = await prisma.form.findUniqueOrThrow({
      where: { id: appendix1Child.id }
    });
    expect(updatedAppendix1Child.wasteDetailsQuantity?.toNumber()).toEqual(6.8);

    const updatedAppendix1Parent = await prisma.form.findUniqueOrThrow({
      where: { id: appendix1Parent.id }
    });
    expect(updatedAppendix1Parent.wasteDetailsQuantity?.toNumber()).toEqual(
      6.8
    );
  });

  it("should udate appendix 1 parent's quantity if revision modified child's quantity (multiple children)", async () => {
    // Given
    const { company: childAppendixEmitter } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user: parentAppendixUser, company: parentAppendixEmitter } =
      await userWithCompanyFactory("ADMIN");
    const { company: transporter } = await userWithCompanyFactory("ADMIN");

    const appendix1Child1 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.RECEIVED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: childAppendixEmitter.siret,
        wasteDetailsCode: "15 01 10*",
        wasteDetailsQuantity: 10,
        owner: { connect: { id: parentAppendixUser.id } },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret
          }
        }
      }
    });

    const appendix1Child2 = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.RECEIVED,
        emitterType: EmitterType.APPENDIX1_PRODUCER,
        emitterCompanySiret: childAppendixEmitter.siret,
        wasteDetailsCode: "15 01 10*",
        wasteDetailsQuantity: 5.5,
        owner: { connect: { id: parentAppendixUser.id } },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret
          }
        }
      }
    });

    const appendix1Parent = await formFactory({
      ownerId: parentAppendixUser.id,
      opt: {
        status: Status.SENT,
        emitterType: EmitterType.APPENDIX1,
        emitterCompanySiret: parentAppendixEmitter.siret,
        emitterCompanyName: parentAppendixEmitter.name,
        recipientCompanySiret: parentAppendixEmitter.siret,
        wasteDetailsQuantity: 15.5,
        grouping: {
          create: [
            { initialFormId: appendix1Child1.id, quantity: 0 },
            { initialFormId: appendix1Child2.id, quantity: 0 }
          ]
        },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporter.siret
          }
        }
      }
    });

    // When
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: appendix1Child1.id,
        authoringCompanyId: childAppendixEmitter.id,
        approvals: { create: { approverSiret: parentAppendixEmitter.siret! } },
        wasteDetailsQuantity: 6.8,
        comment: "Changing quantity from 10 to 6.8"
      }
    });

    const { mutate } = makeClient(parentAppendixUser);
    const { data, errors } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.submitFormRevisionRequestApproval.status).toBe(
      RevisionRequestStatus.ACCEPTED
    );

    const updatedAppendix1Child = await prisma.form.findUniqueOrThrow({
      where: { id: appendix1Child1.id }
    });
    expect(updatedAppendix1Child.wasteDetailsQuantity?.toNumber()).toBe(6.8);

    const updatedAppendix1Parent = await prisma.form.findUniqueOrThrow({
      where: { id: appendix1Parent.id }
    });
    expect(updatedAppendix1Parent.wasteDetailsQuantity?.toNumber()).toBe(12.3);
  });

  it("should udate bsdd sample number", async () => {
    // Given
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("ADMIN");

    const bsdd = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.RECEIVED,
        emitterCompanySiret: emitterCompany.siret,
        wasteDetailsCode: "15 01 10*",
        wasteDetailsSampleNumber: "sample number 1",
        owner: { connect: { id: user.id } },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporterCompany.siret
          }
        }
      }
    });

    // When
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: emitterCompany.id,
        approvals: { create: { approverSiret: transporterCompany.siret! } },
        wasteDetailsSampleNumber: "sample number 2",
        comment: "Changing sample number from 1 to 2"
      }
    });

    const { mutate } = makeClient(transporter);
    const { data, errors } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.submitFormRevisionRequestApproval.status).toBe(
      RevisionRequestStatus.ACCEPTED
    );

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });
    expect(updatedBsdd.wasteDetailsSampleNumber).toEqual("sample number 2");
  });

  it("should udate bsdd wasteDetailsQuantity", async () => {
    // Given
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("ADMIN");

    const bsdd = await prisma.form.create({
      data: {
        readableId: getReadableId(),
        status: Status.RECEIVED,
        emitterCompanySiret: emitterCompany.siret,
        wasteDetailsCode: "15 01 10*",
        wasteDetailsQuantity: 10,
        owner: { connect: { id: user.id } },
        transporters: {
          create: {
            number: 1,
            transporterCompanySiret: transporterCompany.siret
          }
        }
      }
    });

    // When
    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        bsddId: bsdd.id,
        authoringCompanyId: emitterCompany.id,
        approvals: { create: { approverSiret: transporterCompany.siret! } },
        wasteDetailsQuantity: 6.5,
        comment: "Changing wasteDetailsQuantity from 10 to 6.5"
      }
    });

    const { mutate } = makeClient(transporter);
    const { data, errors } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">,
      MutationSubmitFormRevisionRequestApprovalArgs
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.submitFormRevisionRequestApproval.status).toBe(
      RevisionRequestStatus.ACCEPTED
    );

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });
    expect(updatedBsdd.wasteDetailsQuantity?.toNumber()).toEqual(6.5);
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

  it.each([null, undefined])(
    "should nullify the operation mode",
    async mode => {
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
          processingOperationDone: "D 15",
          destinationOperationMode: mode,
          comment: "test"
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

      expect(updatedBsdd.processingOperationDone).toBe("D 15");
      expect(updatedBsdd.destinationOperationMode).toBeNull();
    }
  );

  it(
    "should delete the finalOperations rows when changing operation " +
      "code from a final to a non-final code",
    async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const ttr = await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      });
      const destination = await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      });

      const initialForm = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: ttr.company.siret,
          processingOperationDone: "D 13",
          quantityReceived: 10,
          processedAt: new Date()
        }
      });

      const groupingForm = await formFactory({
        ownerId: ttr.user.id,
        opt: {
          grouping: {
            create: {
              initialFormId: initialForm.id,
              quantity: initialForm.quantityReceived!.toNumber()
            }
          },
          processingOperationDone: "R 1",
          quantityReceived: 10,
          recipientCompanySiret: destination.company.siret,
          recipientCompanyName: destination.company.name,
          processedAt: new Date()
        }
      });

      await operationHook(groupingForm, { runSync: true });

      const initialFormWithFinalOperations =
        await prisma.form.findUniqueOrThrow({
          where: { id: initialForm.id },
          include: { finalOperations: true }
        });

      expect(initialFormWithFinalOperations.finalOperations).toHaveLength(1);

      const revisionRequest = await prisma.bsddRevisionRequest.create({
        data: {
          bsddId: groupingForm.id,
          authoringCompanyId: ttr.company.id,
          approvals: { create: { approverSiret: destination.company.siret! } },
          processingOperationDone: "D 13",
          destinationOperationMode: null,
          comment: ""
        }
      });

      const { mutate } = makeClient(destination.user);

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

      const updatedInitialForm = await prisma.form.findUniqueOrThrow({
        where: { id: initialForm.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialForm.finalOperations).toHaveLength(0);
    }
  );

  it(
    "should create the final operation using the job queue" +
      " when changing operation code to a final one",
    async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const ttr = await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      });
      const destination = await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      });

      const initialForm = await formFactory({
        ownerId: emitter.user.id,
        opt: {
          emitterCompanySiret: emitter.company.siret,
          recipientCompanySiret: ttr.company.siret,
          processingOperationDone: "D 13",
          quantityReceived: 10,
          processedAt: new Date()
        }
      });

      const groupingForm = await formFactory({
        ownerId: ttr.user.id,
        opt: {
          grouping: {
            create: {
              initialFormId: initialForm.id,
              quantity: initialForm.quantityReceived!.toNumber()
            }
          },
          processingOperationDone: "D 13",
          quantityReceived: 10,
          recipientCompanySiret: destination.company.siret,
          recipientCompanyName: destination.company.name,
          processedAt: new Date()
        }
      });

      await operationHook(groupingForm, { runSync: true });

      const initialFormWithFinalOperations =
        await prisma.form.findUniqueOrThrow({
          where: { id: initialForm.id },
          include: { finalOperations: true }
        });

      expect(initialFormWithFinalOperations.finalOperations).toHaveLength(0);

      const revisionRequest = await prisma.bsddRevisionRequest.create({
        data: {
          bsddId: groupingForm.id,
          authoringCompanyId: ttr.company.id,
          approvals: { create: { approverSiret: destination.company.siret! } },
          processingOperationDone: "R 1",
          destinationOperationMode: "ELIMINATION",
          comment: ""
        }
      });

      const { mutate } = makeClient(destination.user);

      const { data } = await mutate<
        Pick<Mutation, "submitFormRevisionRequestApproval">,
        MutationSubmitFormRevisionRequestApprovalArgs
      >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      });

      await new Promise(resolve => {
        operationHooksQueue.once("global:drained", () => resolve(true));
      });

      expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

      const updatedInitialForm = await prisma.form.findUniqueOrThrow({
        where: { id: initialForm.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialForm.finalOperations).toHaveLength(1);
    }
  );

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

  it("if operation code changes to final one > should reset status, noTraceability and nextDestination", async () => {
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
        nextDestinationNotificationNumber: nextDestination.contactPhone,
        nextDestinationProcessingOperation: "D9"
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
    expect(updatedBsdd?.nextDestinationProcessingOperation).toBe("");
  });

  it("should be possible for a foreign transporter to approve a revision on an annexe1", async () => {
    const vatNumber = "IT13029381004";
    const { user, company: foreignTransporter } = await userWithCompanyFactory(
      "ADMIN",
      { siret: null, vatNumber, orgId: vatNumber }
    );
    const { user: emitter, company: emitterCompany } =
      await userWithCompanyFactory();
    const { company: collectorCompany } = await userWithCompanyFactory();
    const { company: destinationCompany } = await userWithCompanyFactory();

    const bsdd = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterType: "APPENDIX1_PRODUCER",
        emitterCompanySiret: emitterCompany.siret,
        wasteDetailsQuantity: 1,
        transporters: {
          create: {
            number: 1,
            transporterCompanyVatNumber: foreignTransporter.vatNumber,
            transporterCompanySiret: null
          }
        }
      }
    });

    const bsddTourneeDedie = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterType: "APPENDIX1",
        emitterCompanySiret: collectorCompany.siret,
        recipientCompanySiret: destinationCompany.siret,
        wasteDetailsQuantity: 1,
        grouping: { create: { initialFormId: bsdd.id, quantity: 1 } }
      }
    });

    const revisionRequest = await prisma.bsddRevisionRequest.create({
      data: {
        status: "PENDING",
        bsddId: bsdd.id,
        authoringCompanyId: emitterCompany.id,
        approvals: { create: { approverSiret: foreignTransporter.orgId! } },
        wasteDetailsQuantity: 2,
        comment: "Yolo"
      }
    });

    const { mutate } = makeClient(user);

    const { data, errors } = await mutate<
      Pick<Mutation, "submitFormRevisionRequestApproval">
    >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitFormRevisionRequestApproval.status).toEqual("ACCEPTED");

    expect(errors).toBeUndefined();

    const updatedRevisionRequest =
      await prisma.bsddRevisionRequest.findUniqueOrThrow({
        where: { id: revisionRequest.id }
      });

    expect(updatedRevisionRequest.status).toEqual("ACCEPTED");

    const updatedBsdd = await prisma.form.findUniqueOrThrow({
      where: { id: bsdd.id }
    });

    expect(updatedBsdd.wasteDetailsQuantity?.toNumber()).toEqual(2);

    const updatedBsddTourneeDedie = await prisma.form.findUniqueOrThrow({
      where: { id: bsddTourneeDedie.id }
    });

    expect(updatedBsddTourneeDedie.wasteDetailsQuantity?.toNumber()).toEqual(2);
  });

  describe("wasteAcceptationStatus & quantityRefused", () => {
    it("should update the BSDD wasteAcceptationStatus", async () => {
      // Given
      const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const { mutate } = makeClient(user);

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: companyOfSomeoneElse.siret,
          status: Status.ACCEPTED,
          quantityReceived: 10
        }
      });

      const revisionRequest = await prisma.bsddRevisionRequest.create({
        data: {
          bsddId: bsdd.id,
          authoringCompanyId: companyOfSomeoneElse.id,
          approvals: { create: { approverSiret: company.siret! } },
          wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
          quantityReceived: 5,
          wasteRefusalReason: "Reason",
          comment: ""
        }
      });

      // When
      const { data } = await mutate<
        Pick<Mutation, "submitFormRevisionRequestApproval">
      >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      });

      // Then
      expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

      const updatedBsdd = await prisma.form.findFirstOrThrow({
        where: { id: bsdd.id }
      });

      expect(updatedBsdd.wasteAcceptationStatus).toBe(Status.REFUSED);
      expect(updatedBsdd.wasteRefusalReason).toBe("Reason");
      expect(updatedBsdd.quantityReceived?.toNumber()).toBe(5);
    });

    it("should update the BSDD wasteAcceptationStatus and quantityRefused", async () => {
      // Given
      const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const { mutate } = makeClient(user);

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: companyOfSomeoneElse.siret,
          status: Status.ACCEPTED,
          quantityReceived: 10
        }
      });

      const revisionRequest = await prisma.bsddRevisionRequest.create({
        data: {
          bsddId: bsdd.id,
          authoringCompanyId: companyOfSomeoneElse.id,
          approvals: { create: { approverSiret: company.siret! } },
          wasteAcceptationStatus: WasteAcceptationStatus.PARTIALLY_REFUSED,
          quantityReceived: 5,
          quantityRefused: 3,
          wasteRefusalReason: "Reason",
          comment: ""
        }
      });

      // When
      const { data } = await mutate<
        Pick<Mutation, "submitFormRevisionRequestApproval">
      >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      });

      // Then
      expect(data.submitFormRevisionRequestApproval.status).toBe("ACCEPTED");

      const updatedBsdd = await prisma.form.findFirstOrThrow({
        where: { id: bsdd.id }
      });

      expect(updatedBsdd.wasteAcceptationStatus).toBe(
        WasteAcceptationStatus.PARTIALLY_REFUSED
      );
      expect(updatedBsdd.wasteRefusalReason).toBe("Reason");
      expect(updatedBsdd.quantityReceived?.toNumber()).toBe(5);
      expect(updatedBsdd.quantityRefused?.toNumber()).toBe(3);
    });

    it("should NOT update the BSDD wasteAcceptationStatus if the BSDD status is no long ACCEPTED or TEMP_STORED_ACCEPTED", async () => {
      // Given
      const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const { mutate } = makeClient(user);

      const bsdd = await formFactory({
        ownerId: user.id,
        opt: {
          emitterCompanySiret: companyOfSomeoneElse.siret,
          status: Status.PROCESSED,
          quantityReceived: 10
        }
      });

      const revisionRequest = await prisma.bsddRevisionRequest.create({
        data: {
          bsddId: bsdd.id,
          authoringCompanyId: companyOfSomeoneElse.id,
          approvals: { create: { approverSiret: company.siret! } },
          wasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
          quantityReceived: 5,
          wasteRefusalReason: "Reason",
          comment: ""
        }
      });

      // When
      const { errors } = await mutate<
        Pick<Mutation, "submitFormRevisionRequestApproval">
      >(SUBMIT_BSDD_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      });

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Le statut d'acceptation des déchets n'est modifiable que si le bordereau est au stade de la réception."
      );
    });
  });
});
