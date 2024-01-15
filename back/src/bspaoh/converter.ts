import {
  nullIfNoValues,
  safeInput,
  processDate,
  chain,
  undefinedOrDefault
} from "../common/converter";
import {
  FormCompany,
  Signature,
  Bspaoh as GraphqlBspaoh,
  BspaohPackaging,
  PickupSite,
  BspaohEmitter,
  BspaohTransporter,
  BspaohEmission,
  BspaohDestination,
  BspaohReception,
  BspaohOperation,
  BspaohTransportInput,
  BspaohTransporterInput,
  BspaohWaste,
  BspaohDestinationInput,
  BspaohInput,
  BspaohEmitterInput,
  BspaohEmissionInput,
  BspaohReceptionInput,
  BspaohOperationInput,
  BspaohWasteInput,
  BspaohWasteDetail,
  BspaohWasteWeight,
  BspaohPackagingInput,
  InputMaybe,
  BspaohHandedOverToDestination,
  BspaohWasteAcceptation,
  BspaohPackagingAcceptationStatus
} from "../generated/graphql/types";
import {
  BspaohTransporter as PrismaBspaohTransporter,
  BspaohStatus,
  Bspaoh as PrismaBspaoh,
  BspaohType
} from "@prisma/client";
import { BspaohForElastic } from "./elastic";
import { getTransporterCompanyOrgId } from "@td/constants";
import { PrismaBspaohWithTransporters } from "./types";

export function getFirstTransporterSync(bspaoh: {
  transporters: PrismaBspaohTransporter[] | null;
}): PrismaBspaohTransporter | null {
  const { transporters } = bspaoh;
  if (!transporters) return null;
  const firstTransporter = transporters.find(t => t.number === 1);
  return firstTransporter ?? null;
}

const getWastepackagingAcceptationStatus = (
  wastePackaging,
  packagingsAcceptation
): BspaohPackagingAcceptationStatus => {
  const found = packagingsAcceptation.find(el => el.id === wastePackaging.id);
  if (!found) {
    return "PENDING";
  }
  return found.acceptation;
};

const formatPackagings = (bspaoh: PrismaBspaoh) => {
  const { wastePackagings } = bspaoh;
  if (!wastePackagings || !Array.isArray(wastePackagings)) {
    return [];
  }
  return wastePackagings?.map(p => ({
    ...(p as object),
    acceptation: getWastepackagingAcceptationStatus(
      p,
      bspaoh.destinationReceptionWastePackagingsAcceptation
    )
  }));
};

export function expandBspaohFromDb(
  bspaoh: PrismaBspaohWithTransporters
): GraphqlBspaoh {
  const transporters = bspaoh.transporters ?? [];
  const transporter = getFirstTransporterSync({ transporters });

  return {
    id: bspaoh.id,
    createdAt: processDate(bspaoh.createdAt),
    updatedAt: processDate(bspaoh.updatedAt),
    isDraft: bspaoh.status === BspaohStatus.DRAFT,
    status:
      bspaoh.status === BspaohStatus.DRAFT
        ? BspaohStatus.INITIAL
        : bspaoh.status,
    waste: nullIfNoValues<BspaohWaste>({
      code: bspaoh.wasteCode,
      adr: bspaoh.wasteAdr,
      type: bspaoh.wasteType,
      packagings: formatPackagings(bspaoh) as BspaohPackaging[]
    }),
    emitter: nullIfNoValues<BspaohEmitter>({
      company: nullIfNoValues<FormCompany>({
        name: bspaoh.emitterCompanyName,
        siret: bspaoh.emitterCompanySiret,
        address: bspaoh.emitterCompanyAddress,
        contact: bspaoh.emitterCompanyContact,
        phone: bspaoh.emitterCompanyPhone,
        mail: bspaoh.emitterCompanyMail
      }),
      customInfo: bspaoh.emitterCustomInfo,
      pickupSite: nullIfNoValues<PickupSite>({
        name: bspaoh.emitterPickupSiteName,
        address: bspaoh.emitterPickupSiteAddress,
        city: bspaoh.emitterPickupSiteCity,
        postalCode: bspaoh.emitterPickupSitePostalCode,
        infos: bspaoh.emitterPickupSiteInfos
      }),
      emission: nullIfNoValues<BspaohEmission>({
        detail: nullIfNoValues<BspaohWasteDetail>({
          quantity: bspaoh.emitterWasteQuantityValue,
          weight: nullIfNoValues<BspaohWasteWeight>({
            value: bspaoh.emitterWasteWeightValue,
            isEstimate: bspaoh.emitterWasteWeightIsEstimate
          })
        }),
        signature: nullIfNoValues<Signature>({
          author: bspaoh.emitterEmissionSignatureAuthor,
          date: processDate(bspaoh.emitterEmissionSignatureDate)
        })
      })
    }),

    destination: nullIfNoValues<BspaohDestination>({
      company: nullIfNoValues<FormCompany>({
        name: bspaoh.destinationCompanyName,
        siret: bspaoh.destinationCompanySiret,
        address: bspaoh.destinationCompanyAddress,
        contact: bspaoh.destinationCompanyContact,
        phone: bspaoh.destinationCompanyPhone,
        mail: bspaoh.destinationCompanyMail
      }),
      cap: bspaoh.destinationCap,
      customInfo: bspaoh.destinationCustomInfo,
      handedOverToDestination: nullIfNoValues<BspaohHandedOverToDestination>({
        date: bspaoh.handedOverToDestinationDate,
        signature: nullIfNoValues<Signature>({
          author: bspaoh.handedOverToDestinationSignatureAuthor,
          date: processDate(bspaoh.handedOverToDestinationSignatureDate)
        })
      }),
      reception: nullIfNoValues<BspaohReception>({
        acceptation: nullIfNoValues<BspaohWasteAcceptation>({
          status: bspaoh.destinationReceptionAcceptationStatus,
          refusalReason: bspaoh.destinationReceptionWasteRefusalReason
        }),
        date: processDate(bspaoh.destinationReceptionDate),
        detail: nullIfNoValues<BspaohWasteDetail>({
          quantity: bspaoh.destinationReceptionWasteQuantityValue,
          weight: nullIfNoValues<BspaohWasteWeight>({
            value: bspaoh.destinationReceptionWasteWeightValue,
            isEstimate: bspaoh.destinationReceptionWasteWeightIsEstimate
          })
        }),
        signature: nullIfNoValues<Signature>({
          author: bspaoh.destinationReceptionSignatureAuthor,
          date: processDate(bspaoh.destinationReceptionSignatureDate)
        })
      }),
      operation: nullIfNoValues<BspaohOperation>({
        code: bspaoh.destinationOperationCode,

        date: processDate(bspaoh.destinationOperationDate),

        signature: nullIfNoValues<Signature>({
          author: bspaoh.destinationOperationSignatureAuthor,
          date: processDate(bspaoh.destinationOperationSignatureDate)
        })
      })
    }),
    transporter: transporter ? expandTransporterFromDb(transporter) : null,

    transporters: [],

    metadata: null as any
  };
}

