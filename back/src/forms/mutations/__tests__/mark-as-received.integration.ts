import { prisma, UserRole } from "../../../generated/prisma-client";

import * as mailsHelper from "../../../common/mails.helper";

import { prepareRedis, prepareDB } from "../../__tests__/helpers";

import makeClient from "../../../__tests__/testClient";

import {
  formFactory,
  userFactory,
  companyFactory,
  transportSegmentFactory
} from "../../../__tests__/factories";
import { resetDatabase } from "../../../../integration-tests/helper";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

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
    const form = await prisma.updateForm({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: "5678" }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Bill",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: ACCEPTED,
            quantityReceived: 11
      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });

    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived).toBe(11);

    // when form is received, we clean up currentTransporterSiret
    expect(frm.currentTransporterSiret).toEqual("");

    // A StatusLog object is created
    const logs = await prisma.statusLogs({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("RECEIVED");
  });

  it("should not accept negative values", async () => {
    const {
      emitter,
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Bill",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: ACCEPTED,
            quantityReceived: -2
      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });
    // form was not accepted, still sent
    expect(frm.status).toBe("SENT");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
  });

  it("should not accept 0 value when form is accepted", async () => {
    const {
      emitter,
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Bill",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: ACCEPTED,
            quantityReceived: 0
      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Holden",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: REFUSED,
            wasteRefusalReason: "Lorem ipsum",
            quantityReceived: 0

      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });

    // form was refused
    expect(frm.status).toBe("REFUSED");
    expect(frm.wasteAcceptationStatus).toBe("REFUSED");
    expect(frm.receivedBy).toBe("Holden");
    expect(frm.wasteRefusalReason).toBe("Lorem ipsum");
    expect(frm.quantityReceived).toBe(0); // quantityReceived is set to 0

    // A StatusLog object is created
    const logs = await prisma.statusLogs({
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Holden",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: REFUSED,
            wasteRefusalReason: "Lorem ipsum",
            quantityReceived: 21
      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });

    // form is still sent
    expect(frm.status).toBe("SENT");

    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);

    // No StatusLog object was created
    const logs = await prisma.statusLogs({
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Carol",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: PARTIALLY_REFUSED,
            wasteRefusalReason: "Dolor sit amet",
            quantityReceived: 12.5

      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });
    // form was not accepted
    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe("PARTIALLY_REFUSED");
    expect(frm.receivedBy).toBe("Carol");
    expect(frm.wasteRefusalReason).toBe("Dolor sit amet");
    expect(frm.quantityReceived).toBe(12.5);

    // A StatusLog object is created
    const logs = await prisma.statusLogs({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("RECEIVED");
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${alreadyReceivedForm.id}",
            receivedInfo: {
            receivedBy: "Sandy",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: PARTIALLY_REFUSED,
            wasteRefusalReason: "Dolor sit amet",
            quantityReceived: 19

      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: alreadyReceivedForm.id });
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Bill",
            receivedAt :"2019-01-17T10:22:00+0100",
            signedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: ACCEPTED,
            quantityReceived: 11
      }
        ) { status }
      }
    `;

    // request performed by randomuser, form state is not updated
    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });

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
    const form = await prisma.updateForm({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: "5678" }
    });

    // a taken over segment
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: "98765",
        readyToTakeOver: true,
        takenOverAt: "2020-01-01",
        takenOverBy: "Jason Statham"
      }
    });

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Bill",
            receivedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: ACCEPTED,
            quantityReceived: 11
      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });

    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived).toBe(11);

    // when form is received, we clean up currentTransporterSiret
    expect(frm.currentTransporterSiret).toEqual("");

    // A StatusLog object is created
    const logs = await prisma.statusLogs({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("RECEIVED");
  });

  it("should not mark as received a form with segment not taken over", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.updateForm({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: "5678" }
    });

    // a taken over segment
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: "98765",
        readyToTakeOver: true,
        takenOverAt: "2020-01-01",
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
    const mutation = `
      mutation {
        markAsReceived(
            id: "${form.id}",
            receivedInfo: {
            receivedBy: "Bill",
            receivedAt :"2019-01-17T10:22:00+0100",
            wasteAcceptationStatus: ACCEPTED,
            quantityReceived: 11
      }
        ) { status }
      }
    `;

    await mutate(mutation);

    const frm = await prisma.form({ id: form.id });

    expect(frm.status).toBe("SENT");

    // currentTransporterSiret was not cleaned up
    expect(frm.currentTransporterSiret).toEqual("5678");

    // A StatusLog object is created
    const logs = await prisma.statusLogs({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(0);
  });
});
