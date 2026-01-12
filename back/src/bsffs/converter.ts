import * as Prisma from "@td/prisma";
import {
  nullIfNoValues,
  safeInput,
  processDate,
  chain,
  undefinedOrDefault,
  processDecimal
} from "../common/converter";
import * as GraphQL from "@td/codegen-back";
import { BsffPackaging, BsffPackagingType } from "@td/prisma";
import { getTransporterCompanyOrgId } from "@td/constants";
import { BsffForElastic } from "./elastic";
import { getFirstTransporterSync } from "./database";
import { BsffWithTransporters } from "./types";

function flattenEmitterInput(input: { emitter?: GraphQL.BsffEmitter | null }) {
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
    emitterCustomInfo: chain(input.emitter, e => e.customInfo)
  };
}

export function flattenBsffTransporterInput(
  transporter?: GraphQL.BsffTransporterInput | null
) {
  return safeInput({
    transporterCompanyName: chain(transporter, t =>
      chain(t.company, c => c.name)
    ),
    transporterCompanySiret: chain(transporter, t =>
      chain(t.company, c => c.siret)
    ),
    transporterCompanyVatNumber: chain(transporter, t =>
      chain(t.company, c => c.vatNumber)
    ),
    transporterCompanyAddress: chain(transporter, t =>
      chain(t.company, c => c.address)
    ),
    transporterCompanyContact: chain(transporter, t =>
      chain(t.company, c => c.contact)
    ),
    transporterCompanyPhone: chain(transporter, t =>
      chain(t.company, c => c.phone)
    ),
    transporterCompanyMail: chain(transporter, t =>
      chain(t.company, c => c.mail)
    ),
    transporterCustomInfo: chain(transporter, t => t.customInfo),
    transporterTransportPlates: undefinedOrDefault(
      chain(transporter, t => chain(t.transport, tr => tr.plates)),
      []
    ),
    transporterRecepisseNumber: chain(transporter, t =>
      chain(t.recepisse, r => r.number)
    ),
    transporterRecepisseDepartment: chain(transporter, t =>
      chain(t.recepisse, r => r.department)
    ),
    transporterRecepisseValidityLimit: chain(transporter, t =>
      chain(t.recepisse, r => r.validityLimit)
    ),
    transporterRecepisseIsExempted: chain(transporter, t =>
      chain(t.recepisse, r => r.isExempted)
    ),
    transporterTransportMode: chain(transporter, t =>
      chain(t.transport, tr => tr.mode)
    ),
    transporterTransportTakenOverAt: chain(transporter, t =>
      chain(t.transport, tr => tr.takenOverAt)
    )
  });
}

function flattenDestinationInput(input: {
  destination?: GraphQL.BsffDestinationInput | null;
}) {
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
    destinationCustomInfo: chain(input.destination, d => d.customInfo),

    destinationReceptionDate: chain(input.destination, d =>
      chain(d.reception, r => r.date)
    ),
    destinationPlannedOperationCode: chain(
      input.destination,
      d => d.plannedOperationCode
    )
  };
}

function flattenWasteDetailsInput(input: {
  waste?: GraphQL.BsffWasteInput | null;
  weight?: GraphQL.BsffWeightInput | null;
}) {
  return {
    wasteCode: chain(input.waste, w => w.code),
    wasteDescription: chain(input.waste, w => w.description),
    wasteAdr: chain(input.waste, w => w.adr),
    weightValue: chain(input.weight, w => w.value),
    weightIsEstimate: chain(input.weight, w => w.isEstimate)
  };
}

export function flattenBsffInput(bsffInput: GraphQL.BsffInput) {
  return safeInput({
    type: bsffInput.type,
    ...flattenEmitterInput(bsffInput),
    ...flattenDestinationInput(bsffInput),
    ...flattenWasteDetailsInput(bsffInput)
  });
}

