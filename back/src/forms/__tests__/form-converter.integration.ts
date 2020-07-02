import { userFactory, formFactory } from "../../__tests__/factories";
import { unflattenObjectFromDb } from "../form-converter";

test("unflattenObjectFromDb", async () => {
  const user = await userFactory();
  const form = await formFactory({ ownerId: user.id });

  const expanded = unflattenObjectFromDb(form);

  const expected = {
    id: form.id,
    readableId: form.readableId,
    customId: form.customId,
    emitter: {
      type: form.emitterType,
      workSite: {
        name: form.emitterWorkSiteName,
        address: form.emitterWorkSiteAddress,
        city: form.emitterWorkSiteCity,
        postalCode: form.emitterWorkSitePostalCode,
        infos: form.emitterWorkSiteInfos
      },
      pickupSite: form.emitterPickupSite,
      company: {
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      }
    },
    recipient: {
      cap: form.recipientCap,
      processingOperation: form.recipientProcessingOperation,
      company: {
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        contact: form.recipientCompanyContact,
        phone: form.recipientCompanyPhone,
        mail: form.recipientCompanyMail
      },
      isTempStorage: false
    },
    transporter: {
      company: {
        name: form.transporterCompanyName,
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail
      },
      isExemptedOfReceipt: form.transporterIsExemptedOfReceipt,
      receipt: form.transporterReceipt,
      department: form.transporterDepartment,
      validityLimit: form.transporterValidityLimit,
      numberPlate: form.transporterNumberPlate,
      customInfo: form.transporterCustomInfo
    },
    wasteDetails: {
      code: form.wasteDetailsCode,
      name: form.wasteDetailsName,
      onuCode: form.wasteDetailsOnuCode,
      packagings: form.wasteDetailsPackagings,
      otherPackaging: form.wasteDetailsOtherPackaging,
      numberOfPackages: form.wasteDetailsNumberOfPackages,
      quantity: form.wasteDetailsQuantity,
      quantityType: form.wasteDetailsQuantityType,
      consistence: form.wasteDetailsConsistence
    },
    trader: {
      company: {
        name: form.traderCompanyName,
        siret: form.traderCompanySiret,
        address: form.traderCompanyAddress,
        contact: form.traderCompanyContact,
        phone: form.traderCompanyPhone,
        mail: form.traderCompanyMail
      }
    },
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    status: form.status,
    signedByTransporter: form.signedByTransporter,
    sentAt: form.sentAt,
    sentBy: form.sentBy,
    wasteAcceptationStatus: form.wasteAcceptationStatus,
    wasteRefusalReason: form.wasteRefusalReason,
    receivedBy: form.receivedBy,
    receivedAt: form.receivedAt,
    signedAt: form.signedAt,
    quantityReceived: form.quantityReceived,
    processingOperationDone: form.processingOperationDone,
    processingOperationDescription: form.processingOperationDescription,
    processedBy: form.processedBy,
    processedAt: form.processedBy,
    noTraceability: form.noTraceability,
    nextDestination: null,
    currentTransporterSiret: form.currentTransporterSiret,
    nextTransporterSiret: form.nextTransporterSiret
  };

  expect(expanded).toEqual(expected);
});
