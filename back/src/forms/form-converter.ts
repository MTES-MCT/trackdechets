import {
  Form as PrismaForm,
  TemporaryStorageDetail as PrismaTemporaryStorageDetail,
  TransportSegment as PrismaTransportSegment,
  Prisma
} from "@prisma/client";
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
  FormEcoOrganisme,
  NextDestination,
  FormInput,
  TemporaryStorageDetailInput,
  EmitterInput,
  ProcessedFormInput,
  ResealedFormInput,
  DestinationInput,
  WasteDetailsInput,
  TransporterInput,
  ResentFormInput,
  RecipientInput,
  TraderInput,
  NextDestinationInput,
  ImportPaperFormInput,
  EcoOrganismeInput,
  PackagingInfo,
  TransporterSignatureFormInput,
  SignatureFormInput,
  ReceivedFormInput
} from "../generated/graphql/types";

export function flattenObjectForDb(
  input,
  previousKeys = [],
  dbObject = {}
): Partial<PrismaForm> {
  const relations = ["temporaryStorageDetail"];

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
 * Return null if all object values are null
 * obj otherwise
 */
export function nullIfNoValues<T>(obj: T): T | null {
  return Object.values(obj).some(v => v !== null) ? obj : null;
}

/**
 * Discard undefined fields in a flatten input
 * It is used to prevent overriding existing data when
 * updating records
 */
export function safeInput<K>(obj: K): Partial<K> {
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
  if (o === undefined) {
    return undefined;
  }
  return getter(o);
}

function flattenDestinationInput(input: {
  destination?: DestinationInput;
}): Prisma.TemporaryStorageDetailCreateInput {
  return {
    destinationCompanyName: chain(input.destination, d =>
      chain(d.company, c => c.name)
    ),
    destinationCompanySiret: chain(input.destination, d =>
      chain(d.company, c => c.siret)
    ),
    destinationCompanyAddress: chain(input.destination, d =>
      chain(d.company, c => c.address)
    ),
    destinationCompanyContact: chain(input.destination, d =>
      chain(d.company, c => c.contact)
    ),
    destinationCompanyPhone: chain(input.destination, d =>
      chain(d.company, c => c.phone)
    ),
    destinationCompanyMail: chain(input.destination, d =>
      chain(d.company, c => c.mail)
    ),
    destinationCap: chain(input.destination, d => d.cap),
    destinationProcessingOperation: chain(
      input.destination,
      d => d.processingOperation
    )
  };
}

function flattenWasteDetailsInput(input: { wasteDetails?: WasteDetailsInput }) {
  return {
    wasteDetailsCode: chain(input.wasteDetails, w => w.code),
    wasteDetailsOnuCode: chain(input.wasteDetails, w => w.onuCode),
    wasteDetailsPackagingInfos: chain(input.wasteDetails, w =>
      getProcessedPackagingInfos(w)
    ),
    wasteDetailsQuantity: chain(input.wasteDetails, w => w.quantity),
    wasteDetailsQuantityType: chain(input.wasteDetails, w => w.quantityType),
    wasteDetailsName: chain(input.wasteDetails, w => w.name),
    wasteDetailsConsistence: chain(input.wasteDetails, w => w.consistence),
    wasteDetailsPop: chain(input.wasteDetails, w => w.pop)
  };
}

function flattenTransporterInput(input: { transporter?: TransporterInput }) {
  return {
    transporterCompanyName: chain(input.transporter, t =>
      chain(t.company, c => c.name)
    ),
    transporterCompanySiret: chain(input.transporter, t =>
      chain(t.company, c => c.siret)
    ),
    transporterCompanyAddress: chain(input.transporter, t =>
      chain(t.company, c => c.address)
    ),
    transporterCompanyContact: chain(input.transporter, t =>
      chain(t.company, c => c.contact)
    ),
    transporterCompanyPhone: chain(input.transporter, t =>
      chain(t.company, c => c.phone)
    ),
    transporterCompanyMail: chain(input.transporter, t =>
      chain(t.company, c => c.mail)
    ),
    transporterIsExemptedOfReceipt: chain(
      input.transporter,
      t => t.isExemptedOfReceipt
    ),
    transporterReceipt: chain(input.transporter, t => t.receipt),
    transporterDepartment: chain(input.transporter, t => t.department),
    transporterValidityLimit: chain(input.transporter, t =>
      t.validityLimit ? new Date(t.validityLimit) : null
    ),
    transporterNumberPlate: chain(input.transporter, t => t.numberPlate),
    transporterCustomInfo: chain(input.transporter, t => t.customInfo)
  };
}

function flattenEmitterInput(input: { emitter?: EmitterInput }) {
  return {
    emitterType: chain(input.emitter, e => e.type),
    emitterPickupSite: chain(input.emitter, e => e.pickupSite),
    emitterWorkSiteName: chain(input.emitter, e =>
      chain(e.workSite, w => w.name)
    ),
    emitterWorkSiteAddress: chain(input.emitter, e =>
      chain(e.workSite, w => w.address)
    ),
    emitterWorkSiteCity: chain(input.emitter, e =>
      chain(e.workSite, w => w.city)
    ),
    emitterWorkSitePostalCode: chain(input.emitter, e =>
      chain(e.workSite, w => w.postalCode)
    ),
    emitterWorkSiteInfos: chain(input.emitter, e =>
      chain(e.workSite, w => w.infos)
    ),
    emitterCompanyName: chain(input.emitter, e =>
      chain(e.company, c => c.name)
    ),
    emitterCompanySiret: chain(input.emitter, e =>
      chain(e.company, c => c.siret)
    ),
    emitterCompanyAddress: chain(input.emitter, e =>
      chain(e.company, c => c.address)
    ),
    emitterCompanyContact: chain(input.emitter, e =>
      chain(e.company, c => c.contact)
    ),
    emitterCompanyPhone: chain(input.emitter, e =>
      chain(e.company, c => c.phone)
    ),
    emitterCompanyMail: chain(input.emitter, e => chain(e.company, c => c.mail))
  };
}

function flattenRecipientInput(input: { recipient?: RecipientInput }) {
  return {
    recipientCap: chain(input.recipient, r => r.cap),
    recipientProcessingOperation: chain(
      input.recipient,
      r => r.processingOperation
    ),
    recipientIsTempStorage: chain(input.recipient, r => r.isTempStorage),
    recipientCompanyName: chain(input.recipient, r =>
      chain(r.company, c => c.name)
    ),
    recipientCompanySiret: chain(input.recipient, r =>
      chain(r.company, c => c.siret)
    ),
    recipientCompanyAddress: chain(input.recipient, r =>
      chain(r.company, c => c.address)
    ),
    recipientCompanyContact: chain(input.recipient, r =>
      chain(r.company, c => c.contact)
    ),
    recipientCompanyPhone: chain(input.recipient, r =>
      chain(r.company, c => c.phone)
    ),
    recipientCompanyMail: chain(input.recipient, r =>
      chain(r.company, c => c.mail)
    )
  };
}

function flattenTraderInput(input: { trader?: TraderInput }) {
  return {
    traderCompanyName: chain(input.trader, t => chain(t.company, c => c.name)),
    traderCompanySiret: chain(input.trader, t =>
      chain(t.company, c => c.siret)
    ),
    traderCompanyAddress: chain(input.trader, t =>
      chain(t.company, c => c.address)
    ),
    traderCompanyContact: chain(input.trader, t =>
      chain(t.company, c => c.contact)
    ),
    traderCompanyPhone: chain(input.trader, t =>
      chain(t.company, c => c.phone)
    ),
    traderCompanyMail: chain(input.trader, t => chain(t.company, c => c.mail)),
    traderReceipt: chain(input.trader, t => t.receipt),
    traderDepartment: chain(input.trader, t => t.department),
    traderValidityLimit: chain(input.trader, t =>
      t.validityLimit ? new Date(t.validityLimit) : null
    )
  };
}

function flattenEcoOrganismeInput(input: { ecoOrganisme?: EcoOrganismeInput }) {
  return {
    ecoOrganismeName: chain(input.ecoOrganisme, e => e.name),
    ecoOrganismeSiret: chain(input.ecoOrganisme, e => e.siret)
  };
}

function flattenNextDestinationInput(input: {
  nextDestination?: NextDestinationInput;
}) {
  return {
    nextDestinationProcessingOperation: chain(
      input.nextDestination,
      nd => nd.processingOperation
    ),
    nextDestinationCompanySiret: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.siret)
    ),
    nextDestinationCompanyAddress: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.address)
    ),
    nextDestinationCompanyCountry: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.country)
    ),
    nextDestinationCompanyContact: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.contact)
    ),
    nextDestinationCompanyMail: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.mail)
    ),
    nextDestinationCompanyName: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.name)
    ),
    nextDestinationCompanyPhone: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.phone)
    )
  };
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
    | "ecoOrganisme"
  >
): Partial<Prisma.FormCreateInput> {
  return safeInput({
    customId: formInput.customId,
    ...flattenEmitterInput(formInput),
    ...flattenRecipientInput(formInput),
    ...flattenTransporterInput(formInput),
    ...flattenWasteDetailsInput(formInput),
    ...flattenTraderInput(formInput),
    ...flattenEcoOrganismeInput(formInput)
  });
}

