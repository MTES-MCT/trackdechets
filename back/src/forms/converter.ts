import {
  BsddRevisionRequest,
  Prisma,
  BsddTransporter,
  TransportMode,
  IntermediaryFormAssociation
} from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import {
  chain,
  nullIfNoValues,
  prismaJsonNoNull,
  processDate,
  safeInput,
  undefinedOrDefault
} from "../common/converter";
import {
  InitialForm,
  Broker,
  BrokerInput,
  Destination,
  DestinationInput,
  EcoOrganismeInput,
  Emitter,
  EmitterInput,
  Form as GraphQLForm,
  FormCompany,
  FormEcoOrganisme,
  FormInput,
  FormRevisionRequestContent,
  FormRevisionRequestContentInput,
  FormRevisionRequestDestination,
  FormRevisionRequestRecipient,
  FormRevisionRequestTemporaryStorageDetail,
  FormRevisionRequestTemporaryStorer,
  FormRevisionRequestWasteDetails,
  FormStatus,
  ImportPaperFormInput,
  NextDestination,
  NextDestinationInput,
  NextSegmentInfoInput,
  PackagingInfo,
  ParcelNumber,
  ProcessedFormInput,
  ReceivedFormInput,
  Recipient,
  RecipientInput,
  SignatureFormInput,
  TemporaryStorageDetailInput,
  Trader,
  TraderInput,
  Transporter,
  TransporterInput,
  TransporterSignatureFormInput,
  TransportSegment as GraphQLTransportSegment,
  WasteDetails,
  WasteDetailsInput,
  WorkSite
} from "../generated/graphql/types";
import { prisma } from "@td/prisma";
import { extractPostalCode } from "../utils";
import { getFirstTransporterSync } from "./database";
import { FormForElastic } from "./elastic";

function flattenDestinationInput(input: {
  destination?: DestinationInput | null;
}): Partial<Prisma.FormCreateInput> {
  return {
    recipientCompanyName: chain(input.destination, d =>
      chain(d.company, c => c.name)
    ),
    recipientCompanySiret: chain(input.destination, d =>
      chain(d.company, c => c.siret)
    ),
    recipientCompanyAddress: chain(input.destination, d =>
      chain(d.company, c => c.address)
    ),
    recipientCompanyContact: chain(input.destination, d =>
      chain(d.company, c => c.contact)
    ),
    recipientCompanyPhone: chain(input.destination, d =>
      chain(d.company, c => c.phone)
    ),
    recipientCompanyMail: chain(input.destination, d =>
      chain(d.company, c => c.mail)
    ),
    recipientCap: chain(input.destination, d => d.cap),
    recipientProcessingOperation: chain(
      input.destination,
      d => d.processingOperation
    )
  };
}

function flattenWasteDetailsInput(input: {
  wasteDetails?: WasteDetailsInput | null;
}) {
  return {
    wasteDetailsCode: chain(input.wasteDetails, w => w.code),
    wasteDetailsOnuCode: chain(input.wasteDetails, w => w.onuCode),
    wasteDetailsPackagingInfos: prismaJsonNoNull(
      chain(input.wasteDetails, w => getProcessedPackagingInfos(w))
    ),
    wasteDetailsQuantity: chain(input.wasteDetails, w => w.quantity),
    wasteDetailsQuantityType: chain(input.wasteDetails, w => w.quantityType),
    wasteDetailsName: chain(input.wasteDetails, w => w.name),
    wasteDetailsConsistence: chain(input.wasteDetails, w => w.consistence),
    wasteDetailsPop: undefinedOrDefault(
      chain(input.wasteDetails, w => w.pop),
      false
    ),
    wasteDetailsIsDangerous: undefinedOrDefault(
      chain(input.wasteDetails, w => w.isDangerous),
      false
    ),
    wasteDetailsParcelNumbers: prismaJsonNoNull(
      chain(input.wasteDetails, w => undefinedOrDefault(w.parcelNumbers, []))
    ),
    wasteDetailsAnalysisReferences: undefinedOrDefault(
      chain(input.wasteDetails, w => w.analysisReferences),
      []
    ),
    wasteDetailsLandIdentifiers: undefinedOrDefault(
      chain(input.wasteDetails, w => undefinedOrDefault(w.landIdentifiers, [])),
      []
    ),
    wasteDetailsSampleNumber: chain(input.wasteDetails, w => w.sampleNumber)
  };
}

