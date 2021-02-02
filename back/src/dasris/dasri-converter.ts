import {
  Dasri as GqlDasri,
  DasriEmitter,
  DasriTransporter,
  DasriRecipient,
  DasriWasteDetails,
  FormCompany,
  DasriInput,
  DasriEmitterInput,
  DasriTransporterInput,
  DasriRecipientInput,
  DasriOperationInput,
  WorkSite,
  DasriEmission,
  DasriTransport,
  DasriReception,
  DasriOperation,
  DasriWasteAcceptation,
  DasriEmissionInput,
  DasriTransportInput,
  DasriReceptionInput,
  DasriPackagingInfo,
  DasriPackagingInfoInput
} from "../generated/graphql/types";
import { chain, nullIfNoValues, safeInput } from "../forms/form-converter";
import { Prisma, Dasri, DasriStatus, QuantityType } from "@prisma/client";

export function expandDasriFromDb(dasri: Dasri): GqlDasri {
  return {
    id: dasri.id,
    readableId: dasri.readableId,
    customId: dasri.customId,

    emitter: nullIfNoValues<DasriEmitter>({
      company: nullIfNoValues<FormCompany>({
        name: dasri.emitterCompanyName,
        siret: dasri.emitterCompanySiret,
        address: dasri.emitterCompanyAddress,
        phone: dasri.emitterCompanyPhone,
        mail: dasri.emitterCompanyMail
      }),
      customInfo: dasri.emitterCustomInfo,
      workSite: nullIfNoValues<WorkSite>({
        name: dasri.emitterWorkSiteName,
        address: dasri.emitterWorkSiteAddress,
        city: dasri.emitterWorkSiteCity,
        postalCode: dasri.emitterWorkSitePostalCode,
        infos: dasri.emitterWorkSiteInfos
      })
    }),
    emission: nullIfNoValues<DasriEmission>({
      wasteCode: dasri.wasteDetailsCode,
      handedOverAt: dasri.handedOverToTransporterAt?.toISOString(),
      signedBy: dasri.emissionSignedBy,
      signedAt: dasri.emissionSignedAt?.toISOString(),
      wasteDetails: nullIfNoValues<DasriWasteDetails>({
        quantity: dasri.emitterWasteQuantity,
        quantityType: dasri.emitterWasteQuantityType as QuantityType,
        volume: dasri.emitterWasteVolume,
        packagingInfos: dasri.emitterWastePackagingsInfo as DasriPackagingInfo[],
        onuCode: dasri.wasteDetailsOnuCode
      })
    }),

    transporter: nullIfNoValues<DasriTransporter>({
      company: nullIfNoValues<FormCompany>({
        name: dasri.transporterCompanyName,
        siret: dasri.transporterCompanySiret,
        address: dasri.transporterCompanyAddress,
        phone: dasri.transporterCompanyPhone,
        mail: dasri.transporterCompanyMail
      }),
      customInfo: dasri.transporterCustomInfo,
      receipt: dasri.transporterReceipt,
      receiptDepartment: dasri.transporterReceiptDepartment,
      receiptValidityLimit: dasri.transporterReceiptValidityLimit?.toISOString()
    }),
    transport: nullIfNoValues<DasriTransport>({
      wasteDetails: nullIfNoValues<DasriWasteDetails>({
        quantity: dasri.transporterWasteQuantity,
        quantityType: dasri.transporterWasteQuantityType as QuantityType,
        volume: dasri.transporterWasteVolume,
        packagingInfos: dasri.transporterWastePackagingsInfo as DasriPackagingInfo[]
      }),

      wasteAcceptation: nullIfNoValues<DasriWasteAcceptation>({
        status: dasri.transporterWasteAcceptationStatus,
        refusalReason: dasri.transporterWasteRefusalReason,
        refusedQuantity: dasri.transporterWasteRefusedQuantity
      }),
      takenOverAt: dasri.transporterTakenOverAt?.toISOString(),
      handedOverAt: dasri.handedOverToRecipientAt?.toISOString(),
      signedBy: dasri.transportSignedBy,
      signedAt: dasri.transportSignedAt?.toISOString()
    }),
    recipient: nullIfNoValues<DasriRecipient>({
      company: nullIfNoValues<FormCompany>({
        name: dasri.recipientCompanyName,
        siret: dasri.recipientCompanySiret,
        address: dasri.recipientCompanyAddress,
        phone: dasri.recipientCompanyPhone,
        mail: dasri.recipientCompanyMail
      }),
      customInfo: dasri.recipientCustomInfo
    }),

    reception: nullIfNoValues<DasriReception>({
      wasteDetails: nullIfNoValues<DasriWasteDetails>({
        quantity: dasri.recipientWasteQuantity,
        volume: dasri.recipientWasteVolume,
        packagingInfos: dasri.recipientWastePackagingsInfo as DasriPackagingInfo[]
      }),
      wasteAcceptation: nullIfNoValues<DasriWasteAcceptation>({
        status: dasri.recipientWasteAcceptationStatus,
        refusalReason: dasri.recipientWasteRefusalReason,
        refusedQuantity: dasri.recipientWasteRefusedQuantity
      }),
      receivedAt: dasri.receivedAt?.toISOString(),
      signedBy: dasri.receptionSignedBy,
      signedAt: dasri.receptionSignedAt?.toISOString()
    }),
    operation: nullIfNoValues<DasriOperation>({
      processingOperation: dasri.processingOperation,
      processedAt: dasri.processedAt?.toISOString(),
      signedBy: dasri.operationSignedBy,
      signedAt: dasri.operationSignedAt?.toISOString()
    }),
    createdAt: dasri.createdAt?.toISOString(),
    updatedAt: dasri.updatedAt?.toISOString(),
    status: dasri.status as DasriStatus
  };
}

