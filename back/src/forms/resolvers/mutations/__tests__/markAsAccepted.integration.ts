import {
  CiterneNotWashedOutReason,
  CompanyType,
  EmitterType,
  EmptyReturnADR,
  Status,
  TransportMode,
  User,
  UserRole,
  WasteAcceptationStatus
} from "@prisma/client";
import { format } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { allowedFormats } from "../../../../common/dates";
import type { Mutation, MutationMarkAsAcceptedArgs } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  formFactory,
  formWithTempStorageFactory,
  userFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prepareDB, prepareRedis } from "../../../__tests__/helpers";
import { sendMail } from "../../../../mailer/mailing";
import { generateBsddPdfToBase64 } from "../../../pdf/generateBsddPdf";
import getReadableId from "../../../readableId";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";
import { waitForJobsCompletion } from "../../../../queue/helpers";
import { associateUserToCompany } from "../../../../users/database";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

jest.mock("../../../pdf/generateBsddPdf");
(generateBsddPdfToBase64 as jest.Mock).mockResolvedValue("");

const MARK_AS_ACCEPTED = `
  mutation MarkAsAccepted($id: ID!, $acceptedInfo: AcceptedFormInput!){
    markAsAccepted(id: $id, acceptedInfo: $acceptedInfo){
      id
      status
    }
  }
`;

