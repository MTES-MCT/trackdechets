import { resetDatabase } from "../../../../../../integration-tests/helper";
import {
  companyAssociatedToExistingUserFactory,
  companyFactory,
  userWithCompanyFactory
} from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdaFactory } from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import type {
  Mutation,
  MutationSubmitBsdaRevisionRequestApprovalArgs
} from "@td/codegen-back";
import { NON_CANCELLABLE_BSDA_STATUSES } from "../createRevisionRequest";
import { BsdaStatus, UserRole } from "@prisma/client";
import { operationHook } from "../../../../operationHook";
import { operationHooksQueue } from "../../../../../queue/producers/operationHook";
import { sendMail } from "../../../../../mailer/mailing";

// No mails
jest.mock("../../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

// Jest's object matching is too goddam annoying, throwing failures
// with hard-to-identify hidden spaces / tabs / line breaks
// Cleanse the strings before asserting on them
const cleanse = (input: string) => {
  // Remove all kinds of hidden spaces (tabs, line breaks, etc.)
  let cleaned = input.replace(/\s+/g, " ");
  // Convert double spaces to single spaces
  cleaned = cleaned.replace(/ {2,}/g, " ");
  return cleaned.trim();
};

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
        approvals: { create: { approverSiret: companyOfSomeoneElse.siret! } },
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
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        wasteCode: "10 13 09*"
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
            { approverSiret: company.siret! },
            { approverSiret: thirdCompany.siret! }
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
      )!.status
    ).toBe("ACCEPTED");

    expect(
      data.submitBsdaRevisionRequestApproval.approvals!.find(
        val => val.approverSiret === thirdCompany.siret
      )!.status
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
            { approverSiret: company.siret! },
            { approverSiret: thirdCompany.siret! }
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
      )!.status
    ).toBe("REFUSED");
    expect(data.submitBsdaRevisionRequestApproval.status).toBe("REFUSED");
    expect(
      data.submitBsdaRevisionRequestApproval.approvals.find(
        val => val.approverSiret === thirdCompany.siret
      )!.status
    ).toBe("CANCELED");
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
        approvals: { create: { approverSiret: company.siret! } },
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

  it("should approve both emitter and ecoOrganisme request when ecoOrganisme approves", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("ADMIN");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company: ecoOrganisme } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        destinationCompanySiret: destinationCompany.siret,
        ecoOrganismeSiret: ecoOrganisme.siret
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: destinationCompany.id,
        approvals: {
          create: [
            { approverSiret: ecoOrganisme.siret! },
            { approverSiret: emitterCompany.siret! }
          ]
        },
        comment: "comment"
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

  it("should approve both emitter and ecoOrganisme request when emitter approves", async () => {
    const { user, company: emitterCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { company: destinationCompany } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { company: ecoOrganisme } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitterCompany.siret,
        destinationCompanySiret: destinationCompany.siret,
        ecoOrganismeSiret: ecoOrganisme.siret
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: destinationCompany.id,
        approvals: {
          create: [
            { approverSiret: ecoOrganisme.siret! },
            { approverSiret: emitterCompany.siret! }
          ]
        },
        comment: "comment"
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
        approvals: { create: { approverSiret: company.siret! } },
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

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
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
        approvals: { create: { approverSiret: company.siret! } },
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

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.wasteCode).not.toBe("01 03 08");
  });

  it("should change the bsda status if the bsda is PROCESSED and the new operation code implies a next bsda", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "PROCESSED",
        destinationOperationCode: "R 5"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        destinationOperationCode: "R 13",
        comment: "Operation code error"
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

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.status).toBe("AWAITING_CHILD");
  });

  it("should change the bsda status if the bsda is AWAITING_CHILD and the new operation code does not imply a next bsda", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "AWAITING_CHILD",
        destinationOperationCode: "R 13"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        destinationOperationCode: "R 5",
        comment: "Operation code error"
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

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.status).toBe("PROCESSED");
  });

  it("should change not the bsda status if the new operation code implies a next bsda but the bsda is not PROCESSED", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "SENT",
        destinationOperationCode: "R 5"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        destinationOperationCode: "R 13",
        comment: "Operation code error"
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

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.status).toBe("SENT");
  });

  it("should change the bsda status to CANCELED if revision asks for cancellation", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "SENT"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "Cancel",
        isCanceled: true
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

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.status).toBe("CANCELED");
  });

  it.each(NON_CANCELLABLE_BSDA_STATUSES)(
    "should fail if request is about cancelation & the BSDA has a non-cancellable status",
    async (status: BsdaStatus) => {
      const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const { mutate } = makeClient(user);

      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: companyOfSomeoneElse.siret,
          status
        }
      });

      const revisionRequest = await prisma.bsdaRevisionRequest.create({
        data: {
          bsdaId: bsda.id,
          authoringCompanyId: companyOfSomeoneElse.id,
          approvals: { create: { approverSiret: company.siret! } },
          comment: "Cancel",
          isCanceled: true
        }
      });

      const { errors } = await mutate<
        Pick<Mutation, "submitBsdaRevisionRequestApproval">,
        MutationSubmitBsdaRevisionRequestApprovalArgs
      >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
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

  it("should free BSD from group if group parent BSD is canceled", async () => {
    const { company: emitter } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: transporter } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const { user, company: destination } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const { company: ttr1 } = await userWithCompanyFactory(UserRole.ADMIN);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: ttr1.siret,
        destinationCompanySiret: destination.siret,
        status: BsdaStatus.SENT
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret
      }
    });

    const grouped1 = await bsdaFactory({
      opt: {
        emitterCompanySiret: emitter.siret,
        destinationCompanySiret: ttr1.siret,
        destinationOperationCode: "R 13",
        status: BsdaStatus.SENT,
        groupedIn: { connect: { id: bsda.id } }
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret
      }
    });
    const grouped2 = await bsdaFactory({
      opt: {
        status: BsdaStatus.SENT,
        emitterCompanySiret: emitter.siret,
        destinationCompanySiret: ttr1.siret,
        destinationOperationCode: "R 13",
        groupedIn: { connect: { id: bsda.id } }
      },
      transporterOpt: {
        transporterCompanySiret: transporter.siret
      }
    });

    const { mutate } = makeClient(user);

    // Now let's cancel the parent bsda
    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: emitter.id,
        approvals: {
          create: [{ approverSiret: destination.siret! }]
        },
        comment: "Cancel",
        isCanceled: true
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdaRevisionRequestApprovalArgs
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(errors).toBeUndefined();

    const newGrouped1AfterRevision = await prisma.bsda.findUniqueOrThrow({
      where: { id: grouped1.id }
    });
    expect(newGrouped1AfterRevision.status).toEqual(BsdaStatus.SENT);
    expect(newGrouped1AfterRevision.groupedInId).toBe(null);

    const newGrouped2AfterRevision = await prisma.bsda.findUniqueOrThrow({
      where: { id: grouped2.id }
    });
    expect(newGrouped2AfterRevision.status).toEqual(BsdaStatus.SENT);
    expect(newGrouped2AfterRevision.groupedInId).toBe(null);

    const newBsdaAfterRevision = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });
    expect(newBsdaAfterRevision.status).toEqual(BsdaStatus.CANCELED);
  });

  it("should remove forwardedIn link in canceled BSDA", async () => {
    const { company, user } = await userWithCompanyFactory(UserRole.ADMIN);
    const { company: transporter } = await userWithCompanyFactory(
      UserRole.ADMIN
    );
    const forwardedBsda = await bsdaFactory({
      opt: {
        destinationCompanySiret: company.siret
      }
    });
    const forwardingBsda = await bsdaFactory({
      opt: {
        forwarding: { connect: { id: forwardedBsda.id } },
        emitterCompanySiret: company.siret,
        status: BsdaStatus.SENT
      }
    });

    const { mutate } = makeClient(user);
    // Now let's cancel the parent bsda
    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: forwardingBsda.id,
        authoringCompanyId: transporter.id,
        approvals: {
          create: [{ approverSiret: company.siret! }]
        },
        comment: "Cancel",
        isCanceled: true
      }
    });

    const { errors } = await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdaRevisionRequestApprovalArgs
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(errors).toBeUndefined();

    const updatedForwarding = await prisma.bsda.findUniqueOrThrow({
      where: { id: forwardingBsda.id },
      include: { forwarding: true }
    });

    expect(updatedForwarding.forwardingId).toBe(null);
    expect(updatedForwarding.forwarding).toBe(null);
  });

  it.each([
    {
      isApproved: true,
      expectedRevisionStatus: "ACCEPTED",
      expectedBsdaStatus: "CANCELED"
    },
    {
      isApproved: false,
      expectedRevisionStatus: "REFUSED",
      expectedBsdaStatus: "SENT"
    }
  ])(
    "if user has numerous companies involved in the bsd, his approbation should work for all his companies",
    async testData => {
      const { user: producerAndTransporter, company: producerCompany } =
        await userWithCompanyFactory("ADMIN");
      const transporterCompany = await companyAssociatedToExistingUserFactory(
        producerAndTransporter,
        "ADMIN"
      );
      const { user: workerAndDestination, company: workCompany } =
        await userWithCompanyFactory("ADMIN");
      const destinationCompany = await companyAssociatedToExistingUserFactory(
        workerAndDestination,
        "ADMIN"
      );

      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: producerCompany.siret,
          workerCompanySiret: workCompany.siret,
          destinationCompanySiret: destinationCompany.siret,
          status: "SENT"
        },
        transporterOpt: {
          transporterCompanySiret: transporterCompany.siret
        }
      });

      const revisionRequest = await prisma.bsdaRevisionRequest.create({
        data: {
          bsdaId: bsda.id,
          authoringCompanyId: producerCompany.id,
          approvals: {
            create: [
              { approverSiret: workCompany.siret! },
              { approverSiret: destinationCompany.siret! }
            ]
          },
          comment: "Cancel",
          isCanceled: true
        }
      });

      const { mutate } = makeClient(workerAndDestination);
      const { errors, data: revision } = await mutate<
        Pick<Mutation, "submitBsdaRevisionRequestApproval">,
        MutationSubmitBsdaRevisionRequestApprovalArgs
      >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequest.id,
          isApproved: testData.isApproved
        }
      });

      expect(errors).toBeUndefined();

      expect(revision.submitBsdaRevisionRequestApproval.status).toBe(
        testData.expectedRevisionStatus
      );

      const updatedBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: bsda.id }
      });

      expect(updatedBsda.status).toBe(testData.expectedBsdaStatus);
    }
  );

  it("should update the operation code & mode", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        destinationOperationCode: "R 1",
        destinationOperationMode: "VALORISATION_ENERGETIQUE"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        destinationOperationCode: "R 4",
        destinationOperationMode: "RECYCLAGE"
      }
    });

    await mutate<Pick<Mutation, "submitBsdaRevisionRequestApproval">>(
      SUBMIT_BSDA_REVISION_REQUEST_APPROVAL,
      {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      }
    );

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.destinationOperationCode).toBe("R 4");
    expect(updatedBsda.destinationOperationMode).toBe("RECYCLAGE");
  });

  it.each([null, undefined])("should nullify the operation mode", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        destinationOperationCode: "R 1",
        destinationOperationMode: "VALORISATION_ENERGETIQUE"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        destinationOperationCode: "D 15"
      }
    });

    await mutate<Pick<Mutation, "submitBsdaRevisionRequestApproval">>(
      SUBMIT_BSDA_REVISION_REQUEST_APPROVAL,
      {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      }
    );

    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.destinationOperationCode).toBe("D 15");
    expect(updatedBsda.destinationOperationMode).toBeNull();
  });

  it(
    "should delete the finalOperations rows when changing operation " +
      "code from a final to a non-final code",
    async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");

      const { mutate } = makeClient(emitter.user);

      const initialBsda = await bsdaFactory({
        opt: { destinationOperationCode: "D 15" }
      });

      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          destinationOperationCode: "R 1",
          destinationOperationSignatureDate: new Date(),
          destinationOperationMode: "VALORISATION_ENERGETIQUE",
          grouping: { connect: { id: initialBsda.id } }
        }
      });

      await operationHook(bsda, { runSync: true });

      const initialBsdaWithFinalOperations =
        await prisma.bsda.findUniqueOrThrow({
          where: { id: initialBsda.id },
          include: { finalOperations: true }
        });

      expect(initialBsdaWithFinalOperations.finalOperations).toHaveLength(1);

      const revisionRequest = await prisma.bsdaRevisionRequest.create({
        data: {
          bsdaId: bsda.id,
          authoringCompanyId: destination.company.id,
          approvals: { create: { approverSiret: emitter.company.siret! } },
          comment: "",
          destinationOperationCode: "D 15"
        }
      });

      await mutate<Pick<Mutation, "submitBsdaRevisionRequestApproval">>(
        SUBMIT_BSDA_REVISION_REQUEST_APPROVAL,
        {
          variables: {
            id: revisionRequest.id,
            isApproved: true
          }
        }
      );

      const updatedInitialBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: initialBsda.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialBsda.finalOperations).toHaveLength(0);
    }
  );
  it(
    "should create the final operation using the job queue" +
      " when changing operation code to a final one",
    async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");

      const { mutate } = makeClient(emitter.user);

      const initialBsda = await bsdaFactory({
        opt: { destinationOperationCode: "D 15" }
      });

      const bsda = await bsdaFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          destinationOperationCode: "D 15",
          destinationOperationSignatureDate: new Date(),
          destinationOperationMode: "VALORISATION_ENERGETIQUE",
          grouping: { connect: { id: initialBsda.id } }
        }
      });

      const revisionRequest = await prisma.bsdaRevisionRequest.create({
        data: {
          bsdaId: bsda.id,
          authoringCompanyId: destination.company.id,
          approvals: { create: { approverSiret: emitter.company.siret! } },
          comment: "",
          destinationOperationCode: "R 1"
        }
      });

      await mutate<Pick<Mutation, "submitBsdaRevisionRequestApproval">>(
        SUBMIT_BSDA_REVISION_REQUEST_APPROVAL,
        {
          variables: {
            id: revisionRequest.id,
            isApproved: true
          }
        }
      );

      await new Promise(resolve => {
        operationHooksQueue.once("global:drained", () => resolve(true));
      });

      const updatedInitialBsda = await prisma.bsda.findUniqueOrThrow({
        where: { id: initialBsda.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialBsda.finalOperations).toHaveLength(1);
    }
  );

  it("should be able to update the exutoire's CAP (no TTR)", async () => {
    // Given
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const exutoire = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        // Exutoire"
        destinationCompanySiret: exutoire.siret,
        destinationCap: "EXUTOIRE-CAP"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        destinationCap: "NEW-EXUTOIRE-CAP",
        comment: ""
      }
    });

    // When
    const { mutate } = makeClient(user);
    await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdaRevisionRequestApprovalArgs
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    // Then
    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.destinationCap).toBe("NEW-EXUTOIRE-CAP");
  });

  it("should be able to update the exutoire's CAP (TTR involved)", async () => {
    // Given
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const exutoire = await companyFactory();
    const ttr = await companyFactory();

    const bsda = await bsdaFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        // TTR
        destinationCompanySiret: ttr.siret,
        destinationCap: "TTR-CAP",
        // Exutoire
        destinationOperationNextDestinationCompanySiret: exutoire.siret,
        destinationOperationNextDestinationCap: "EXUTOIRE-CAP"
      }
    });

    const revisionRequest = await prisma.bsdaRevisionRequest.create({
      data: {
        bsdaId: bsda.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        destinationCap: "NEW-EXUTOIRE-CAP",
        comment: ""
      }
    });

    // When
    const { mutate } = makeClient(user);
    await mutate<
      Pick<Mutation, "submitBsdaRevisionRequestApproval">,
      MutationSubmitBsdaRevisionRequestApprovalArgs
    >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    // Then
    const updatedBsda = await prisma.bsda.findUniqueOrThrow({
      where: { id: bsda.id }
    });

    expect(updatedBsda.destinationOperationNextDestinationCap).toBe(
      "NEW-EXUTOIRE-CAP"
    );
  });

  describe("tra-15364: si révision sur wasteSealNumbers ou packagings, approbations du worker et de la destination requises uniquement", () => {
    beforeEach(jest.resetAllMocks);

    const createBsdaRevisionAndApprove = async (bsdaOpt, revisionOpt) => {
      const { user: emitter, company: emitterCompany } =
        await userWithCompanyFactory(
          "ADMIN",
          { name: "Emitter Inc." },
          { email: "emitter@mail.com", name: "Emetteur" }
        );
      const { user: worker, company: workerCompany } =
        await userWithCompanyFactory(
          "ADMIN",
          {
            name: "Worker Inc."
          },
          { email: "worker@mail.com", name: "Worker" }
        );
      const { user: destination, company: destinationCompany } =
        await userWithCompanyFactory(
          "ADMIN",
          { name: "Destination Inc." },
          { email: "destination@mail.com", name: "Destination" }
        );

      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          type: "OTHER_COLLECTIONS",
          emitterCompanySiret: emitterCompany.siret,
          emitterCompanyName: emitterCompany.name,
          workerCompanySiret: workerCompany.siret,
          workerCompanyName: workerCompany.name,
          destinationCompanySiret: destinationCompany.siret,
          destinationCompanyName: destinationCompany.name,
          ...bsdaOpt
        }
      });

      const revisionRequest = await prisma.bsdaRevisionRequest.create({
        data: {
          bsdaId: bsda.id,
          authoringCompanyId: workerCompany.id,
          approvals: { create: { approverSiret: destinationCompany.siret! } },
          comment: "It's reviewin' time!",
          ...revisionOpt
        }
      });

      return {
        revisionRequest,
        bsda,
        worker,
        workerCompany,
        destination,
        destinationCompany,
        emitter,
        emitterCompany
      };
    };

    const approveRevision = async (user, revisionRequestId) => {
      // When
      const { mutate } = makeClient(user);
      return await mutate<
        Pick<Mutation, "submitBsdaRevisionRequestApproval">,
        MutationSubmitBsdaRevisionRequestApprovalArgs
      >(SUBMIT_BSDA_REVISION_REQUEST_APPROVAL, {
        variables: {
          id: revisionRequestId,
          isApproved: true
        }
      });
    };

    it("updating wasteSealNumbers and packagings > mail should be sent to emitter", async () => {
      // Given
      const {
        bsda,
        revisionRequest,
        workerCompany,
        destination,
        destinationCompany
      } = await createBsdaRevisionAndApprove(
        {
          wasteSealNumbers: ["SEAL-1", "SEAL-2"],
          packagings: [{ quantity: 1, type: "PALETTE_FILME" }]
        },
        {
          wasteSealNumbers: ["SEAL-3"],
          packagings: [
            { type: "OTHER", quantity: 2, other: "Boîte à chaussure" }
          ]
        }
      );

      // When
      const { errors } = await approveRevision(destination, revisionRequest.id);

      // Then
      expect(errors).toBeUndefined();

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
      console.log("body", (sendMail as jest.Mock).mock.calls[0][0]);
      const { body, messageVersions, subject, cc } = (sendMail as jest.Mock)
        .mock.calls[0][0];

      expect(messageVersions[0].to).toMatchObject([
        { email: "emitter@mail.com", name: "Emetteur" }
      ]);
      expect(cc).toMatchObject([
        { email: "worker@mail.com", name: "Worker" },
        { email: "destination@mail.com", name: "Destination" }
      ]);
      expect(subject).toBe(
        `Scellés et conditionnement du bordereau amiante n° ${bsda.id} mis à jour`
      );

      const expectedBody = `<p>
  Trackdéchets vous informe qu'une révision sur le bordereau amiante n° ${bsda.id} sur lequel votre établissement est identifié comme
  producteur/émetteur a été demandée par l'entreprise ${workerCompany.name} (${workerCompany.siret}) et validée par l'entreprise ${destinationCompany.name} (${destinationCompany.siret}). Cette révision concerne les éléments suivants :
</p>
<ul>
  <li>
    Numéros de scellés avant révision : SEAL-1, SEAL-2
  </li>
  <li>
    Numéros de scellés après révision : SEAL-3
  </li>
  <li>
    Nombre et type de conditionnement avant révision : 1 x Palette filmée
  </li>
  <li>
    Nombre et type de conditionnement après révision : 2 x Autre - Boîte à chaussure
  </li>
</ul> 
<br /> 
<p>
  En cas de désaccord ou de question, il convient de vous rapprocher de
  l'entreprise de travaux amiante ${workerCompany.name} (${workerCompany.siret})
  mandatée et visée sur ce même bordereau, ou de l'établissement de destination
  finale ${destinationCompany.name} (${destinationCompany.siret}).
</p>`;

      expect(cleanse(body)).toBe(cleanse(expectedBody));
    });

    it("updating wasteSealNumbers only > mail should be sent to emitter", async () => {
      // Given
      const {
        bsda,
        revisionRequest,
        workerCompany,
        destination,
        destinationCompany
      } = await createBsdaRevisionAndApprove(
        {
          wasteSealNumbers: ["SEAL-1", "SEAL-2"]
        },
        {
          wasteSealNumbers: ["SEAL-3"]
        }
      );

      // When
      const { errors } = await approveRevision(destination, revisionRequest.id);

      // Then
      expect(errors).toBeUndefined();

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
      const { body, messageVersions, subject, cc } = (sendMail as jest.Mock)
        .mock.calls[0][0];

      expect(messageVersions[0].to).toMatchObject([
        { email: "emitter@mail.com", name: "Emetteur" }
      ]);
      expect(cc).toMatchObject([
        { email: "worker@mail.com", name: "Worker" },
        { email: "destination@mail.com", name: "Destination" }
      ]);
      expect(subject).toBe(
        `Scellés du bordereau amiante n° ${bsda.id} mis à jour`
      );

      const expectedBody = `<p>
  Trackdéchets vous informe qu'une révision sur le bordereau amiante n° ${bsda.id} sur lequel votre établissement est identifié comme
  producteur/émetteur a été demandée par l'entreprise ${workerCompany.name} (${workerCompany.siret}) et validée par l'entreprise ${destinationCompany.name} (${destinationCompany.siret}). Cette révision concerne les éléments suivants :
</p>
<ul>
  <li>
    Numéros de scellés avant révision : SEAL-1, SEAL-2
  </li>
  <li>
    Numéros de scellés après révision : SEAL-3
  </li>
</ul> 
<br /> 
<p>
  En cas de désaccord ou de question, il convient de vous rapprocher de
  l'entreprise de travaux amiante ${workerCompany.name} (${workerCompany.siret})
  mandatée et visée sur ce même bordereau, ou de l'établissement de destination
  finale ${destinationCompany.name} (${destinationCompany.siret}).
</p>`;

      expect(cleanse(body)).toBe(cleanse(expectedBody));
    });

    it("updating packagings only > mail should be sent to emitter", async () => {
      // Given
      const {
        bsda,
        revisionRequest,
        workerCompany,
        destination,
        destinationCompany
      } = await createBsdaRevisionAndApprove(
        {
          packagings: [{ quantity: 1, type: "PALETTE_FILME" }]
        },
        {
          packagings: [
            { type: "OTHER", quantity: 2, other: "Boîte à chaussure" }
          ]
        }
      );

      // When
      const { errors } = await approveRevision(destination, revisionRequest.id);

      // Then
      expect(errors).toBeUndefined();

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(1);
      const { body, messageVersions, subject, cc } = (sendMail as jest.Mock)
        .mock.calls[0][0];

      expect(messageVersions[0].to).toMatchObject([
        { email: "emitter@mail.com", name: "Emetteur" }
      ]);
      expect(cc).toMatchObject([
        { email: "worker@mail.com", name: "Worker" },
        { email: "destination@mail.com", name: "Destination" }
      ]);
      expect(subject).toBe(
        `Conditionnement du bordereau amiante n° ${bsda.id} mis à jour`
      );

      const expectedBody = `<p>
  Trackdéchets vous informe qu'une révision sur le bordereau amiante n° ${bsda.id} sur lequel votre établissement est identifié comme
  producteur/émetteur a été demandée par l'entreprise ${workerCompany.name} (${workerCompany.siret}) et validée par l'entreprise ${destinationCompany.name} (${destinationCompany.siret}). Cette révision concerne les éléments suivants :
</p>
<ul>
  <li>
    Nombre et type de conditionnement avant révision : 1 x Palette filmée
  </li>
  <li>
    Nombre et type de conditionnement après révision : 2 x Autre - Boîte à chaussure
  </li>
</ul> 
<br /> 
<p>
  En cas de désaccord ou de question, il convient de vous rapprocher de
  l'entreprise de travaux amiante ${workerCompany.name} (${workerCompany.siret})
  mandatée et visée sur ce même bordereau, ou de l'établissement de destination
  finale ${destinationCompany.name} (${destinationCompany.siret}).
</p>`;

      expect(cleanse(body)).toBe(cleanse(expectedBody));
    });

    it("updating wasteSealNumbers and packagings AND something else > mail should NOT be sent to emitter", async () => {
      // Given
      const { revisionRequest, destination } =
        await createBsdaRevisionAndApprove(
          {
            wasteSealNumbers: ["SEAL-1", "SEAL-2"],
            packagings: [{ quantity: 1, type: "PALETTE_FILME" }],
            wasteMaterialName: "Some stuff"
          },
          {
            wasteSealNumbers: ["SEAL-3"],
            packagings: [
              { type: "OTHER", quantity: 2, other: "Boîte à chaussure" }
            ],
            wasteMaterialName: "Some other stuff"
          }
        );

      // When
      const { errors } = await approveRevision(destination, revisionRequest.id);

      // Then
      expect(errors).toBeUndefined();

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
    });

    it("canceling BSDA > mail should NOT be sent to emitter", async () => {
      // Given
      const { revisionRequest, destination } =
        await createBsdaRevisionAndApprove({}, { isCanceled: true });

      // When
      const { errors } = await approveRevision(destination, revisionRequest.id);

      // Then
      expect(errors).toBeUndefined();

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
    });

    it("admin is not subscribed to email alerts > mail should NOT be sent", async () => {
      // Given
      const { emitter, revisionRequest, destination } =
        await createBsdaRevisionAndApprove(
          {
            wasteSealNumbers: ["SEAL-1", "SEAL-2"],
            packagings: [{ quantity: 1, type: "PALETTE_FILME" }]
          },
          {
            wasteSealNumbers: ["SEAL-3"],
            packagings: [
              { type: "OTHER", quantity: 2, other: "Boîte à chaussure" }
            ]
          }
        );

      // Unsubscribe admins from registry notification
      await prisma.companyAssociation.updateMany({
        where: { userId: { in: [emitter.id] } },
        data: { notificationIsActiveBsdaFinalDestinationUpdate: false }
      });

      // When
      const { errors } = await approveRevision(destination, revisionRequest.id);

      // Then
      expect(errors).toBeUndefined();

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
    });

    it("emitter creates revision on wasteSealNumbers > mail should NOT be sent", async () => {
      // Given
      const { company: emitterCompany } = await userWithCompanyFactory(
        "ADMIN",
        { name: "Emitter Inc." },
        { email: "emitter@mail.com", name: "Emetteur" }
      );
      const { user: worker, company: workerCompany } =
        await userWithCompanyFactory("ADMIN", {
          name: "Worker Inc."
        });
      const { user: destination, company: destinationCompany } =
        await userWithCompanyFactory("ADMIN", { name: "Destination Inc." });

      const bsda = await bsdaFactory({
        opt: {
          status: "SENT",
          type: "OTHER_COLLECTIONS",
          emitterCompanySiret: emitterCompany.siret,
          emitterCompanyName: emitterCompany.name,
          workerCompanySiret: workerCompany.siret,
          workerCompanyName: workerCompany.name,
          destinationCompanySiret: destinationCompany.siret,
          destinationCompanyName: destinationCompany.name,
          wasteSealNumbers: ["SEAL-1", "SEAL-2"]
        }
      });

      const revisionRequest = await prisma.bsdaRevisionRequest.create({
        data: {
          bsdaId: bsda.id,
          authoringCompanyId: emitterCompany.id,
          approvals: {
            createMany: {
              data: [
                { approverSiret: workerCompany.siret! },
                { approverSiret: destinationCompany.siret! }
              ]
            }
          },
          comment: "It's reviewin' time!",
          wasteSealNumbers: ["SEAL-3"]
        }
      });

      // When
      const { errors: destinationErrors } = await approveRevision(
        destination,
        revisionRequest.id
      );
      const { errors: workerErrors } = await approveRevision(
        worker,
        revisionRequest.id
      );

      // Then
      expect(destinationErrors).toBeUndefined();
      expect(workerErrors).toBeUndefined();

      expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
    });
  });
});