export function expandTransporterFromDb(
  transporter: PrismaBspaohTransporter
): BspaohTransporter | null {
  return nullIfNoValues<BspaohTransporter>({
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
    customInfo: transporter.transporterCustomInfo,
    recepisse: nullIfNoValues({
      isExempted: transporter.transporterRecepisseIsExempted,
      department: transporter.transporterRecepisseDepartment,
      number: transporter.transporterRecepisseNumber,
      validityLimit: processDate(transporter.transporterRecepisseValidityLimit)
    }),
    transport: {
      mode: transporter.transporterTransportMode,
      plates: transporter.transporterTransportPlates,
      takenOverAt: processDate(transporter.transporterTakenOverAt),
      signature: nullIfNoValues<Signature>({
        author: transporter.transporterTransportSignatureAuthor,
        date: processDate(transporter.transporterTransportSignatureDate)
      })
    }
  });
}

function flattenEmissionInput(
  input?: { emission?: BspaohEmissionInput | null } | null
) {
  if (!input?.emission) {
    return null;
  }

  return {
    emitterWasteWeightValue: chain(input.emission, e =>
      chain(e.detail, d => chain(d.weight, w => w.value))
    ),
    emitterWasteWeightIsEstimate: chain(input.emission, e =>
      chain(e.detail, d => chain(d.weight, w => w.isEstimate))
    ),
    emitterWasteQuantityValue: chain(input.emission, e =>
      chain(e.detail, d => d.quantity)
    )
  };
}

function flattenEmitterInput(input: {
  emitter?: BspaohEmitterInput | null;
  transporter?: BspaohTransporterInput | null;
}) {
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
    emitterPickupSiteName: chain(input.emitter, e =>
      chain(e.pickupSite, w => w.name)
    ),
    emitterPickupSiteAddress: chain(input.emitter, e =>
      chain(e.pickupSite, w => w.address)
    ),
    emitterPickupSiteCity: chain(input.emitter, e =>
      chain(e.pickupSite, w => w.city)
    ),
    emitterPickupSitePostalCode: chain(input.emitter, e =>
      chain(e.pickupSite, w => w.postalCode)
    ),
    emitterPickupSiteInfos: chain(input.emitter, e =>
      chain(e.pickupSite, w => w.infos)
    ),
    emitterCustomInfo: chain(input.emitter, e => e.customInfo),
    ...flattenEmissionInput(input.emitter),
    transporterTransportTakenOverAt: chain(input.transporter, t =>
      chain(t.transport, t =>
        t.takenOverAt ? new Date(t.takenOverAt) : t.takenOverAt
      )
    )
  };
}

function flattenTransportInput(
  input?: {
    transport?: BspaohTransportInput | null;
  } | null
) {
  if (!input?.transport) {
    return null;
  }

  return {
    transporterTransportMode: chain(input.transport, t => t.mode),
    transporterTakenOverAt: chain(input.transport, t =>
      t.takenOverAt ? new Date(t.takenOverAt) : t.takenOverAt
    )
  };
}