export function flattenProcessedFormInput(
  processedFormInput: ProcessedFormInput
): Partial<Prisma.FormCreateInput> {
  const { nextDestination, ...rest } = processedFormInput;
  return safeInput({
    ...rest,
    processedAt: rest.processedAt.toISOString(),
    ...flattenNextDestinationInput(processedFormInput)
  });
}

export function flattenImportPaperFormInput(
  input: ImportPaperFormInput
): Partial<Prisma.FormCreateInput> {
  const {
    id,
    customId,
    signingInfo,
    receivedInfo,
    processedInfo,
    ...rest
  } = input;

  return safeInput({
    id,
    customId,
    ...flattenEmitterInput(rest),
    ...flattenEcoOrganismeInput(rest),
    ...flattenRecipientInput(rest),
    ...flattenTransporterInput(rest),
    ...flattenWasteDetailsInput(rest),
    ...flattenTraderInput(rest),
    ...flattenSigningInfo(signingInfo),
    ...flattenReceivedInfo(receivedInfo),
    ...flattenProcessedFormInput(processedInfo)
  });
}

function flattenSigningInfo(signingInfo: SignatureFormInput) {
  return safeInput({
    ...signingInfo,
    ...(signingInfo.sentAt && { sentAt: new Date(signingInfo.sentAt) })
  });
}