export function flattenTransporterInput(input: {
  transporter?: TransporterInput | null;
}) {
  return safeInput({
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
    transporterCompanyVatNumber: chain(input.transporter, t =>
      chain(t.company, c => c.vatNumber)
    ),
    transporterIsExemptedOfReceipt: chain(
      input.transporter,
      t => t.isExemptedOfReceipt
    ),
    // deprecated receipt fields, ignored
    transporterReceipt: chain(input.transporter, t => t.receipt),
    transporterDepartment: chain(input.transporter, t => t.department),
    transporterValidityLimit: chain(input.transporter, t => t.validityLimit),
    transporterNumberPlate: chain(input.transporter, t => t.numberPlate),
    transporterCustomInfo: chain(input.transporter, t => t.customInfo),
    transporterTransportMode: chain(input.transporter, t => t.mode)
  });
}

function flattenEmitterInput(input: { emitter?: EmitterInput | null }) {
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
    emitterIsPrivateIndividual: chain(
      input.emitter,
      e => e.isPrivateIndividual
    ),
    emitterIsForeignShip: chain(input.emitter, e => e.isForeignShip),
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
    emitterCompanyMail: chain(input.emitter, e =>
      chain(e.company, c => c.mail)
    ),
    emitterCompanyOmiNumber: chain(input.emitter, e =>
      chain(e.company, c => c.omiNumber)
    )
  };
}

function flattenRecipientInput(input: { recipient?: RecipientInput | null }) {
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

function flattenTraderInput(input: { trader?: TraderInput | null }) {
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
    traderValidityLimit: chain(input.trader, t => t.validityLimit)
  };
}

function flattenBrokerInput(input: { broker?: BrokerInput | null }) {
  return {
    brokerCompanyName: chain(input.broker, t => chain(t.company, c => c.name)),
    brokerCompanySiret: chain(input.broker, t =>
      chain(t.company, c => c.siret)
    ),
    brokerCompanyAddress: chain(input.broker, t =>
      chain(t.company, c => c.address)
    ),
    brokerCompanyContact: chain(input.broker, t =>
      chain(t.company, c => c.contact)
    ),
    brokerCompanyPhone: chain(input.broker, t =>
      chain(t.company, c => c.phone)
    ),
    brokerCompanyMail: chain(input.broker, t => chain(t.company, c => c.mail)),
    brokerReceipt: chain(input.broker, t => t.receipt),
    brokerDepartment: chain(input.broker, t => t.department),
    brokerValidityLimit: chain(input.broker, t =>
      t.validityLimit ? new Date(t.validityLimit) : null
    )
  };
}

function flattenEcoOrganismeInput(input: {
  ecoOrganisme?: EcoOrganismeInput | null;
}) {
  return {
    ecoOrganismeName: chain(input.ecoOrganisme, e => e.name),
    ecoOrganismeSiret: chain(input.ecoOrganisme, e => e.siret)
  };
}

function flattenNextDestinationInput(input: {
  nextDestination?: NextDestinationInput | null;
}) {
  return {
    nextDestinationProcessingOperation: chain(
      input.nextDestination,
      nd => nd.processingOperation
    ),
    nextDestinationNotificationNumber: chain(
      input.nextDestination,
      nd => nd.notificationNumber
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
    ),
    nextDestinationCompanyVatNumber: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.vatNumber)
    ),
    nextDestinationCompanyExtraEuropeanId: chain(input.nextDestination, nd =>
      chain(nd.company, c => c.extraEuropeanId)
    )
  };
}