const createAndAcceptForm = async (createOpt, acceptOpt) => {
  // Create form
  const {
    emitterCompany,
    recipient,
    recipientCompany,
    form: initialForm
  } = await prepareDB();
  const form = await prisma.form.update({
    where: { id: initialForm.id },
    data: {
      status: "RECEIVED",
      receivedBy: "Bill",
      receivedAt: new Date("2019-01-17T10:22:00+0100"),
      wasteDetailsPackagingInfos: [{ type: "CITERNE", quantity: 1 }],
      ...createOpt
    }
  });
  await prepareRedis({
    emitterCompany,
    recipientCompany
  });

  // When
  const { mutate } = makeClient(recipient);
  const { errors, data } = await mutate(MARK_AS_ACCEPTED, {
    variables: {
      id: form.id,
      acceptedInfo: {
        signedAt: "2019-01-17T10:22:00+0100",
        signedBy: "Bill",
        wasteAcceptationStatus: "ACCEPTED",
        quantityReceived: 11,
        quantityRefused: 0,
        ...acceptOpt
      }
    }
  });

  const acceptedForm = await prisma.form.findUniqueOrThrow({
    where: { id: form.id }
  });

  return {
    form: acceptedForm,
    errors,
    data
  };
};

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

  it("should mark a received form as accepted", async () => {
    const {
      emitterCompany,
      recipient,
      recipientCompany,
      form: initialForm
    } = await prepareDB();
    const form = await prisma.form.update({
      where: { id: initialForm.id },
      data: {
        status: "RECEIVED",
        receivedBy: "Bill",
        receivedAt: new Date("2019-01-17T10:22:00+0100")
      }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_ACCEPTED, {
      variables: {
        id: form.id,
        acceptedInfo: {
          signedAt: "2019-01-17T10:22:00+0100",
          signedBy: "Bill",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 11,
          quantityRefused: 0
        }
      }
    });

    const acceptedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(acceptedForm.status).toBe("ACCEPTED");
    expect(acceptedForm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(acceptedForm.signedBy).toBe("Bill");
    expect(acceptedForm.quantityReceived?.toNumber()).toBe(11);
    expect(acceptedForm.quantityRefused?.toNumber()).toBe(0);

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: acceptedForm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("ACCEPTED");
  });

  it("ensure an older RECEIVED bsdd with invalid plates can still be accepted", async () => {
    const emitter = await userWithCompanyFactory("ADMIN");
    const transporter = await userWithCompanyFactory("ADMIN");
    const recipient = await userWithCompanyFactory("ADMIN");
    const initialForm = await formFactory({
      ownerId: emitter.user.id,
      opt: {
        status: "RECEIVED",
        emitterCompanySiret: emitter.company.siret,
        emitterCompanyName: emitter.company.name,
        signedByTransporter: null,
        sentAt: null,
        sentBy: null,

        emittedBy: emitter.user.name,

        recipientCompanySiret: recipient.company.siret,
        recipientsSirets: [recipient.company.siret!],
        receivedBy: "Bill",
        receivedAt: new Date("2019-01-17T10:22:00+0100"),
        transporters: {
          create: {
            transporterCompanySiret: transporter.company.siret,
            transporterCompanyName: transporter.company.name,
            transporterNumberPlate: "XY", // invalid plate number
            number: 1
          }
        }
      }
    });

    const { mutate } = makeClient(recipient.user);

    await mutate(MARK_AS_ACCEPTED, {
      variables: {
        id: initialForm.id,
        acceptedInfo: {
          signedAt: "2019-01-17T10:22:00+0100",
          signedBy: "Bill",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 11,
          quantityRefused: 0
        }
      }
    });

    const acceptedForm = await prisma.form.findUniqueOrThrow({
      where: { id: initialForm.id }
    });

    expect(acceptedForm.status).toBe("ACCEPTED");
    expect(acceptedForm.wasteAcceptationStatus).toBe("ACCEPTED");
    expect(acceptedForm.signedBy).toBe("Bill");
    expect(acceptedForm.quantityReceived?.toNumber()).toBe(11);
    expect(acceptedForm.quantityRefused?.toNumber()).toBe(0);

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: acceptedForm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("ACCEPTED");
  });

  it("should not accept negative values", async () => {
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();
    await prisma.form.update({
      where: { id: form.id },
      data: {
        status: "RECEIVED",
        receivedBy: "Bill",
        receivedAt: new Date("2019-01-17T10:22:00+0100")
      }
    });

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);
    // payload contains a negative quantity value, which must not be accepted
    await mutate(MARK_AS_ACCEPTED, {
      variables: {
        id: form.id,
        acceptedInfo: {
          signedBy: "Bill",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: -2
        }
      }
    });

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    // form was not accepted, still sent
    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.signedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
  });

  it("should not accept 0 value when form is accepted", async () => {
    const { emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();
    await prisma.form.update({
      where: { id: form.id },
      data: {
        status: "RECEIVED",
        receivedBy: "Bill",
        receivedAt: new Date("2019-01-17T10:22:00+0100")
      }
    });

    await prepareRedis({
      emitterCompany,
      recipientCompany
    });

    const { mutate } = makeClient(recipient);
    // payload contains a null quantity value whereas wasteAcceptationStatus is ACCEPTED, which is invalid
    await mutate(MARK_AS_ACCEPTED, {
      variables: {
        id: form.id,
        acceptedInfo: {
          signedBy: "Bill",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 0
        }
      }
    });

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    // form was not accepted, still sent
    expect(frm.status).toBe("RECEIVED");
    expect(frm.wasteAcceptationStatus).toBe(null);
    expect(frm.signedBy).toBe(null);
    expect(frm.quantityReceived).toBe(null);
  });

  it("should mark a received form as refused", async () => {
    const { emitter, emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();

    // should received email
    const emitter2 = await userFactory();
    await associateUserToCompany(emitter2.id, emitterCompany.orgId, "ADMIN", {
      notificationIsActiveBsdRefusal: true
    });

    // should not receive email
    const emitter3 = await userFactory();
    await associateUserToCompany(emitter3.id, emitterCompany.orgId, "ADMIN", {
      notificationIsActiveBsdRefusal: false
    });

    // should received email
    const recipient2 = await userFactory();
    await associateUserToCompany(
      recipient2.id,
      recipientCompany.orgId,
      "ADMIN",
      {
        notificationIsActiveBsdRefusal: true
      }
    );

    await prisma.form.update({
      where: { id: form.id },
      data: {
        status: "RECEIVED",
        receivedBy: "Bill",
        receivedAt: new Date("2019-01-17T10:22:00+0100")
      }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_ACCEPTED, {
      variables: {
        id: form.id,
        acceptedInfo: {
          signedBy: "Holden",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Lorem ipsum",
          quantityReceived: 0,
          quantityRefused: 0
        }
      }
    });

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });

    // form was refused
    expect(frm.status).toBe("REFUSED");
    expect(frm.wasteAcceptationStatus).toBe("REFUSED");
    expect(frm.signedBy).toBe("Holden");
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
          "Le déchet de l’entreprise company_1 a été totalement refusé à réception",
        to: [
          { email: emitter.email, name: emitter.name },
          { email: emitter2.email, name: emitter2.name }
        ],
        cc: [
          { email: recipient.email, name: recipient.name },
          { email: recipient2.email, name: recipient2.name }
        ]
      })
    );
  });

  it("should mark a received form as partially refused and send emails to subscribers", async () => {
    const { emitter, emitterCompany, recipient, recipientCompany, form } =
      await prepareDB();

    // should received email
    const emitter2 = await userFactory();
    await associateUserToCompany(emitter2.id, emitterCompany.orgId, "ADMIN", {
      notificationIsActiveBsdRefusal: true
    });

    // should not receive email
    const emitter3 = await userFactory();
    await associateUserToCompany(emitter3.id, emitterCompany.orgId, "ADMIN", {
      notificationIsActiveBsdRefusal: false
    });

    // should received email
    const recipient2 = await userFactory();
    await associateUserToCompany(
      recipient2.id,
      recipientCompany.orgId,
      "ADMIN",
      {
        notificationIsActiveBsdRefusal: true
      }
    );

    // should not receive email
    const recipient3 = await userFactory();
    await associateUserToCompany(
      recipient3.id,
      recipientCompany.orgId,
      "ADMIN",
      {
        notificationIsActiveBsdRefusal: false
      }
    );

    await prisma.form.update({
      where: { id: form.id },
      data: {
        status: "RECEIVED",
        receivedBy: "Bill",
        receivedAt: new Date("2019-01-17T10:22:00+0100")
      }
    });
    await prepareRedis({
      emitterCompany,
      recipientCompany
    });
    const { mutate } = makeClient(recipient);

    await mutate(MARK_AS_ACCEPTED, {
      variables: {
        id: form.id,
        acceptedInfo: {
          signedBy: "Carol",
          signedAt: "2019-01-17T10:22:00+0100",
          wasteAcceptationStatus: "PARTIALLY_REFUSED",
          wasteRefusalReason: "Dolor sit amet",
          quantityReceived: 12.5,
          quantityRefused: 7
        }
      }
    });

    const frm = await prisma.form.findUniqueOrThrow({ where: { id: form.id } });
    // form was not accepted
    expect(frm.status).toBe("ACCEPTED");
    expect(frm.wasteAcceptationStatus).toBe("PARTIALLY_REFUSED");
    expect(frm.signedBy).toBe("Carol");
    expect(frm.wasteRefusalReason).toBe("Dolor sit amet");
    expect(frm.quantityReceived?.toNumber()).toBe(12.5);
    expect(frm.quantityRefused?.toNumber()).toBe(7);

    // A StatusLog object is created
    const logs = await prisma.statusLog.findMany({
      where: { form: { id: frm.id }, user: { id: recipient.id } }
    });
    expect(logs.length).toBe(1);
    expect(logs[0].status).toBe("ACCEPTED");

    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject:
          "Le déchet de l’entreprise company_1 a été partiellement refusé à réception",
        to: [
          { email: emitter.email, name: emitter.name },
          { email: emitter2.email, name: emitter2.name }
        ],
        cc: [
          { email: recipient.email, name: recipient.name },
          { email: recipient2.email, name: recipient2.name }
        ]
      })
    );
  });

  test.each(allowedFormats)(
    "%p should be a valid format for signedAt",
    async f => {
      const owner = await userFactory();
      const { user, company: destination } = await userWithCompanyFactory(
        UserRole.MEMBER,
        {
          companyTypes: { set: [CompanyType.WASTEPROCESSOR] }
        }
      );

      const form = await formFactory({
        ownerId: owner.id,
        opt: {
          status: Status.RECEIVED,
          receivedBy: "Bill",
          recipientCompanySiret: destination.siret,
          receivedAt: new Date("2019-01-17")
        }
      });

      const { mutate } = makeClient(user);

      const signedAt = new Date("2019-01-18");

      await mutate(MARK_AS_ACCEPTED, {
        variables: {
          id: form.id,
          acceptedInfo: {
            signedAt: format(signedAt, f),
            signedBy: "Bill",
            wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
            quantityReceived: 11,
            quantityRefused: 0
          }
        }
      });

      const acceptedForm = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });

      expect(acceptedForm.status).toBe(Status.ACCEPTED);
      expect(acceptedForm.signedAt).toEqual(signedAt);
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
        status: Status.RECEIVED,
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
      mutate<Pick<Mutation, "markAsAccepted">, MutationMarkAsAcceptedArgs>(
        MARK_AS_ACCEPTED,
        {
          variables: {
            id: groupementForm.id,
            acceptedInfo: {
              wasteAcceptationStatus: "REFUSED",
              wasteRefusalReason: "Parce que",
              signedAt: "2019-01-18" as any,
              signedBy: "John",
              quantityReceived: 0,
              quantityRefused: 0
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

    const groupement = await prisma.form
      .findUniqueOrThrow({
        where: { id: groupementForm.id }
      })
      .grouping({ include: { initialForm: true } });

    const appendix2Forms = groupement.map(g => g.initialForm);

    expect(appendix2Forms).toEqual([]);
  });

  it("should not allow a temp storer to call markAsAccepted", async () => {
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        recipientCompanySiret: tempStorer.company.siret,
        status: "RECEIVED"
      },
      forwardedInOpts: { recipientCompanySiret: destination.company.siret }
    });
    const { mutate } = makeClient(tempStorer.user);
    const { errors } = await mutate<
      Pick<Mutation, "markAsAccepted">,
      MutationMarkAsAcceptedArgs
    >(MARK_AS_ACCEPTED, {
      variables: {
        id: form.id,
        acceptedInfo: {
          wasteAcceptationStatus: "ACCEPTED",
          quantityReceived: 1,
          quantityRefused: 0,
          signedAt: new Date("2022-01-01").toISOString() as any,
          signedBy: "John Snow"
        }
      }
    });
    expect(errors).toEqual([
      expect.objectContaining({
        message: "Vous n'êtes pas autorisé à marquer ce bordereau comme accepté"
      })
    ]);
  });

  describe("Annexe 1", () => {
    it("should prevent marking an appendix1 item as accepted", async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");

      const appendix1_item = await prisma.form.create({
        data: {
          readableId: getReadableId(),
          status: Status.RECEIVED,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: company.siret,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          },
          owner: { connect: { id: user.id } }
        }
      });

      const { mutate } = makeClient(user);
      const { errors } = await mutate<
        Pick<Mutation, "markAsAccepted">,
        MutationMarkAsAcceptedArgs
      >(MARK_AS_ACCEPTED, {
        variables: {
          id: appendix1_item.id,
          acceptedInfo: {
            wasteAcceptationStatus: "ACCEPTED",
            quantityReceived: 1,
            quantityRefused: 0,
            signedAt: new Date("2022-01-01").toISOString() as any,
            signedBy: "John Snow"
          }
        }
      });

      expect(errors).toEqual([
        expect.objectContaining({
          message:
            "Un bordereau d'annexe 1 ne peut pas avoir être marqué comme accepté. Il suit son bordereau de tournée."
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
          status: Status.RECEIVED,
          emitterType: EmitterType.APPENDIX1_PRODUCER,
          emitterCompanySiret: producerCompany.siret,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          },
          owner: { connect: { id: user.id } }
        }
      });

      const container = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.RECEIVED,
          emitterType: EmitterType.APPENDIX1,
          emitterCompanySiret: company.siret,
          emitterCompanyName: company.name,
          transporters: {
            create: {
              transporterCompanySiret: company.siret,
              number: 1
            }
          },
          recipientCompanySiret: company.siret,
          grouping: {
            create: { initialFormId: appendix1_item.id, quantity: 0 }
          }
        }
      });

      const { mutate } = makeClient(user);
      const { data } = await mutate<
        Pick<Mutation, "markAsAccepted">,
        MutationMarkAsAcceptedArgs
      >(MARK_AS_ACCEPTED, {
        variables: {
          id: container.id,
          acceptedInfo: {
            wasteAcceptationStatus: "ACCEPTED",
            quantityReceived: 1,
            quantityRefused: 0,
            signedAt: new Date("2022-01-01").toISOString() as any,
            signedBy: "Collecteur annexe 1"
          }
        }
      });

      expect(data.markAsAccepted.status).toBe(Status.ACCEPTED);

      const refreshedItem = await prisma.form.findUniqueOrThrow({
        where: { id: appendix1_item.id }
      });
      expect(refreshedItem.status).toBe(Status.ACCEPTED);
    });
  });

  // Bug was "Cannot destructure property 'prepareVariables' of 'mailTemplate' as it is undefined."
  // Use-case:
  // - Create a tmp storage BSD
  // - Temp storer partially accepts the waste
  // - Final destination receives the waste (no acceptation, just receive)
  // - Final destination tries to accept the waste
  // - markAsAccepted detects that waste was partially refused (by tmp storer) and tries to send a mail,
  //   but wasteAcceptationStatus is ACCEPTED, so it cannot find the mail template and crashes
  it("when final destination accepts a BSD (after reception), no mail should be sent even if temp storage partially refused the BSD", async () => {
    // Given
    const emitter = await userWithCompanyFactory("MEMBER");
    const tempStorer = await userWithCompanyFactory("MEMBER");
    const destination = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: emitter.user.id,
      opt: {
        emitterCompanySiret: emitter.company.siret,
        recipientCompanySiret: tempStorer.company.siret,
        status: "RECEIVED",
        wasteAcceptationStatus: "PARTIALLY_REFUSED",
        quantityReceived: 10,
        quantityRefused: 2
      },
      forwardedInOpts: {
        sentAt: new Date(),
        emitterCompanySiret: tempStorer.company.siret,
        recipientCompanySiret: destination.company.siret,
        emittedAt: new Date(),
        status: "RECEIVED",
        receivedAt: new Date(),
        receivedBy: "Toto"
      }
    });

    // When
    const { mutate } = makeClient(destination.user);
    const { data, errors } = await mutate<
      Pick<Mutation, "markAsAccepted">,
      MutationMarkAsAcceptedArgs
    >(MARK_AS_ACCEPTED, {
      variables: {
        id: form.id,
        acceptedInfo: {
          quantityReceived: 10,
          signedAt: new Date("2022-01-01").toISOString() as any,
          signedBy: "Toto",
          wasteAcceptationStatus: "ACCEPTED",
          quantityRefused: 0
        }
      }
    });

    // Then
    expect(errors).toBeUndefined();
    expect(sendMail as jest.Mock).toHaveBeenCalledTimes(0);
    expect(data.markAsAccepted.status).toBe("ACCEPTED");
  });

  describe("Charte citerne", () => {
    it.each(["BENNE", "FUT", "GRV", "PIPELINE", "AUTRE"])(
      "cannot clean citerne if packaging is not citerne (hasCiterneBeenWashedOut = true, type = %p)",
      async type => {
        // When
        const { errors } = await createAndAcceptForm(
          {
            wasteDetailsPackagingInfos: [{ type, quantity: 1 }]
          },
          {
            hasCiterneBeenWashedOut: true
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Vous ne pouvez préciser si la citerne a été rincée si le conditionnement du déchet n'est pas une citerne"
        );
      }
    );

    it.each(["BENNE", "FUT", "GRV", "PIPELINE", "AUTRE"])(
      "cannot clean citerne if packaging is not citerne (hasCiterneBeenWashedOut = false, type = %p)",
      async type => {
        // When
        const { errors } = await createAndAcceptForm(
          {
            wasteDetailsPackagingInfos: [{ type, quantity: 1 }]
          },
          {
            hasCiterneBeenWashedOut: false,
            citerneNotWashedOutReason: CiterneNotWashedOutReason.NOT_BY_DRIVER
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Vous ne pouvez préciser si la citerne a été rincée si le conditionnement du déchet n'est pas une citerne"
        );
      }
    );

    it.each([
      WasteAcceptationStatus.PARTIALLY_REFUSED,
      WasteAcceptationStatus.REFUSED
    ])(
      "cannot clean citerne if waste acceptation status is not ACCEPTED (status = %p)",
      async wasteAcceptationStatus => {
        // When
        const { errors } = await createAndAcceptForm(
          {},
          {
            hasCiterneBeenWashedOut: true,
            wasteAcceptationStatus,
            wasteRefusalReason: "Parce que"
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Vous ne pouvez préciser si la citerne a été rincée que si le déchet a été totalement accepté"
        );
      }
    );

    it("can accept a waste without specifying citerne washing status", async () => {
      // When
      const { errors, form } = await createAndAcceptForm({}, {});

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.hasCiterneBeenWashedOut).toBeNull();
      expect(form.citerneNotWashedOutReason).toBeNull();
    });

    it("can accept a waste and wash out citerne", async () => {
      // When
      const { errors, form } = await createAndAcceptForm(
        {},
        {
          hasCiterneBeenWashedOut: true
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.hasCiterneBeenWashedOut).toBe(true);
      expect(form.citerneNotWashedOutReason).toBeNull();
    });

    it.each([true, undefined, null])(
      "cannot only give a reason for not washing if citerne has not been washed out (hasCiterneBeenWashedOut = %p)",
      async hasCiterneBeenWashedOut => {
        // When
        const { errors } = await createAndAcceptForm(
          {},
          {
            hasCiterneBeenWashedOut,
            citerneNotWashedOutReason: CiterneNotWashedOutReason.EXEMPTED
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Vous ne pouvez préciser de raison pour l'absence de rinçage que si la citerne n'a pas été rincée"
        );
      }
    );

    it("if didn't wash out citerne, must give a reason why", async () => {
      // When
      const { errors } = await createAndAcceptForm(
        {},
        {
          hasCiterneBeenWashedOut: false
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous devez préciser la raison pour laquelle la citerne n'a pas été rincée"
      );
    });

    it("can accept a waste and not wash out citerne, if providing a reason", async () => {
      // When
      const { errors, form } = await createAndAcceptForm(
        {},
        {
          hasCiterneBeenWashedOut: false,
          citerneNotWashedOutReason: CiterneNotWashedOutReason.EXEMPTED
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.hasCiterneBeenWashedOut).toBe(false);
      expect(form.citerneNotWashedOutReason).toBe(
        CiterneNotWashedOutReason.EXEMPTED
      );
    });
  });

  describe("Empty return ADR", () => {
    it.each(["FUT", "GRV", "PIPELINE", "AUTRE"])(
      "cannot specify empty return if packaging is not citerne or benne (type = %p)",
      async type => {
        // When
        const { errors } = await createAndAcceptForm(
          {
            wasteDetailsPackagingInfos: [{ type, quantity: 1 }]
          },
          {
            emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Vous ne pouvez pas préciser de retour à vide ADR si le conditionnement du déchet n'est pas une citerne ou une benne"
        );
      }
    );

    it.each([
      WasteAcceptationStatus.PARTIALLY_REFUSED,
      WasteAcceptationStatus.REFUSED
    ])(
      "cannot specify empty return if wasteStatus is not ACCEPTED (status = %p)",
      async wasteAcceptationStatus => {
        // When
        const { errors } = await createAndAcceptForm(
          {},
          {
            emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE,
            wasteAcceptationStatus,
            wasteRefusalReason: "Parce que"
          }
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "Vous ne pouvez préciser de retour à vide ADR que si le déchet a été totalement accepté"
        );
      }
    );

    it("cannot specify empty return if waste is not dangerous", async () => {
      // When
      const { errors } = await createAndAcceptForm(
        {
          wasteDetailsCode: "05 01 04",
          wasteDetailsPop: false,
          wasteDetailsIsDangerous: false
        },
        {
          emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
        }
      );

      // Then
      expect(errors).not.toBeUndefined();
      expect(errors[0].message).toBe(
        "Vous ne pouvez préciser de retour à vide ADR que si le déchet est dangereux"
      );
    });

    it("can specify empty return if waste is dangerous (wasteDetailsCode)", async () => {
      // When
      const { errors, form } = await createAndAcceptForm(
        {
          wasteDetailsCode: "05 01 04*",
          wasteDetailsPop: false,
          wasteDetailsIsDangerous: false
        },
        {
          emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.emptyReturnADR).toBe(EmptyReturnADR.EMPTY_CITERNE);
    });

    it("can specify empty return if waste is dangerous (wasteDetailsPop)", async () => {
      // When
      const { errors, form } = await createAndAcceptForm(
        {
          wasteDetailsCode: "05 01 04",
          wasteDetailsPop: true,
          wasteDetailsIsDangerous: false
        },
        {
          emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.emptyReturnADR).toBe(EmptyReturnADR.EMPTY_CITERNE);
    });

    it("can specify empty return if waste is dangerous (wasteDetailsIsDangerous)", async () => {
      // When
      const { errors, form } = await createAndAcceptForm(
        {
          wasteDetailsCode: "05 01 04",
          wasteDetailsPop: false,
          wasteDetailsIsDangerous: true
        },
        {
          emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.emptyReturnADR).toBe(EmptyReturnADR.EMPTY_CITERNE);
    });

    it("can accept a waste without specifying empty return ADR", async () => {
      // When
      const { errors, form } = await createAndAcceptForm({}, {});

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.emptyReturnADR).toBeNull();
    });

    it("can accept a waste and specify empty return", async () => {
      // When
      const { errors, form } = await createAndAcceptForm(
        {},
        {
          emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
        }
      );

      // Then
      expect(errors).toBeUndefined();
      expect(form.status).toBe("ACCEPTED");
      expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
      expect(form.emptyReturnADR).toBe(EmptyReturnADR.EMPTY_CITERNE);
    });

    it.each([TransportMode.ROAD, null, undefined])(
      "can accept a waste and specify empty return if transporter mode is ROAD or null (value = %p)",
      async transporterTransportMode => {
        // When
        const { company: transporter } = await userWithCompanyFactory("MEMBER");
        const { errors, form } = await createAndAcceptForm(
          {
            transporters: {
              create: {
                transporterCompanySiret: transporter.siret,
                transporterTransportMode,
                number: 1
              }
            }
          },
          {
            emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
          }
        );

        // Then
        expect(errors).toBeUndefined();
        expect(form.status).toBe("ACCEPTED");
        expect(form.wasteAcceptationStatus).toBe("ACCEPTED");
        expect(form.emptyReturnADR).toBe(EmptyReturnADR.EMPTY_CITERNE);
      }
    );
  });

  it("can NOT accept a waste and specify empty return if transporter mode is not ROAD nor null", async () => {
    // When
    const { company: transporter } = await userWithCompanyFactory("MEMBER");
    const { errors } = await createAndAcceptForm(
      {
        transporters: {
          create: {
            transporterCompanySiret: transporter.siret,
            transporterTransportMode: TransportMode.AIR,
            number: 1
          }
        }
      },
      {
        emptyReturnADR: EmptyReturnADR.EMPTY_CITERNE
      }
    );

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "Vous ne pouvez préciser de retour à vide ADR que si le mode de transport est route (ROAD) ou null"
    );
  });

  describe("quantityRefused", () => {
    const createBSDD = async (opt?) => {
      const {
        emitterCompany,
        recipient,
        recipientCompany,
        form: initialForm
      } = await prepareDB();

      const form = await prisma.form.update({
        where: { id: initialForm.id },
        data: {
          status: "RECEIVED",
          receivedBy: "Bill",
          receivedAt: new Date("2019-01-17T10:22:00+0100"),
          createdAt: new Date("2025-03-20"),
          ...opt
        }
      });

      await prepareRedis({
        emitterCompany,
        recipientCompany
      });

      return { recipient, form };
    };

    const markBSDDAsAccepted = async (
      recipient: User,
      formId: string,
      wasteAcceptationStatus: WasteAcceptationStatus,
      quantityReceived: number,
      quantityRefused: number | null,
      wasteRefusalReason?: string | null
    ) => {
      const { mutate } = makeClient(recipient);
      return await mutate(MARK_AS_ACCEPTED, {
        variables: {
          id: formId,
          acceptedInfo: {
            signedAt: "2019-01-17T10:22:00+0100",
            signedBy: "Bill",
            wasteAcceptationStatus,
            wasteRefusalReason,
            quantityReceived,
            quantityRefused
          }
        }
      });
    };

    describe("wasteAcceptationStatus = ACCEPTED", () => {
      it("waste should be accepted", async () => {
        // Given
        const { recipient, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          recipient,
          form.id,
          "ACCEPTED",
          11,
          0
        );

        // Then
        expect(errors).toBeUndefined();
        const acceptedForm = await prisma.form.findUniqueOrThrow({
          where: { id: form.id }
        });
        expect(acceptedForm.quantityReceived?.toNumber()).toEqual(11);
        expect(acceptedForm.quantityRefused?.toNumber()).toEqual(0);
        expect(acceptedForm.wasteAcceptationStatus).toBe("ACCEPTED");
        expect(acceptedForm.status).toBe("ACCEPTED");
      });

      it("quantityRefused cannot be > 0", async () => {
        // Given
        const { recipient, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          recipient,
          form.id,
          "ACCEPTED",
          11,
          5
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "La quantité refusée (quantityRefused) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)"
        );
      });
    });

    describe("wasteAcceptationStatus = REFUSED", () => {
      it("waste should be refused", async () => {
        // Given
        const { recipient, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          recipient,
          form.id,
          "REFUSED",
          11,
          11,
          "Pas bon"
        );

        // Then
        expect(errors).toBeUndefined();
        const acceptedForm = await prisma.form.findUniqueOrThrow({
          where: { id: form.id }
        });
        expect(acceptedForm.quantityReceived?.toNumber()).toEqual(11);
        expect(acceptedForm.quantityRefused?.toNumber()).toEqual(11);
        expect(acceptedForm.wasteAcceptationStatus).toBe("REFUSED");
        expect(acceptedForm.status).toBe("REFUSED");
      });

      it("quantityRefused cannot be != quantityReceived", async () => {
        // Given
        const { recipient, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          recipient,
          form.id,
          "REFUSED",
          11,
          5,
          "Pas bon"
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "La quantité refusée (quantityRefused) doit être égale à la quantité reçue (quantityReceived) si le déchet est refusé (REFUSED)"
        );
      });
    });

    describe("wasteAcceptationStatus = PARTIALLY_REFUSED", () => {
      it("waste should be partially refused", async () => {
        // Given
        const { recipient, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          recipient,
          form.id,
          "PARTIALLY_REFUSED",
          11,
          6,
          "Pas bon"
        );

        // Then
        expect(errors).toBeUndefined();
        const acceptedForm = await prisma.form.findUniqueOrThrow({
          where: { id: form.id }
        });
        expect(acceptedForm.quantityReceived?.toNumber()).toEqual(11);
        expect(acceptedForm.quantityRefused?.toNumber()).toEqual(6);
        expect(acceptedForm.wasteAcceptationStatus).toBe("PARTIALLY_REFUSED");
        expect(acceptedForm.status).toBe("ACCEPTED");
      });

      it("quantityRefused cannot be = quantityReceived", async () => {
        // Given
        const { recipient, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          recipient,
          form.id,
          "PARTIALLY_REFUSED",
          11,
          11,
          "Pas bon"
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
        );
      });

      it("quantityRefused cannot be zero", async () => {
        // Given
        const { recipient, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          recipient,
          form.id,
          "PARTIALLY_REFUSED",
          11,
          0,
          "Pas bon"
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
        );
      });
    });
  });
});