function flattenReceivedInfo(receivedInfo: ReceivedFormInput) {
  return safeInput({
    ...receivedInfo,
    ...(receivedInfo.receivedAt && {
      receivedAt: new Date(receivedInfo.receivedAt)
    }),
    ...(receivedInfo.signedAt && { signedAt: new Date(receivedInfo.signedAt) })
  });
}

export function flattenTemporaryStorageDetailInput(
  tempStorageInput: TemporaryStorageDetailInput
): Prisma.TemporaryStorageDetailCreateInput {
  return safeInput(flattenDestinationInput(tempStorageInput));
}

export function flattenResealedFormInput(
  resealedFormInput: ResealedFormInput
): Prisma.TemporaryStorageDetailUpdateInput {
  return safeInput({
    ...flattenDestinationInput(resealedFormInput),
    ...flattenWasteDetailsInput(resealedFormInput),
    ...flattenTransporterInput(resealedFormInput)
  });
}

export function flattenResentFormInput(
  resentFormInput: ResentFormInput
): Prisma.TemporaryStorageDetailUpdateInput {
  return safeInput({
    ...flattenDestinationInput(resentFormInput),
    ...flattenWasteDetailsInput(resentFormInput),
    ...flattenTransporterInput(resentFormInput),
    signedBy: resentFormInput.signedBy,
    signedAt: resentFormInput.signedAt
      ? new Date(resentFormInput.signedAt)
      : null
  });
}

