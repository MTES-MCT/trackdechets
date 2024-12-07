import { format } from "date-fns";
import { CompanyType, EmitterType, Status, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../../mailer/mailing";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  bsddTransporterFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prepareDB, prepareRedis } from "../../../__tests__/helpers";
import { allowedFormats } from "../../../../common/dates";
import { ErrorCode } from "../../../../common/errors";
import type { Mutation, MutationMarkAsReceivedArgs } from "@td/codegen-back";
import { generateBsddPdfToBase64 } from "../../../pdf/generateBsddPdf";
import getReadableId from "../../../readableId";
import { getFirstTransporter } from "../../../database";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";
import { waitForJobsCompletion } from "../../../../queue/helpers";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

// No PDFs
jest.mock("../../../pdf/generateBsddPdf");
(generateBsddPdfToBase64 as jest.Mock).mockResolvedValue("");

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
    jest.resetAllMocks();
  });

  beforeEach(() => {
    // No mails
    jest.mock("../../../../mailer/mailing");
    (sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

    // No PDFs
    jest.mock("../../../pdf/generateBsddPdf");
    (generateBsddPdfToBase64 as jest.Mock).mockResolvedValue("");
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
      data: { currentTransporterOrgId: siretify(3) }
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived).toBe(null);

    // when form is received, we clean up currentTransporterOrgId
    expect(frm.currentTransporterOrgId).toEqual("");

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("RECEIVED");
  });

  it("should be possible to specify a quantityReceived=0 when acceptation status is not specified", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterOrgId: siretify(3) }
    });
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
          quantityReceived: 0
        }
      }
    });

    expect(errors).toBeUndefined();

    const receivedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(receivedForm.status).toBe("RECEIVED");
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
      data: { currentTransporterOrgId: siretify(3) }
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

    expect(frm.status).toBe("ACCEPTED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived?.toNumber()).toBe(11);

    // when form is received, we clean up currentTransporterOrgId
    expect(frm.currentTransporterOrgId).toEqual("");

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("ACCEPTED");
  });

  it("it should not mark a sent form as accepted if wasteAcceptationStatus is ACCEPTED but quantityReceived is 0", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterOrgId: siretify(3) }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const frm1 = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(frm1.quantityReceivedType).toBeNull();
    const { mutate } = makeClient(recipient);
    const { errors } = await mutate(MARK_AS_RECEIVED, {
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

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Réception : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
    const frm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    // form was not accepted, still sent
    expect(frm.status).toBe("SENT");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
  });

  it("it should not mark a sent form as accepted if wasteAcceptationStatus is ACCEPTED but quantityReceived is missing", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterOrgId: siretify(3) }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const frm1 = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(frm1.quantityReceivedType).toBeNull();
    const { mutate } = makeClient(recipient);
    const { errors } = await mutate(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedBy: "Bill",
          receivedAt: "2019-01-17T10:22:00+0100",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED"
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Réception : le poids est requis lorsque le déchet est accepté ou accepté partiellement.",
        extensions: expect.objectContaining({
          code: ErrorCode.BAD_USER_INPUT
        })
      })
    ]);
    const frm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    // form was not accepted, still sent
    expect(frm.status).toBe("SENT");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.receivedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

    // form was refused
    expect(frm.status).toBe("REFUSED");
    expect(frm.wasteAcceptationStatus).toBe("REFUSED");
    expect(frm.receivedBy).toBe("Holden");
    expect(frm.wasteRefusalReason).toBe("Lorem ipsum");
    expect(frm.quantityReceived?.toNumber()).toBe(0); // quantityReceived is set to 0

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("REFUSED");
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject:
          "Le déchet de l’entreprise company_1 a été totalement refusé à réception"
      })
    );
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    // form was not accepted
    expect(frm.status).toBe("ACCEPTED");
    expect(frm.wasteAcceptationStatus).toBe("PARTIALLY_REFUSED");
    expect(frm.receivedBy).toBe("Carol");
    expect(frm.wasteRefusalReason).toBe("Dolor sit amet");
    expect(frm.quantityReceived?.toNumber()).toBe(12.5);

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

    const frm = await prisma.form.findUniqueOrThrow({
      where: { id: alreadyReceivedForm.id }
    });
    // form is not updated by the last mutation
    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Hugo");
    expect(frm.wasteRefusalReason).toBe(null);
    expect(frm.quantityReceived?.toNumber()).toBe(22.7);
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
          role: "ADMIN"
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

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
      data: { currentTransporterOrgId: siretify(3) }
    });

    // a taken over segment
    await bsddTransporterFactory({
      formId: form.id,
      opts: {
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

    expect(frm.status).toBe("ACCEPTED");
    expect(frm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(frm.receivedBy).toBe("Bill");
    expect(frm.quantityReceived?.toNumber()).toBe(11);

    // when form is received, we clean up currentTransporterOrgId
    expect(frm.currentTransporterOrgId).toEqual("");

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
      data: { currentTransporterOrgId: siretify(3) }
    });

    // a taken over segment
    await bsddTransporterFactory({
      formId: form.id,
      opts: {
        transporterCompanySiret: siretify(3),
        readyToTakeOver: true,
        takenOverAt: new Date("2020-01-01"),
        takenOverBy: "Jason Statham"
      }
    });

    // this segment has not been taken over yet
    const staleSegment = await bsddTransporterFactory({
      formId: form.id,
      opts: {
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

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

    expect(frm.status).toBe("ACCEPTED");

    // currentTransporterOrgId was cleaned up
    expect(frm.currentTransporterOrgId).toEqual("");

    const deleted = await prisma.bsddTransporter.findFirst({
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

      const frm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });

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
              {
                initialFormId: form1.id,
                quantity: form1.quantityReceived!.toNumber()
              },
              {
                initialFormId: form2.id,
                quantity: form2.quantityReceived!.toNumber()
              }
            ]
          }
        }
      }
    });

    const { mutate } = makeClient(destinationUser);

    const mutateFn = () =>
      mutate<Pick<Mutation, "markAsReceived">, MutationMarkAsReceivedArgs>(
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

    await waitForJobsCompletion({
      fn: mutateFn,
      queue: updateAppendix2Queue,
      expectedJobCount: 2
    });

    const updatedForm1 = await prisma.form.findUniqueOrThrow({
      where: { id: form1.id }
    });
    const updatedForm2 = await prisma.form.findUniqueOrThrow({
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

    const transporter = await getFirstTransporter(form);

    expect(transporter!.transporterTransportMode).toEqual("ROAD");

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

    const transporter = await getFirstTransporter(form);

    expect(transporter!.transporterTransportMode).toEqual("ROAD");

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
          quantityReceived: 30
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
      })
    ]);
  });

  describe("Annexe 1", () => {
    it("should prevent marking an appendix1 item as received", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: company.siret,
          owner: { connect: { id: user.id } },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "markAsReceived">,
        MutationMarkAsReceivedArgs
      >(MARK_AS_RECEIVED, {
        variables: {
          id: appendix1_item.id,
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
          message:
            "Un bordereau d'annexe 1 ne peut pas être marqué comme reçu. C'est la réception du bordereau de tournée qui mettra à jour le statut de ce bordereau."
        })
      ]);
    });

    it("should mark the appendix1 items as ACCEPTED when the container form if marked as ACCEPTED", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          recipientCompanySiret: company.siret,
          grouping: {
            create: { initialFormId: appendix1_item.id, quantity: 0 }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "markAsReceived">,
        MutationMarkAsReceivedArgs
      >(MARK_AS_RECEIVED, {
        variables: {
          id: container.id,
          receivedInfo: {
            wasteAcceptationStatus: "ACCEPTED",
            receivedAt: new Date("2022-01-01").toISOString() as any,
            receivedBy: "John",
            quantityReceived: 1
          }
        }
      });

      expect(data.markAsReceived.status).toBe(Status.ACCEPTED);

      const refreshedItem = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_item.id }
      });
      expect(refreshedItem.status).toBe(Status.ACCEPTED);
    });

    it("should mark the appendix1 items as RECEIVED when the container form if marked as RECEIVED", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          recipientCompanySiret: company.siret,
          grouping: {
            create: { initialFormId: appendix1_item.id, quantity: 0 }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "markAsReceived">,
        MutationMarkAsReceivedArgs
      >(MARK_AS_RECEIVED, {
        variables: {
          id: container.id,
          receivedInfo: {
            receivedAt: new Date("2022-01-01").toISOString() as any,
            receivedBy: "John",
            quantityReceived: 1
          }
        }
      });

      expect(data.markAsReceived.status).toBe(Status.RECEIVED);

      const refreshedItem = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_item.id }
      });
      expect(refreshedItem.status).toBe(Status.RECEIVED);
    });

    it("should remove the appendix1 items that have not been marked as SENT when receiving the container form", async () => {
      const { company: producerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );
      const { user, company } = await userWithCompanyFactory("MEMBER");

      // This one is SENT
      const appendix1_1 = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });
      // This one hasnt been signed by the transporter
      const appendix1_2 = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SIGNED_BY_PRODUCER,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });
      // This one hasnt been signed at all
      const appendix1_3 = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.SEALED,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          owner: { connect: { id: user.id } },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SENT,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          recipientCompanySiret: company.siret,
          grouping: {
            createMany: {
              data: [
                { initialFormId: appendix1_1.id, quantity: 0 },
                { initialFormId: appendix1_2.id, quantity: 0 },
                { initialFormId: appendix1_3.id, quantity: 0 }
              ]
            }
          },
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "markAsReceived">,
        MutationMarkAsReceivedArgs
      >(MARK_AS_RECEIVED, {
        variables: {
          id: container.id,
          receivedInfo: {
            receivedAt: new Date("2022-01-01").toISOString() as any,
            receivedBy: "John",
            quantityReceived: 1
          }
        }
      });

      expect(data.markAsReceived.status).toBe(Status.RECEIVED);
      const links = await prisma.formGroupement.findMany({
        where: { nextFormId: container.id }
      });
      expect(links.length).toBe(1);

      const refreshedItem1 = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_1.id }
      });
      expect(refreshedItem1.status).toBe(Status.RECEIVED);

      const refreshedItem2 = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_2.id }
      });
      expect(refreshedItem2.isDeleted).toBe(true);

      const refreshedItem3 = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_3.id }
      });
      expect(refreshedItem3.isDeleted).toBe(true);
    });
  });

  it("should work with quantityRefused", async () => {
    // Given
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: { currentTransporterOrgId: siretify(3) }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    // When
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
          quantityReceived: 12.5,
          quantityRefused: 7.5
        }
      }
    });

    // Then
    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    expect(frm.quantityReceived?.toNumber()).toEqual(12.5);
    expect(frm.quantityRefused?.toNumber()).toEqual(7.5);
  });

  it("when final destination refuses a BSD, a mail should be sent", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorer.company.siret,
        status: "RESENT",
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 2
      },
      forwardedInOpts: {
        sentAt: new Date(),
        emitterCompanySiret: tempStorer.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date()
      }
    });

    // When
    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsReceived">,
      MutationMarkAsReceivedArgs
    >(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedAt: new Date("2022-01-01").toISOString() as any,
          receivedBy: "John",
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Bof",
          quantityReceived: 8,
          quantityRefused: 8
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject:
          "Le déchet de l’entreprise WASTE PRODUCER a été totalement refusé à réception"
      })
    );
  });

  it("when final destination partially refuses a BSD, a mail should be sent", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorer.company.siret,
        status: "RESENT",
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 2
      },
      forwardedInOpts: {
        sentAt: new Date(),
        emitterCompanySiret: tempStorer.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date()
      }
    });

    // When
    const { mutate } = makeClient(destination.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "markAsReceived">,
      MutationMarkAsReceivedArgs
    >(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedAt: new Date("2022-01-01").toISOString() as any,
          receivedBy: "John",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          wasteRefusalReason: "Bof",
          quantityReceived: 8,
          quantityRefused: 6
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(data.markAsReceived.status).toBe("ACCEPTED");
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject:
          "Le déchet de l’entreprise WASTE PRODUCER a été partiellement refusé à réception"
      })
    );
  });

  // Bug was "Cannot destructure property 'prepareVariables' of 'mailTemplate' as it is undefined."
  // Use-case:
  // - Create a tmp storage BSD
  // - Temp storer partially accepts the waste
  // - Final destination tries to receive the waste (no acceptation, just receive)
  // - markAsReceived detects that waste was partially refused (by tmp storer) and tries to send a mail,
  //   but wasteAcceptationStatus does not exist yet for the final destination. Cannot find the mail template
  //   and crashes
  it("when final destination receives a BSD (without acceptation), no mail should be sent even if temp storage partially refused the BSD", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorer.company.siret,
        status: "RESENT",
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 2
      },
      forwardedInOpts: {
        sentAt: new Date(),
        emitterCompanySiret: tempStorer.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date()
      }
    });

    // When
    const { mutate } = makeClient(destination.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "markAsReceived">,
      MutationMarkAsReceivedArgs
    >(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedAt: new Date("2022-01-01").toISOString() as any,
          receivedBy: "John"
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
    expect(data.markAsReceived.status).toBe("RECEIVED");
  });

  it("when final destination accepts a BSD, no mail should be sent even if temp storage partially refused the BSD", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorer.company.siret,
        status: "RESENT",
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 2
      },
      forwardedInOpts: {
        sentAt: new Date(),
        emitterCompanySiret: tempStorer.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date()
      }
    });

    // When
    const { mutate } = makeClient(destination.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "markAsReceived">,
      MutationMarkAsReceivedArgs
    >(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedAt: new Date("2022-01-01").toISOString() as any,
          receivedBy: "John",
          // Acceptation also
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 8,
          quantityRefused: 0
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
    expect(data.markAsReceived.status).toBe("ACCEPTED");
  });

  it("quantityReceived is required for a final destination to accept a BSD", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorer.company.siret,
        status: "RESENT",
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 10,
        quantityRefused: 0
      },
      forwardedInOpts: {
        sentAt: new Date(),
        emitterCompanySiret: tempStorer.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date()
      }
    });

    const { mutate } = makeClient(destination.user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsReceived">,
      MutationMarkAsReceivedArgs
    >(MARK_AS_RECEIVED, {
      variables: {
        id: form.id,
        receivedInfo: {
          receivedAt: new Date("2022-01-01").toISOString() as any,
          receivedBy: "John",

          wasteAcceptationStatus: "ACCEPTED"
          // quantityReceived not provided,
        }
      }
    });

    expect(errors).toEqual([
      expect.objectContaining({
        message:
          "Réception : le poids est requis lorsque le déchet est accepté ou accepté partiellement."
      })
    ]);

    const frm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });
    // form was not accepted, still resent
    expect(frm.status).toBe("RESENT");
  });
});
