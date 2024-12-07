import { format } from "date-fns";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { ErrorCode } from "../../../../common/errors";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { allowedFormats } from "../../../../common/dates";
import { CompanyType, Status, UserRole } from "@prisma/client";
import { Mutation, MutationMarkAsTempStoredArgs } from "@td/codegen-back";
import getReadableId from "../../../readableId";
import { sendMail } from "../../../../mailer/mailing";
import { generateBsddPdfToBase64 } from "../../../pdf/generateBsddPdf";
import gql from "graphql-tag";
import { waitForJobsCompletion } from "../../../../queue/helpers";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

jest.mock("../../../pdf/generateBsddPdf");
(generateBsddPdfToBase64 as jest.Mock).mockResolvedValue("");

const MARK_AS_TEMP_STORED = gql`
  mutation MarkAsTempStored($id: ID!, $tempStoredInfos: TempStoredFormInput!) {
    markAsTempStored(id: $id, tempStoredInfos: $tempStoredInfos) {
      id
      status
      temporaryStorageDetail {
        wasteDetails {
          quantity
        }
      }
    }
  }
`;

describe("{ mutation { markAsTempStored } }", () => {
  afterEach(() => resetDatabase());

  test("it fails when form is not SENT", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "DRAFT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { ownerId: user.id, readableId: getReadableId() }
        }
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  test("the temp storer of the BSD can mark it as TEMP_STORED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("TEMP_STORED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORED"
      }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the temp storer of the BSD can mark it as TEMP_STORER_ACCEPTED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORER_ACCEPTED"
      }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("should leave the signature date empty when not provided", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );
    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    const { mutate } = makeClient(user);
    await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    const updatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(updatedForm.signedAt).toBeNull();
  });

  test("the temp storer of the BSD can mark it as REFUSED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Thats isn't what I was expecting man !",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 0,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("REFUSED");

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "REFUSED"
      }
    });
    expect(statusLogs.length).toEqual(1);
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject:
          "Le déchet de l’entreprise WASTE PRODUCER a été totalement refusé à réception"
      })
    );
  });

  it("should not be possible to mark a BSD as temp stored if recipientIsTempStorage != true", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: false,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Ce bordereau ne peut pas être marqué comme entreposé provisoirement car le destinataire " +
        "n'a pas été identifié comme étant une installation d'entreposage provisoire ou de reconditionnement"
    );
    expect(errors[0].extensions?.code).toEqual(ErrorCode.BAD_USER_INPUT);
  });

  test.each(allowedFormats)(
    "%p should be a valid format for receivedAt",
    async f => {
      const { user, company: tempStorerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      const emitterCompany = await companyFactory();

      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.SENT,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: tempStorerCompany.siret,
          recipientIsTempStorage: true,
          forwardedIn: {
            create: { readableId: getReadableId(), ownerId: user.id }
          }
        }
      });

      const { mutate } = makeClient(user);

      const receivedAt = new Date("2019-10-04");

      await mutate(MARK_AS_TEMP_STORED, {
        variables: {
          id: form.id,
          tempStoredInfos: {
            receivedBy: "John Doe",
            receivedAt: format(receivedAt, f),
            quantityReceived: 2.4,
            quantityType: "REAL"
          }
        }
      });

      const formAfterMutation = await prisma.form.findUniqueOrThrow({
        where: { id: form.id }
      });

      expect(formAfterMutation.status).toEqual(Status.TEMP_STORED);
      expect(formAfterMutation.receivedAt).toEqual(receivedAt);
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

    const groupementForm = await formWithTempStorageFactory({
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
      mutate<Pick<Mutation, "markAsReceived">, MutationMarkAsTempStoredArgs>(
        MARK_AS_TEMP_STORED,
        {
          variables: {
            id: groupementForm.id,
            tempStoredInfos: {
              wasteAcceptationStatus: "REFUSED",
              wasteRefusalReason: "Parce que",
              receivedAt: "2019-01-18" as any,
              receivedBy: "John",
              quantityType: "REAL",
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

    const groupement = await prisma.form
      .findUniqueOrThrow({
        where: { id: groupementForm.id }
      })
      .grouping({ include: { initialForm: true } });

    const appendix2Forms = groupement.map(g => g.initialForm);
    expect(appendix2Forms).toEqual([]);
  });

  it("should not be possible to mark a BSD as temp stored if it's canceled", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.CANCELED,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 2.4,
          quantityType: "REAL"
        }
      }
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  test("the temp storer of the BSD can mark it as ACCEPTED and specify quantityRefused = 0", async () => {
    // Given
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();
    const forwardedFormReadableId = getReadableId();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: forwardedFormReadableId, ownerId: user.id }
        }
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "markAsTempStored">>(
      MARK_AS_TEMP_STORED,
      {
        variables: {
          id: form.id,
          tempStoredInfos: {
            wasteAcceptationStatus: "ACCEPTED",
            receivedBy: "John Doe",
            receivedAt: "2018-12-11T00:00:00.000Z",
            signedAt: "2018-12-11T00:00:00.000Z",
            quantityReceived: 10,
            quantityRefused: 0,
            quantityType: "REAL"
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(
      data.markAsTempStored?.temporaryStorageDetail?.wasteDetails?.quantity
    ).toEqual(10);

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");
    expect(formAfterMutation.wasteAcceptationStatus).toEqual("ACCEPTED");
    expect(formAfterMutation.quantityReceived?.toNumber()).toEqual(10);
    expect(formAfterMutation.quantityRefused?.toNumber()).toEqual(0);

    const forwardedFormAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { readableId: forwardedFormReadableId }
    });

    expect(forwardedFormAfterMutation.wasteDetailsQuantity?.toNumber()).toEqual(
      10
    );

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORER_ACCEPTED"
      }
    });
    expect(statusLogs.length).toEqual(1);
  });

  test("the temp storer of the BSD cannot mark it as ACCEPTED and specify quantityRefused != 0", async () => {
    // Given
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();
    const forwardedFormReadableId = getReadableId();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: forwardedFormReadableId, ownerId: user.id }
        }
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "ACCEPTED",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 10,
          quantityRefused: 5,
          quantityType: "REAL"
        }
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "La quantité refusée (quantityRefused) ne peut être supérieure à zéro si le déchet est accepté (ACCEPTED)"
    );
  });

  test("the temp storer of the BSD can mark it as REFUSED and specify quantityRefused = quantityReceived", async () => {
    // Given
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();
    const forwardedFormReadableId = getReadableId();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: forwardedFormReadableId, ownerId: user.id }
        }
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "markAsTempStored">>(
      MARK_AS_TEMP_STORED,
      {
        variables: {
          id: form.id,
          tempStoredInfos: {
            wasteAcceptationStatus: "REFUSED",
            wasteRefusalReason: "Thats isn't what I was expecting man !",
            receivedBy: "John Doe",
            receivedAt: "2018-12-11T00:00:00.000Z",
            signedAt: "2018-12-11T00:00:00.000Z",
            quantityReceived: 10,
            quantityRefused: 10,
            quantityType: "REAL"
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(
      data.markAsTempStored?.temporaryStorageDetail?.wasteDetails?.quantity
    ).toEqual(null);

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("REFUSED");
    expect(formAfterMutation.wasteAcceptationStatus).toEqual("REFUSED");
    expect(formAfterMutation.quantityReceived?.toNumber()).toEqual(10);
    expect(formAfterMutation.quantityRefused?.toNumber()).toEqual(10);

    const forwardedFormAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { readableId: forwardedFormReadableId }
    });

    expect(forwardedFormAfterMutation.wasteDetailsQuantity).toEqual(null);

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "REFUSED"
      }
    });
    expect(statusLogs.length).toEqual(1);
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `Le déchet de l’entreprise ${form.emitterCompanyName} a été totalement refusé à réception`
      })
    );
  });

  test("the temp storer of the BSD cannot mark it as REFUSED and specify quantityRefused != quantityReceived", async () => {
    // Given
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();
    const forwardedFormReadableId = getReadableId();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: forwardedFormReadableId, ownerId: user.id }
        }
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_TEMP_STORED, {
      variables: {
        id: form.id,
        tempStoredInfos: {
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Thats isn't what I was expecting man !",
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 10,
          quantityRefused: 5,
          quantityType: "REAL"
        }
      }
    });

    // Then
    expect(errors).not.toBeUndefined();
    expect(errors[0].message).toBe(
      "La quantité refusée (quantityRefused) doit être égale à la quantité reçue (quantityReceived) si le déchet est refusé (REFUSED)"
    );
  });

  test("the temp storer of the BSD can mark it as PARTIALLY_REFUSED and specify quantityRefused", async () => {
    // Given
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();
    const forwardedFormReadableId = getReadableId();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: forwardedFormReadableId, ownerId: user.id }
        }
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "markAsTempStored">>(
      MARK_AS_TEMP_STORED,
      {
        variables: {
          id: form.id,
          tempStoredInfos: {
            wasteAcceptationStatus: "PARTIALLY_REFUSED",
            wasteRefusalReason: "Thats isn't what I was expecting man !",
            receivedBy: "John Doe",
            receivedAt: "2018-12-11T00:00:00.000Z",
            signedAt: "2018-12-11T00:00:00.000Z",
            quantityReceived: 10,
            quantityRefused: 7,
            quantityType: "REAL"
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(
      data.markAsTempStored?.temporaryStorageDetail?.wasteDetails?.quantity
    ).toEqual(3);

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");
    expect(formAfterMutation.wasteAcceptationStatus).toEqual(
      "PARTIALLY_REFUSED"
    );
    expect(formAfterMutation.quantityReceived?.toNumber()).toEqual(10);
    expect(formAfterMutation.quantityRefused?.toNumber()).toEqual(7);

    const forwardedFormAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { readableId: forwardedFormReadableId }
    });

    expect(forwardedFormAfterMutation.wasteDetailsQuantity?.toNumber()).toEqual(
      3
    );

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORER_ACCEPTED"
      }
    });
    expect(statusLogs.length).toEqual(1);
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `Le déchet de l’entreprise ${form.emitterCompanyName} a été partiellement refusé à réception`,
        body: expect.stringContaining(`<li>Quantité réelle présentée nette : 10 tonnes</li>
    <li>Quantité refusée nette : 7 tonnes</li>
    <li>Quantité acceptée nette : 3 tonnes</li>`)
      })
    );
  });

  test("[legacy] the temp storer of the BSD can mark it as PARTIALLY_REFUSED with quantityRefused = undefined", async () => {
    // Given
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "SENT",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    // When
    const { mutate } = makeClient(user);
    const { errors, data } = await mutate<Pick<Mutation, "markAsTempStored">>(
      MARK_AS_TEMP_STORED,
      {
        variables: {
          id: form.id,
          tempStoredInfos: {
            wasteAcceptationStatus: "PARTIALLY_REFUSED",
            wasteRefusalReason: "Thats isn't what I was expecting man !",
            receivedBy: "John Doe",
            receivedAt: "2018-12-11T00:00:00.000Z",
            signedAt: "2018-12-11T00:00:00.000Z",
            quantityReceived: 10,
            quantityType: "REAL"
          }
        }
      }
    );

    // Then
    expect(errors).toBeUndefined();
    expect(
      data.markAsTempStored?.temporaryStorageDetail?.wasteDetails?.quantity
    ).toEqual(10);

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");
    expect(formAfterMutation.wasteAcceptationStatus).toEqual(
      "PARTIALLY_REFUSED"
    );
    expect(formAfterMutation.quantityReceived?.toNumber()).toEqual(10);
    expect(formAfterMutation.quantityRefused).toBeNull();

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: form.id },
        user: { id: user.id },
        status: "TEMP_STORER_ACCEPTED"
      }
    });
    expect(statusLogs.length).toEqual(1);
    expect(sendMail as jest.Mock).toHaveBeenCalledWith(
      expect.objectContaining({
        subject: `Le déchet de l’entreprise ${form.emitterCompanyName} a été partiellement refusé à réception`,
        body: expect.stringContaining(`<li>Quantité réelle présentée nette : 10 tonnes</li>
    <li>Quantité refusée nette : Non renseignée</li>
    <li>Quantité acceptée nette : Non renseignée</li>`)
      })
    );
  });
});
