import {
  formFactory,
  formWithTempStorageFactory,
  userWithCompanyFactory
} from "../../../../__tests__/factories";
import makeClient from "../../../../__tests__/testClient";
import { prisma } from "../../../../generated/prisma-client";
import { resetDatabase } from "../../../../../integration-tests/helper";

const DUPLICATE_FORM = `
  mutation DuplicateForm($id: ID!) {
    duplicateForm(id: $id) {
      id
    }
  }
`;

describe("Mutation.duplicateForm", () => {
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
        ecoOrganismeSiret: "12345678912345"
      }
    ]
  ])("should duplicate a form %s", async (_, opt) => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const {
      id,
      nextDestinationProcessingOperation,
      nextDestinationCompanyName,
      nextDestinationCompanySiret,
      nextDestinationCompanyAddress,
      nextDestinationCompanyCountry,
      nextDestinationCompanyContact,
      nextDestinationCompanyPhone,
      nextDestinationCompanyMail,
      emitterType,
      emitterPickupSite,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
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
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      wasteDetailsCode,
      wasteDetailsName,
      wasteDetailsOnuCode,
      wasteDetailsPackagings,
      wasteDetailsOtherPackaging,
      wasteDetailsNumberOfPackages,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsConsistence,
      wasteDetailsPop,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret,
      nextTransporterSiret
    } = await formFactory({
      ownerId: user.id,
      opt: {
        emitterCompanySiret: company.siret,
        ...opt
      }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(DUPLICATE_FORM, {
      variables: {
        id
      }
    });
    const duplicatedForm = await prisma.form({ id: data.duplicateForm.id });

    expect(duplicatedForm).toMatchObject({
      customId: null,
      isDeleted: false,
      isImportedFromPaper: false,
      signedByTransporter: null,
      status: "DRAFT",
      sentAt: null,
      sentBy: null,
      isAccepted: null,
      wasteAcceptationStatus: null,
      wasteRefusalReason: null,
      receivedBy: null,
      receivedAt: null,
      signedAt: null,
      quantityReceived: null,
      processedBy: null,
      processedAt: null,
      processingOperationDone: null,
      processingOperationDescription: null,
      noTraceability: null,
      nextDestinationProcessingOperation,
      nextDestinationCompanyName,
      nextDestinationCompanySiret,
      nextDestinationCompanyAddress,
      nextDestinationCompanyCountry,
      nextDestinationCompanyContact,
      nextDestinationCompanyPhone,
      nextDestinationCompanyMail,
      emitterType,
      emitterPickupSite,
      emitterWorkSiteName,
      emitterWorkSiteAddress,
      emitterWorkSiteCity,
      emitterWorkSitePostalCode,
      emitterWorkSiteInfos,
      emitterCompanyName,
      emitterCompanySiret,
      emitterCompanyAddress,
      emitterCompanyContact,
      emitterCompanyPhone,
      emitterCompanyMail,
      recipientCap,
      recipientProcessingOperation,
      recipientIsTempStorage: false,
      recipientCompanyName,
      recipientCompanySiret,
      recipientCompanyAddress,
      recipientCompanyContact,
      recipientCompanyPhone,
      recipientCompanyMail,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterNumberPlate: null,
      transporterCustomInfo: null,
      wasteDetailsCode,
      wasteDetailsName,
      wasteDetailsOnuCode,
      wasteDetailsPackagings,
      wasteDetailsOtherPackaging,
      wasteDetailsNumberOfPackages,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      wasteDetailsConsistence,
      wasteDetailsPop,
      traderCompanyName,
      traderCompanySiret,
      traderCompanyAddress,
      traderCompanyContact,
      traderCompanyPhone,
      traderCompanyMail,
      traderReceipt,
      traderDepartment,
      traderValidityLimit,
      ecoOrganismeName,
      ecoOrganismeSiret,
      currentTransporterSiret: null,
      nextTransporterSiret
    });
  });

  it("should duplicate the temporary storage detail", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formWithTempStorageFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });
    const {
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationCap,
      destinationProcessingOperation,
      wasteDetailsOnuCode,
      wasteDetailsPackagings,
      wasteDetailsOtherPackaging,
      wasteDetailsNumberOfPackages,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit
    } = await prisma.form({ id: form.id }).temporaryStorageDetail();

    const { mutate } = makeClient(user);
    const { data } = await mutate(DUPLICATE_FORM, {
      variables: {
        id: form.id
      }
    });
    const duplicatedForm = await prisma.form({ id: data.duplicateForm.id });
    const duplicatedTemporaryStorageDetail = await prisma
      .form({
        id: duplicatedForm.id
      })
      .temporaryStorageDetail();

    expect(duplicatedForm.recipientIsTempStorage).toBe(true);
    expect(duplicatedTemporaryStorageDetail).toMatchObject({
      tempStorerQuantityType: null,
      tempStorerQuantityReceived: null,
      tempStorerWasteAcceptationStatus: null,
      tempStorerWasteRefusalReason: null,
      tempStorerReceivedAt: null,
      tempStorerReceivedBy: null,
      tempStorerSignedAt: null,
      destinationCompanyName,
      destinationCompanySiret,
      destinationCompanyAddress,
      destinationCompanyContact,
      destinationCompanyPhone,
      destinationCompanyMail,
      destinationCap,
      destinationProcessingOperation,
      wasteDetailsOnuCode,
      wasteDetailsPackagings,
      wasteDetailsOtherPackaging,
      wasteDetailsNumberOfPackages,
      wasteDetailsQuantity,
      wasteDetailsQuantityType,
      transporterCompanyName,
      transporterCompanySiret,
      transporterCompanyAddress,
      transporterCompanyContact,
      transporterCompanyPhone,
      transporterCompanyMail,
      transporterIsExemptedOfReceipt,
      transporterReceipt,
      transporterDepartment,
      transporterValidityLimit,
      transporterNumberPlate: null,
      signedByTransporter: null,
      signedBy: null,
      signedAt: null
    });
  });

  it("should create a status log", async () => {
    const { user, company } = await userWithCompanyFactory("MEMBER");
    const form = await formFactory({
      ownerId: user.id,
      opt: { emitterCompanySiret: company.siret }
    });

    const { mutate } = makeClient(user);
    const { data } = await mutate(DUPLICATE_FORM, {
      variables: {
        id: form.id
      }
    });

    const statusLogs = await prisma.statusLogs({
      where: {
        form: { id: data.duplicateForm.id },
        user: { id: user.id },
        status: "DRAFT"
      }
    });

    expect(statusLogs.length).toEqual(1);
    expect(statusLogs[0].loggedAt).toBeTruthy();
  });
});
