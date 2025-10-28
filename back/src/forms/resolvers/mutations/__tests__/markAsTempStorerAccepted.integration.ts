import { format } from "date-fns";
import {
  userWithCompanyFactory,
  formFactory,
  companyFactory,
  formWithTempStorageFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { prisma } from "@td/prisma";
import { allowedFormats } from "../../../../common/dates";
import {
  CompanyType,
  Status,
  User,
  UserRole,
  WasteAcceptationStatus
} from "@td/prisma";
import type {
  Mutation,
  MutationMarkAsTempStorerAcceptedArgs
} from "@td/codegen-back";
import getReadableId from "../../../readableId";
import { sendMail } from "../../../../mailer/mailing";
import { generateBsddPdfToBase64 } from "../../../pdf/generateBsddPdf";
import { waitForJobsCompletion } from "../../../../queue/helpers";
import { updateAppendix2Queue } from "../../../../queue/producers/updateAppendix2";

// No mails
jest.mock("../../../../mailer/mailing");
(sendMail as jest.Mock).mockImplementation(() => Promise.resolve());

jest.mock("../../../pdf/generateBsddPdf");
(generateBsddPdfToBase64 as jest.Mock).mockResolvedValue("");

const MARK_AS_TEMP_STORER_ACCEPTED = `
    mutation MarkAsTempStorerAccepted($id: ID!, $tempStorerAcceptedInfo: TempStorerAcceptedFormInput!){
      markAsTempStorerAccepted(id: $id, tempStorerAcceptedInfo: $tempStorerAcceptedInfo){
        id
        status
      }
    }
  `;

describe("{ mutation { markAsTempStorerAccepted } }", () => {
  afterEach(() => resetDatabase());

  test("it fails when form is not TEMP_STORED", async () => {
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
          create: { readableId: getReadableId(), ownerId: user.id }
        }
      }
    });

    const { mutate } = makeClient(user);

    const { errors } = await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          signedAt: "2018-12-11T00:00:00.000Z",
          signedBy: "John Doe",
          quantityReceived: 2.4,
          quantityRefused: 0,
          quantityType: "REAL"
        }
      }
    });
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toEqual(
      "Vous ne pouvez pas passer ce bordereau à l'état souhaité."
    );
  });

  test("the temp storer of the BSD can mark it as TEMP_STORER_ACCEPTED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "TEMP_STORED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        },
        receivedBy: "John Doe",
        receivedAt: "2018-12-11T00:00:00.000Z"
      }
    });

    const { mutate } = makeClient(user);

    await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: "ACCEPTED",
          wasteRefusalReason: "",
          signedAt: "2018-12-11T00:00:00.000Z",
          signedBy: "John Doe",
          quantityReceived: 2.4,
          quantityRefused: 0,
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

  test("the temp storer of the BSD can mark it as REFUSED", async () => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: "TEMP_STORED",
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        },
        receivedBy: "John Doe",
        receivedAt: "2018-12-11T00:00:00.000Z"
      }
    });

    const { mutate } = makeClient(user);
    const { errors } = await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: "REFUSED",
          wasteRefusalReason: "Thats isn't what I was expecting man !",
          signedBy: "John Doe",
          signedAt: "2018-12-11T00:00:00.000Z",
          quantityReceived: 1,
          quantityRefused: 1,
          quantityType: "REAL"
        }
      }
    });

    expect(errors).toBeUndefined();
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

  test.each(allowedFormats)("%p is a valid format for signedAt", async f => {
    const { user, company: tempStorerCompany } = await userWithCompanyFactory(
      "MEMBER"
    );

    const emitterCompany = await companyFactory();

    const form = await formFactory({
      ownerId: user.id,
      opt: {
        status: Status.TEMP_STORED,
        emitterCompanySiret: emitterCompany.siret,
        recipientCompanySiret: tempStorerCompany.siret,
        recipientIsTempStorage: true,
        forwardedIn: {
          create: { readableId: getReadableId(), ownerId: user.id }
        },
        receivedBy: "John Doe",
        receivedAt: "2018-12-11T00:00:00.000Z"
      }
    });

    const { mutate } = makeClient(user);

    const signedAt = new Date("2018-12-11");

    await mutate(MARK_AS_TEMP_STORER_ACCEPTED, {
      variables: {
        id: form.id,
        tempStorerAcceptedInfo: {
          wasteAcceptationStatus: WasteAcceptationStatus.ACCEPTED,
          wasteRefusalReason: "",
          signedAt: format(signedAt, f),
          signedBy: "John Doe",
          quantityReceived: 2.4,
          quantityRefused: 0,
          quantityType: "REAL"
        }
      }
    });

    const formAfterMutation = await prisma.form.findUniqueOrThrow({
      where: { id: form.id }
    });

    expect(formAfterMutation.status).toEqual(Status.TEMP_STORER_ACCEPTED);
    expect(formAfterMutation.signedAt).toEqual(signedAt);
  });

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
        status: Status.TEMP_STORED,
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
      mutate<
        Pick<Mutation, "markAsReceived">,
        MutationMarkAsTempStorerAcceptedArgs
      >(MARK_AS_TEMP_STORER_ACCEPTED, {
        variables: {
          id: groupementForm.id,
          tempStorerAcceptedInfo: {
            wasteAcceptationStatus: "REFUSED",
            wasteRefusalReason: "Parce que",
            signedAt: "2019-01-18" as any,
            signedBy: "John",
            quantityType: "REAL",
            quantityReceived: 0,
            quantityRefused: 0
          }
        }
      });

    await waitForJobsCompletion({
      queue: updateAppendix2Queue,
      fn: mutateFn,
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

  describe("quantityRefused", () => {
    const createBSDD = async (opt?) => {
      const { user, company: tempStorerCompany } = await userWithCompanyFactory(
        "MEMBER"
      );

      const emitterCompany = await companyFactory();
      const form = await formFactory({
        ownerId: user.id,
        opt: {
          status: Status.TEMP_STORED,
          emitterCompanySiret: emitterCompany.siret,
          recipientCompanySiret: tempStorerCompany.siret,
          recipientIsTempStorage: true,
          forwardedIn: {
            create: { readableId: getReadableId(), ownerId: user.id }
          },
          receivedBy: "John Doe",
          receivedAt: "2018-12-11T00:00:00.000Z",
          createdAt: new Date("2025-03-20"),
          ...opt
        }
      });

      return { user, form };
    };

    const markBSDDAsAccepted = async (
      user: User,
      formId: string,
      wasteAcceptationStatus: WasteAcceptationStatus,
      quantityReceived: number,
      quantityRefused: number | null,
      wasteRefusalReason?: string | null
    ) => {
      const { mutate } = makeClient(user);
      return await mutate<Pick<Mutation, "markAsTempStorerAccepted">>(
        MARK_AS_TEMP_STORER_ACCEPTED,
        {
          variables: {
            id: formId,
            tempStorerAcceptedInfo: {
              wasteAcceptationStatus,
              wasteRefusalReason,
              signedAt: "2019-01-18" as any,
              signedBy: "John Doe",
              quantityReceived,
              quantityRefused,
              quantityType: "REAL"
            }
          }
        }
      );
    };

    describe("wasteAcceptationStatus = ACCEPTED", () => {
      it("waste should be accepted", async () => {
        // Given
        const { user, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          user,
          form.id,
          WasteAcceptationStatus.ACCEPTED,
          2.4,
          0
        );

        // Then
        expect(errors).toBeUndefined();

        const formAfterMutation = await prisma.form.findUniqueOrThrow({
          where: { id: form.id }
        });

        expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");
        expect(formAfterMutation.wasteAcceptationStatus).toEqual("ACCEPTED");
        expect(formAfterMutation.quantityReceived?.toNumber()).toEqual(2.4);
        expect(formAfterMutation.quantityRefused?.toNumber()).toEqual(0);

        const forwardedFormAfterMutation = await prisma.form.findUniqueOrThrow({
          where: { id: form.forwardedIn?.id }
        });

        expect(
          forwardedFormAfterMutation.wasteDetailsQuantity?.toNumber()
        ).toEqual(2.4);
      });

      it("quantityRefused must be zero", async () => {
        // Given
        const { user, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          user,
          form.id,
          WasteAcceptationStatus.ACCEPTED,
          2.4,
          1
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
        const { user, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          user,
          form.id,
          WasteAcceptationStatus.REFUSED,
          2.4,
          2.4,
          "Pas bon"
        );

        // Then
        expect(errors).toBeUndefined();

        const formAfterMutation = await prisma.form.findUniqueOrThrow({
          where: { id: form.id }
        });

        expect(formAfterMutation.status).toEqual("REFUSED");
        expect(formAfterMutation.wasteAcceptationStatus).toEqual("REFUSED");
        expect(formAfterMutation.quantityReceived?.toNumber()).toEqual(2.4);
        expect(formAfterMutation.quantityRefused?.toNumber()).toEqual(2.4);

        const forwardedFormAfterMutation = await prisma.form.findUniqueOrThrow({
          where: { id: form.forwardedIn?.id }
        });

        expect(
          forwardedFormAfterMutation.wasteDetailsQuantity?.toNumber()
        ).toEqual(0);

        expect(sendMail as jest.Mock).toHaveBeenCalledWith(
          expect.objectContaining({
            subject: `Le déchet de l’entreprise ${form.emitterCompanyName} a été totalement refusé à réception`
          })
        );
      });

      it("quantityRefused must = quantityReceived", async () => {
        // Given
        const { user, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          user,
          form.id,
          WasteAcceptationStatus.REFUSED,
          2.4,
          1,
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
        const { user, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          user,
          form.id,
          WasteAcceptationStatus.PARTIALLY_REFUSED,
          2.4,
          1.1,
          "Pas bon"
        );

        // Then
        expect(errors).toBeUndefined();

        const formAfterMutation = await prisma.form.findUniqueOrThrow({
          where: { id: form.id }
        });

        expect(formAfterMutation.status).toEqual("TEMP_STORER_ACCEPTED");
        expect(formAfterMutation.wasteAcceptationStatus).toEqual(
          "PARTIALLY_REFUSED"
        );
        expect(formAfterMutation.quantityReceived?.toNumber()).toEqual(2.4);
        expect(formAfterMutation.quantityRefused?.toNumber()).toEqual(1.1);

        const forwardedFormAfterMutation = await prisma.form.findUniqueOrThrow({
          where: { id: form.forwardedIn?.id }
        });

        expect(
          forwardedFormAfterMutation.wasteDetailsQuantity?.toNumber()
        ).toEqual(1.3);

        // Mail
        expect.objectContaining({
          subject: `Le déchet de l’entreprise ${form.emitterCompanyName} a été partiellement refusé à réception`,
          body: expect.stringContaining(`<li>Quantité réelle présentée nette : 2.4 tonnes</li>
        <li>Quantité refusée nette : 1.1 tonnes</li>
        <li>Quantité acceptée nette : 1.3 tonnes</li>`)
        });
      });

      it("quantityRefused cannot = 0", async () => {
        // Given
        const { user, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          user,
          form.id,
          WasteAcceptationStatus.PARTIALLY_REFUSED,
          2.4,
          0,
          "Pas bon"
        );

        // Then
        expect(errors).not.toBeUndefined();
        expect(errors[0].message).toBe(
          "La quantité refusée (quantityRefused) doit être inférieure à la quantité reçue (quantityReceived) et supérieure à zéro si le déchet est partiellement refusé (PARTIALLY_REFUSED)"
        );
      });

      it("quantityRefused cannot = quantityReceived", async () => {
        // Given
        const { user, form } = await createBSDD();

        // When
        const { errors } = await markBSDDAsAccepted(
          user,
          form.id,
          WasteAcceptationStatus.PARTIALLY_REFUSED,
          2.4,
          2.4,
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
