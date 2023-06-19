import {
  Bsdasri as GqlBsdasri,
  BsdasriEmitter,
  BsdasriTransporter,
  BsdasriDestination,
  BsdasriWeight,
  BsdasriOperationWeight,
  FormCompany,
  BsdasriInput,
  BsdasriEmitterInput,
  BsdasriTransporterInput,
  BsdasriDestinationInput,
  BsdasriOperationInput,
  PickupSite,
  BsdasriEmission,
  BsdasriTransport,
  BsdasriReception,
  BsdasriOperation,
  BsdasriWasteAcceptation,
  BsdasriEmissionInput,
  BsdasriTransportInput,
  BsdasriReceptionInput,
  BsdasriPackaging,
  BsdasriPackagingsInput,
  BsdasriSignature,
  InitialBsdasri,
  BsdasriWasteInput,
  BsdasriWaste,
  BsdasriEcoOrganisme,
  BsdasriEcoOrganismeInput,
  BsdasriIdentification,
  BsdasriIdentificationInput
} from "../generated/graphql/types";
import {
  nullIfNoValues,
  safeInput,
  processDate,
  chain,
  undefinedOrDefault
} from "../common/converter";
import { Prisma, Bsdasri, BsdasriStatus } from "@prisma/client";
import { Decimal } from "decimal.js-light";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import { RawBsdasri } from "./elastic";

