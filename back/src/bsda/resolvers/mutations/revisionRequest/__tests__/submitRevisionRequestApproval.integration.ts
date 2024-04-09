import { resetDatabase } from "../../../../../../integration-tests/helper";
import {
  companyAssociatedToExistingUserFactory,
  userWithCompanyFactory
} from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdaFactory } from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import {
  Mutation,
  MutationSubmitBsdaRevisionRequestApprovalArgs
} from "../../../../../generated/graphql/types";
import { NON_CANCELLABLE_BSDA_STATUSES } from "../createRevisionRequest";
import { BsdaStatus, UserRole } from "@prisma/client";

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
});