export function flattenBsddRevisionRequestInput(
  reviewContent: FormRevisionRequestContentInput
) {
  return safeInput({
    isCanceled: undefinedOrDefault(
      chain(reviewContent, c => chain(c, r => r.isCanceled)),
      false
    ),
    recipientCap: chain(reviewContent, c => chain(c.recipient, r => r.cap)),
    wasteDetailsCode: chain(reviewContent, c =>
      chain(c.wasteDetails, w => w.code)
    ),
    wasteDetailsName: chain(reviewContent, c =>
      chain(c.wasteDetails, w => w.name)
    ),
    wasteDetailsPop: chain(reviewContent, c =>
      chain(c.wasteDetails, w => w.pop)
    ),
    wasteDetailsPackagingInfos: prismaJsonNoNull(
      chain(reviewContent, c => chain(c.wasteDetails, w => w.packagingInfos))
    ),
    quantityReceived: chain(reviewContent, c => c.quantityReceived),
    processingOperationDone: chain(
      reviewContent,
      c => c.processingOperationDone
    ),
    destinationOperationMode: chain(
      reviewContent,
      c => c.destinationOperationMode
    ),
    processingOperationDescription: chain(
      reviewContent,
      c => c.processingOperationDescription
    ),
    ...flattenTraderInput(reviewContent),
    ...flattenBrokerInput(reviewContent),
    temporaryStorageDestinationCap: chain(reviewContent, c =>
      chain(c.temporaryStorageDetail, t => chain(t.destination, d => d.cap))
    ),
    temporaryStorageTemporaryStorerQuantityReceived: chain(reviewContent, c =>
      chain(c.temporaryStorageDetail, t =>
        chain(t.temporaryStorer, s => s.quantityReceived)
      )
    ),
    temporaryStorageDestinationProcessingOperation: chain(reviewContent, c =>
      chain(c.temporaryStorageDetail, t =>
        chain(t.destination, d => d.processingOperation)
      )
    )
  });
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
    | "broker"
    | "ecoOrganisme"
  >
): Partial<Omit<Prisma.FormCreateInput, "temporaryStorageDetail">> {
  return safeInput({
    customId: formInput.customId,
    ...flattenEmitterInput(formInput),
    ...flattenRecipientInput(formInput),
    ...flattenWasteDetailsInput(formInput),
    ...flattenTraderInput(formInput),
    ...flattenBrokerInput(formInput),
    ...flattenEcoOrganismeInput(formInput)
  });
}

export function flattenProcessedFormInput(
  processedFormInput: ProcessedFormInput
): Partial<Prisma.FormCreateInput> {
  const { nextDestination, ...rest } = processedFormInput;
  return safeInput({
    ...rest,
    ...flattenNextDestinationInput(processedFormInput)
  });
}

export function flattenImportPaperFormInput(
  input: ImportPaperFormInput
): Partial<Prisma.FormCreateInput> {
  const { id, customId, signingInfo, receivedInfo, processedInfo, ...rest } =
    input;

  return safeInput({
    id: id !== null ? id : undefined,
    customId,
    ...flattenEmitterInput(rest),
    ...flattenEcoOrganismeInput(rest),
    ...flattenRecipientInput(rest),
    ...flattenWasteDetailsInput(rest),
    ...flattenTraderInput(rest),
    ...flattenBrokerInput(rest),
    ...flattenSigningInfo(signingInfo),
    ...flattenReceivedInfo(receivedInfo),
    ...flattenProcessedFormInput(processedInfo)
  });
}

function flattenSigningInfo(signingInfo: SignatureFormInput) {
  return safeInput(signingInfo);
}

function flattenReceivedInfo(receivedInfo: ReceivedFormInput) {
  return safeInput(receivedInfo);
}

export function flattenTemporaryStorageDetailInput(
  tempStorageInput: TemporaryStorageDetailInput
): Partial<Prisma.FormCreateInput> {
  return safeInput(flattenDestinationInput(tempStorageInput));
}

