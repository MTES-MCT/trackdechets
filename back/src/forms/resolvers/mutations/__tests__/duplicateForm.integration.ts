import { Prisma, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import { Mutation } from "../../../../generated/graphql/types";
import prisma from "../../../../prisma";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { xDaysAgo } from "../../../../commands/onboarding.helpers";

const DUPLICATE_FORM = `
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      id
      intermediaries {
        siret
        name
      }
    }
  }
`;

const TODAY = new Date();
const FOUR_DAYS_AGO = xDaysAgo(TODAY, 4);

async function createForm(opt: Partial<Prisma.FormCreateInput> = {}) {
  const emitter = await userWithCompanyFactory("MEMBER");
  const transporter = await userWithCompanyFactory("MEMBER", {
    transporterReceipt: {
      create: {
        receiptNumber: "TRANSPORTER-RECEIPT-NUMBER",
        validityLimit: TODAY.toISOString() as any,
        department: "TRANSPORTER- RECEIPT-DEPARTMENT"
      }
    }
  });
  const transporterReceipt = await prisma.transporterReceipt.findUniqueOrThrow({
    where: { id: transporter.company.transporterReceiptId! }
  });
  const recipient = await userWithCompanyFactory("MEMBER");
  const broker = await userWithCompanyFactory("ADMIN", {
    brokerReceipt: {
      create: {
        receiptNumber: "BROKER-RECEIPT-NUMBER",
        validityLimit: TODAY.toISOString() as any,
        department: "BROKER-RECEIPT-DEPARTMENT"
      }
    }
  });
  const brokerReceipt = await prisma.brokerReceipt.findUniqueOrThrow({
    where: { id: broker.company.brokerReceiptId! }
  });
  const trader = await userWithCompanyFactory("ADMIN", {
    traderReceipt: {
      create: {
        receiptNumber: "TRADER-RECEIPT-NUMBER",
        validityLimit: TODAY.toISOString() as any,
        department: "TRADER-RECEIPT-DEPARTMENT"
      }
    }
  });

  const traderReceipt = await prisma.traderReceipt.findUniqueOrThrow({
    where: { id: trader.company.traderReceiptId! }
  });

  const form = await formFactory({
    ownerId: emitter.user.id,
    opt: {
      emitterCompanySiret: emitter.company.siret,
      emitterCompanyName: emitter.company.name,
      emitterCompanyAddress: emitter.company.address,
      emitterCompanyContact: emitter.company.contact,
      emitterCompanyPhone: emitter.company.contactPhone,
      emitterCompanyMail: emitter.company.contactEmail,
      transporterCompanySiret: transporter.company.siret,
      transporterCompanyName: transporter.company.name,
      transporterCompanyAddress: transporter.company.address,
      transporterCompanyContact: transporter.company.contact,
      transporterCompanyPhone: transporter.company.contactPhone,
      transporterCompanyMail: transporter.company.contactEmail,
      transporterReceipt: transporterReceipt.receiptNumber,
      transporterDepartment: transporterReceipt.department,
      transporterValidityLimit: transporterReceipt.validityLimit,
      recipientCompanySiret: recipient.company.siret,
      recipientCompanyName: recipient.company.name,
      recipientCompanyAddress: recipient.company.address,
      recipientCompanyContact: recipient.company.contact,
      recipientCompanyPhone: recipient.company.contactPhone,
      recipientCompanyMail: recipient.company.contactEmail,
      brokerCompanySiret: broker.company.siret,
      brokerCompanyName: broker.company.name,
      brokerCompanyAddress: broker.company.address,
      brokerCompanyContact: broker.company.contact,
      brokerCompanyPhone: broker.company.contactPhone,
      brokerCompanyMail: broker.company.contactEmail,
      brokerReceipt: brokerReceipt.receiptNumber,
      brokerDepartment: brokerReceipt.department,
      brokerValidityLimit: brokerReceipt.validityLimit,
      traderCompanySiret: trader.company.siret,
      traderCompanyName: trader.company.name,
      traderCompanyAddress: trader.company.address,
      traderCompanyContact: trader.company.contact,
      traderCompanyPhone: trader.company.contactPhone,
      traderCompanyMail: trader.company.contactEmail,
      traderReceipt: traderReceipt.receiptNumber,
      traderDepartment: traderReceipt.department,
      traderValidityLimit: traderReceipt.validityLimit,
      ...opt
    }
  });

  return { form, emitter, transporter, recipient, broker, trader };
}

const validateIntermediariesInputMock = jest.fn();
jest.mock("../../../validation", () => ({
  validateIntermediariesInput: jest.fn((...args) =>
    validateIntermediariesInputMock(...args)
  )
}));

describe("Mutation.duplicateForm", () => {
  beforeEach(() => {
    validateIntermediariesInputMock.mockReset();
  });
  afterEach(() => resetDatabase());

  it.each([
    [
      "",
      {
        transporterNumberPlate: "AB-1234-56",
        transporterCustomInfo: "T001"
      }
    ],
    [
      "with an eco-organisme",
      {
        ecoOrganismeName: "COREPILE",
        ecoOrganismeSiret: siretify(1)
      }
    ]
  ])("should duplicate a form %s", async (_, opt) => {
    const { form, emitter } = await createForm(opt);

    const {
      id,
      emitterType,
      emitterPickupSite,
      emitterIsPrivateIndividual,
      emitterIsForeignShip,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterCompanyOmiNumber,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
      recipientCap,
      recipientProcessingOperation,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      recipientIsTempStorage,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCompanyVatNumber,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterTransportMode,
      transporterIsExemptedOfReceipt,
      wasteDetailsCode,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsParcelNumbers,
      wasteDetailsAnalysisReferences,
      wasteDetailsLandIdentifiers,
      wasteDetailsName,
      wasteDetailsConsistence,
      wasteDetailsSampleNumber,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerReceipt,
      brokerDepartment,
      brokerValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret,
      ...rest
    } = form;

    const expectedSkipped = [
      "createdAt",
      "updatedAt",
      "transporterNumberPlate",
      "readableId",
      "status",
      "emittedBy",
      "emittedAt",
      "emittedByEcoOrganisme",
      "takenOverBy",
      "takenOverAt",
      "sentAt",
      "sentBy",
      "isAccepted",
      "receivedAt",
      "quantityReceived",
      "quantityReceivedType",
      "processingOperationDone",
      "isDeleted",
      "receivedBy",
      "processedBy",
      "processedAt",
      "nextDestinationProcessingOperation",
      "processingOperationDescription",
      "noTraceability",
      "signedByTransporter",
      "customId",
      "wasteAcceptationStatus",
      "wasteRefusalReason",
      "nextDestinationCompanyName",
      "nextDestinationCompanySiret",
      "nextDestinationCompanyAddress",
      "nextDestinationCompanyContact",
      "nextDestinationCompanyPhone",
      "nextDestinationCompanyMail",
      "nextDestinationCompanyCountry",
      "nextDestinationCompanyVatNumber",
      "nextDestinationNotificationNumber",
      "transporterCustomInfo",
      "signedAt",
      "currentTransporterOrgId",
      "nextTransporterOrgId",
      "isImportedFromPaper",
      "signedBy",
      "ownerId",
      "forwardedInId",
      "recipientsSirets",
      "transportersSirets",
      "intermediariesSirets",
      "forwardedIn"
    ];

    // make sure this test breaks when a new field is added to the Form model
    // it will ensure we think of adding necessary fields to the duplicate input
    expect(Object.keys(rest).sort()).toEqual(expectedSkipped.sort());

    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id
        }
      }
    );

    const duplicatedForm = await prisma.form.findUnique({
      where: { id: data.duplicateForm.id }
    });

    expect(duplicatedForm).toMatchObject({
      emitterType,
      emitterPickupSite,
      emitterIsPrivateIndividual,
      emitterIsForeignShip,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      emitterCompanyOmiNumber,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
      recipientCap,
      recipientProcessingOperation,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      recipientIsTempStorage,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterCompanyVatNumber,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterTransportMode,
      transporterIsExemptedOfReceipt,
      wasteDetailsCode,
      wasteDetailsOnuCode,
      wasteDetailsPackagingInfos,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsParcelNumbers,
      wasteDetailsAnalysisReferences,
      wasteDetailsLandIdentifiers,
      wasteDetailsName,
      wasteDetailsConsistence,
      wasteDetailsSampleNumber,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      brokerCompanyName,
      brokerCompanySiret,
      brokerCompanyAddress,
      brokerCompanyContact,
      brokerCompanyPhone,
      brokerCompanyMail,
      brokerReceipt,
      brokerDepartment,
      brokerValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret
    });
  });

  it("should duplicate the temporary storage detail", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const ttr = await companyFactory();
    const destination = await companyFactory();
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret },
      forwardedInOpts: {
        emitterCompanySiret: ttr.siret,
        emitterCompanyName: ttr.name,
        emitterCompanyAddress: ttr.address,
        emitterCompanyContact: ttr.contact,
        emitterCompanyPhone: ttr.contactPhone,
        emitterCompanyMail: ttr.contactEmail,
        recipientCompanySiret: destination.siret,
        recipientCompanyName: destination.name,
        recipientCompanyAddress: destination.address,
        recipientCompanyContact: destination.contact,
        recipientCompanyPhone: destination.contactPhone,
        recipientCompanyMail: destination.contactEmail
      }
    });
    const {
      emitterType,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      recipientCap,
      recipientProcessingOperation,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      wasteDetailsCode,
      wasteDetailsPackagingInfos,
      wasteDetailsOnuCode,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsName,
      wasteDetailsConsistence,
      ...rest
    } = await prisma.form
      .findUniqueOrThrow({ where: { id: form.id } })
      .forwardedIn();

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );
    const duplicatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.duplicateForm.id }
    });
    const duplicatedForwardedIn = await prisma.form
      .findUnique({
        where: {
          id: duplicatedForm.id
        }
      })
      .forwardedIn();

    expect(duplicatedForm.recipientIsTempStorage).toBe(true);
    expect(duplicatedForwardedIn).toMatchObject({
      readableId: `${duplicatedForm.readableId}-suite`,
      emitterType,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      recipientCap,
      recipientProcessingOperation,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      wasteDetailsCode,
      wasteDetailsPackagingInfos,
      wasteDetailsOnuCode,
      wasteDetailsPop,
      wasteDetailsIsDangerous,
      wasteDetailsName,
      wasteDetailsConsistence,
      quantityReceived: null,
      wasteAcceptationStatus: null,
      wasteRefusalReason: null,
      receivedAt: null,
      receivedBy: null,
      signedAt: null,
      signedByTransporter: null,
      signedBy: null
    });

    const expectedSkipped = [
      "id",
      "createdAt",
      "updatedAt",
      "transporterNumberPlate",
      "readableId",
      "status",
      "recipientIsTempStorage",
      "emitterCompanyOmiNumber",
      "emitterIsForeignShip",
      "emitterIsPrivateIndividual",
      "emitterPickupSite",
      "emitterWorkSiteAddress",
      "emitterWorkSiteCity",
      "emitterWorkSiteInfos",
      "emitterWorkSiteName",
      "emitterWorkSitePostalCode",
      "traderCompanyAddress",
      "traderCompanyContact",
      "traderCompanyMail",
      "traderCompanyName",
      "traderCompanyPhone",
      "traderCompanySiret",
      "traderDepartment",
      "traderReceipt",
      "traderValidityLimit",
      "transporterCompanyAddress",
      "transporterCompanyContact",
      "transporterCompanyMail",
      "transporterCompanyName",
      "transporterCompanyPhone",
      "transporterCompanySiret",
      "transporterCompanyVatNumber",
      "transporterDepartment",
      "transporterIsExemptedOfReceipt",
      "transporterReceipt",
      "transporterTransportMode",
      "transporterValidityLimit",
      "wasteDetailsAnalysisReferences",
      "wasteDetailsLandIdentifiers",
      "wasteDetailsParcelNumbers",
      "wasteDetailsQuantity",
      "wasteDetailsQuantityType",
      "wasteDetailsSampleNumber",
      "emittedBy",
      "emittedAt",
      "emittedByEcoOrganisme",
      "takenOverBy",
      "takenOverAt",
      "sentAt",
      "sentBy",
      "isAccepted",
      "receivedAt",
      "quantityReceived",
      "quantityReceivedType",
      "processingOperationDone",
      "isDeleted",
      "receivedBy",
      "processedBy",
      "processedAt",
      "nextDestinationProcessingOperation",
      "processingOperationDescription",
      "noTraceability",
      "signedByTransporter",
      "customId",
      "wasteAcceptationStatus",
      "wasteRefusalReason",
      "nextDestinationCompanyName",
      "nextDestinationCompanySiret",
      "nextDestinationCompanyAddress",
      "nextDestinationCompanyContact",
      "nextDestinationCompanyPhone",
      "nextDestinationCompanyMail",
      "nextDestinationCompanyCountry",
      "nextDestinationCompanyVatNumber",
      "nextDestinationNotificationNumber",
      "transporterCustomInfo",
      "signedAt",
      "currentTransporterOrgId",
      "nextTransporterOrgId",
      "isImportedFromPaper",
      "signedBy",
      "ownerId",
      "forwardedInId",
      "recipientsSirets",
      "transportersSirets",
      "intermediariesSirets",
      "brokerCompanyAddress",
      "brokerCompanyContact",
      "brokerCompanyMail",
      "brokerCompanyName",
      "brokerCompanyPhone",
      "brokerCompanySiret",
      "brokerDepartment",
      "brokerReceipt",
      "brokerValidityLimit",
      "ecoOrganismeName",
      "ecoOrganismeSiret"
    ];

    // make sure this test breaks when a new field is added to the Form model
    // it will ensure we think of adding necessary fields to the duplicate forwardedIn input
    expect(Object.keys(rest).sort()).toEqual(expectedSkipped.sort());
  });

  it("should create a status log", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );

    // check relevant statusLog is created
    const statusLogs = await prisma.statusLog.findMany({
      where: {
        form: { id: data.duplicateForm.id },
        user: { id: user.id },
        status: "DRAFT"
      }
    });

    expect(statusLogs.length).toEqual(1);
    expect(statusLogs[0].loggedAt).toBeTruthy();
  });

  it("should duplicate the intermediary company", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const intermediary = await userWithCompanyFactory(UserRole.MEMBER);
    validateIntermediariesInputMock.mockResolvedValueOnce([
      toIntermediaryCompany(intermediary.company)
    ]);
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        intermediaries: {
          create: [toIntermediaryCompany(intermediary.company)]
        }
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(data.duplicateForm.intermediaries).toEqual([
      expect.objectContaining({
        name: intermediary.company.name,
        siret: intermediary.company.siret
      })
    ]);
  });

  it("should not duplicate nextDestination info", async () => {
    const { user, company } = await userWithCompanyFactory(UserRole.MEMBER);
    const nextDestination = await companyFactory();
    const form = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        nextDestinationProcessingOperation: "R 2",
        nextDestinationCompanySiret: nextDestination.siret,
        nextDestinationCompanyName: nextDestination.name,
        nextDestinationCompanyAddress: nextDestination.address,
        nextDestinationCompanyContact: "John Snow",
        nextDestinationCompanyCountry: "FR",
        nextDestinationCompanyMail: "john.snow@trackdechets.fr",
        nextDestinationCompanyPhone: "00 00 00 00 00",
        nextDestinationCompanyVatNumber: "FRXX"
      }
    });
    const { mutate } = makeClient(user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );
    const duplicatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.duplicateForm.id }
    });
    expect(duplicatedForm.nextDestinationProcessingOperation).toBeNull();
    expect(duplicatedForm.nextDestinationCompanySiret).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyName).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyAddress).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyContact).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyCountry).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyMail).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyPhone).toBeNull();
    expect(duplicatedForm.nextDestinationCompanyVatNumber).toBeNull();
  });

  test("duplicated BSDD should have the updated data when company info changes", async () => {
    const { form, emitter, transporter, recipient, trader, broker } =
      await createForm();

    await prisma.company.update({
      where: { id: emitter.company.id },
      data: {
        name: "UPDATED-EMITTER-NAME",
        address: "UPDATED-EMITTER-ADDRESS",
        contact: "UPDATED-EMITTER-CONTACT",
        contactPhone: "UPDATED-EMITTER-PHONE",
        contactEmail: "UPDATED-EMITTER-MAIL"
      }
    });

    await prisma.company.update({
      where: { id: transporter.company.id },
      data: {
        name: "UPDATED-TRANSPORTER-NAME",
        address: "UPDATED-TRANSPORTER-ADDRESS",
        contact: "UPDATED-TRANSPORTER-CONTACT",
        contactPhone: "UPDATED-TRANSPORTER-PHONE",
        contactEmail: "UPDATED-TRANSPORTER-MAIL"
      }
    });

    await prisma.transporterReceipt.update({
      where: { id: transporter.company.transporterReceiptId! },
      data: {
        receiptNumber: "UPDATED-TRANSPORTER-RECEIPT-NUMBER",
        validityLimit: FOUR_DAYS_AGO.toISOString(),
        department: "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
      }
    });

    await prisma.company.update({
      where: { id: recipient.company.id },
      data: {
        name: "UPDATED-RECIPIENT-NAME",
        address: "UPDATED-RECIPIENT-ADDRESS",
        contact: "UPDATED-RECIPIENT-CONTACT",
        contactPhone: "UPDATED-RECIPIENT-PHONE",
        contactEmail: "UPDATED-RECIPIENT-MAIL"
      }
    });

    await prisma.company.update({
      where: { id: trader.company.id },
      data: {
        name: "UPDATED-TRADER-NAME",
        address: "UPDATED-TRADER-ADDRESS",
        contact: "UPDATED-TRADER-CONTACT",
        contactPhone: "UPDATED-TRADER-PHONE",
        contactEmail: "UPDATED-TRADER-MAIL"
      }
    });

    await prisma.traderReceipt.update({
      where: { id: trader.company.traderReceiptId! },
      data: {
        receiptNumber: "UPDATED-TRADER-RECEIPT-NUMBER",
        validityLimit: FOUR_DAYS_AGO.toISOString(),
        department: "UPDATED-TRADER-RECEIPT-DEPARTMENT"
      }
    });

    await prisma.company.update({
      where: { id: broker.company.id },
      data: {
        name: "UPDATED-BROKER-NAME",
        address: "UPDATED-BROKER-ADDRESS",
        contact: "UPDATED-BROKER-CONTACT",
        contactPhone: "UPDATED-BROKER-PHONE",
        contactEmail: "UPDATED-BROKER-MAIL"
      }
    });

    await prisma.brokerReceipt.update({
      where: { id: broker.company.brokerReceiptId! },
      data: {
        receiptNumber: "UPDATED-BROKER-RECEIPT-NUMBER",
        validityLimit: FOUR_DAYS_AGO.toISOString(),
        department: "UPDATED-BROKER-RECEIPT-DEPARTMENT"
      }
    });

    const { mutate } = makeClient(emitter.user);
    const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );
    const duplicatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.duplicateForm.id }
    });

    expect(duplicatedForm.emitterCompanyName).toEqual("UPDATED-EMITTER-NAME");
    expect(duplicatedForm.emitterCompanyAddress).toEqual(
      "UPDATED-EMITTER-ADDRESS"
    );
    expect(duplicatedForm.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedForm.emitterCompanyMail).toEqual("UPDATED-EMITTER-MAIL");
    expect(duplicatedForm.emitterCompanyPhone).toEqual("UPDATED-EMITTER-PHONE");

    expect(duplicatedForm.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(duplicatedForm.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADDRESS"
    );
    expect(duplicatedForm.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(duplicatedForm.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(duplicatedForm.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );

    expect(duplicatedForm.transporterReceipt).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );
    expect(duplicatedForm.transporterValidityLimit).toEqual(FOUR_DAYS_AGO);
    expect(duplicatedForm.transporterDepartment).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-DEPARTMENT"
    );

    expect(duplicatedForm.recipientCompanyName).toEqual(
      "UPDATED-RECIPIENT-NAME"
    );
    expect(duplicatedForm.recipientCompanyAddress).toEqual(
      "UPDATED-RECIPIENT-ADDRESS"
    );
    expect(duplicatedForm.recipientCompanyContact).toEqual(
      "UPDATED-RECIPIENT-CONTACT"
    );
    expect(duplicatedForm.recipientCompanyMail).toEqual(
      "UPDATED-RECIPIENT-MAIL"
    );
    expect(duplicatedForm.recipientCompanyPhone).toEqual(
      "UPDATED-RECIPIENT-PHONE"
    );
    expect(duplicatedForm.recipientCompanyPhone).toEqual(
      "UPDATED-RECIPIENT-PHONE"
    );

    expect(duplicatedForm.traderCompanyName).toEqual("UPDATED-TRADER-NAME");
    expect(duplicatedForm.traderCompanyAddress).toEqual(
      "UPDATED-TRADER-ADDRESS"
    );
    expect(duplicatedForm.traderCompanyContact).toEqual(
      "UPDATED-TRADER-CONTACT"
    );
    expect(duplicatedForm.traderCompanyMail).toEqual("UPDATED-TRADER-MAIL");
    expect(duplicatedForm.traderCompanyPhone).toEqual("UPDATED-TRADER-PHONE");

    expect(duplicatedForm.traderReceipt).toEqual(
      "UPDATED-TRADER-RECEIPT-NUMBER"
    );
    expect(duplicatedForm.traderValidityLimit).toEqual(FOUR_DAYS_AGO);
    expect(duplicatedForm.traderDepartment).toEqual(
      "UPDATED-TRADER-RECEIPT-DEPARTMENT"
    );

    expect(duplicatedForm.brokerCompanyName).toEqual("UPDATED-BROKER-NAME");
    expect(duplicatedForm.brokerCompanyAddress).toEqual(
      "UPDATED-BROKER-ADDRESS"
    );
    expect(duplicatedForm.brokerCompanyContact).toEqual(
      "UPDATED-BROKER-CONTACT"
    );
    expect(duplicatedForm.brokerCompanyMail).toEqual("UPDATED-BROKER-MAIL");
    expect(duplicatedForm.brokerCompanyPhone).toEqual("UPDATED-BROKER-PHONE");

    expect(duplicatedForm.brokerReceipt).toEqual(
      "UPDATED-BROKER-RECEIPT-NUMBER"
    );
    expect(duplicatedForm.brokerValidityLimit).toEqual(FOUR_DAYS_AGO);
    expect(duplicatedForm.brokerDepartment).toEqual(
      "UPDATED-BROKER-RECEIPT-DEPARTMENT"
    );
  });

  test(
    "duplicated BSDD with temp storage should have updated data" +
      " in temp storage detail when company info changes",
    async () => {
      const { user, company } = await userWithCompanyFactory("MEMBER");
      const ttr = await companyFactory();
      const destination = await companyFactory();
      const form = await formWithTempStorageFactory({
        ownerId: user.id,
        opt: { emitterCompanySiret: company.siret },
        forwardedInOpts: {
          emitterCompanySiret: ttr.siret,
          emitterCompanyName: ttr.name,
          emitterCompanyAddress: ttr.address,
          emitterCompanyContact: ttr.contact,
          emitterCompanyPhone: ttr.contactPhone,
          emitterCompanyMail: ttr.contactEmail,
          recipientCompanySiret: destination.siret,
          recipientCompanyName: destination.name,
          recipientCompanyAddress: destination.address,
          recipientCompanyContact: destination.contact,
          recipientCompanyPhone: destination.contactPhone,
          recipientCompanyMail: destination.contactEmail
        }
      });
      const { mutate } = makeClient(user);

      await prisma.company.update({
        where: { id: ttr.id },
        data: {
          name: "UPDATED-TTR-NAME",
          address: "UPDATED-TTR-ADDRESS",
          contact: "UPDATED-TTR-CONTACT",
          contactPhone: "UPDATED-TTR-PHONE",
          contactEmail: "UPDATED-TTR-MAIL"
        }
      });

      await prisma.company.update({
        where: { id: destination.id },
        data: {
          name: "UPDATED-DESTINATION-NAME",
          address: "UPDATED-DESTINATION-ADDRESS",
          contact: "UPDATED-DESTINATION-CONTACT",
          contactPhone: "UPDATED-DESTINATION-PHONE",
          contactEmail: "UPDATED-DESTINATION-MAIL"
        }
      });

      const { data } = await mutate<Pick<Mutation, "duplicateForm">>(
        DUPLICATE_FORM,
        {
          variables: {
            id: form.id
          }
        }
      );
      const duplicatedForwardedIn = await prisma.form
        .findUniqueOrThrow({
          where: { id: data.duplicateForm.id }
        })
        .forwardedIn();

      expect(duplicatedForwardedIn.emitterCompanyName).toEqual(
        "UPDATED-TTR-NAME"
      );
      expect(duplicatedForwardedIn.emitterCompanyAddress).toEqual(
        "UPDATED-TTR-ADDRESS"
      );
      expect(duplicatedForwardedIn.emitterCompanyContact).toEqual(
        "UPDATED-TTR-CONTACT"
      );
      expect(duplicatedForwardedIn.emitterCompanyPhone).toEqual(
        "UPDATED-TTR-PHONE"
      );
      expect(duplicatedForwardedIn.emitterCompanyMail).toEqual(
        "UPDATED-TTR-MAIL"
      );
      expect(duplicatedForwardedIn.recipientCompanyName).toEqual(
        "UPDATED-DESTINATION-NAME"
      );
      expect(duplicatedForwardedIn.recipientCompanyAddress).toEqual(
        "UPDATED-DESTINATION-ADDRESS"
      );
      expect(duplicatedForwardedIn.recipientCompanyContact).toEqual(
        "UPDATED-DESTINATION-CONTACT"
      );
      expect(duplicatedForwardedIn.recipientCompanyPhone).toEqual(
        "UPDATED-DESTINATION-PHONE"
      );
      expect(duplicatedForwardedIn.recipientCompanyMail).toEqual(
        "UPDATED-DESTINATION-MAIL"
      );
    }
  );
});
