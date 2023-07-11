import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  transporterReceiptFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import {
  BsdasriStatus,
  BsdasriType,
  WasteAcceptationStatus
} from "@prisma/client";
import {
  bsdasriFactory,
  initialData,
  readyToTakeOverData,
  readyToReceiveData,
  readyToProcessData,
  readyToPublishData
} from "../../../__tests__/factories";
import prisma from "../../../../prisma";
import { Mutation } from "../../../../generated/graphql/types";
import { ErrorCode } from "../../../../common/errors";

import { SIGN_DASRI } from "./signUtils";

describe("Mutation.signBsdasri on synthesis bsd", () => {
  afterEach(resetDatabase);

  it("should deny emitter signature on an INITIAL synthesis dasri", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    // this dasri will be grouped by the synthesis dasris
    const synthesizeBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.SENT
      }
    });

    // synthesis dasris
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL,
        type: BsdasriType.SYNTHESIS,

        synthesizing: { connect: [{ id: synthesizeBsdasri.id }] }
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", author: "Jimmy" }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Un dasri de synthèse INITIAL attend une signature transporteur, la signature producteur n'est pas acceptée.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });
  it("should put transport signature on an INITIAL synthesis dasri and cascade on associated bsds", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { user: transporter, company: transporterCompany } =
      await userWithCompanyFactory("MEMBER");
    await transporterReceiptFactory({ company: transporterCompany });
    const { company: destinationCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    // this dasri will be grouped by the synthesis dasris
    const synthesizeBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.SENT
      }
    });

    // synthesis dasris
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToPublishData(destinationCompany),
        ...readyToTakeOverData(transporterCompany),
        status: BsdasriStatus.INITIAL,
        type: BsdasriType.SYNTHESIS,

        synthesizing: { connect: [{ id: synthesizeBsdasri.id }] }
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", author: "Jimmy" }
      }
    });

    const takenOverDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(takenOverDasri.status).toEqual("SENT");
    expect(takenOverDasri.transporterTransportSignatureAuthor).toEqual("Jimmy");
    expect(takenOverDasri.transporterTransportSignatureDate).toBeTruthy();
    expect(takenOverDasri.transportSignatoryId).toEqual(transporter.id);

    // signature data are cascaded on synthesizeBsdasri
    const updatedSynthesizeBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });

    expect(updatedSynthesizeBsdasri.status).toEqual("SENT");
    expect(
      updatedSynthesizeBsdasri.transporterTransportSignatureAuthor
    ).toEqual("Jimmy");
    expect(
      updatedSynthesizeBsdasri.transporterTransportSignatureDate
    ).toBeTruthy();
    expect(updatedSynthesizeBsdasri.transportSignatoryId).toEqual(
      transporter.id
    );
  });

  it.each([
    WasteAcceptationStatus.REFUSED,
    WasteAcceptationStatus.PARTIALLY_REFUSED
  ])(
    "should deny transport %p signature on an INITIAL synthesis dasri",
    async acceptationStatus => {
      // Synthesis dasri can't be refused
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user: transporter, company: transporterCompany } =
        await userWithCompanyFactory("MEMBER");
      await transporterReceiptFactory({ company: transporterCompany });
      const { company: destinationCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      // this dasri will be grouped by the synthesis dasris
      const synthesizeBsdasri = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),
          status: BsdasriStatus.SENT
        }
      });

      // synthesis dasris
      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(transporterCompany),
          ...readyToPublishData(destinationCompany),
          ...readyToTakeOverData(transporterCompany),
          status: BsdasriStatus.INITIAL,
          type: BsdasriType.SYNTHESIS,
          transporterAcceptationStatus: acceptationStatus,
          transporterWasteRefusedWeightValue: 100,
          transporterWasteRefusalReason: "j'en veux pas",
          synthesizing: { connect: [{ id: synthesizeBsdasri.id }] }
        }
      });
      const { mutate } = makeClient(transporter); // transporter

      const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
        SIGN_DASRI,
        {
          variables: {
            id: dasri.id,
            input: { type: "TRANSPORT", author: "Jimmy" }
          }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Un dasri de synthèse ne peut pas être refusé ou partiellement accepté par le transporteur.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it("should put reception signature on a SENT synthesis dasri and cascade on grouped bsds", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const { user: recipient, company: recipientCompany } =
      await userWithCompanyFactory("MEMBER");

    // this dasri will be grouped by the synthesis dasris
    const synthesizeBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(recipientCompany),
        ...readyToTakeOverData(transporterCompany),

        status: BsdasriStatus.SENT
      }
    });

    // synthesis dasris
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToPublishData(recipientCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        status: BsdasriStatus.SENT,
        type: BsdasriType.SYNTHESIS,
        destinationReceptionDate: new Date("2020-12-15T11:00:00.000Z"),

        synthesizing: { connect: [{ id: synthesizeBsdasri.id }] }
      }
    });
    const { mutate } = makeClient(recipient); // recipient

    await mutate<Pick<Mutation, "signBsdasri">>(SIGN_DASRI, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", author: "Billy" }
      }
    });

    const receivedDasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.destinationReceptionSignatureAuthor).toEqual("Billy");

    expect(receivedDasri.destinationReceptionSignatureDate).toBeTruthy();

    expect(receivedDasri.receptionSignatoryId).toEqual(recipient.id);

    // signature data are cascaded on synthesizeBsdasri
    const updatedSynthesizeBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });

    expect(updatedSynthesizeBsdasri.status).toEqual("RECEIVED");

    expect(
      updatedSynthesizeBsdasri.destinationReceptionSignatureAuthor
    ).toEqual("Billy");
    expect(
      updatedSynthesizeBsdasri.destinationReceptionSignatureDate
    ).toBeTruthy();
    expect(updatedSynthesizeBsdasri.receptionSignatoryId).toEqual(recipient.id);
  });

  it.each([
    WasteAcceptationStatus.REFUSED,
    WasteAcceptationStatus.PARTIALLY_REFUSED
  ])(
    "should deny reception %p  signature on a SENT synthesis dasri",
    async acceptationStatus => {
      const { company: emitterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { company: transporterCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      const { user: recipient, company: recipientCompany } =
        await userWithCompanyFactory("MEMBER");

      // this dasri will be grouped by the synthesis dasris
      const synthesizeBsdasri = await bsdasriFactory({
        opt: {
          ...initialData(emitterCompany),
          ...readyToPublishData(recipientCompany),
          ...readyToTakeOverData(transporterCompany),

          status: BsdasriStatus.SENT
        }
      });

      // synthesis dasris
      const dasri = await bsdasriFactory({
        opt: {
          ...initialData(transporterCompany),
          ...readyToPublishData(recipientCompany),
          ...readyToTakeOverData(transporterCompany),
          ...readyToReceiveData(),
          status: BsdasriStatus.SENT,
          type: BsdasriType.SYNTHESIS,
          destinationReceptionDate: new Date("2020-12-15T11:00:00.000Z"),
          destinationReceptionWasteRefusedWeightValue: 130,
          destinationReceptionWasteRefusalReason: "Nope",
          destinationReceptionAcceptationStatus: acceptationStatus,
          synthesizing: { connect: [{ id: synthesizeBsdasri.id }] }
        }
      });
      const { mutate } = makeClient(recipient); // recipient

      const { errors } = await mutate<Pick<Mutation, "signBsdasri">>(
        SIGN_DASRI,
        {
          variables: {
            id: dasri.id,
            input: { type: "RECEPTION", author: "Billy" }
          }
        }
      );
      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Un dasri de synthèse ne peut pas être refusé ou partiellement accepté par le destinataire.",
          extensions: expect.objectContaining({
            code: ErrorCode.BAD_USER_INPUT
          })
        })
      ]);
    }
  );

  it("should put operation signature on a RECEIVED synthesis dasri and cascade on grouped bsds", async () => {
    const { company: emitterCompany } = await userWithCompanyFactory("MEMBER");
    const { company: transporterCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const { user: recipient, company: recipientCompany } =
      await userWithCompanyFactory("MEMBER");

    // this dasri will be grouped by the synthesis dasris
    const synthesizeBsdasri = await bsdasriFactory({
      opt: {
        ...initialData(emitterCompany),
        ...readyToPublishData(recipientCompany),
        ...readyToTakeOverData(transporterCompany),

        status: BsdasriStatus.SENT
      }
    });

    // synthesis dasris
    const dasri = await bsdasriFactory({
      opt: {
        ...initialData(transporterCompany),
        ...readyToPublishData(recipientCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(),
        ...readyToProcessData,
        status: BsdasriStatus.RECEIVED,
        type: BsdasriType.SYNTHESIS,

        synthesizing: { connect: [{ id: synthesizeBsdasri.id }] }
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
    expect(receivedDasri.status).toEqual("PROCESSED");
    expect(receivedDasri.destinationOperationSignatureAuthor).toEqual(
      "Martine"
    );

    expect(receivedDasri.destinationOperationSignatureDate).toBeTruthy();

    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);

    // signature data are cascaded on synthesizeBsdasri
    const updatedSynthesizeBsdasri = await prisma.bsdasri.findUniqueOrThrow({
      where: { id: dasri.id }
    });

    expect(updatedSynthesizeBsdasri.status).toEqual("PROCESSED");

    expect(
      updatedSynthesizeBsdasri.destinationOperationSignatureAuthor
    ).toEqual("Martine");
    expect(
      updatedSynthesizeBsdasri.destinationOperationSignatureDate
    ).toBeTruthy();
    expect(updatedSynthesizeBsdasri.operationSignatoryId).toEqual(recipient.id);
  });
});