export function flattenSignedByTransporterInput(
  transporterSignatureFormInput: TransporterSignatureFormInput
) {
  return safeInput({
    ...transporterSignatureFormInput,
    packagingInfos: getProcessedPackagingInfos(transporterSignatureFormInput)
  });
}

export function flattenTransportSegmentInput(
  segmentInput: NextSegmentInfoInput
) {
  return safeInput({
    transporterCompanySiret: chain(segmentInput.transporter, t =>
      chain(t.company, c => c.siret)
    ),
    transporterCompanyVatNumber: chain(segmentInput.transporter, t =>
      chain(t.company, c => c.vatNumber)
    ),
    transporterCompanyName: chain(segmentInput.transporter, t =>
      chain(t.company, c => c.name)
    ),
    transporterCompanyAddress: chain(segmentInput.transporter, t =>
      chain(t.company, c => c.address)
    ),
    transporterCompanyContact: chain(segmentInput.transporter, t =>
      chain(t.company, c => c.contact)
    ),
    transporterCompanyMail: chain(segmentInput.transporter, t =>
      chain(t.company, c => c.mail)
    ),
    transporterCompanyPhone: chain(segmentInput.transporter, t =>
      chain(t.company, c => c.phone)
    ),
    transporterIsExemptedOfReceipt: chain(
      segmentInput.transporter,
      t => t.isExemptedOfReceipt
    ),
    transporterReceipt: chain(segmentInput.transporter, t => t.receipt),
    transporterDepartment: chain(segmentInput.transporter, t => t.department),
    transporterNumberPlate: chain(segmentInput.transporter, t => t.numberPlate),
    transporterValidityLimit: chain(
      segmentInput.transporter,
      t => t.validityLimit
    ),
    transporterTransportMode: segmentInput.mode
  });
}

export function expandTransporterFromDb(
  transporter: BsddTransporter
): Transporter | null {
  return nullIfNoValues<Transporter>({
    id: transporter.id,
    company: nullIfNoValues<FormCompany>({
      name: transporter.transporterCompanyName,
      orgId: getTransporterCompanyOrgId(transporter),
      siret: transporter.transporterCompanySiret,
      vatNumber: transporter.transporterCompanyVatNumber,
      address: transporter.transporterCompanyAddress,
      contact: transporter.transporterCompanyContact,
      phone: transporter.transporterCompanyPhone,
      mail: transporter.transporterCompanyMail
    }),
    isExemptedOfReceipt: transporter.transporterIsExemptedOfReceipt,
    receipt: transporter.transporterReceipt,
    department: transporter.transporterDepartment,
    validityLimit: processDate(transporter.transporterValidityLimit),
    numberPlate: transporter.transporterNumberPlate,
    customInfo: transporter.transporterCustomInfo,
    // transportMode has default value in DB but we do not want to return anything
    // if the transporter siret is not defined
    mode:
      !transporter.transporterCompanySiret &&
      transporter.transporterTransportMode === TransportMode.ROAD
        ? null
        : transporter.transporterTransportMode,
    takenOverAt: processDate(transporter.takenOverAt),
    takenOverBy: transporter.takenOverBy
  });
}

/**
 * Prisma form with optional computed fields
 */
export const expandableFormIncludes = Prisma.validator<Prisma.FormInclude>()({
  forwardedIn: { include: { transporters: true } },
  transporters: true
});
export type PrismaFormWithForwardedInAndTransporters = Prisma.FormGetPayload<{
  include: typeof expandableFormIncludes;
}>;

type FormGroupingItem = Prisma.FormGroupementGetPayload<{
  include: {
    initialForm: true;
  };
}>;