export function expandBsdasriFromDB(bsdasri: Bsdasri): GqlBsdasri {
  return {
    id: bsdasri.id,
    isDraft: Boolean(bsdasri.isDraft),
    type: bsdasri.type,

    waste: nullIfNoValues<BsdasriWaste>({
      code: bsdasri.wasteCode,
      adr: bsdasri.wasteAdr
    }),
    ecoOrganisme: nullIfNoValues<BsdasriEcoOrganisme>({
      name: bsdasri.ecoOrganismeName,
      siret: bsdasri.ecoOrganismeSiret,
      // do not return false because mandatory siret/name might be null and break query
      emittedByEcoOrganisme: !!bsdasri.emittedByEcoOrganisme ? true : null
    }),
    emitter: nullIfNoValues<BsdasriEmitter>({
      company: nullIfNoValues<FormCompany>({
        name: bsdasri.emitterCompanyName,
        siret: bsdasri.emitterCompanySiret,
        address: bsdasri.emitterCompanyAddress,
        phone: bsdasri.emitterCompanyPhone,
        mail: bsdasri.emitterCompanyMail,
        contact: bsdasri.emitterCompanyContact
      }),
      customInfo: bsdasri.emitterCustomInfo,
      pickupSite: nullIfNoValues<PickupSite>({
        name: bsdasri.emitterPickupSiteName,
        address: bsdasri.emitterPickupSiteAddress,
        city: bsdasri.emitterPickupSiteCity,
        postalCode: bsdasri.emitterPickupSitePostalCode,
        infos: bsdasri.emitterPickupSiteInfos
      }),
      emission: nullIfNoValues<BsdasriEmission>({
        signature: nullIfNoValues<BsdasriSignature>({
          author: bsdasri.emitterEmissionSignatureAuthor,
          date: bsdasri.emitterEmissionSignatureDate
        }),

        weight: nullIfNoValues<BsdasriWeight>({
          value: bsdasri.emitterWasteWeightValue,
          // due to a previous validation bug we might have null weigh value and not null isEstimate, thus breaking gql required return type

          isEstimate: !!bsdasri.emitterWasteWeightValue
            ? bsdasri.emitterWasteWeightIsEstimate
            : null
        }),

        volume: bsdasri.emitterWasteVolume,
        packagings: bsdasri.emitterWastePackagings as BsdasriPackaging[],

        isTakenOverWithoutEmitterSignature: bsdasri.isEmissionDirectTakenOver,
        isTakenOverWithSecretCode: bsdasri.isEmissionTakenOverWithSecretCode
      })
    }),

    transporter: nullIfNoValues<BsdasriTransporter>({
      company: nullIfNoValues<FormCompany>({
        name: bsdasri.transporterCompanyName,
        orgId: getTransporterCompanyOrgId(bsdasri),
        siret: bsdasri.transporterCompanySiret,
        vatNumber: bsdasri.transporterCompanyVatNumber,
        address: bsdasri.transporterCompanyAddress,
        phone: bsdasri.transporterCompanyPhone,
        mail: bsdasri.transporterCompanyMail,
        contact: bsdasri.transporterCompanyContact
      }),
      customInfo: bsdasri.transporterCustomInfo,
      recepisse: nullIfNoValues({
        isExempted: bsdasri.transporterRecepisseIsExempted,
        department: bsdasri.transporterRecepisseDepartment,
        number: bsdasri.transporterRecepisseNumber,
        validityLimit: processDate(bsdasri.transporterRecepisseValidityLimit)
      }),
      transport: nullIfNoValues<BsdasriTransport>({
        mode: bsdasri.transporterTransportMode,
        plates: bsdasri.transporterTransportPlates,

        weight: nullIfNoValues<BsdasriWeight>({
          value: bsdasri.transporterWasteWeightValue,
          // due to a previous validation bug we might have null weigh value and not null isEstimate, thus breaking gql required return type
          isEstimate: !!bsdasri.transporterWasteWeightValue
            ? bsdasri.transporterWasteWeightIsEstimate
            : null
        }),

        volume: bsdasri.transporterWasteVolume,
        packagings: bsdasri.transporterWastePackagings as BsdasriPackaging[],

        acceptation: nullIfNoValues<BsdasriWasteAcceptation>({
          status: bsdasri.transporterAcceptationStatus,
          refusalReason: bsdasri.transporterWasteRefusalReason,
          refusedWeight: bsdasri.transporterWasteRefusedWeightValue
        }),
        takenOverAt: processDate(bsdasri.transporterTakenOverAt),
        handedOverAt: bsdasri.handedOverToRecipientAt,
        signature: nullIfNoValues<BsdasriSignature>({
          author: bsdasri.transporterTransportSignatureAuthor,
          date: bsdasri.transporterTransportSignatureDate
        })
      })
    }),

    destination: nullIfNoValues<BsdasriDestination>({
      company: nullIfNoValues<FormCompany>({
        name: bsdasri.destinationCompanyName,
        siret: bsdasri.destinationCompanySiret,
        address: bsdasri.destinationCompanyAddress,
        phone: bsdasri.destinationCompanyPhone,
        mail: bsdasri.destinationCompanyMail,
        contact: bsdasri.destinationCompanyContact
      }),
      customInfo: bsdasri.destinationCustomInfo,
      reception: nullIfNoValues<BsdasriReception>({
        volume: bsdasri.destinationReceptionWasteVolume,
        packagings: bsdasri.destinationWastePackagings as BsdasriPackaging[],

        acceptation: nullIfNoValues<BsdasriWasteAcceptation>({
          status: bsdasri.destinationReceptionAcceptationStatus,
          refusalReason: bsdasri.destinationReceptionWasteRefusalReason,
          refusedWeight: bsdasri.destinationReceptionWasteRefusedWeightValue
        }),
        date: processDate(bsdasri.destinationReceptionDate),
        signature: nullIfNoValues<BsdasriSignature>({
          author: bsdasri.destinationReceptionSignatureAuthor,
          date: bsdasri.destinationReceptionSignatureDate
        })
      }),
      operation: nullIfNoValues<BsdasriOperation>({
        weight: nullIfNoValues<BsdasriOperationWeight>({
          value: bsdasri.destinationReceptionWasteWeightValue
        }),
        code: bsdasri.destinationOperationCode,
        date: processDate(bsdasri.destinationOperationDate),
        signature: nullIfNoValues<BsdasriSignature>({
          author: bsdasri.destinationOperationSignatureAuthor,
          date: processDate(bsdasri.destinationOperationSignatureDate)
        })
      })
    }),
    identification: nullIfNoValues<BsdasriIdentification>({
      numbers: bsdasri.identificationNumbers
    }),
    createdAt: processDate(bsdasri.createdAt),
    updatedAt: processDate(bsdasri.updatedAt),
    status: bsdasri.status as BsdasriStatus,
    metadata: null as any,
    allowDirectTakeOver: null
  };
}

export function expandBsdasriFromElastic(bsdasri: RawBsdasri): GqlBsdasri {
  const expanded = expandBsdasriFromDB(bsdasri);

  // pass down related field to sub-resolvers
  return {
    ...expanded,
    grouping: [],
    synthesizing: [],
    groupedIn: undefined,
    synthesizedIn: undefined
  };
}

