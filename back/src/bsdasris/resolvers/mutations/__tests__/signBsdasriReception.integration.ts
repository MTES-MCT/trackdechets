import { resetDatabase } from "../../../../../integration-tests/helper";

import { userWithCompanyFactory } from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { BsdasriStatus, WasteAcceptationStatus } from "@prisma/client";
import {
  bsdasriFactory,
  initialData,
  readyToTakeOverData,
  readyToReceiveData,
  readyToPublishData
} from "../../../__tests__/factories";
import { prisma } from "@td/prisma";
import type { Mutation } from "@td/codegen-back";

import { SIGN_DASRI } from "./signUtils";

describe("Mutation.signBsdasri reception", () => {
  afterEach(resetDatabase);

  it("should put reception signature on a dasri and fill handedOverToRecipientAt", async () => {
    // When a reception is signed, handedOverToRecipientAt is filled with destinationReceptionDate field
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
        destinationReceptionDate: new Date("2020-12-15T11:00:00.000Z"),
        status: BsdasriStatus.SENT
      }
    });
    expect(dasri.handedOverToRecipientAt).toBeNull(); // sanity check

    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", author: "Monique" }
      }
    });

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.destinationReceptionSignatureAuthor).toEqual(
      "Monique"
    );
    expect(receivedDasri.destinationReceptionSignatureDate).toBeTruthy();
    expect(receivedDasri.receptionSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.handedOverToRecipientAt).not.toBeNull();

    expect(receivedDasri.handedOverToRecipientAt).toEqual(
      new Date("2020-12-15T11:00:00.000Z")
    );
  });

  it("should put reception signature on a dasri even if plates are invalid and bsd was created before V2025020", async () => {
    // When a reception is signed, handedOverToRecipientAt is filled with destinationReceptionDate field
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
        transporterTransportPlates: ["XY"], // too short
        destinationReceptionDate: new Date("2020-12-15T11:00:00.000Z"),
        createdAt: new Date("2025-01-04T00:00:00.000Z"), // created before V2025020

        status: BsdasriStatus.SENT
      }
    });
    expect(dasri.handedOverToRecipientAt).toBeNull(); // sanity check

    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", author: "Monique" }
      }
    });

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.destinationReceptionSignatureAuthor).toEqual(
      "Monique"
    );
    expect(receivedDasri.destinationReceptionSignatureDate).toBeTruthy();
    expect(receivedDasri.receptionSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.handedOverToRecipientAt).not.toBeNull();

    expect(receivedDasri.handedOverToRecipientAt).toEqual(
      new Date("2020-12-15T11:00:00.000Z")
    );
  });

  it("should put reception signature on a dasri and preserve handedOverToRecipientAt", async () => {
    // When a reception is signed, handedOverToRecipientAt must be kept if already filled

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
        handedOverToRecipientAt: new Date("2020-12-20T11:00:00.000Z"),
        status: BsdasriStatus.SENT
      }
    });

    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", author: "Monique" }
      }
    });

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.destinationReceptionSignatureAuthor).toEqual(
      "Monique"
    );
    expect(receivedDasri.destinationReceptionSignatureDate).toBeTruthy();
    expect(receivedDasri.receptionSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.handedOverToRecipientAt).toEqual(
      new Date("2020-12-20T11:00:00.000Z")
    ); // field was preserved
  });

  it("should mark a dasri as refused when reception acceptation is refused", async () => {
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
        destinationReceptionAcceptationStatus: WasteAcceptationStatus.REFUSED,
        destinationReceptionWasteRefusalReason: "Non conforme",
        destinationReceptionWasteRefusedWeightValue: 66,

        status: BsdasriStatus.SENT
      }
    });
    const { mutate } = makeClient(recipient);

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", author: "Caroline" }
      }
    });

    const readyTotakeOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("REFUSED");
    expect(readyTotakeOverDasri.destinationReceptionSignatureAuthor).toEqual(
      "Caroline"
    );
    expect(readyTotakeOverDasri.destinationReceptionSignatureDate).toBeTruthy();
    expect(readyTotakeOverDasri.receptionSignatoryId).toEqual(recipient.id);
  });
});