export async function getAndExpandFormFromDb(id: string) {
  const form = await prisma.form.findUniqueOrThrow({
    where: { id },
    include: expandableFormIncludes
  });
  return expandFormFromDb(form);
}
/**
 * Expand form data from db. Depending on the calling context,
 * certain related fields may be already computed or not. For example when
 * this function is called on a RawForm stored in Elasticsearch.
 * An optional data loader for `forwardedIn` may also be passed
 */
export function expandFormFromDb(
  form: PrismaFormWithForwardedInAndTransporters & {
    intermediaries?: IntermediaryFormAssociation[];
    grouping?: FormGroupingItem[];
  }
): GraphQLForm {
  const transporters = form.transporters ?? []; // Theoretically transporters should never be null. But for eg form.grouping.initialForm.forwardedIn it might happen
  const transporter = getFirstTransporterSync({ transporters }); // avoid retrieving transporters twice if it is already passed

  const forwardedIn = form.forwardedIn;
  const forwardedInTransporters = forwardedIn?.transporters ?? [];

  const forwardedInTransporter = getFirstTransporterSync({
    transporters: forwardedInTransporters
  });

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
      isPrivateIndividual: form.emitterIsPrivateIndividual,
      isForeignShip: form.emitterIsForeignShip,
      company: nullIfNoValues<FormCompany>({
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail,
        omiNumber: form.emitterCompanyOmiNumber
      })
    }),
    transportSegments: transporters
      .filter(t => t.number && t.number >= 2)
      .sort((s1, s2) => s1.number - s2.number)
      .map(segment => expandTransportSegmentFromDb(segment)),
    transporter: transporter ? expandTransporterFromDb(transporter) : null,
    transporters: transporters.map(t => expandTransporterFromDb(t)!),
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
      pop: form.wasteDetailsPop,
      isDangerous: form.wasteDetailsIsDangerous,
      parcelNumbers: form.wasteDetailsParcelNumbers as ParcelNumber[],
      analysisReferences: form.wasteDetailsAnalysisReferences,
      landIdentifiers: form.wasteDetailsLandIdentifiers,
      sampleNumber: form.wasteDetailsSampleNumber
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
      validityLimit: processDate(form.traderValidityLimit)
    }),
    broker: nullIfNoValues<Broker>({
      company: nullIfNoValues<FormCompany>({
        name: form.brokerCompanyName,
        siret: form.brokerCompanySiret,
        address: form.brokerCompanyAddress,
        contact: form.brokerCompanyContact,
        phone: form.brokerCompanyPhone,
        mail: form.brokerCompanyMail
      }),
      receipt: form.brokerReceipt,
      department: form.brokerDepartment,
      validityLimit: processDate(form.brokerValidityLimit)
    }),
    ecoOrganisme: nullIfNoValues<FormEcoOrganisme>({
      name: form.ecoOrganismeName,
      siret: form.ecoOrganismeSiret
    }),
    createdAt: processDate(form.createdAt),
    updatedAt: processDate(form.updatedAt),
    status: form.status as FormStatus,
    emittedAt: processDate(form.emittedAt),
    emittedBy: form.emittedBy,
    emittedByEcoOrganisme: form.emittedByEcoOrganisme,
    takenOverAt: processDate(form.takenOverAt),
    takenOverBy: form.takenOverBy,
    signedByTransporter: form.signedByTransporter,
    sentAt: processDate(form.sentAt),
    sentBy: form.sentBy,
    wasteAcceptationStatus: forwardedIn
      ? forwardedIn.wasteAcceptationStatus
      : form.wasteAcceptationStatus,
    wasteRefusalReason: forwardedIn
      ? forwardedIn.wasteRefusalReason
      : form.wasteRefusalReason,
    receivedBy: forwardedIn ? forwardedIn.receivedBy : form.receivedBy,
    receivedAt: processDate(
      forwardedIn ? forwardedIn.receivedAt : form.receivedAt
    ),
    signedAt: processDate(forwardedIn ? forwardedIn.signedAt : form.signedAt),
    quantityReceived: forwardedIn
      ? forwardedIn.quantityReceived
      : form.quantityReceived,
    quantityGrouped: form.quantityGrouped,
    processingOperationDone: forwardedIn
      ? forwardedIn.processingOperationDone
      : form.processingOperationDone,
    destinationOperationMode: form.destinationOperationMode,
    processingOperationDescription: forwardedIn
      ? forwardedIn.processingOperationDescription
      : form.processingOperationDescription,
    processedBy: forwardedIn ? forwardedIn.processedBy : form.processedBy,
    processedAt: processDate(
      forwardedIn ? forwardedIn.processedAt : form.processedAt
    ),
    noTraceability: forwardedIn
      ? forwardedIn.noTraceability
      : form.noTraceability,
    nextDestination: forwardedIn
      ? nullIfNoValues<NextDestination>({
          processingOperation: forwardedIn.nextDestinationProcessingOperation,
          notificationNumber: forwardedIn.nextDestinationNotificationNumber,
          company: nullIfNoValues<FormCompany>({
            name: forwardedIn.nextDestinationCompanyName,
            siret: forwardedIn.nextDestinationCompanySiret,
            vatNumber: forwardedIn.nextDestinationCompanyVatNumber,
            extraEuropeanId: forwardedIn.nextDestinationCompanyExtraEuropeanId,
            address: forwardedIn.nextDestinationCompanyAddress,
            country: forwardedIn.nextDestinationCompanyCountry,
            contact: forwardedIn.nextDestinationCompanyContact,
            phone: forwardedIn.nextDestinationCompanyPhone,
            mail: forwardedIn.nextDestinationCompanyMail
          })
        })
      : nullIfNoValues<NextDestination>({
          processingOperation: form.nextDestinationProcessingOperation,
          notificationNumber: form.nextDestinationNotificationNumber,
          company: nullIfNoValues<FormCompany>({
            name: form.nextDestinationCompanyName,
            siret: form.nextDestinationCompanySiret,
            vatNumber: form.nextDestinationCompanyVatNumber,
            extraEuropeanId: form.nextDestinationCompanyExtraEuropeanId,
            address: form.nextDestinationCompanyAddress,
            country: form.nextDestinationCompanyCountry,
            contact: form.nextDestinationCompanyContact,
            phone: form.nextDestinationCompanyPhone,
            mail: form.nextDestinationCompanyMail
          })
        }),
    currentTransporterSiret: form.currentTransporterOrgId,
    nextTransporterSiret: form.nextTransporterOrgId,
    // Intermediaries cannot be null in the gql model.
    // But for the `intermediaries` subresolver to know if the value was precalculated or not in here, we cannot return an empty array
    intermediaries: form.intermediaries ?? (undefined as any),
    grouping: form.grouping
      ? form.grouping.map(({ quantity, initialForm }) => ({
          form: expandInitialFormFromDb(initialForm),
          quantity
        }))
      : null,
    temporaryStorageDetail: forwardedIn
      ? {
          temporaryStorer: {
            quantityType: form.quantityReceivedType,
            quantityReceived: form.quantityReceived,
            wasteAcceptationStatus: form.wasteAcceptationStatus,
            wasteRefusalReason: form.wasteRefusalReason,
            receivedAt: processDate(form.receivedAt),
            receivedBy: form.receivedBy
          },
          transporter: forwardedInTransporter
            ? expandTransporterFromDb(forwardedInTransporter)
            : null,
          destination: nullIfNoValues<Destination>({
            cap: forwardedIn.recipientCap,
            processingOperation: forwardedIn.recipientProcessingOperation,
            company: nullIfNoValues<FormCompany>({
              name: forwardedIn.recipientCompanyName,
              siret: forwardedIn.recipientCompanySiret,
              address: forwardedIn.recipientCompanyAddress,
              contact: forwardedIn.recipientCompanyContact,
              phone: forwardedIn.recipientCompanyPhone,
              mail: forwardedIn.recipientCompanyMail
            }),
            isFilledByEmitter: false // DEPRECATED, always returns false
          }),
          wasteDetails: nullIfNoValues<WasteDetails>({
            code: forwardedIn.wasteDetailsCode,
            name: forwardedIn.wasteDetailsName,
            onuCode: forwardedIn.wasteDetailsOnuCode,
            packagingInfos:
              forwardedIn.wasteDetailsPackagingInfos as PackagingInfo[],
            // DEPRECATED - To remove with old packaging fields
            ...getDeprecatedPackagingApiFields(
              forwardedIn.wasteDetailsPackagingInfos as PackagingInfo[]
            ),
            quantity: forwardedIn.wasteDetailsQuantity,
            quantityType: forwardedIn.wasteDetailsQuantityType,
            consistence: forwardedIn.wasteDetailsConsistence,
            pop: forwardedIn.wasteDetailsPop,
            isDangerous: forwardedIn.wasteDetailsIsDangerous
          }),
          emittedAt: processDate(forwardedIn.emittedAt),
          emittedBy: forwardedIn.emittedBy,
          takenOverAt: processDate(forwardedIn.takenOverAt),
          takenOverBy: forwardedIn.takenOverBy,
          // Deprecated: Remplacé par takenOverAt
          signedAt: processDate(forwardedIn.takenOverAt),
          // Deprecated: Remplacé par emittedBy
          signedBy: forwardedIn.emittedBy
        }
      : null,
    metadata: undefined as any
  };
}

