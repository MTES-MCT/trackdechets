import { Prisma, UserRole } from "@prisma/client";
import { resetDatabase } from "../../../../../integration-tests/helper";
import {
  CompanySearchResult,
  Mutation
} from "../../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import {
  companyFactory,
  formFactory,
  formWithTempStorageFactory,
  siretify,
  toIntermediaryCompany,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { xDaysAgo } from "../../../../utils";
import {
  getFirstTransporter,
  getFirstTransporterSync
} from "../../../database";
import { searchCompany } from "../../../../companies/search";

jest.mock("../../../../companies/search");

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

function sortFn(a: string, b: string) {
  return a.localeCompare(b);
}

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
      transporters: {
        create: {
          transporterCompanySiret: transporter.company.siret,
          transporterCompanyName: transporter.company.name,
          transporterCompanyAddress: transporter.company.address,
          transporterCompanyContact: transporter.company.contact,
          transporterCompanyPhone: transporter.company.contactPhone,
          transporterCompanyMail: transporter.company.contactEmail,
          transporterReceipt: transporterReceipt.receiptNumber,
          transporterDepartment: transporterReceipt.department,
          transporterValidityLimit: transporterReceipt.validityLimit,
          transporterNumberPlate: "AB-1234-56",
          transporterCustomInfo: "T001",
          number: 1
        }
      },
      ...opt
    }
  });

  return {
    form,
    emitter,
    transporter,
    recipient,
    broker,
    trader,
    transporterReceipt
  };
}

