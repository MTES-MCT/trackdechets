import { resetDatabase } from "../../../integration-tests/helper";
import { ErrorCode } from "../../common/errors";
import { userWithCompanyFactory } from "../../__tests__/factories";
import makeClient from "../../__tests__/testClient";
import {
  QuantityType,
  DasriStatus,
  WasteAcceptationStatus
} from "@prisma/client";
import { dasriFactory } from "./factories";
import prisma from "../../prisma";

const DASRI_SIGN = `
mutation DasriSign($id: ID!, $input: DasriSignatureInput
!) {
  dasriSign(id: $id, signatureInput: $input	) {
    id
  }
}
`;

const draftData = company => ({
  emitterCompanySiret: company.siret,
  emitterCompanyName: company.name,
  emitterCompanyContact: "Contact",
  emitterCompanyPhone: "0123456789",
  emitterCompanyAddress: "Rue jean Jaurès",
  emitterCompanyMail: "emitter@test.fr",
  wasteDetailsCode: "18 01 03*",
  wasteDetailsOnuCode: "abc",
  emitterWasteQuantity: 22,
  emitterWasteQuantityType: QuantityType.ESTIMATED,
  emitterWasteVolume: 66,
  emitterWastePackagingsInfo: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ]
});

const readyToTakeOverData = company => ({
  transporterCompanyName: company.name,
  transporterCompanySiret: company.siret,
  transporterCompanyAddress: "Boulevard machin",
  transporterCompanyPhone: "987654534",
  transporterCompanyContact: "Contact",
  transporterCompanyMail: "transporter@test.fr",
  transporterReceipt: "xyz",
  transporterReceiptDepartment: "83",
  transporterReceiptValidityLimit: new Date(),

  transporterWastePackagingsInfo: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  transporterWasteQuantity: 33,
  transporterWasteQuantityType: QuantityType.ESTIMATED,
  transporterWasteVolume: 66,
  transporterWasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  transporterTakenOverAt: new Date()
});

const readyToReceiveData = company => ({
  recipientCompanyName: company.name,
  recipientCompanySiret: company.siret,

  recipientCompanyAddress: "rue Legrand",
  recipientCompanyContact: " Contact",
  recipientCompanyPhone: "1234567",
  recipientCompanyMail: "recipient@test.fr",
  recipientWastePackagingsInfo: [
    { type: "BOITE_CARTON", volume: 22, quantity: 3 }
  ],
  recipientWasteVolume: 66,
  recipientWasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
  recipientWasteQuantity: 70,
  receivedAt: new Date()
});

const readyToProcessData = {
  processingOperation: "D10",
  processedAt: new Date()
};

describe("Mutation.dasriSign emission", () => {
  afterEach(resetDatabase);

  it("should disallow unauthenticated user", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret
      }
    });
    const { mutate } = makeClient(); // unauthenticated user
    const { errors } = await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", signedBy: "Marcel" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas connecté.",
        extensions: expect.objectContaining({
          code: ErrorCode.UNAUTHENTICATED
        })
      })
    ]);
  });

  it("a draft dasri should not be signed", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: draftData(company)
    });
    const { mutate } = makeClient(user); // emitter

    const { errors } = await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", signedBy: "Marcel" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas passer ce bordereau à l'état souhaité.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
  });

  it("should put emission signature on a dasri", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const dasri = await dasriFactory({
      ownerId: user.id,
      opt: { ...draftData(company), status: DasriStatus.SEALED }
    });
    const { mutate } = makeClient(user); // emitter

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "EMISSION", signedBy: "Marcel" }
      }
    });

    const readyTotakeOverDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("READY_FOR_TAKEOVER");
    expect(readyTotakeOverDasri.emissionSignedBy).toEqual("Marcel");
    expect(readyTotakeOverDasri.emissionSignatoryId).toEqual(user.id);
  });
});

describe("Mutation.dasriSign emission with secret code", () => {
  afterEach(resetDatabase);

  it("should deny emission signature if secret code is incorrect", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    let dasri = await dasriFactory({
      ownerId: user.id,
      opt: {
        ...draftData(company),
        status: DasriStatus.SEALED,
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(transporter); // emitter

    const { errors } = await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: {
          type: "EMISSION_WITH_SECRET_CODE",
          signedBy: "Joe",
          securityCode: 9876 // should be 1234, factory default value
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Erreur, le code de sécurité est manquant ou invalide",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
    dasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(dasri.status).toEqual("SEALED");
  });

  it("should put emission signature on a dasri", async () => {
    const { user: emitter, company } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(company),
        status: DasriStatus.SEALED,
        transporterCompanySiret: transporterCompany.siret
      }
    });
    const { mutate } = makeClient(transporter); // emitter

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: {
          type: "EMISSION_WITH_SECRET_CODE",
          signedBy: "Marcel",
          securityCode: 1234
        }
      }
    });

    const readyTotakeOverDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("READY_FOR_TAKEOVER");
    expect(readyTotakeOverDasri.emissionSignedBy).toEqual("Marcel");
    expect(readyTotakeOverDasri.emissionSignatoryId).toEqual(transporter.id);
  });
});