export function expandFormFromElastic(form: FormForElastic): GraphQLForm {
  const expandedForm = expandFormFromDb(form);

  return {
    ...expandedForm,
    metadata: {
      latestRevision:
        form.bsddRevisionRequests?.length > 0
          ? (form.bsddRevisionRequests.reduce(
              (latestRevision, currentRevision) => {
                if (
                  !latestRevision ||
                  currentRevision.updatedAt > latestRevision.updatedAt
                ) {
                  return currentRevision;
                }
                return latestRevision;
              }
            ) as any)
          : null
    }
  };
}

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export function expandInitialFormFromDb(
  prismaForm: Optional<
    PrismaFormWithForwardedInAndTransporters,
    "transporters" | "forwardedIn"
  >
): InitialForm {
  const {
    id,
    readableId,
    status,
    wasteDetails,
    emitter,
    recipient,
    transporter,
    takenOverAt,
    signedAt,
    quantityReceived,
    processingOperationDone,
    quantityGrouped
  } = expandFormFromDb({
    ...prismaForm,
    transporters: prismaForm.transporters ?? [],
    forwardedIn: prismaForm.forwardedIn ?? null
  });

  const hasPickupSite =
    emitter?.workSite?.postalCode && emitter.workSite.postalCode.length > 0;

  return {
    id,
    readableId,
    status,
    wasteDetails,
    emitter,
    emitterPostalCode: hasPickupSite
      ? emitter?.workSite?.postalCode
      : extractPostalCode(emitter?.company?.address),
    takenOverAt: processDate(takenOverAt),
    signedAt: processDate(signedAt),
    recipient,
    transporter,
    quantityReceived,
    quantityGrouped,
    processingOperationDone
  };
}

