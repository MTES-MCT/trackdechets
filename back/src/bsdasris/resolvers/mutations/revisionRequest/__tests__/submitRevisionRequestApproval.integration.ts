import { resetDatabase } from "../../../../../../integration-tests/helper";
import { userWithCompanyFactory } from "../../../../../__tests__/factories";
import makeClient from "../../../../../__tests__/testClient";
import { bsdasriFactory } from "../../../../__tests__/factories";
import { prisma } from "@td/prisma";
import {
  Mutation,
  MutationSubmitBsdasriRevisionRequestApprovalArgs,
  BsdasriStatus
} from "../../../../../generated/graphql/types";
import { NON_CANCELLABLE_BSDASRI_STATUSES } from "../../revisionRequest/createRevisionRequest";

import { operationHook } from "../../../../operationHook";
import { operationHooksQueue } from "../../../../../queue/producers/operationHook";

const SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL = `
  mutation SubmitBsdasriRevisionRequestApproval($id: ID!, $isApproved: Boolean!) {
    submitBsdasriRevisionRequestApproval(id: $id, isApproved: $isApproved) {
      id
      bsdasri {
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

describe("Mutation.submitBsdasriRevisionRequestApproval", () => {
  afterEach(() => resetDatabase());

  it("should fail if revisionRequest doesnt exist", async () => {
    const { user } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const { errors } = await mutate(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
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

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        comment: ""
      }
    });

    const { errors } = await mutate(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
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

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: company.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: company.id,
        approvals: { create: { approverSiret: companyOfSomeoneElse.siret! } },
        comment: ""
      }
    });

    const { errors } = await mutate(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
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

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        wasteCode: "10 13 09*"
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitBsdasriRevisionRequestApproval.status).toBe("ACCEPTED");
  });

  it("should work if one of the approvers approves the revisionRequest, but not mark the revisionRequest as accepted", async () => {
    const { company: secondCompany } = await userWithCompanyFactory("ADMIN");
    const { company: thirdCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: secondCompany.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
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
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    expect(data.submitBsdasriRevisionRequestApproval.status).toBe("PENDING");

    expect(
      data.submitBsdasriRevisionRequestApproval.approvals.find(
        val => val.approverSiret === company.siret
      )!.status
    ).toBe("ACCEPTED");

    expect(
      data.submitBsdasriRevisionRequestApproval.approvals!.find(
        val => val.approverSiret === thirdCompany.siret
      )!.status
    ).toBe("PENDING");
  });

  it("should mark the revisionRequest as refused if one of the approvers refused the revisionRequest", async () => {
    const { company: secondCompany } = await userWithCompanyFactory("ADMIN");
    const { company: thirdCompany } = await userWithCompanyFactory("ADMIN");
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: secondCompany.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
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
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    expect(
      data.submitBsdasriRevisionRequestApproval.approvals.find(
        val => val.approverSiret === company.siret
      )!.status
    ).toBe("REFUSED");
    expect(data.submitBsdasriRevisionRequestApproval.status).toBe("REFUSED");
    expect(
      data.submitBsdasriRevisionRequestApproval.approvals.find(
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

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: ""
      }
    });

    const { data } = await mutate<
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    expect(data.submitBsdasriRevisionRequestApproval.status).toBe("REFUSED");
  });

  it("should edit bsdasri accordingly when accepted", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    expect(bsdasri.wasteCode).not.toBe("01 03 08");
    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteCode: "01 03 08",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
      MutationSubmitBsdasriRevisionRequestApprovalArgs
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id }
    });

    expect(updatedBsdasri.wasteCode).toBe("01 03 08");
  });

  it("should not edit bsdasri when refused", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: { emitterCompanySiret: companyOfSomeoneElse.siret }
    });

    expect(bsdasri.wasteCode).not.toBe("01 03 08");
    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        wasteCode: "01 03 08",
        comment: ""
      }
    });

    await mutate<
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
      MutationSubmitBsdasriRevisionRequestApprovalArgs
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: false
      }
    });

    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id }
    });

    expect(updatedBsdasri.wasteCode).not.toBe("01 03 08");
  });

  //   it("should change the bsdasri status if the bsdasri is PROCESSED and the new operation code implies a next bsdasri", async () => {
  //     const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
  //       "ADMIN"
  //     );
  //     const { user, company } = await userWithCompanyFactory("ADMIN");
  //     const { mutate } = makeClient(user);

  //     const bsdasri = await bsdasriFactory({
  //       opt: {
  //         emitterCompanySiret: companyOfSomeoneElse.siret,
  //         status: "PROCESSED",
  //         destinationOperationCode: "D10"
  //       }
  //     });

  //     const revisionRequest = await prisma.bsdasriRevisionRequest.create({
  //       data: {
  //         bsdasriId: bsdasri.id,
  //         authoringCompanyId: companyOfSomeoneElse.id,
  //         approvals: { create: { approverSiret: company.siret! } },
  //         destinationOperationCode: "R 13",
  //         comment: "Operation code error"
  //       }
  //     });

  //     await mutate<
  //       Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
  //       MutationSubmitBsdasriRevisionRequestApprovalArgs
  //     >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
  //       variables: {
  //         id: revisionRequest.id,
  //         isApproved: true
  //       }
  //     });

  //     const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
  //       where: { id: bsdasri.id }
  //     });

  //     expect(updatedBsdasri.status).toBe("AWAITING_CHILD");
  //   });

  //   it("should change the bsdasri status if the bsdasri is AWAITING_CHILD and the new operation code does not imply a next bsdasri", async () => {
  //     const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
  //       "ADMIN"
  //     );
  //     const { user, company } = await userWithCompanyFactory("ADMIN");
  //     const { mutate } = makeClient(user);

  //     const bsdasri = await bsdasriFactory({
  //       opt: {
  //         emitterCompanySiret: companyOfSomeoneElse.siret,
  //         status: "AWAITING_CHILD",
  //         destinationOperationCode: "R 13"
  //       }
  //     });

  //     const revisionRequest = await prisma.bsdasriRevisionRequest.create({
  //       data: {
  //         bsdasriId: bsdasri.id,
  //         authoringCompanyId: companyOfSomeoneElse.id,
  //         approvals: { create: { approverSiret: company.siret! } },
  //         destinationOperationCode: "R 5",
  //         comment: "Operation code error"
  //       }
  //     });

  //     await mutate<
  //       Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
  //       MutationSubmitBsdasriRevisionRequestApprovalArgs
  //     >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
  //       variables: {
  //         id: revisionRequest.id,
  //         isApproved: true
  //       }
  //     });

  //     const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
  //       where: { id: bsdasri.id }
  //     });

  //     expect(updatedBsdasri.status).toBe("PROCESSED");
  //   });

  it("should change not the bsdasri status if the new operation code implies a next bsdasri but the bsdasri is not PROCESSED", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "SENT",
        destinationOperationCode: "R 5"
      }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        destinationOperationCode: "R 13",
        comment: "Operation code error"
      }
    });

    await mutate<
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
      MutationSubmitBsdasriRevisionRequestApprovalArgs
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id }
    });

    expect(updatedBsdasri.status).toBe("SENT");
  });

  it("should change the bsdasri status to CANCELED if revision asks for cancellation", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        status: "SENT"
      }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "Cancel",
        isCanceled: true
      }
    });

    await mutate<
      Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
      MutationSubmitBsdasriRevisionRequestApprovalArgs
    >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
      variables: {
        id: revisionRequest.id,
        isApproved: true
      }
    });

    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id }
    });

    expect(updatedBsdasri.status).toBe("CANCELED");
  });

  it.each(NON_CANCELLABLE_BSDASRI_STATUSES)(
    "should fail if request is about cancelation & the BSDASRI has a non-cancellable status",
    async (status: BsdasriStatus) => {
      const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
        "ADMIN"
      );
      const { user, company } = await userWithCompanyFactory("ADMIN");
      const { mutate } = makeClient(user);

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: companyOfSomeoneElse.siret,
          status
        }
      });

      const revisionRequest = await prisma.bsdasriRevisionRequest.create({
        data: {
          bsdasriId: bsdasri.id,
          authoringCompanyId: companyOfSomeoneElse.id,
          approvals: { create: { approverSiret: company.siret! } },
          comment: "Cancel",
          isCanceled: true
        }
      });

      const { errors } = await mutate<
        Pick<Mutation, "submitBsdasriRevisionRequestApproval">,
        MutationSubmitBsdasriRevisionRequestApprovalArgs
      >(SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL, {
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

  // todo: grouped - synthesis

  it("should update the operation code & mode", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        destinationOperationCode: "D9"
      }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        destinationOperationCode: "D10",
        destinationOperationMode: "ELIMINATION"
      }
    });

    await mutate<Pick<Mutation, "submitBsdasriRevisionRequestApproval">>(
      SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL,
      {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      }
    );

    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id }
    });

    expect(updatedBsdasri.destinationOperationCode).toBe("D10");
    expect(updatedBsdasri.destinationOperationMode).toBe("ELIMINATION");
  });

  it.each([null, undefined])("should nullify the operation mode", async () => {
    const { company: companyOfSomeoneElse } = await userWithCompanyFactory(
      "ADMIN"
    );
    const { user, company } = await userWithCompanyFactory("ADMIN");
    const { mutate } = makeClient(user);

    const bsdasri = await bsdasriFactory({
      opt: {
        emitterCompanySiret: companyOfSomeoneElse.siret,
        destinationOperationCode: "D 10",
        destinationOperationMode: "ELIMINATION"
      }
    });

    const revisionRequest = await prisma.bsdasriRevisionRequest.create({
      data: {
        bsdasriId: bsdasri.id,
        authoringCompanyId: companyOfSomeoneElse.id,
        approvals: { create: { approverSiret: company.siret! } },
        comment: "",
        destinationOperationCode: "D 9"
      }
    });

    await mutate<Pick<Mutation, "submitBsdasriRevisionRequestApproval">>(
      SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL,
      {
        variables: {
          id: revisionRequest.id,
          isApproved: true
        }
      }
    );

    const updatedBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: bsdasri.id }
    });

    expect(updatedBsdasri.destinationOperationCode).toBe("D 9");
    expect(updatedBsdasri.destinationOperationMode).toBeNull();
  });

  it.skip(
    "should delete the finalOperations rows when changing operation " +
      "code from a final to a non-final code",
    async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");

      const { mutate } = makeClient(emitter.user);

      const initialBsdasri = await bsdasriFactory({
        opt: { destinationOperationCode: "D 10" }
      });

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          destinationOperationCode: "R 1",
          destinationOperationSignatureDate: new Date(),
          destinationOperationMode: "VALORISATION_ENERGETIQUE",
          grouping: { connect: { id: initialBsdasri.id } }
        }
      });

      await operationHook(bsdasri, { runSync: true });

      const initialBsdasriWithFinalOperations =
        await prisma.bsdasri.findUniqueOrThrow({
          where: { id: initialBsdasri.id },
          include: { finalOperations: true }
        });

      expect(initialBsdasriWithFinalOperations.finalOperations).toHaveLength(1);

      const revisionRequest = await prisma.bsdasriRevisionRequest.create({
        data: {
          bsdasriId: bsdasri.id,
          authoringCompanyId: destination.company.id,
          approvals: { create: { approverSiret: emitter.company.siret! } },
          comment: "",
          destinationOperationCode: "D 9"
        }
      });

      await mutate<Pick<Mutation, "submitBsdasriRevisionRequestApproval">>(
        SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL,
        {
          variables: {
            id: revisionRequest.id,
            isApproved: true
          }
        }
      );

      const updatedInitialBsdasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: initialBsdasri.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialBsdasri.finalOperations).toHaveLength(0);
    }
  );
  it(
    "should create the final operation using the job queue" +
      " when changing operation code to a final one",
    async () => {
      const emitter = await userWithCompanyFactory("ADMIN");
      const destination = await userWithCompanyFactory("ADMIN");

      const { mutate } = makeClient(emitter.user);

      const initialBsdasri = await bsdasriFactory({
        opt: { destinationOperationCode: "D 15" }
      });

      const bsdasri = await bsdasriFactory({
        opt: {
          emitterCompanySiret: emitter.company.siret,
          destinationCompanySiret: destination.company.siret,
          destinationOperationCode: "D 15",
          destinationOperationSignatureDate: new Date(),
          destinationOperationMode: "VALORISATION_ENERGETIQUE",
          grouping: { connect: { id: initialBsdasri.id } }
        }
      });

      const revisionRequest = await prisma.bsdasriRevisionRequest.create({
        data: {
          bsdasriId: bsdasri.id,
          authoringCompanyId: destination.company.id,
          approvals: { create: { approverSiret: emitter.company.siret! } },
          comment: "",
          destinationOperationCode: "R 1"
        }
      });

      await mutate<Pick<Mutation, "submitBsdasriRevisionRequestApproval">>(
        SUBMIT_BSDASRI_REVISION_REQUEST_APPROVAL,
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

      const updatedInitialBsdasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: initialBsdasri.id },
        include: { finalOperations: true }
      });

      expect(updatedInitialBsdasri.finalOperations).toHaveLength(1);
    }
  );
});
