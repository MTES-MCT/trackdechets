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
  readyToProcessData
} from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";

import { SIGN_DASRI } from "./signUtils";

describe("Mutation.signBsdasri operation", () => {
  afterEach(resetDatabase);

  it("should deny operation signature on a dasri if operation code is invalid", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const {
      user: recipient,
      company: destinationCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(destinationCompany),
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

    const receivedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.destinationOperationSignatureAuthor).toBeNull();
    expect(receivedDasri.operationSignatoryId).toBeNull();
  });

  it("should put operation signature on a dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const {
      user: recipient,
      company: destinationCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(destinationCompany),
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

    const receivedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("PROCESSED");
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
    const {
      user: recipient,
      company: destinationCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      destinationReceptionWasteWeightValue,
      ...processDataWithoutQuantity
    } = readyToProcessData;
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(destinationCompany),
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
    const receivedDasri = await prisma.bsdasri.findUnique({
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
    const {
      user: recipient,
      company: destinationCompany
    } = await userWithCompanyFactory("MEMBER", {
      companyTypes: {
        set: [CompanyType.COLLECTOR]
      }
    });

    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(destinationCompany),
        ...readyToProcessData,
        destinationOperationCode: "D12",
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

    const receivedDasri = await prisma.bsdasri.findUnique({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("PROCESSED");
    expect(receivedDasri.destinationOperationSignatureAuthor).toEqual(
      "Martine"
    );
    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.destinationOperationSignatureDate).toBeTruthy();
  });
});