type computeTotalVolumeFn = (
  packagingInfos: DasriPackagingInfoInput[]
) => number;
/**
 * Compute total volume according to packaging infos details
 */
const computeTotalVolume: computeTotalVolumeFn = packagingInfos => {
  if (!packagingInfos) {
    return undefined;
  }
  return packagingInfos.reduce(
    (acc, packaging) =>
      acc + (packaging.volume || 0) * (packaging.quantity || 0),
    0
  );
};

function flattenEmitterInput(input: { emitter?: DasriEmitterInput }) {
  return {
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
    emitterCustomInfo: chain(input.emitter, e => e.customInfo)
  };
}

function flattenEmissionInput(input: { emission?: DasriEmissionInput }) {
  if (!input?.emission) {
    return null;
  }
  const emitterWastePackagingsInfo = chain(input.emission, e =>
    chain(e.wasteDetails, w => w.packagingInfos)
  );
  return {
    wasteDetailsCode: chain(input.emission, e => e.wasteCode),
    wasteDetailsOnuCode: chain(input.emission, e =>
      chain(e.wasteDetails, w => w.onuCode)
    ),
    handedOverToTransporterAt: chain(input.emission, e =>
      e.handedOverAt ? new Date(e.handedOverAt) : null
    ),
    emitterWasteQuantity: chain(input.emission, e =>
      chain(e.wasteDetails, w => w.quantity)
    ),
    emitterWasteQuantityType: chain(input.emission, e =>
      chain(e.wasteDetails, w => w.quantityType)
    ),
    emitterWasteVolume: computeTotalVolume(emitterWastePackagingsInfo),
    emitterWastePackagingsInfo
  };
}
function flattenTransporterInput(input: {
  transporter?: DasriTransporterInput;
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

    transporterReceipt: chain(input.transporter, t => t.receipt),
    transporterReceiptDepartment: chain(
      input.transporter,
      t => t.receiptDepartment
    ),
    transporterReceiptValidityLimit: chain(input.transporter, t =>
      t.receiptValidityLimit
        ? new Date(t.receiptValidityLimit)
        : t.receiptValidityLimit
    ),
    transporterCustomInfo: chain(input.transporter, e => e.customInfo)
  });
}
function flattenTransportInput(input: { transport?: DasriTransportInput }) {
  const transporterWastePackagingsInfo = chain(input.transport, t =>
    chain(t.wasteDetails, w => w.packagingInfos)
  );
  return {
    transporterTakenOverAt: chain(input.transport, t =>
      t.takenOverAt ? new Date(t.takenOverAt) : t.takenOverAt
    ),
    handedOverToRecipientAt: chain(input.transport, t =>
      t.handedOverAt ? new Date(t.handedOverAt) : t.handedOverAt
    ),
    transporterWasteQuantity: chain(input.transport, t =>
      chain(t.wasteDetails, w => w.quantity)
    ),
    transporterWasteQuantityType: chain(input.transport, t =>
      chain(t.wasteDetails, w => w.quantityType)
    ),
    transporterWasteAcceptationStatus: chain(input.transport, t =>
      chain(t.wasteAcceptation, w => w.status)
    ),
    transporterWasteRefusedQuantity: chain(input.transport, t =>
      chain(t.wasteAcceptation, w => w.refusedQuantity)
    ),
    transporterWasteRefusalReason: chain(input.transport, t =>
      chain(t.wasteAcceptation, w => w.refusalReason)
    ),
    transporterWasteVolume: computeTotalVolume(transporterWastePackagingsInfo),
    transporterWastePackagingsInfo
  };
}

function flattenRecipientInput(input: { recipient?: DasriRecipientInput }) {
  return {
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
    ),
    recipientCustomInfo: chain(input.recipient, e => e.customInfo)
  };
}

function flattenReceptiontInput(input: { reception?: DasriReceptionInput }) {
  const recipientWastePackagingsInfo = chain(input.reception, r =>
    chain(r.wasteDetails, w => w.packagingInfos)
  );
  return {
    recipientWasteQuantity: chain(input.reception, r =>
      chain(r.wasteDetails, w => w.quantity)
    ),
    recipientWasteVolume: computeTotalVolume(recipientWastePackagingsInfo),
    receivedAt: chain(input.reception, r =>
      r.receivedAt ? new Date(r.receivedAt) : r.receivedAt
    ),

    recipientWastePackagingsInfo
  };
}

function flattenOperationInput(input: { operation?: DasriOperationInput }) {
  return {
    processingOperation: chain(input.operation, r => r.processingOperation),
    processedAt: chain(input.operation, r =>
      r.processedAt ? new Date(r.processedAt) : r.processedAt
    )
  };
}
export function flattenDasriInput(
  formInput: Pick<
    DasriInput,
    | "customId"
    | "emitter"
    | "emission"
    | "transporter"
    | "transport"
    | "recipient"
    | "reception"
    | "operation"
  >
): Partial<Prisma.DasriCreateInput> {
  return safeInput({
    customId: formInput.customId,
    ...flattenEmitterInput(formInput),
    ...flattenEmissionInput(formInput),
    ...flattenTransporterInput(formInput),
    ...flattenTransportInput(formInput),
    ...flattenRecipientInput(formInput),
    ...flattenReceptiontInput(formInput),
    ...flattenOperationInput(formInput)
  });
}