export function flattenSignedByTransporterInput(
  transporterSignatureFormInput: TransporterSignatureFormInput
) {
  return safeInput({
    ...transporterSignatureFormInput,
    packagingInfos: getProcessedPackagingInfos(transporterSignatureFormInput)
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
    isImportedFromPaper: form.isImportedFromPaper,
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
      packagingInfos: form.wasteDetailsPackagingInfos as PackagingInfo[],
      // DEPRECATED - To remove with old packaging fields
      ...getDeprecatedPackagingApiFields(
        form.wasteDetailsPackagingInfos as PackagingInfo[]
      ),
      quantity: form.wasteDetailsQuantity,
      quantityType: form.wasteDetailsQuantityType,
      consistence: form.wasteDetailsConsistence,
      pop: form.wasteDetailsPop
    }),
    trader: nullIfNoValues<Trader>({
      company: nullIfNoValues<FormCompany>({
        name: form.traderCompanyName,
        siret: form.traderCompanySiret,
        address: form.traderCompanyAddress,
        contact: form.traderCompanyContact,
        phone: form.traderCompanyPhone,
        mail: form.traderCompanyMail
      }),
      receipt: form.traderReceipt,
      department: form.traderDepartment,
      validityLimit: form.traderValidityLimit
    }),
    ecoOrganisme: nullIfNoValues<FormEcoOrganisme>({
      name: form.ecoOrganismeName,
      siret: form.ecoOrganismeSiret
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
    processedAt: new Date(form.processedAt),
    noTraceability: form.noTraceability,
    nextDestination: nullIfNoValues<NextDestination>({
      processingOperation: form.nextDestinationProcessingOperation,
      company: nullIfNoValues<FormCompany>({
        name: form.nextDestinationCompanyName,
        siret: form.nextDestinationCompanySiret,
        address: form.nextDestinationCompanyAddress,
        country: form.nextDestinationCompanyCountry,
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
      packagingInfos: temporaryStorageDetail.wasteDetailsPackagingInfos as PackagingInfo[],
      // DEPRECATED - To remove with old packaging fields
      ...getDeprecatedPackagingApiFields(
        temporaryStorageDetail.wasteDetailsPackagingInfos as PackagingInfo[]
      ),
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

/**
 * `packagings`, `otherPackaging` and `numberOfPackages` are DEPRECATED
 * For retro compatibility, calculate their values by reading `packagingInfos`
 * @param packagingInfos
 */
function getDeprecatedPackagingApiFields(packagingInfos: PackagingInfo[]) {
  return {
    packagings: chain(packagingInfos, pi => pi.map(pi => pi.type)),
    otherPackaging: chain(
      packagingInfos,
      pi => pi.find(pi => pi.type === "AUTRE")?.other
    ),
    numberOfPackages: chain(packagingInfos, pi =>
      pi.reduce((prev, cur) => prev + cur.quantity, 0)
    )
  };
}

/**
 * `packagings`, `otherPackaging` and `numberOfPackages` are DEPRECATED
 * But they can still be passed as input instead of `packagingInfos`
 * So we calculate the `packagingInfos` to store in DB based on their values
 * @param wasteDetails
 */
function getProcessedPackagingInfos(wasteDetails: Partial<WasteDetailsInput>) {
  // if deprecated `packagings` field is passed and `packagingInfos` is not passed
  // convert old packagings to new packaging info
  if (wasteDetails.packagings && !wasteDetails.packagingInfos) {
    const packagings = wasteDetails.packagings;
    const numberOfPackages = wasteDetails.numberOfPackages ?? 1;
    const maxPackagesPerPackaging = Math.ceil(
      numberOfPackages / packagings.length
    );

    return packagings.map((type, idx) => ({
      type,
      other: type === "AUTRE" ? wasteDetails.otherPackaging : null,
      quantity: Math.max(
        0,
        Math.min(
          maxPackagesPerPackaging,
          numberOfPackages - maxPackagesPerPackaging * idx
        )
      )
    }));
  }

  // otherwise return packagingInfos "as is". It can be null or undefined
  return wasteDetails.packagingInfos;
}
