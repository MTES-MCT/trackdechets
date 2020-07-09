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
  TemporaryStorageDetailInput,
  EmitterInput
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

/**
 * Discard undefined fields in a flatten input
 * It is used to prevent overriding existing data when
 * updating records
 */
export function safeInput(obj: { [key: string]: any }) {
  return Object.keys(obj).reduce((acc, curr) => {
    return {
      ...acc,
      ...(obj[curr] !== undefined ? { [curr]: obj[curr] } : {})
    };
  }, {});
}

/**
 * Equivalent to a typescript optional chaining operator foo?.bar
 * except that it returns "null" instead of "undefined" if "null" is encountered in the chain
 * It allows to differentiate between voluntary null update and field omission that should
 * not update any data
 */
export function chain<T, K>(o: T, getter: (o: T) => K): K | null | undefined {
  if (o === null) {
    return null;
  }
  if (o === undefined || o === {}) {
    return undefined;
  }
  return getter(o);
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
  const flattened = safeInput({
    customId: formInput.customId,
    emitterType: chain(formInput.emitter, e => e.type),
    emitterPickupSite: chain(formInput.emitter, e => e.pickupSite),
    emitterWorkSiteName: chain(formInput.emitter, e =>
      chain(e.workSite, w => w.name)
    ),
    emitterWorkSiteAddress: chain(formInput.emitter, e =>
      chain(e.workSite, w => w.address)
    ),
    emitterWorkSiteCity: chain(formInput.emitter, e =>
      chain(e.workSite, w => w.city)
    ),
    emitterWorkSitePostalCode: chain(formInput.emitter, e =>
      chain(e.workSite, w => w.postalCode)
    ),
    emitterWorkSiteInfos: chain(formInput.emitter, e =>
      chain(e.workSite, w => w.infos)
    ),
    emitterCompanyName: chain(formInput.emitter, e =>
      chain(e.company, c => c.name)
    ),
    emitterCompanySiret: chain(formInput.emitter, e =>
      chain(e.company, c => c.siret)
    ),
    emitterCompanyAddress: chain(formInput.emitter, e =>
      chain(e.company, c => c.address)
    ),
    emitterCompanyContact: chain(formInput.emitter, e =>
      chain(e.company, c => c.contact)
    ),
    emitterCompanyPhone: chain(formInput.emitter, e =>
      chain(e.company, c => c.phone)
    ),
    emitterCompanyMail: chain(formInput.emitter, e =>
      chain(e.company, c => c.mail)
    ),
    recipientCap: chain(formInput.recipient, r => r.cap),
    recipientProcessingOperation: chain(
      formInput.recipient,
      r => r.processingOperation
    ),
    recipientIsTempStorage: chain(formInput.recipient, r => r.isTempStorage),
    recipientCompanyName: chain(formInput.recipient, r =>
      chain(r.company, c => c.name)
    ),
    recipientCompanySiret: chain(formInput.recipient, r =>
      chain(r.company, c => c.siret)
    ),
    recipientCompanyAddress: chain(formInput.recipient, r =>
      chain(r.company, c => c.address)
    ),
    recipientCompanyContact: chain(formInput.recipient, r =>
      chain(r.company, c => c.contact)
    ),
    recipientCompanyPhone: chain(formInput.recipient, r =>
      chain(r.company, c => c.phone)
    ),
    recipientCompanyMail: chain(formInput.recipient, r =>
      chain(r.company, c => c.mail)
    ),
    transporterCompanyName: chain(formInput.transporter, t =>
      chain(t.company, c => c.name)
    ),
    transporterCompanySiret: chain(formInput.transporter, t =>
      chain(t.company, c => c.siret)
    ),
    transporterCompanyAddress: chain(formInput.transporter, t =>
      chain(t.company, c => c.address)
    ),
    transporterCompanyContact: chain(formInput.transporter, t =>
      chain(t.company, c => c.contact)
    ),
    transporterCompanyPhone: chain(formInput.transporter, t =>
      chain(t.company, c => c.phone)
    ),
    transporterCompanyMail: chain(formInput.transporter, t =>
      chain(t.company, c => c.mail)
    ),
    transporterIsExemptedOfReceipt: chain(
      formInput.transporter,
      t => t.isExemptedOfReceipt
    ),
    transporterReceipt: chain(formInput.transporter, t => t.receipt),
    transporterDepartment: chain(formInput.transporter, t => t.department),
    transporterValidityLimit: chain(
      formInput.transporter,
      t => t.validityLimit
    ),
    transporterNumberPlate: chain(formInput.transporter, t => t.numberPlate),
    wasteDetailsCode: chain(formInput.wasteDetails, w => w.code),
    wasteDetailsName: chain(formInput.wasteDetails, w => w.name),
    wasteDetailsOnuCode: chain(formInput.wasteDetails, w => w.onuCode),
    wasteDetailsPackagings: chain(formInput.wasteDetails, w => w.packagings),
    wasteDetailsOtherPackaging: chain(
      formInput.wasteDetails,
      w => w.otherPackaging
    ),
    wasteDetailsNumberOfPackages: chain(
      formInput.wasteDetails,
      w => w.numberOfPackages
    ),
    wasteDetailsQuantity: chain(formInput.wasteDetails, w => w.quantity),
    wasteDetailsQuantityType: chain(
      formInput.wasteDetails,
      w => w.quantityType
    ),
    wasteDetailsConsistence: chain(formInput.wasteDetails, w => w.consistence),
    traderCompanyName: chain(formInput.trader, t =>
      chain(t.company, c => c.name)
    ),
    traderCompanySiret: chain(formInput.trader, t =>
      chain(t.company, c => c.siret)
    ),
    traderCompanyAddress: chain(formInput.trader, t =>
      chain(t.company, c => c.address)
    ),
    traderCompanyContact: chain(formInput.trader, t =>
      chain(t.company, c => c.contact)
    ),
    traderCompanyPhone: chain(formInput.trader, t =>
      chain(t.company, c => c.phone)
    ),
    traderCompanyMail: chain(formInput.trader, t =>
      chain(t.company, c => c.mail)
    ),
    traderReceipt: chain(formInput.trader, t => t.receipt),
    traderDepartment: chain(formInput.trader, t => t.department),
    traderValidityLimit: chain(formInput.trader, t => t.validityLimit)
  });

  return flattened;
}

export function flattenTemporaryStorageDetailInput(
  tempStorageInput: TemporaryStorageDetailInput
): TemporaryStorageDetailCreateInput | TemporaryStorageDetailUpdateInput {
  return safeInput({
    destinationCompanyName: chain(tempStorageInput.destination, d =>
      chain(d.company, c => c.name)
    ),
    destinationCompanySiret: chain(tempStorageInput.destination, d =>
      chain(d.company, c => c.siret)
    ),
    destinationCompanyAddress: chain(tempStorageInput.destination, d =>
      chain(d.company, c => c.address)
    ),
    destinationCompanyContact: chain(tempStorageInput.destination, d =>
      chain(d.company, c => c.contact)
    ),
    destinationCompanyPhone: chain(tempStorageInput.destination, d =>
      chain(d.company, c => c.phone)
    ),
    destinationCompanyMail: chain(tempStorageInput.destination, d =>
      chain(d.company, c => c.mail)
    ),
    destinationCap: chain(tempStorageInput.destination, d => d.cap),
    destinationProcessingOperation: chain(
      tempStorageInput.destination,
      d => d.processingOperation
    )
  });
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
