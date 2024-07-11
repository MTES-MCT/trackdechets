import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus, CompanyType } from "@prisma/client";
import {
  bsdasriFactory,
  initialData,
  readyToTakeOverData,
  readyToReceiveData,
  readyToProcessData,
  readyToPublishData
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import { Mutation } from "../../../../generated/graphql/types";

import { SIGN_DASRI } from "./signUtils";
import { operationHooksQueue } from "../../../../queue/producers/operationHook";

describe("Mutation.signBsdasri operation", () => {
  afterEach(resetDatabase);

  it("should deny operation signature on a dasri if operation code is invalid", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user: recipient, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        ...{
          destinationOperationCode: "XYZ",
          destinationOperationDate: new Date()
        },
        status: BsdasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient);

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", author: "Martine" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Cette opération d’élimination / valorisation n'existe pas ou n'est pas appropriée",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.destinationOperationSignatureAuthor).toBeNull();
    expect(receivedDasri.operationSignatoryId).toBeNull();
  });

  it("should put operation signature on a dasri and set status to PROCESSED", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user: recipient, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        ...readyToProcessData,
        status: BsdasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", author: "Martine" }
      }
    });

    await new Promise(resolve => {
      operationHooksQueue.once("global:drained", () => resolve(true));
    });
    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: { finalOperations: true }
    });
    expect(receivedDasri.status).toEqual("PROCESSED");
    expect(receivedDasri.destinationOperationSignatureAuthor).toEqual(
      "Martine"
    );
    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.destinationOperationSignatureDate).toBeTruthy();
    expect(receivedDasri.finalOperations).toHaveLength(1);
  });

  it("should accept D9 code without destinationOperationMode", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user: recipient, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER");

    // no destinationOperationMode when code is D9
    const readyToProcessDataForD9 = {
      destinationOperationCode: "D9",

      destinationReceptionWasteWeightValue: 70,
      destinationOperationDate: new Date()
    };
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        ...readyToProcessDataForD9,
        status: BsdasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", author: "Martine" }
      }
    });

    // we can't wait for global:drained event as no operationHook job should be queued
    // however we check the queue is empty
    const jobsCount = await operationHooksQueue.getJobCounts();
    expect(jobsCount?.active + jobsCount?.waiting).toEqual(0);

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: { finalOperations: true }
    });
    expect(receivedDasri.status).toEqual("PROCESSED");
    expect(receivedDasri.destinationOperationSignatureAuthor).toEqual(
      "Martine"
    );
    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.destinationOperationSignatureDate).toBeTruthy();
    expect(receivedDasri.finalOperations).toHaveLength(0);
  });

  it("should put operation signature on a dasri and set status to AWAITING_GROUP", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user: recipient, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER", {
        companyTypes: {
          set: [CompanyType.COLLECTOR]
        }
      });

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        ...readyToProcessData,
        destinationOperationCode: "D13",
        destinationOperationMode: null,
        status: BsdasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", author: "Martine" }
      }
    });

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("AWAITING_GROUP");
    expect(receivedDasri.destinationOperationSignatureAuthor).toEqual(
      "Martine"
    );
    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.destinationOperationSignatureDate).toBeTruthy();
  });

  it("should deny operation signature if ops code is final and quantity is not provided", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user: recipient, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER");
    const {
      destinationReceptionWasteWeightValue,
      ...processDataWithoutQuantity
    } = readyToProcessData;
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        ...processDataWithoutQuantity,
        status: BsdasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient); // recipient

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", author: "Martine" }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Le poids du déchet traité en kg est obligatoire si le code correspond à un traitement final",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.destinationOperationSignatureAuthor).toEqual(null);

    expect(receivedDasri.destinationOperationSignatureDate).toBeFalsy();
  });

  it("should allow operation signature if ops code is not final and quantity is not provided", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const { user: recipient, company: destinationCompany } =
      await userWithCompanyFactory("MEMBER", {
        companyTypes: {
          set: [CompanyType.COLLECTOR]
        }
      });

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        ...readyToProcessData,
        destinationOperationCode: "D13",
        destinationOperationMode: null,
        status: BsdasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", author: "Martine" }
      }
    });

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("AWAITING_GROUP");
    expect(receivedDasri.destinationOperationSignatureAuthor).toEqual(
      "Martine"
    );
    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.destinationOperationSignatureDate).toBeTruthy();
  });
});