export function expandBsffFromDB(
  prismaBsff: BsffWithTransporters
): GraphQL.Bsff {
  const transporter = getFirstTransporterSync(prismaBsff);
  return {
    id: prismaBsff.id,
    createdAt: processDate(prismaBsff.createdAt),
    updatedAt: processDate(prismaBsff.updatedAt),
    isDraft: prismaBsff.isDraft,
    type: prismaBsff.type,
    status: prismaBsff.status,
    isDuplicateOf: prismaBsff.isDuplicateOf,
    emitter: nullIfNoValues<GraphQL.BsffEmitter>({
      company: nullIfNoValues<GraphQL.FormCompany>({
        name: prismaBsff.emitterCompanyName,
        siret: prismaBsff.emitterCompanySiret,
        address: prismaBsff.emitterCompanyAddress,
        contact: prismaBsff.emitterCompanyContact,
        phone: prismaBsff.emitterCompanyPhone,
        mail: prismaBsff.emitterCompanyMail
      }),
      customInfo: prismaBsff.emitterCustomInfo,
      emission: nullIfNoValues<GraphQL.BsffEmission>({
        signature: nullIfNoValues<GraphQL.Signature>({
          author: prismaBsff.emitterEmissionSignatureAuthor,
          date: processDate(prismaBsff.emitterEmissionSignatureDate)
        })
      })
    }),
    packagings: [], // will be resolved in Bsff resolver
    waste: prismaBsff.wasteCode
      ? nullIfNoValues<GraphQL.BsffWaste>({
          code: prismaBsff.wasteCode,
          description: prismaBsff.wasteDescription,
          adr: prismaBsff.wasteAdr
        })
      : null,
    weight: prismaBsff.weightValue
      ? {
          value: processDecimal(prismaBsff.weightValue).toNumber(),
          isEstimate: prismaBsff.weightIsEstimate ?? false
        }
      : null,
    transporter: transporter ? expandBsffTransporterFromDb(transporter) : null,
    transporters: (prismaBsff.transporters ?? [])
      .map(t => expandBsffTransporterFromDb(t))
      .filter(Boolean),
    destination: nullIfNoValues<GraphQL.BsffDestination>({
      cap: prismaBsff.destinationCap,
      company: nullIfNoValues<GraphQL.FormCompany>({
        name: prismaBsff.destinationCompanyName,
        siret: prismaBsff.destinationCompanySiret,
        address: prismaBsff.destinationCompanyAddress,
        contact: prismaBsff.destinationCompanyContact,
        phone: prismaBsff.destinationCompanyPhone,
        mail: prismaBsff.destinationCompanyMail
      }),
      customInfo: prismaBsff.destinationCustomInfo,
      reception: nullIfNoValues<GraphQL.BsffReception>({
        date: processDate(prismaBsff.destinationReceptionDate),
        signature: nullIfNoValues<GraphQL.Signature>({
          author: prismaBsff.destinationReceptionSignatureAuthor,
          date: processDate(prismaBsff.destinationReceptionSignatureDate)
        })
      }),
      plannedOperationCode:
        prismaBsff.destinationPlannedOperationCode as GraphQL.BsffOperationCode
    }),
    // the following relations will be set in Bsff resolver
    ficheInterventions: [],
    forwarding: [],
    repackaging: [],
    grouping: [],
    metadata: {} as any
  };
}

