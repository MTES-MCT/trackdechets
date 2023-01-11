import { format } from "date-fns";
import { CompanyType, Status, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import prisma from "../../../../prisma";
import * as mailsHelper from "../../../../mailer/mailing";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  transportSegmentFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prepareDB, prepareRedis } from "../../../__tests__/helpers";
import { allowedFormats } from "../../../../common/dates";
import {
  Mutation,
  MutationMarkAsReceivedArgs
} from "../../../../generated/graphql/types";
import * as generateBsddPdf from "../../../pdf/generateBsddPdf";

// No mails
const sendMailSpy = jest.spyOn(mailsHelper, "sendMail");
sendMailSpy.mockImplementation(() => Promise.resolve());

const generateBsddPdfToBase64Spy = jest.spyOn(
  generateBsddPdf,
  "generateBsddPdfToBase64"
);
generateBsddPdfToBase64Spy.mockResolvedValue("");

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
      data: { currentTransporterSiret: siretify(3) }
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
      data: { currentTransporterSiret: siretify(3) }
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
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();
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
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();
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
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();
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
    expect(sendMailSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: "Refus de prise en charge de votre déchet"
      })
    );
  });

  it("should not accept a non-zero quantity when waste is refused", async () => {
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();
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
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();
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
    const { emitter, emitterCompany, recipient, recipientCompany } =
      await prepareDB();
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
    expect(frm.wasteRefusalReason).toBe(null);
    expect(frm.quantityReceived).toBe(22.7);
  });

  it("should not allow users whose siret is not on the form", async () => {
    const { emitterCompany, recipientCompany, form } = await prepareDB();
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const randomUserCompany = await companyFactory({ siret: siretify(2) }); // this user does not belong to the form
    const randomUser = await userFactory({
      companyAssociations: {
        create: {
          company: { connect: { id: randomUserCompany.id } },
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
      data: { currentTransporterSiret: siretify(3) }
    });

    // a taken over segment
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: siretify(2),
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

  it("should delete stale transport segments not yet taken over after a reception occured", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterSiret: siretify(3) }
    });

    // a taken over segment
    await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: siretify(3),
        readyToTakeOver: true,
        takenOverAt: new Date("2020-01-01"),
        takenOverBy: "Jason Statham"
      }
    });

    // this segment has not been taken over yet
    const staleSegment = await transportSegmentFactory({
      formId: form.id,
      segmentPayload: {
        transporterCompanySiret: siretify(4),
        readyToTakeOver: true
      }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);

    // the truck finally goes directly to the destination
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

    // currentTransporterSiret was cleaned up
    expect(frm.currentTransporterSiret).toEqual("");

    const deleted = await prisma.transportSegment.findFirst({
      where: { id: staleSegment.id }
    });
    expect(deleted).toEqual(null);
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

  test.each(allowedFormats)(
    "%p should be a valid format for receivedAt",
    async f => {
      const { user, company: destination } = await userWithCompanyFactory(
        UserRole.MEMBER,
        {
          companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
        }
      );

      const owner = await userFactory();
      const form = await formFactory({
        ownerId: owner.id,
        opt: { status: Status.SENT, recipientCompanySiret: destination.siret }
      });

      const { mutate } = makeClient(user);

      const receivedAt = new Date("2019-10-04");

      await mutate(MARK_AS_RECEIVED, {
        variables: {
          id: form.id,
          receivedInfo: {
            receivedBy: "Bill",
            receivedAt: format(receivedAt, f)
          }
        }
      });

      const frm = await prisma.form.findUnique({ where: { id: form.id } });

      expect(frm.status).toBe(Status.RECEIVED);
      expect(frm.receivedAt).toEqual(receivedAt);
    }
  );

  it("should unlink appendix 2 in case of refusal", async () => {
    const { user: ttrUser, company: ttr } = await userWithCompanyFactory(
      UserRole.MEMBER,
      {
        companyTypes: { set: [CompanyType.COLLECTOR] }
      }
    );
    const { user: destinationUser, company: destination } =
      await userWithCompanyFactory(UserRole.MEMBER, {
        companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
      });

    const form1 = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        status: "GROUPED",
        processingOperationDone: "R 13",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const form2 = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        status: "GROUPED",
        processingOperationDone: "R 13",
        recipientCompanySiret: ttr.siret,
        quantityReceived: 1
      }
    });

    const groupementForm = await formFactory({
      ownerId: ttrUser.id,
      opt: {
        emitterType: "APPENDIX2",
        emitterCompanySiret: ttr.siret,
        status: Status.SENT,
        receivedBy: "Bill",
        recipientCompanySiret: destination.siret,
        receivedAt: new Date("2019-01-17"),
        grouping: {
          createMany: {
            data: [
              { initialFormId: form1.id, quantity: form1.quantityReceived },
              { initialFormId: form2.id, quantity: form2.quantityReceived }
            ]
          }
        }
      }
    });

    const { mutate } = makeClient(destinationUser);

    await mutate<Pick<Mutation, "markAsReceived">, MutationMarkAsReceivedArgs>(
      MARK_AS_RECEIVED,
      {
        variables: {
          id: groupementForm.id,
          receivedInfo: {
            wasteAcceptationStatus: "REFUSED",
            wasteRefusalReason: "Parce que",
            receivedAt: "2019-01-18" as any,
            receivedBy: "John",
            quantityReceived: 0
          }
        }
      }
    );

    const updatedForm1 = await prisma.form.findUnique({
      where: { id: form1.id }
    });
    const updatedForm2 = await prisma.form.findUnique({
      where: { id: form2.id }
    });
    expect(updatedForm1.status).toEqual("AWAITING_GROUP");
    expect(updatedForm2.status).toEqual("AWAITING_GROUP");

    const appendix2Forms = (
      await prisma.formGroupement.findMany({
        where: { nextFormId: groupementForm.id },
        include: { initialForm: true }
      })
    ).map(g => g.initialForm);

    expect(appendix2Forms).toEqual([]);
  });

  it("should not allow a temp storer to call markAsReceived", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        recipientCompanySiret: tempStorer.company.siret,
        status: "RESENT"
      },
      forwardedInOpts: {
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date()
      }
    });
    const { mutate } = makeClient(tempStorer.user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsReceived">,
      MutationMarkAsReceivedArgs
    >(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          wasteAcceptationStatus: "ACCEPTED",
          receivedAt: new Date("2022-01-01").toISOString() as any,
          receivedBy: "John",
          quantityReceived: 1
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à réceptionner ce bordereau"
      })
    ]);
  });

  it("should throw an error if transport mode is road and quantity accepted > 40T", async () => {
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();

    expect(form.transporterTransportMode).toEqual("ROAD");

    await prepareRedis({
      emitterCompany,
      recipientCompany
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
          quantityReceived: 50
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Réception : le poids doit être inférieur à 40 tonnes lorsque le transport se fait par la route"
      })
    ]);
  });

  it("should throw an error if the BSDD is canceled", async () => {
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB({ status: Status.CANCELED });

    expect(form.transporterTransportMode).toEqual("ROAD");

    await prepareRedis({
      emitterCompany,
      recipientCompany
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
          quantityReceived: 50
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Vous ne pouvez pas faire cette action, ce bordereau a été annulé"
      })
    ]);
  });
});