export function flattenBspaohTransporterInput(input: {
  transporter?: BspaohTransporterInput | null;
}): Partial<
  Omit<
    PrismaBspaohTransporter,
    | "id"
    | "status"
    | "createdAt"
    | "transporterTransportSignatureDate"
    | "transporterTransportSignatureAuthor"
  >
> {
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
    transporterRecepisseIsExempted: chain(input.transporter, t =>
      chain(t.recepisse, recep => recep.isExempted)
    ),

    transporterCustomInfo: chain(input.transporter, e => e.customInfo),
    transporterTransportPlates: undefinedOrDefault(
      chain(input.transporter, t => chain(t.transport, e => e.plates)),
      []
    ),
    ...flattenTransportInput(input.transporter)
  });
}

function flattenReceptionInput(
  input?: {
    reception?: BspaohReceptionInput | null;
  } | null
) {
  if (!input?.reception) {
    return null;
  }

  return {
    destinationReceptionDate: chain(input.reception, r =>
      r.date ? new Date(r.date) : r.date
    ),

    destinationReceptionAcceptationStatus: chain(input.reception, r =>
      chain(r.acceptation, a => a.status)
    ),
    destinationReceptionWastePackagingsAcceptation: chain(input.reception, r =>
      chain(r.acceptation, a => a.packagings)
    ),
    destinationReceptionWasteRefusalReason: chain(input.reception, r =>
      chain(r.acceptation, a => a.refusalReason)
    ),
    destinationReceptionWasteWeightValue: chain(input.reception, r =>
      chain(r.detail, d => chain(d.weight, w => w.value))
    ),
    destinationReceptionWasteWeightIsEstimate: chain(input.reception, r =>
      chain(r.detail, d => chain(d.weight, w => w.isEstimate))
    ),
    destinationReceptionWasteQuantityValue: chain(input.reception, r =>
      chain(r.detail, d => d.quantity)
    )
  };
}

function flattenOperationInput(
  input?: {
    operation?: BspaohOperationInput | null;
  } | null
) {
  if (!input?.operation) {
    return null;
  }
  return {
    destinationOperationCode: chain(input.operation, o => o.code),

    destinationOperationDate: chain(input.operation, o =>
      o.date ? new Date(o.date) : o.date
    )
  };
}

function flattenDestinationInput(input: {
  destination?: BspaohDestinationInput | null;
}) {
  return {
    destinationCompanyName: chain(input.destination, r =>
      chain(r.company, c => c.name)
    ),
    destinationCompanySiret: chain(input.destination, r =>
      chain(r.company, c => c.siret)
    ),
    destinationCompanyAddress: chain(input.destination, r =>
      chain(r.company, c => c.address)
    ),
    destinationCompanyContact: chain(input.destination, r =>
      chain(r.company, c => c.contact)
    ),
    destinationCompanyPhone: chain(input.destination, r =>
      chain(r.company, c => c.phone)
    ),
    destinationCompanyMail: chain(input.destination, r =>
      chain(r.company, c => c.mail)
    ),
    destinationCap: chain(input.destination, r => r.cap),

    destinationCustomInfo: chain(input.destination, e => e.customInfo),

    handedOverToDestinationDate: chain(input.destination, d =>
      chain(d.handedOverToDestination, h =>
        h.date ? new Date(h.date) : h.date
      )
    ),
    ...flattenReceptionInput(input.destination),
    ...flattenOperationInput(input.destination)
  };
}

function processPackagings(
  packagings?: InputMaybe<Array<BspaohPackagingInput>>
) {
  if (!packagings?.length) {
    return packagings;
  }
  const ret = packagings.map((p, idx) => ({
    ...p,
    id: `packaging_${idx}`,
    acceptation: "PENDING"
  }));

  return ret;
}

function flattenWasteInput(input: { waste?: BspaohWasteInput | null }) {
  return {
    wasteType: chain(input.waste, w => w.type) ?? BspaohType.PAOH,
    wasteCode: chain(input.waste, w => w.code),
    wasteAdr: chain(input.waste, w => w.adr),
    wastePackagings: undefinedOrDefault(
      chain(input.waste, w => processPackagings(w.packagings)),
      []
    )
  };
}

export function flattenBspaohInput(
  bsdInput: BspaohInput
): Partial<
  Omit<
    PrismaBspaoh,
    | "id"
    | "status"
    | "createdAt"
    | "updatedAt"
    | "isDeleted"
    | "emitterEmissionSignatureAuthor"
    | "emitterEmissionSignatureDate"
    | "handedOverToDestinationSignatureDate"
    | "handedOverToDestinationSignatureAuthor"
    | "destinationReceptionSignatureDate"
    | "destinationReceptionSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "destinationOperationSignatureAuthor"
  >
> {
  return safeInput({
    ...flattenWasteInput(bsdInput),

    ...flattenEmitterInput(bsdInput),

    ...flattenDestinationInput(bsdInput)
  });
}

export function expandBspaohFromElastic(
  bspaoh: BspaohForElastic
): GraphqlBspaoh {
  const expanded = expandBspaohFromDb(bspaoh);

  return {
    ...expanded
  };
}
