import { Form as PrismaForm } from "../generated/prisma-client";
import {
  Form as GraphQLForm,
  Emitter,
  Recipient,
  Transporter,
  Trader,
  WasteDetails,
  FormStatus,
  WorkSite,
  FormCompany,
  NextDestination
} from "../generated/graphql/types";

export function flattenObjectForDb(
  input,
  previousKeys = [],
  dbObject = {}
): Partial<PrismaForm> {
  const relations = ["ecoOrganisme", "temporaryStorageDetail"];

  Object.keys(input || {}).forEach(key => {
    if (relations.includes(key)) {
      dbObject[key] = {};
      return input[key]
        ? flattenObjectForDb(input[key], [], dbObject[key])
        : {};
    }

    if (
      input[key] &&
      !Array.isArray(input[key]) &&
      typeof input[key] === "object"
    ) {
      return flattenObjectForDb(input[key], [...previousKeys, key], dbObject);
    }

    const objectKey = [...previousKeys, key]
      .map((k, i) => {
        if (i !== 0) {
          return k.charAt(0).toUpperCase() + k.slice(1);
        }
        return k;
      })
      .join("");

    dbObject[objectKey] = input[key];
  });

  return dbObject;
}

/**
 * Check if any of the passed args is different from null
 */
export function hasAny(...args: any[]): boolean {
  return args.reduce((acc, curr) => {
    return acc || curr !== null;
  }, false);
}

/**
 * Return null if all object values are null
 * obj otherwise
 */
export function nullIfNoValues<F>(obj: F): F | null {
  return hasAny(...Object.values(obj)) ? obj : null;
}

export function unflattenObjectFromDb(form: PrismaForm): GraphQLForm {
  return {
    id: form.id,
    readableId: form.readableId,
    customId: form.customId,
    emitter: nullIfNoValues<Emitter>({
      type: form.emitterType,
      workSite: nullIfNoValues<WorkSite>({
        name: form.emitterWorkSiteName,
        address: form.emitterWorkSiteAddress,
        city: form.emitterWorkSiteCity,
        postalCode: form.emitterWorkSitePostalCode,
        infos: form.emitterWorkSiteInfos
      }),
      pickupSite: form.emitterPickupSite,
      company: nullIfNoValues<FormCompany>({
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      })
    }),
    recipient: nullIfNoValues<Recipient>({
      cap: form.recipientCap,
      processingOperation: form.recipientProcessingOperation,
      company: nullIfNoValues<FormCompany>({
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        contact: form.recipientCompanyContact,
        phone: form.recipientCompanyPhone,
        mail: form.recipientCompanyMail
      }),
      isTempStorage: form.recipientIsTempStorage
    }),
    transporter: nullIfNoValues<Transporter>({
      company: nullIfNoValues<FormCompany>({
        name: form.transporterCompanyName,
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail
      }),
      isExemptedOfReceipt: form.transporterIsExemptedOfReceipt,
      receipt: form.transporterReceipt,
      department: form.transporterDepartment,
      validityLimit: form.transporterValidityLimit,
      numberPlate: form.transporterNumberPlate,
      customInfo: form.transporterCustomInfo
    }),
    wasteDetails: nullIfNoValues<WasteDetails>({
      code: form.wasteDetailsCode,
      name: form.wasteDetailsName,
      onuCode: form.wasteDetailsOnuCode,
      packagings: form.wasteDetailsPackagings,
      otherPackaging: form.wasteDetailsOtherPackaging,
      numberOfPackages: form.wasteDetailsNumberOfPackages,
      quantity: form.wasteDetailsQuantity,
      quantityType: form.wasteDetailsQuantityType,
      consistence: form.wasteDetailsConsistence
    }),
    trader: nullIfNoValues<Trader>({
      company: nullIfNoValues<FormCompany>({
        name: form.traderCompanyName,
        siret: form.traderCompanySiret,
        address: form.traderCompanyAddress,
        contact: form.traderCompanyContact,
        phone: form.traderCompanyPhone,
        mail: form.traderCompanyMail
      })
    }),
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    status: form.status as FormStatus,
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
    processedAt: form.processedAt,
    noTraceability: form.noTraceability,
    nextDestination: nullIfNoValues<NextDestination>({
      processingOperation: form.nextDestinationProcessingOperation,
      company: nullIfNoValues<FormCompany>({
        name: form.nextDestinationCompanyName,
        siret: form.nextDestinationCompanySiret,
        address: form.nextDestinationCompanyAddress,
        contact: form.nextDestinationCompanyContact,
        phone: form.nextDestinationCompanyPhone,
        mail: form.nextDestinationCompanyMail
      })
    }),
    currentTransporterSiret: form.currentTransporterSiret,
    nextTransporterSiret: form.nextTransporterSiret
  };
}

export function cleanUpNotDuplicatableFieldsInForm(form) {
  const {
    id,
    createdAt,
    updatedAt,
    readableId,

    transporterNumberPlate,

    status,
    sentAt,
    sentBy,

    isAccepted,
    wasteAcceptationStatus,
    wasteRefusalReason,
    receivedBy,
    receivedAt,
    quantityReceived,
    processingOperationDone,
    currentTransporterSiret,
    ...rest
  } = form;

  return rest;
}

export const cleanUpNonDuplicatableSegmentField = segment => {
  const {
    id,
    sealed,
    form,
    createdAt,
    updatedAt,
    takenOverAt,
    takenOverBy,
    ...rest
  } = segment;

  return rest;
};