describe("Mutation.duplicateForm", () => {
  afterEach(() => resetDatabase());

  it("should duplicate a form %s", async () => {
    const { form, emitter } = await createForm({
      ecoOrganismeName: "COREPILE",
      ecoOrganismeSiret: siretify(1)
    });

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

    const transporter = await getFirstTransporter({ id });

    const {
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
      number,
      ...restTransporter
    } = transporter!;

    const expectedSkipped = [
      "createdAt",
      "updatedAt",
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
      "nextDestinationCompanyExtraEuropeanId",
      "nextDestinationNotificationNumber",
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
      "canAccessDraftSirets",
      "forwardedIn",
      "destinationOperationMode",
      "quantityGrouped"
    ];

    const expectedSkippedTransporter = [
      "createdAt",
      "updatedAt",
      "formId",
      "id",
      "transporterNumberPlate",
      "previousTransporterCompanyOrgId",
      "readyToTakeOver",
      "takenOverAt",
      "takenOverBy",
      "transporterCustomInfo"
    ];

    // make sure this test breaks when a new field is added to the Form model
    // it will ensure we think of adding necessary fields to the duplicate input
    expect(Object.keys(rest).sort(sortFn)).toEqual(
      expectedSkipped.sort(sortFn)
    );
    expect(Object.keys(restTransporter).sort(sortFn)).toEqual(
      expectedSkippedTransporter.sort(sortFn)
    );

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
      where: { id: data.duplicateForm.id },
      include: { transporters: true }
    });

    const duplicatedTransporter = await getFirstTransporter(duplicatedForm!);

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
      wasteDetailsCode,
      wasteDetailsOnuCode,
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

    expect(duplicatedTransporter).toMatchObject({
      number,
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
      readyToTakeOver: true
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
    const forwardedIn = await prisma.form
      .findUniqueOrThrow({ where: { id: form.id } })
      .forwardedIn({ include: { transporters: true } });
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
    } = forwardedIn ?? {};

    const { mutate } = makeClient(user);
    const { data, errors } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(errors).toBeUndefined();

    const duplicatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.duplicateForm.id }
    });
    const {
      transporters: duplicatedForwardedInTransporters,
      ...duplicatedForwardedIn
    } =
      (await prisma.form
        .findUniqueOrThrow({
          where: {
            id: duplicatedForm.id
          }
        })
        .forwardedIn({ include: { transporters: true } })) ?? {};

    expect(duplicatedForm.recipientIsTempStorage).toBe(true);
    // transporter after temp storage should not be duplicated
    expect(duplicatedForwardedInTransporters).toEqual([]);
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
      "nextDestinationCompanyExtraEuropeanId",
      "nextDestinationNotificationNumber",
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
      "canAccessDraftSirets",
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
      "ecoOrganismeSiret",
      "transporters",
      "destinationOperationMode",
      "quantityGrouped"
    ];

    // make sure this test breaks when a new field is added to the Form model
    // it will ensure we think of adding necessary fields to the duplicate forwardedIn input
    expect(Object.keys(rest).sort(sortFn)).toEqual(
      expectedSkipped.sort(sortFn)
    );
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

  it("should duplicate nulling transporter receipt when it was emptied", async () => {
    const { form, transporterReceipt, emitter } = await createForm();
    const { mutate } = makeClient(emitter.user);
    await prisma.transporterReceipt.delete({
      where: { id: transporterReceipt.id }
    });
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
    const firstDuplicatedTransporter = await getFirstTransporter(
      duplicatedForm
    );
    expect(firstDuplicatedTransporter?.transporterReceipt).toBeNull();
    expect(firstDuplicatedTransporter?.transporterDepartment).toBeNull();
    expect(firstDuplicatedTransporter?.transporterValidityLimit).toBeNull();
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

    // No SIRENE data, just return DB objects
    (searchCompany as jest.Mock).mockImplementation(async (clue: string) => {
      const company = await prisma.company.findFirstOrThrow({
        where: { orgId: clue },
        include: {
          transporterReceipt: true,
          brokerReceipt: true,
          workerCertification: true
        }
      });

      return {
        name: company.name,
        address: company.address,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
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
      where: { id: data.duplicateForm.id },
      include: { transporters: true }
    });

    const duplicatedTransporter = getFirstTransporterSync(duplicatedForm);

    expect(duplicatedForm.emitterCompanyName).toEqual("UPDATED-EMITTER-NAME");
    expect(duplicatedForm.emitterCompanyAddress).toEqual(
      "UPDATED-EMITTER-ADDRESS"
    );
    expect(duplicatedForm.emitterCompanyContact).toEqual(
      "UPDATED-EMITTER-CONTACT"
    );
    expect(duplicatedForm.emitterCompanyMail).toEqual("UPDATED-EMITTER-MAIL");
    expect(duplicatedForm.emitterCompanyPhone).toEqual("UPDATED-EMITTER-PHONE");

    expect(duplicatedTransporter?.transporterCompanyName).toEqual(
      "UPDATED-TRANSPORTER-NAME"
    );
    expect(duplicatedTransporter?.transporterCompanyAddress).toEqual(
      "UPDATED-TRANSPORTER-ADDRESS"
    );
    expect(duplicatedTransporter?.transporterCompanyContact).toEqual(
      "UPDATED-TRANSPORTER-CONTACT"
    );
    expect(duplicatedTransporter?.transporterCompanyMail).toEqual(
      "UPDATED-TRANSPORTER-MAIL"
    );
    expect(duplicatedTransporter?.transporterCompanyPhone).toEqual(
      "UPDATED-TRANSPORTER-PHONE"
    );

    expect(duplicatedTransporter?.transporterReceipt).toEqual(
      "UPDATED-TRANSPORTER-RECEIPT-NUMBER"
    );
    expect(duplicatedTransporter?.transporterValidityLimit).toEqual(
      FOUR_DAYS_AGO
    );
    expect(duplicatedTransporter?.transporterDepartment).toEqual(
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

      expect(duplicatedForwardedIn?.emitterCompanyName).toEqual(
        "UPDATED-TTR-NAME"
      );
      expect(duplicatedForwardedIn?.emitterCompanyAddress).toEqual(
        "UPDATED-TTR-ADDRESS"
      );
      expect(duplicatedForwardedIn?.emitterCompanyContact).toEqual(
        "UPDATED-TTR-CONTACT"
      );
      expect(duplicatedForwardedIn?.emitterCompanyPhone).toEqual(
        "UPDATED-TTR-PHONE"
      );
      expect(duplicatedForwardedIn?.emitterCompanyMail).toEqual(
        "UPDATED-TTR-MAIL"
      );
      expect(duplicatedForwardedIn?.recipientCompanyName).toEqual(
        "UPDATED-DESTINATION-NAME"
      );
      expect(duplicatedForwardedIn?.recipientCompanyAddress).toEqual(
        "UPDATED-DESTINATION-ADDRESS"
      );
      expect(duplicatedForwardedIn?.recipientCompanyContact).toEqual(
        "UPDATED-DESTINATION-CONTACT"
      );
      expect(duplicatedForwardedIn?.recipientCompanyPhone).toEqual(
        "UPDATED-DESTINATION-PHONE"
      );
      expect(duplicatedForwardedIn?.recipientCompanyMail).toEqual(
        "UPDATED-DESTINATION-MAIL"
      );
    }
  );

  test("duplicated BSDD should have the updated SIRENE data when company info changes", async () => {
    const intermediary1 = await companyFactory();
    const intermediary2 = await companyFactory();
    const { form, emitter, transporter, recipient, trader, broker } =
      await createForm({
        intermediaries: {
          createMany: {
            data: [
              {
                name: intermediary1.name,
                siret: intermediary1.siret ?? "",
                address: intermediary1.address,
                contact: intermediary1.contact ?? ""
              },
              {
                name: intermediary2.name,
                siret: intermediary2.siret ?? "",
                address: intermediary2.address,
                contact: intermediary2.contact ?? ""
              }
            ]
          }
        }
      });

    function searchResult(companyName: string) {
      return {
        name: `updated ${companyName} name`,
        address: `updated ${companyName} address`,
        statutDiffusionEtablissement: "O"
      } as CompanySearchResult;
    }

    const searchResults = {
      [emitter.company.siret!]: searchResult("emitter"),
      [transporter.company.siret!]: searchResult("transporter"),
      [recipient.company.siret!]: searchResult("recipient"),
      [trader.company.siret!]: searchResult("trader"),
      [broker.company.siret!]: searchResult("broker"),
      [intermediary1.siret!]: searchResult("intermediary1"),
      [intermediary2.siret!]: searchResult("intermediary2")
    };

    (searchCompany as jest.Mock).mockImplementation((clue: string) => {
      return Promise.resolve(searchResults[clue]);
    });

    const { mutate } = makeClient(emitter.user);
    const { data, errors } = await mutate<Pick<Mutation, "duplicateForm">>(
      DUPLICATE_FORM,
      {
        variables: {
          id: form.id
        }
      }
    );

    expect(errors).toBeUndefined();

    const duplicatedForm = await prisma.form.findUniqueOrThrow({
      where: { id: data.duplicateForm.id },
      include: { transporters: true, intermediaries: true }
    });

    const duplicatedTransporter = getFirstTransporterSync(duplicatedForm);

    // Emitter
    expect(duplicatedForm.emitterCompanyName).toEqual("updated emitter name");
    expect(duplicatedForm.emitterCompanyAddress).toEqual(
      "updated emitter address"
    );

    // Transporter
    expect(duplicatedTransporter?.transporterCompanyName).toEqual(
      "updated transporter name"
    );
    expect(duplicatedTransporter?.transporterCompanyAddress).toEqual(
      "updated transporter address"
    );

    // Recipient
    expect(duplicatedForm.recipientCompanyName).toEqual(
      "updated recipient name"
    );
    expect(duplicatedForm.recipientCompanyAddress).toEqual(
      "updated recipient address"
    );

    // Trader
    expect(duplicatedForm.traderCompanyName).toEqual("updated trader name");
    expect(duplicatedForm.traderCompanyAddress).toEqual(
      "updated trader address"
    );

    // Broker
    expect(duplicatedForm.brokerCompanyName).toEqual("updated broker name");
    expect(duplicatedForm.brokerCompanyAddress).toEqual(
      "updated broker address"
    );

    // Intermediaries
    expect(duplicatedForm.intermediaries[0].name).toEqual(
      "updated intermediary1 name"
    );
    expect(duplicatedForm.intermediaries[0].address).toEqual(
      "updated intermediary1 address"
    );
    expect(duplicatedForm.intermediaries[1].name).toEqual(
      "updated intermediary2 name"
    );
    expect(duplicatedForm.intermediaries[1].address).toEqual(
      "updated intermediary2 address"
    );
  });

  test(
    "duplicated BSDD with temp storage should have updated data" +
      " in temp storage detail when company SIRENE info changes",
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

      function searchResult(companyName: string) {
        return {
          name: `updated ${companyName} name`,
          address: `updated ${companyName} address`,
          statutDiffusionEtablissement: "O"
        } as CompanySearchResult;
      }

      const searchResults = {
        [ttr.siret!]: searchResult("ttr"),
        [destination.siret!]: searchResult("destination")
      };

      (searchCompany as jest.Mock).mockImplementation((clue: string) => {
        return Promise.resolve(searchResults[clue]);
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

      expect(duplicatedForwardedIn?.emitterCompanyName).toEqual(
        "updated ttr name"
      );
      expect(duplicatedForwardedIn?.emitterCompanyAddress).toEqual(
        "updated ttr address"
      );

      expect(duplicatedForwardedIn?.recipientCompanyName).toEqual(
        "updated destination name"
      );
      expect(duplicatedForwardedIn?.recipientCompanyAddress).toEqual(
        "updated destination address"
      );
    }
  );
});