export function expandTransportSegmentFromDb(
  segment: BsddTransporter
): GraphQLTransportSegment {
  return {
    id: segment.id,
    // GraphQLTransportSegment specifications was not changed to previousTransporterCompanyOrgId
    // in order to keep the public API intact
    previousTransporterCompanySiret: segment.previousTransporterCompanyOrgId,
    transporter: nullIfNoValues({
      id: segment.id,
      company: nullIfNoValues({
        name: segment.transporterCompanyName,
        siret: segment.transporterCompanySiret,
        orgId: segment.transporterCompanySiret?.length
          ? segment.transporterCompanySiret
          : segment.transporterCompanyVatNumber,
        vatNumber: segment.transporterCompanyVatNumber,
        address: segment.transporterCompanyAddress,
        contact: segment.transporterCompanyContact,
        phone: segment.transporterCompanyPhone,
        mail: segment.transporterCompanyMail
      }),
      isExemptedOfReceipt: segment.transporterIsExemptedOfReceipt,
      receipt: segment.transporterReceipt,
      department: segment.transporterDepartment,
      validityLimit: processDate(segment.transporterValidityLimit),
      numberPlate: segment.transporterNumberPlate,
      customInfo: null
    }),
    mode: segment.transporterTransportMode,
    takenOverAt: processDate(segment.takenOverAt),
    takenOverBy: segment.takenOverBy,
    readyToTakeOver: segment.readyToTakeOver,
    segmentNumber: segment.number
  };
}