describe("Mutation.dasriSign transport", () => {
  afterEach(resetDatabase);

  it("should put transport signature on a READY_FOR_TAKEOVER dasri", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: DasriStatus.READY_FOR_TAKEOVER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", signedBy: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transportSignedBy).toEqual("Jimmy");
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });

  it("should put transport signature on a SEALED dasri if allowed by emitter company", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER", {
      allowDasriTakeOverWithoutSignature: true // company allow takeover without signature
    });

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: DasriStatus.SEALED
      }
    });
    const { mutate } = makeClient(transporter);

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", signedBy: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("SENT");
    expect(readyTotakeOverDasri.transportSignedBy).toEqual("Jimmy");
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });

  it("should not put transport signature on a SEALED dasri if not allowed by emitter company", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER"); // company forbid takeover without signature

    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    let dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        status: DasriStatus.SEALED
      }
    });
    const { mutate } = makeClient(transporter);

    const { errors } = await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", signedBy: "Jimmy" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Erreur, l'émetteur n'a pas autorisé l'emport par le transporteur sans l'avoir préalablement signé",

        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);

    dasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(dasri.status).toEqual("SEALED"); // status did not change
  });

  it("should mark a dasri as refused when transporter acceptation is refused", async () => {
    const {
      user: emitter,
      company: emitterCompany
    } = await userWithCompanyFactory("MEMBER");
    const {
      user: transporter,
      company: transporterCompany
    } = await userWithCompanyFactory("MEMBER");

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        transporterWasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
        transporterWasteRefusalReason: "J'en veux pas",
        transporterWasteRefusedQuantity: 66,
        status: DasriStatus.READY_FOR_TAKEOVER
      }
    });
    const { mutate } = makeClient(transporter); // transporter

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "TRANSPORT", signedBy: "Jimmy" }
      }
    });

    const readyTotakeOverDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("REFUSED");
    expect(readyTotakeOverDasri.transportSignedBy).toEqual("Jimmy");
    expect(readyTotakeOverDasri.transportSignatoryId).toEqual(transporter.id);
  });
});

describe("Mutation.dasriSign reception", () => {
  afterEach(resetDatabase);

  it("should put reception signature on a dasri and fill handedOverToRecipientAt", async () => {
    // When a reception is signed, handedOverToRecipientAt is filled with receivedAt field
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

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(recipientCompany),
        receivedAt: new Date("2020-12-15T11:00:00.000Z"),
        status: DasriStatus.SENT
      }
    });
    expect(dasri.handedOverToRecipientAt).toBeNull(); // sanity check

    const { mutate } = makeClient(recipient); // recipient

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", signedBy: "Monique" }
      }
    });

    const receivedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.receptionSignedBy).toEqual("Monique");
    expect(receivedDasri.receptionSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.handedOverToRecipientAt).not.toBeNull();

    expect(receivedDasri.handedOverToRecipientAt).toEqual(
      new Date("2020-12-15T11:00:00.000Z")
    ); // field was filled with receivedAt value
  });

  it("should put reception signature on a dasri and keep already filled handedOverToRecipientAt", async () => {
    // When a reception is signed, handedOverToRecipientAt must be kept if already filled

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

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(recipientCompany),
        handedOverToRecipientAt: new Date("2020-12-20T11:00:00.000Z"),
        status: DasriStatus.SENT
      }
    });

    const { mutate } = makeClient(recipient); // recipient

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", signedBy: "Monique" }
      }
    });

    const receivedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.receptionSignedBy).toEqual("Monique");
    expect(receivedDasri.receptionSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.handedOverToRecipientAt).toEqual(
      new Date("2020-12-20T11:00:00.000Z")
    ); // field was not overwritten
  });

  it("should mark a dasri as refused when reception acceptation is refused", async () => {
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

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(recipientCompany),
        recipientWasteAcceptationStatus: WasteAcceptationStatus.REFUSED,
        recipientWasteRefusalReason: "Non conforme",
        recipientWasteRefusedQuantity: 66,

        status: DasriStatus.SENT
      }
    });
    const { mutate } = makeClient(recipient);

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "RECEPTION", signedBy: "Caroline" }
      }
    });

    const readyTotakeOverDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(readyTotakeOverDasri.status).toEqual("REFUSED");
    expect(readyTotakeOverDasri.receptionSignedBy).toEqual("Caroline");
    expect(readyTotakeOverDasri.receptionSignatoryId).toEqual(recipient.id);
  });
});

describe("Mutation.dasriSign operation", () => {
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

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(recipientCompany),
        ...{ processingOperation: "XYZ", processedAt: new Date() },
        status: DasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient);

    const { errors } = await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", signedBy: "Martine" }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Cette opération d’élimination / valorisation n'existe pas.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);

    const receivedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("RECEIVED");
    expect(receivedDasri.operationSignedBy).toBeNull();
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

    const dasri = await dasriFactory({
      ownerId: emitter.id,
      opt: {
        ...draftData(emitterCompany),
        ...readyToTakeOverData(transporterCompany),
        ...readyToReceiveData(recipientCompany),
        ...readyToProcessData,
        status: DasriStatus.RECEIVED
      }
    });
    const { mutate } = makeClient(recipient); // recipient

    await mutate(DASRI_SIGN, {
      variables: {
        id: dasri.id,
        input: { type: "OPERATION", signedBy: "Martine" }
      }
    });

    const receivedDasri = await prisma.dasri.findUnique({
      where: { id: dasri.id }
    });
    expect(receivedDasri.status).toEqual("PROCESSED");
    expect(receivedDasri.operationSignedBy).toEqual("Martine");
    expect(receivedDasri.operationSignatoryId).toEqual(recipient.id);
    expect(receivedDasri.operationSignedAt).not.toBeNull();
  });
});
