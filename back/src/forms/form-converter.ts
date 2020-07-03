import {
  Form as PrismaForm,
  TemporaryStorageDetail as PrismaTemporaryStorageDetail,
  TransportSegment as PrismaTransportSegment,
  FormCreateInput,
  FormUpdateInput,
  TemporaryStorageDetailCreateInput,
  TemporaryStorageDetailUpdateInput
} from "../generated/prisma-client";
import {
  Form as GraphQLForm,
  TemporaryStorageDetail as GraphQLTemporaryStorageDetail,
  TransportSegment as GraphQLTransportSegment,
  Emitter,
  Recipient,
  Transporter,
  Trader,
  WasteDetails,
  FormStatus,
  WorkSite,
  FormCompany,
  NextDestination,
  FormInput,
  TemporaryStorageDetailInput
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

export function flattenFormInput(
  formInput: Pick<
    FormInput,
    | "customId"
    | "emitter"
    | "recipient"
    | "transporter"
    | "wasteDetails"
    | "trader"
  >
): FormCreateInput | FormUpdateInput {
  return {
    customId: formInput.customId,
    emitterType: formInput.emitter.type,
    emitterPickupSite: formInput.emitter?.pickupSite,
    emitterWorkSiteName: formInput.emitter?.workSite?.name,
    emitterWorkSiteAddress: formInput.emitter?.workSite?.address,
    emitterWorkSiteCity: formInput.emitter?.workSite?.city,
    emitterWorkSitePostalCode: formInput.emitter?.workSite?.postalCode,
    emitterWorkSiteInfos: formInput.emitter?.workSite?.infos,
    emitterCompanyName: formInput.emitter?.company?.name,
    emitterCompanySiret: formInput.emitter?.company?.siret,
    emitterCompanyAddress: formInput.emitter?.company?.address,
    emitterCompanyContact: formInput.emitter?.company?.contact,
    emitterCompanyPhone: formInput.emitter?.company?.phone,
    emitterCompanyMail: formInput.emitter?.company?.mail,
    recipientCap: formInput.recipient?.cap,
    recipientProcessingOperation: formInput.recipient?.processingOperation,
    recipientIsTempStorage: formInput.recipient?.isTempStorage,
    recipientCompanyName: formInput.recipient?.company?.name,
    recipientCompanySiret: formInput.recipient?.company?.siret,
    recipientCompanyAddress: formInput.recipient?.company?.address,
    recipientCompanyContact: formInput.recipient?.company?.contact,
    recipientCompanyPhone: formInput.recipient?.company?.phone,
    recipientCompanyMail: formInput.recipient?.company?.mail,
    transporterCompanyName: formInput.transporter?.company?.name,
    transporterCompanySiret: formInput.transporter?.company?.siret,
    transporterCompanyAddress: formInput.transporter?.company?.address,
    transporterCompanyContact: formInput.transporter?.company?.contact,
    transporterCompanyPhone: formInput.transporter?.company?.phone,
    transporterCompanyMail: formInput.transporter?.company?.mail,
    transporterIsExemptedOfReceipt: formInput.transporter?.isExemptedOfReceipt,
    transporterReceipt: formInput.transporter?.receipt,
    transporterDepartment: formInput.transporter?.department,
    transporterValidityLimit: formInput.transporter?.validityLimit,
    transporterNumberPlate: formInput.transporter?.numberPlate,
    wasteDetailsCode: formInput.wasteDetails?.code,
    wasteDetailsName: formInput.wasteDetails?.name,
    wasteDetailsOnuCode: formInput.wasteDetails?.onuCode,
    wasteDetailsPackagings: formInput.wasteDetails?.packagings,
    wasteDetailsOtherPackaging: formInput.wasteDetails?.otherPackaging,
    wasteDetailsNumberOfPackages: formInput.wasteDetails?.numberOfPackages,
    wasteDetailsQuantity: formInput.wasteDetails?.quantity,
    wasteDetailsQuantityType: formInput.wasteDetails?.quantityType,
    wasteDetailsConsistence: formInput.wasteDetails?.consistence,
    traderCompanyName: formInput.trader?.company?.name,
    traderCompanySiret: formInput.trader?.company?.siret,
    traderCompanyAddress: formInput.trader?.company?.address,
    traderCompanyContact: formInput.trader?.company?.contact,
    traderCompanyPhone: formInput.trader?.company?.phone,
    traderCompanyMail: formInput.trader?.company?.mail,
    traderReceipt: formInput.trader?.receipt,
    traderDepartment: formInput.trader?.department,
    traderValidityLimit: formInput.trader?.validityLimit
  };
}

export function flattenTemporaryStorageDetailInput(
  tempStorageInput: TemporaryStorageDetailInput
): TemporaryStorageDetailCreateInput | TemporaryStorageDetailUpdateInput {
  return {
    destinationCompanyName: tempStorageInput.destination?.company?.name,
    destinationCompanySiret: tempStorageInput.destination?.company?.siret,
    destinationCompanyAddress: tempStorageInput.destination?.company?.address,
    destinationCompanyContact: tempStorageInput.destination?.company?.contact,
    destinationCompanyPhone: tempStorageInput.destination?.company?.phone,
    destinationCompanyMail: tempStorageInput.destination?.company?.mail,
    destinationCap: tempStorageInput.destination?.cap,
    destinationProcessingOperation:
      tempStorageInput.destination.processingOperation
  };
}

/**
 * Expand form data from db
 */
export function expandFormFromDb(form: PrismaForm): GraphQLForm {
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

/**
 * Expand temporary storage data from db
 */
export function expandTemporaryStorageFromDb(
  temporaryStorageDetail: PrismaTemporaryStorageDetail
): GraphQLTemporaryStorageDetail {
  return {
    temporaryStorer: nullIfNoValues({
      quantityType: temporaryStorageDetail.tempStorerQuantityType,
      quantityReceived: temporaryStorageDetail.tempStorerQuantityReceived,
      wasteAcceptationStatus:
        temporaryStorageDetail.tempStorerWasteAcceptationStatus,
      wasteRefusalReason: temporaryStorageDetail.tempStorerWasteRefusalReason,
      receivedAt: temporaryStorageDetail.tempStorerReceivedAt,
      receivedBy: temporaryStorageDetail.tempStorerReceivedBy
    }),
    destination: nullIfNoValues({
      cap: temporaryStorageDetail.destinationCap,
      processingOperation:
        temporaryStorageDetail.destinationProcessingOperation,
      company: nullIfNoValues({
        name: temporaryStorageDetail.destinationCompanyName,
        siret: temporaryStorageDetail.destinationCompanySiret,
        address: temporaryStorageDetail.destinationCompanyAddress,
        contact: temporaryStorageDetail.destinationCompanyContact,
        phone: temporaryStorageDetail.destinationCompanyPhone,
        mail: temporaryStorageDetail.destinationCompanyMail
      }),
      isFilledByEmitter: temporaryStorageDetail.destinationIsFilledByEmitter
    }),
    wasteDetails: nullIfNoValues({
      code: null,
      name: null,
      onuCode: temporaryStorageDetail.wasteDetailsOnuCode,
      packagings: temporaryStorageDetail.wasteDetailsPackagings,
      otherPackaging: temporaryStorageDetail.wasteDetailsOtherPackaging,
      numberOfPackages: temporaryStorageDetail.wasteDetailsNumberOfPackages,
      quantity: temporaryStorageDetail.wasteDetailsQuantity,
      quantityType: temporaryStorageDetail.wasteDetailsQuantityType,
      consistence: null
    }),
    transporter: nullIfNoValues({
      company: nullIfNoValues({
        name: temporaryStorageDetail.transporterCompanyName,
        siret: temporaryStorageDetail.transporterCompanySiret,
        address: temporaryStorageDetail.transporterCompanyAddress,
        contact: temporaryStorageDetail.transporterCompanyContact,
        phone: temporaryStorageDetail.transporterCompanyPhone,
        mail: temporaryStorageDetail.transporterCompanyMail
      }),
      isExemptedOfReceipt:
        temporaryStorageDetail.transporterIsExemptedOfReceipt,
      receipt: temporaryStorageDetail.transporterReceipt,
      department: temporaryStorageDetail.transporterDepartment,
      validityLimit: temporaryStorageDetail.transporterValidityLimit,
      numberPlate: temporaryStorageDetail.transporterNumberPlate,
      customInfo: null
    }),
    signedBy: temporaryStorageDetail.signedBy,
    signedAt: temporaryStorageDetail.signedAt
  };
}

export function expandTransportSegmentFromDb(
  segment: PrismaTransportSegment
): GraphQLTransportSegment {
  return {
    id: segment.id,
    previousTransporterCompanySiret: segment.previousTransporterCompanySiret,
    transporter: nullIfNoValues({
      company: nullIfNoValues({
        name: segment.transporterCompanyName,
        siret: segment.transporterCompanySiret,
        address: segment.transporterCompanyAddress,
        contact: segment.transporterCompanyContact,
        phone: segment.transporterCompanyPhone,
        mail: segment.transporterCompanyMail
      }),
      isExemptedOfReceipt: segment.transporterIsExemptedOfReceipt,
      receipt: segment.transporterReceipt,
      department: segment.transporterDepartment,
      validityLimit: segment.transporterValidityLimit,
      numberPlate: segment.transporterNumberPlate,
      customInfo: null
    }),
    mode: segment.mode,
    takenOverAt: segment.takenOverAt,
    takenOverBy: segment.takenOverBy,
    readyToTakeOver: segment.readyToTakeOver,
    segmentNumber: segment.segmentNumber
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
