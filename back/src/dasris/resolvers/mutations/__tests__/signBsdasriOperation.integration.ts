import { resetDatabase } from "../../../../../integration-tests/helper";
import { ErrorCode } from "../../../../common/errors";
import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus } from "@prisma/client";
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
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const {
      user: recipient,
      company: recipientCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      ownerId: emitter.id,
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(recipientCompany),
        ...{ processingOperation: "XYZ", processedAt: new Date() },
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
    expect(receivedDasri.operationSignatureAuthor).toBeNull();
    expect(receivedDasri.operationSignatoryId).toBeNull();
  });

  it("should put operation signature on a dasri", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const {
      user: recipient,
      company: recipientCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await bsdasriFactory({
      ownerId: emitter.id,
      opt: {
        ...initialData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(recipientCompany),
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
    expect(receivedDasri.operationSignatureAuthor).toEqual("Martine");
    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.operationSignatureDate).toBeTruthy();
  });
});