const extractPostalCode = address => {
  const cpReg = new RegExp(/(?:[0-8]\d|9[0-8])\d{3}/g);
  if (!address) {
    return "";
  }
  const match = address.match(cpReg);
  return !!match ? match[0] : "Code postal non trouvé";
};

const countWasteQuantity = packagingsInfo => {
  if (!packagingsInfo) {
    return 0;
  }
  return packagingsInfo.map(p => p.quantity).reduce((acc, p) => p + acc, 0);
};

export const expandGroupingDasri = (dasri: Bsdasri): InitialBsdasri => ({
  id: dasri.id,

  quantity: countWasteQuantity(dasri.destinationWastePackagings),

  volume: dasri.destinationReceptionWasteVolume,

  weight: dasri.destinationReceptionWasteWeightValue,

  takenOverAt: processDate(dasri.transporterTakenOverAt),

  postalCode:
    dasri?.emitterPickupSitePostalCode ??
    extractPostalCode(dasri?.emitterCompanyAddress)
});

export const expandSynthesizingDasri = (dasri: Bsdasri): InitialBsdasri => ({
  id: dasri.id,

  quantity: countWasteQuantity(dasri.emitterWastePackagings),

  volume: dasri.emitterWasteVolume ?? 0,

  weight: dasri?.emitterWasteWeightValue ?? 0,

  takenOverAt: dasri.transporterTakenOverAt,

  postalCode:
    dasri?.emitterPickupSitePostalCode ??
    extractPostalCode(dasri?.emitterCompanyAddress)
});

type ComputeTotalVolumeFn = (
  packagings: BsdasriPackagingsInput[] | null | undefined
) => number | undefined;
/**
 * Compute total volume according to packaging infos details
 */
const computeTotalVolume: ComputeTotalVolumeFn = packagings => {
  if (!packagings) {
    return undefined;
  }
  return packagings
    .reduce(
      (acc, packaging) =>
        acc.plus((packaging.volume || 0) * (packaging.quantity || 0)),
      new Decimal(0)
    )
    .toNumber();
};

function flattenEcoOrganismeInput(input: {
  ecoOrganisme?: BsdasriEcoOrganismeInput | null;
}) {
  return {
    ecoOrganismeName: chain(input.ecoOrganisme, e => e.name),
    ecoOrganismeSiret: chain(input.ecoOrganisme, e => e.siret)
  };
}

function flattenEmitterInput(input: { emitter?: BsdasriEmitterInput | null }) {
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
    ...flattenEmissionInput(input.emitter)
  };
}

function flattenWasteInput(input: { waste?: BsdasriWasteInput | null }) {
  if (!input?.waste) {
    return null;
  }
  return {
    wasteCode: chain(input.waste, w =>
      // we used to accept wrong "18 01 02*" code. Still accept it but convert it to "18 02 02*"
      w.code === "18 01 02*" ? "18 02 02*" : w.code
    ),
    wasteAdr: chain(input.waste, w => w.adr)
  };
}
function flattenEmissionInput(
  input?: { emission?: BsdasriEmissionInput | null } | null
) {
  if (!input?.emission) {
    return null;
  }
  const emitterWastePackagings = chain(input.emission, e => e.packagings);

  return {
    emitterWasteWeightValue: chain(input.emission, e =>
      chain(e.weight, q => q.value)
    ),
    emitterWasteWeightIsEstimate: chain(input.emission, e =>
      chain(e.weight, q => q.isEstimate)
    ),
    emitterWasteVolume: computeTotalVolume(emitterWastePackagings),
    emitterWastePackagings: undefinedOrDefault(emitterWastePackagings, [])
  };
}
function flattenTransporterInput(input: {
  transporter?: BsdasriTransporterInput | null;
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
    transporterRecepisseIsExempted: chain(input.transporter, t =>
      chain(t.recepisse, recep => recep.isExempted)
    ),
    transporterRecepisseNumber: chain(input.transporter, t =>
      chain(t.recepisse, recep => recep.number)
    ),
    transporterRecepisseDepartment: chain(input.transporter, t =>
      chain(t.recepisse, recep => recep.department)
    ),
    transporterRecepisseValidityLimit: chain(input.transporter, t =>
      chain(t.recepisse, recep =>
        recep.validityLimit
          ? new Date(recep.validityLimit)
          : recep.validityLimit
      )
    ),

    transporterCustomInfo: chain(input.transporter, e => e.customInfo),
    transporterTransportPlates: undefinedOrDefault(
      chain(input.transporter, t => chain(t.transport, e => e.plates)),
      []
    ),
    ...flattenTransportInput(input.transporter)
  });
}
function flattenTransportInput(
  input?: {
    transport?: BsdasriTransportInput | null;
  } | null
) {
  if (!input?.transport) {
    return null;
  }

  const transporterWastePackagings = chain(input.transport, t => t.packagings);
  return {
    transporterTransportMode: chain(input.transport, t => t.mode),
    transporterTakenOverAt: chain(input.transport, t =>
      t.takenOverAt ? new Date(t.takenOverAt) : t.takenOverAt
    ),
    handedOverToRecipientAt: chain(input.transport, t =>
      t.handedOverAt ? new Date(t.handedOverAt) : t.handedOverAt
    ),
    transporterWasteWeightValue: chain(input.transport, t =>
      chain(t.weight, q => q.value)
    ),
    transporterWasteWeightIsEstimate: chain(input.transport, t =>
      chain(t.weight, q => q.isEstimate)
    ),
    transporterAcceptationStatus: chain(input.transport, t =>
      chain(t.acceptation, w => w.status)
    ),
    transporterWasteRefusedWeightValue: chain(input.transport, t =>
      chain(t.acceptation, w => w.refusedWeight)
    ),
    transporterWasteRefusalReason: chain(input.transport, t =>
      chain(t.acceptation, w => w.refusalReason)
    ),
    transporterWasteVolume: computeTotalVolume(transporterWastePackagings),
    transporterWastePackagings: undefinedOrDefault(
      transporterWastePackagings,
      []
    )
  };
}