export function expandBsffTransporterFromDb(
  transporter: Prisma.BsffTransporter
): GraphQL.BsffTransporter | null {
  return nullIfNoValues<GraphQL.BsffTransporter>({
    id: transporter.id,
    company: nullIfNoValues<GraphQL.FormCompany>({
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
    recepisse: nullIfNoValues<GraphQL.BsffTransporterRecepisse>({
      department: transporter.transporterRecepisseDepartment,
      number: transporter.transporterRecepisseNumber,
      validityLimit: processDate(transporter.transporterRecepisseValidityLimit),
      isExempted: transporter.transporterRecepisseIsExempted
    }),
    transport: nullIfNoValues<GraphQL.BsffTransport>({
      mode: transporter.transporterTransportMode,
      plates: transporter.transporterTransportPlates,
      takenOverAt: processDate(transporter.transporterTransportTakenOverAt),
      signature: nullIfNoValues<GraphQL.Signature>({
        author: transporter.transporterTransportSignatureAuthor,
        date: processDate(transporter.transporterTransportSignatureDate)
      })
    })
  });
}

export function flattenBsffPackagingInput(
  input: GraphQL.UpdateBsffPackagingInput
) {
  return safeInput({
    numero: input.numero,
    acceptationDate: chain(input.acceptation, a => a.date),
    acceptationWeight: chain(input.acceptation, a => a.weight),
    acceptationStatus: chain(input.acceptation, a => a.status),
    acceptationRefusalReason: chain(input.acceptation, a => a.refusalReason),
    acceptationWasteCode: chain(input.acceptation, a => a.wasteCode),
    acceptationWasteDescription: chain(
      input.acceptation,
      a => a.wasteDescription
    ),
    operationDate: chain(input.operation, o => o.date),
    operationNoTraceability: undefinedOrDefault(
      chain(input.operation, o => o.noTraceability),
      false
    ),
    operationCode: chain(input.operation, o => o.code),
    operationMode: chain(input.operation, o => o.mode),
    operationDescription: chain(input.operation, o => o.description),
    operationNextDestinationPlannedOperationCode: chain(input.operation, o =>
      chain(o.nextDestination, nd => nd.plannedOperationCode)
    ),
    operationNextDestinationCap: chain(input.operation, o =>
      chain(o.nextDestination, nd => nd.cap)
    ),
    operationNextDestinationCompanyName: chain(input.operation, o =>
      chain(o.nextDestination, nd => chain(nd.company, c => c.name))
    ),
    operationNextDestinationCompanySiret: chain(input.operation, o =>
      chain(o.nextDestination, nd => chain(nd.company, c => c.siret))
    ),
    operationNextDestinationCompanyVatNumber: chain(input.operation, o =>
      chain(o.nextDestination, nd => chain(nd.company, c => c.vatNumber))
    ),
    operationNextDestinationCompanyAddress: chain(input.operation, o =>
      chain(o.nextDestination, nd => chain(nd.company, c => c.address))
    ),
    operationNextDestinationCompanyContact: chain(input.operation, o =>
      chain(o.nextDestination, nd => chain(nd.company, c => c.contact))
    ),
    operationNextDestinationCompanyPhone: chain(input.operation, o =>
      chain(o.nextDestination, nd => chain(nd.company, c => c.phone))
    ),
    operationNextDestinationCompanyMail: chain(input.operation, o =>
      chain(o.nextDestination, nd => chain(nd.company, c => c.mail))
    )
  });
}

export function expandBsffPackagingFromDB(
  prismaBsffPackaging: BsffPackaging
): GraphQL.BsffPackaging {
  return {
    id: prismaBsffPackaging.id,
    bsffId: prismaBsffPackaging.bsffId,
    numero: prismaBsffPackaging.numero,
    type: prismaBsffPackaging.type,
    other: prismaBsffPackaging.other,
    name:
      prismaBsffPackaging.type === BsffPackagingType.AUTRE
        ? prismaBsffPackaging.other
        : prismaBsffPackaging.type,
    volume: prismaBsffPackaging.volume,
    weight: prismaBsffPackaging.weight,
    acceptation: nullIfNoValues<GraphQL.BsffPackagingAcceptation>({
      date: prismaBsffPackaging.acceptationDate,
      weight: prismaBsffPackaging.acceptationWeight,
      status: prismaBsffPackaging.acceptationStatus,
      refusalReason: prismaBsffPackaging.acceptationRefusalReason,
      wasteCode: prismaBsffPackaging.acceptationWasteCode,
      wasteDescription: prismaBsffPackaging.acceptationWasteDescription,
      signature: nullIfNoValues<GraphQL.Signature>({
        date: processDate(prismaBsffPackaging.acceptationSignatureDate),
        author: prismaBsffPackaging.acceptationSignatureAuthor
      })
    }),
    operation: nullIfNoValues<GraphQL.BsffPackagingOperation>({
      code: prismaBsffPackaging.operationCode as GraphQL.BsffOperationCode,
      mode: prismaBsffPackaging.operationMode as GraphQL.OperationMode,
      date: prismaBsffPackaging.operationDate,
      description: prismaBsffPackaging.operationDescription,
      noTraceability: prismaBsffPackaging.operationNoTraceability,
      nextDestination: nullIfNoValues<GraphQL.BsffPackagingNextDestination>({
        plannedOperationCode:
          prismaBsffPackaging.operationNextDestinationPlannedOperationCode as GraphQL.BsffOperationCode,
        cap: prismaBsffPackaging.operationNextDestinationCap,
        company: nullIfNoValues<GraphQL.FormCompany>({
          name: prismaBsffPackaging.operationNextDestinationCompanyName,
          siret: prismaBsffPackaging.operationNextDestinationCompanySiret,
          vatNumber:
            prismaBsffPackaging.operationNextDestinationCompanyVatNumber,
          address: prismaBsffPackaging.operationNextDestinationCompanyAddress,
          contact: prismaBsffPackaging.operationNextDestinationCompanyContact,
          phone: prismaBsffPackaging.operationNextDestinationCompanyPhone,
          mail: prismaBsffPackaging.operationNextDestinationCompanyMail
        })
      }),
      signature: nullIfNoValues<GraphQL.Signature>({
        date: processDate(prismaBsffPackaging.operationSignatureDate),
        author: prismaBsffPackaging.operationSignatureAuthor
      })
    }),
    // the following fields will be resolved in BsddPackaging resolver
    nextBsffs: [],
    previousBsffs: [],
    bsff: null as any
  };
}

export function expandBsffFromElastic(bsff: BsffForElastic): GraphQL.Bsff {
  const expanded = expandBsffFromDB(bsff);

  // pass down related field to sub-resolvers
  return {
    ...expanded,
    packagings: bsff.packagings.map(expandBsffPackagingFromDB)
  };
}

export function flattenFicheInterventionBsffInput(
  ficheInterventionInput: GraphQL.BsffFicheInterventionInput
):
  | Prisma.Prisma.BsffFicheInterventionCreateInput
  | Prisma.Prisma.BsffFicheInterventionUpdateInput {
  return {
    numero: ficheInterventionInput.numero,
    weight: ficheInterventionInput.weight,
    postalCode: ficheInterventionInput.postalCode,
    detenteurCompanyName:
      ficheInterventionInput?.detenteur?.company?.name ?? undefined,
    detenteurCompanySiret: chain(ficheInterventionInput, fi =>
      chain(fi.detenteur, d => chain(d.company, c => c.siret))
    ),
    detenteurCompanyAddress:
      ficheInterventionInput?.detenteur?.company?.address ?? undefined,
    detenteurCompanyContact: chain(ficheInterventionInput, fi =>
      chain(fi.detenteur, d => chain(d.company, c => c.contact))
    ),
    detenteurCompanyPhone: chain(ficheInterventionInput, fi =>
      chain(fi.detenteur, d => chain(d.company, c => c.phone))
    ),
    detenteurCompanyMail: chain(ficheInterventionInput, fi =>
      chain(fi.detenteur, d => chain(d.company, c => c.mail))
    ),
    detenteurIsPrivateIndividual:
      ficheInterventionInput?.detenteur?.isPrivateIndividual ?? undefined,
    operateurCompanyName:
      ficheInterventionInput.operateur?.company?.name ?? undefined,
    operateurCompanySiret:
      ficheInterventionInput.operateur?.company?.siret ?? undefined,
    operateurCompanyAddress:
      ficheInterventionInput.operateur?.company?.address ?? undefined,
    operateurCompanyContact:
      ficheInterventionInput.operateur?.company?.contact ?? undefined,
    operateurCompanyPhone:
      ficheInterventionInput.operateur?.company?.phone ?? undefined,
    operateurCompanyMail:
      ficheInterventionInput.operateur?.company?.mail ?? undefined
  };
}

export function expandFicheInterventionBsffFromDB(
  prismaFicheIntervention: Prisma.BsffFicheIntervention
): GraphQL.BsffFicheIntervention {
  return {
    id: prismaFicheIntervention.id,
    numero: prismaFicheIntervention.numero,
    weight: processDecimal(prismaFicheIntervention.weight).toNumber(),
    postalCode: prismaFicheIntervention.postalCode,
    detenteur: nullIfNoValues<GraphQL.BsffDetenteur>({
      company: nullIfNoValues<GraphQL.FormCompany>({
        name: prismaFicheIntervention.detenteurCompanyName,
        siret: prismaFicheIntervention.detenteurCompanySiret,
        address: prismaFicheIntervention.detenteurCompanyAddress,
        contact: prismaFicheIntervention.detenteurCompanyContact,
        phone: prismaFicheIntervention.detenteurCompanyPhone,
        mail: prismaFicheIntervention.detenteurCompanyMail
      }),
      isPrivateIndividual: prismaFicheIntervention.detenteurIsPrivateIndividual
    }),
    operateur: nullIfNoValues<GraphQL.BsffOperateur>({
      company: nullIfNoValues<GraphQL.FormCompany>({
        name: prismaFicheIntervention.operateurCompanyName,
        siret: prismaFicheIntervention.operateurCompanySiret,
        address: prismaFicheIntervention.operateurCompanyAddress,
        contact: prismaFicheIntervention.operateurCompanyContact,
        phone: prismaFicheIntervention.operateurCompanyPhone,
        mail: prismaFicheIntervention.operateurCompanyMail
      })
    })
  };
}

/**
 * Only returns fields that can be read from the child BSFF in
 * case of a forwarding, repackaging or grouping
 */
export function toInitialBsff(bsff: GraphQL.Bsff): GraphQL.InitialBsff {
  return {
    id: bsff.id,
    type: bsff.type,
    // emitter can only be read by someone who is contributor of the initial BSFF, this
    // logic is implemented in the InitialBsff resolver
    emitter: bsff.emitter,
    waste: bsff.waste,
    weight: bsff.weight,
    destination: bsff.destination,
    packagings: bsff.packagings,
    // ficheInterventions will be returned in InitialBsff resolver
    ficheInterventions: []
  };
}