export function expandBsddRevisionRequestContent(
  bsddRevisionRequest: BsddRevisionRequest
): FormRevisionRequestContent {
  return {
    wasteDetails: nullIfNoValues<FormRevisionRequestWasteDetails>({
      code: bsddRevisionRequest.wasteDetailsCode,
      name: bsddRevisionRequest.wasteDetailsName,
      pop: bsddRevisionRequest.wasteDetailsPop,
      packagingInfos:
        bsddRevisionRequest.wasteDetailsPackagingInfos as PackagingInfo[]
    }),
    trader: nullIfNoValues<Trader>({
      company: nullIfNoValues<FormCompany>({
        name: bsddRevisionRequest.traderCompanyName,
        siret: bsddRevisionRequest.traderCompanySiret,
        address: bsddRevisionRequest.traderCompanyAddress,
        contact: bsddRevisionRequest.traderCompanyContact,
        phone: bsddRevisionRequest.traderCompanyPhone,
        mail: bsddRevisionRequest.traderCompanyMail
      }),
      receipt: bsddRevisionRequest.traderReceipt,
      department: bsddRevisionRequest.traderDepartment,
      validityLimit: bsddRevisionRequest.traderValidityLimit
    }),
    broker: nullIfNoValues<Broker>({
      company: nullIfNoValues<FormCompany>({
        name: bsddRevisionRequest.brokerCompanyName,
        siret: bsddRevisionRequest.brokerCompanySiret,
        address: bsddRevisionRequest.brokerCompanyAddress,
        contact: bsddRevisionRequest.brokerCompanyContact,
        phone: bsddRevisionRequest.brokerCompanyPhone,
        mail: bsddRevisionRequest.brokerCompanyMail
      }),
      receipt: bsddRevisionRequest.brokerReceipt,
      department: bsddRevisionRequest.brokerDepartment,
      validityLimit: bsddRevisionRequest.brokerValidityLimit
    }),
    recipient: nullIfNoValues<FormRevisionRequestRecipient>({
      cap: bsddRevisionRequest.recipientCap
    }),
    quantityReceived: bsddRevisionRequest.quantityReceived,
    processingOperationDone: bsddRevisionRequest.processingOperationDone,
    destinationOperationMode: bsddRevisionRequest.destinationOperationMode,
    processingOperationDescription:
      bsddRevisionRequest.processingOperationDescription,
    temporaryStorageDetail:
      nullIfNoValues<FormRevisionRequestTemporaryStorageDetail>({
        temporaryStorer: nullIfNoValues<FormRevisionRequestTemporaryStorer>({
          quantityReceived:
            bsddRevisionRequest.temporaryStorageTemporaryStorerQuantityReceived
        }),
        destination: nullIfNoValues<FormRevisionRequestDestination>({
          cap: bsddRevisionRequest.temporaryStorageDestinationCap,
          processingOperation:
            bsddRevisionRequest.temporaryStorageDestinationProcessingOperation
        })
      }),
    isCanceled: bsddRevisionRequest.isCanceled
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

  // Otherwise return packagingInfos "as is".
  // Always default to an empty array to avoid unhandled `null` for JSON fields in prisma
  return undefinedOrDefault(wasteDetails.packagingInfos, []);
}
