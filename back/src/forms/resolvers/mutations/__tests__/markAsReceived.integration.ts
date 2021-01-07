import { UserRole } from "@prisma/client";
import { resetDatabase } from "integration-tests/helper";
import prisma from "src/prisma";
import * as mailsHelper from "../../../../mailer/mailing";
import {
  companyFactory,
  formFactory,
  transportSegmentFactory,
  userFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prepareDB, prepareRedis } from "../../../__tests__/helpers";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const MARK_AS_RECEIVED = `
  mutation MarkAsReceived($id: ID!, $receivedInfo: ReceivedFormInput!){
    markAsReceived(id: $id, receivedInfo: $receivedInfo){
      id
      status
    }
  }
`;

describe("Test Form reception", () => {
  afterEach(async () => {
    await resetDatabase();
  });

  it("should mark a sent form as received", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: "5678" }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100"
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });

    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived).toBe(null);

    // when form is received, we clean up currentTransporterSiret
    expect(frm.currentTransporterSiret).toEqual("");

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("RECEIVED");
  });

  it("should mark a sent form as accepted if wasteAcceptationStatus is ACCEPTED", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: "5678" }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 11
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });

    expect(frm.status).toBe("ACCEPTED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived).toBe(11);

    // when form is received, we clean up currentTransporterSiret
    expect(frm.currentTransporterSiret).toEqual("");

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("ACCEPTED");
  });

  it("should not accept negative values", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);
    // payload contains a negative quantity value, which must not be accepted
    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: -2
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });
    // form was not accepted, still sent
    expect(frm.status).toBe("SENT");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
  });

  it("should not accept 0 value when form is accepted", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);
    // payload contains a null quantity value whereas wasteAcceptationStatus is ACCEPTED, which is invalid
    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 0
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });
    // form was not accepted, still sent
    expect(frm.status).toBe("SENT");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
  });

  it("should mark a sent form as refused", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Holden",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Lorem ipsum",
          quantityReceived: 0
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });

    // form was refused
    expect(frm.status).toBe("REFUSED");
    expect(frm.wasteAcceptationStatus).toBe("REFUSED");
    expect(frm.receivedBy).toBe("Holden");
    expect(frm.wasteRefusalReason).toBe("Lorem ipsum");
    expect(frm.quantityReceived).toBe(0); // quantityReceived is set to 0

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("REFUSED");
  });

  it("should not accept a non-zero quantity when waste is refused", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const { mutate } = makeClient(recipient);
    // trying to refuse waste with a non-zero quantityReceived
    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Holden",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Lorem ipsum",
          quantityReceived: 21
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });

    // form is still sent
    expect(frm.status).toBe("SENT");

    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);

    // No StatusLog object was created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(0);
  });

  it("should mark a sent form as partially refused", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form
    } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Carol",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          wasteRefusalReason: "Dolor sit amet",
          quantityReceived: 12.5
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });
    // form was not accepted
    expect(frm.status).toBe("ACCEPTED");
    expect(frm.wasteAcceptationStatus).toBe("PARTIALLY_REFUSED");
    expect(frm.receivedBy).toBe("Carol");
    expect(frm.wasteRefusalReason).toBe("Dolor sit amet");
    expect(frm.quantityReceived).toBe(12.5);

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("ACCEPTED");
  });

  it("should not accept to edit a received form", async () => {
    const {
      emitter,
      emitterCompany,
      recipient,
      recipientCompany
    } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const alreadyReceivedForm = await formFactory({
      ownerId: emitter.id,
      opt: {
        emitterCompanyName: emitterCompany.name,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: recipientCompany.siret,
        status: "RECEIVED",
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 22.7,
        receivedBy: "Hugo"
      }
    });
    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: alreadyReceivedForm.id,
        receivedInfo: {
          receivedBy: "Sandy",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          wasteRefusalReason: "Dolor sit amet",
          quantityReceived: 19
        }
      }
    });

    const frm = await prisma.form.findUnique({
      where: { id: alreadyReceivedForm.id }
    });
    // form is not updated by the last mutation
    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Hugo");
    expect(frm.wasteRefusalReason).toBe("");
    expect(frm.quantityReceived).toBe(22.7);
  });

  it("should not allow users whose siret is not on the form", async () => {
    const { emitterCompany, recipientCompany, form } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const randomUserCompany = await companyFactory({ siret: "9999999" }); // this user does not belong to the form
    const randomUser = await userFactory({
      companyAssociations: {
        create: {
          company: { connect: { siret: randomUserCompany.siret } },
          role: "ADMIN" as UserRole
        }
      }
    });
    const { mutate } = makeClient(randomUser);

    // request performed by randomuser, form state is not updated
    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 11
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });

    expect(frm.status).toBe("SENT");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
  });

  it("should mark as received a form with taken over segment", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: "5678" }
    });

    // a taken over segment
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: "98765",
        readyToTakeOver: true,
        takenOverAt: new Date("2020-01-01"),
        takenOverBy: "Jason Statham"
      }
    });

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 11
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });

    expect(frm.status).toBe("ACCEPTED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived).toBe(11);

    // when form is received, we clean up currentTransporterSiret
    expect(frm.currentTransporterSiret).toEqual("");

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("ACCEPTED");
  });

  it("should not mark as received a form with segment not taken over", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: "5678" }
    });

    // a taken over segment
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: "98765",
        readyToTakeOver: true,
        takenOverAt: new Date("2020-01-01"),
        takenOverBy: "Jason Statham"
      }
    });

    // this segment is still not yet taken over, the form should not be accepted
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: { transporterCompanySiret: "7777", readyToTakeOver: true }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 11
        }
      }
    });

    const frm = await prisma.form.findUnique({ where: { id: form.id } });

    expect(frm.status).toBe("SENT");

    // currentTransporterSiret was not cleaned up
    expect(frm.currentTransporterSiret).toEqual("5678");

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(0);
  });

  it("should fail if recipient is temp storage", async () => {
    const { recipient, form } = await prepareDB();

    await prisma.form.update({
      where: { id: form.id },
      data: { recipientIsTempStorage: true }
    });

    const { mutate } = makeClient(recipient);

    const { errors } = await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 11
        }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Ce bordereau ne peut pas être marqué comme reçu car le destinataire est une installation " +
        "d'entreposage provisoire ou de reconditionnement. Utiliser la mutation markAsTempStored " +
        "pour marquer ce bordereau comme entreposé provisoirement"
    );
  });
});