function flattenDestinationInput(input: {
  destination?: BsdasriDestinationInput | null;
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
    destinationCustomInfo: chain(input.destination, e => e.customInfo),
    ...flattenReceptiontInput(input.destination),
    ...flattenOperationInput(input.destination)
  };
}

function flattenReceptiontInput(
  input?: {
    reception?: BsdasriReceptionInput | null;
  } | null
) {
  if (!input?.reception) {
    return null;
  }
  const destinationWastePackagings = chain(input.reception, r => r.packagings);
  return {
    destinationReceptionWasteVolume: computeTotalVolume(
      destinationWastePackagings
    ),
    destinationReceptionAcceptationStatus: chain(input.reception, t =>
      chain(t.acceptation, w => w.status)
    ),
    destinationReceptionDate: chain(input.reception, r =>
      r.date ? new Date(r.date) : r.date
    ),

    destinationReceptionWasteRefusedWeightValue: chain(input.reception, t =>
      chain(t.acceptation, w => w.refusedWeight)
    ),
    destinationReceptionWasteRefusalReason: chain(input.reception, t =>
      chain(t.acceptation, w => w.refusalReason)
    ),
    destinationWastePackagings: undefinedOrDefault(
      destinationWastePackagings,
      []
    )
  };
}

function flattenOperationInput(
  input?: {
    operation?: BsdasriOperationInput | null;
  } | null
) {
  if (!input?.operation) {
    return null;
  }
  return {
    destinationOperationCode: chain(input.operation, o => o.code),
    destinationReceptionWasteWeightValue: chain(input.operation, o =>
      chain(o.weight, q => q.value)
    ),

    destinationOperationDate: chain(input.operation, o =>
      o.date ? new Date(o.date) : o.date
    )
  };
}

function flattenContainersInput(input: {
  identification?: BsdasriIdentificationInput | null;
}) {
  if (!input?.identification?.numbers) {
    return null;
  }
  return {
    identificationNumbers: input.identification.numbers
  };
}

export function flattenBsdasriInput(
  formInput: Pick<
    BsdasriInput,
    | "waste"
    | "emitter"
    | "ecoOrganisme"
    | "transporter"
    | "destination"
    | "identification"
    | "grouping"
    | "synthesizing"
  >
): Partial<Prisma.BsdasriCreateInput> {
  return safeInput({
    ...flattenWasteInput(formInput),

    ...flattenEmitterInput(formInput),

    ...flattenEcoOrganismeInput(formInput),

    ...flattenTransporterInput(formInput),

    ...flattenDestinationInput(formInput),

    ...flattenContainersInput(formInput)
  });
}
