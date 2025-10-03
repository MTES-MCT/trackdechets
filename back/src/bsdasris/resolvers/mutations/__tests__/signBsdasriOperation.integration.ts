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
import type { Mutation } from "@td/codegen-back";

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

  it("should create final operation with code D9F", async () => {
    // Given
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

    // When
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

    // Then
    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id },
      include: { finalOperations: true }
    });
    expect(receivedDasri.finalOperations).toHaveLength(1);
    expect(receivedDasri.finalOperations[0].operationCode).toEqual("D9F");
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
          "Le poids du déchet traité en kg est un champ requis. (Si le code correspond à un traitement final)",
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

  describe("TRA-16750 - Code D9 becomes D9F", () => {
    it("should be able to sign dasri with operation code D9F", async () => {
      // Given
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
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
          status: BsdasriStatus.RECEIVED,
          destinationOperationCode: "D9F",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // When
      const { mutate } = makeClient(recipient); // recipient
      const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
        SIGN_DASRI,
        {
          variables: {
            id: dasri.id,
            input: { type: "OPERATION", author: "Martine" }
          }
        }
      );

      // Then
      expect(errors).toBeUndefined();
      const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
        where: { id: dasri.id },
        include: { finalOperations: true }
      });
      expect(receivedDasri.status).toEqual("PROCESSED");
      expect(receivedDasri.destinationOperationCode).toBe("D9F");
    });

    it("should no longer be able to sign dasri with operation code D9", async () => {
      // Given
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
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
          status: BsdasriStatus.RECEIVED,
          destinationOperationCode: "D9",
          destinationOperationMode: "ELIMINATION"
        }
      });

      // When
      const { mutate } = makeClient(recipient); // recipient
      const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
        SIGN_DASRI,
        {
          variables: {
            id: dasri.id,
            input: { type: "OPERATION", author: "Martine" }
          }
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Cette opération d’élimination / valorisation n'existe pas ou n'est pas appropriée"
      );
    });
  });
});
