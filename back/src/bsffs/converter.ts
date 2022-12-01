import * as Prisma from "@prisma/client";
import {
  nullIfNoValues,
  safeInput,
  processDate,
  chain
} from "../common/converter";
import * as GraphQL from "../generated/graphql/types";
import { BsdElastic } from "../common/elastic";
import { BsffPackaging, BsffPackagingType } from "@prisma/client";

function flattenEmitterInput(input: { emitter?: GraphQL.BsffEmitter }) {
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

function flattenTransporterInput(input: {
  transporter?: GraphQL.BsffTransporter;
}) {
  return {
    transporterCompanyName: chain(input.transporter, t =>
      chain(t.company, c => c.name)
    ),
    transporterCompanySiret: chain(input.transporter, t =>
      chain(t.company, c => c.siret)
    ),
    transporterCompanyVatNumber: chain(input.transporter, t =>
      chain(t.company, c => c.vatNumber)
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
    transporterCustomInfo: chain(input.transporter, t => t.customInfo),
    transporterTransportPlates: chain(input.transporter, t =>
      chain(t.transport, tr => tr.plates)
    ),
    transporterRecepisseNumber: chain(input.transporter, t =>
      chain(t.recepisse, r => r.number)
    ),
    transporterRecepisseDepartment: chain(input.transporter, t =>
      chain(t.recepisse, r => r.department)
    ),
    transporterRecepisseValidityLimit: chain(input.transporter, t =>
      chain(t.recepisse, r => r.validityLimit)
    ),
    transporterTransportMode: chain(input.transporter, t =>
      chain(t.transport, tr => tr.mode)
    ),
    transporterTransportTakenOverAt: chain(input.transporter, t =>
      chain(t.transport, tr => tr.takenOverAt)
    )
  };
}

function flattenDestinationInput(input: {
  destination?: GraphQL.BsffDestinationInput;
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
  waste?: GraphQL.BsffWasteInput;
  weight?: GraphQL.BsffWeightInput;
}) {
  return {
    wasteCode: chain(input.waste, w => w.code),
    wasteDescription: chain(input.waste, w => w.description),
    wasteAdr: chain(input.waste, w => w.adr),
    weightValue: chain(input.weight, w => w.value),
    weightIsEstimate: chain(input.weight, w => w.isEstimate)
  };
}

export function flattenBsffInput(
  bsffInput: GraphQL.BsffInput
): Partial<
  Omit<
    Prisma.Bsff,
    | "id"
    | "isDraft"
    | "createdAt"
    | "updatedAt"
    | "isDeleted"
    | "emitterEmissionSignatureAuthor"
    | "emitterEmissionSignatureDate"
    | "transporterTransportSignatureAuthor"
    | "transporterTransportSignatureDate"
    | "destinationReceptionSignatureAuthor"
    | "destinationReceptionSignatureDate"
    | "destinationOperationSignatureAuthor"
    | "destinationOperationSignatureDate"
    | "bsffId"
  >
> {
  return safeInput({
    type: bsffInput.type,
    ...flattenEmitterInput(bsffInput),
    ...flattenTransporterInput(bsffInput),
    ...flattenDestinationInput(bsffInput),
    ...flattenWasteDetailsInput(bsffInput)
  });
}

export function expandBsffFromDB(prismaBsff: Prisma.Bsff): GraphQL.Bsff {
  return {
    id: prismaBsff.id,
    createdAt: processDate(prismaBsff.createdAt),
    updatedAt: processDate(prismaBsff.updatedAt),
    isDraft: prismaBsff.isDraft,
    type: prismaBsff.type,
    status: prismaBsff.status,
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
    waste: nullIfNoValues<GraphQL.BsffWaste>({
      code: prismaBsff.wasteCode,
      description: prismaBsff.wasteDescription,
      adr: prismaBsff.wasteAdr
    }),
    weight: nullIfNoValues<GraphQL.BsffWeight>({
      value: prismaBsff.weightValue,
      isEstimate: prismaBsff.weightIsEstimate
    }),
    transporter: nullIfNoValues<GraphQL.BsffTransporter>({
      company: nullIfNoValues<GraphQL.FormCompany>({
        name: prismaBsff.transporterCompanyName,
        siret: prismaBsff.transporterCompanySiret,
        vatNumber: prismaBsff.transporterCompanyVatNumber,
        address: prismaBsff.transporterCompanyAddress,
        contact: prismaBsff.transporterCompanyContact,
        phone: prismaBsff.transporterCompanyPhone,
        mail: prismaBsff.transporterCompanyMail
      }),
      recepisse: nullIfNoValues<GraphQL.BsffTransporterRecepisse>({
        number: prismaBsff.transporterRecepisseNumber,
        department: prismaBsff.transporterRecepisseDepartment,
        validityLimit: processDate(prismaBsff.transporterRecepisseValidityLimit)
      }),
      customInfo: prismaBsff.transporterCustomInfo,
      transport: nullIfNoValues<GraphQL.BsffTransport>({
        mode: prismaBsff.transporterTransportMode,
        plates: prismaBsff.transporterTransportPlates,
        takenOverAt: prismaBsff.transporterTransportTakenOverAt,
        signature: nullIfNoValues<GraphQL.Signature>({
          author: prismaBsff.transporterTransportSignatureAuthor,
          date: processDate(prismaBsff.transporterTransportSignatureDate)
        })
      })
    }),
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
    grouping: []
  };
}

export function flattenBsffPackagingInput(
  input: GraphQL.UpdateBsffPackagingInput
) {
  return {
    acceptationDate: input.acceptation?.date,
    acceptationWeight: input.acceptation?.weight,
    acceptationStatus: input.acceptation?.status,
    acceptationRefusalReason: input.acceptation?.refusalReason,
    acceptationWasteCode: input.acceptation?.wasteCode,
    acceptationWasteDescription: input.acceptation?.wasteDescription,
    operationDate: input.operation?.date,
    operationNoTraceability: input.operation?.noTraceability,
    operationCode: input.operation?.code,
    operationDescription: input.operation?.description,
    operationNextDestinationPlannedOperationCode:
      input.operation?.nextDestination?.plannedOperationCode,
    operationNextDestinationCap: input.operation?.nextDestination?.cap,
    operationNextDestinationCompanyName:
      input.operation?.nextDestination?.company?.name,
    operationNextDestinationCompanySiret:
      input.operation?.nextDestination?.company?.siret,
    operationNextDestinationCompanyVatNumber:
      input.operation?.nextDestination?.company?.vatNumber,
    operationNextDestinationCompanyAddress:
      input.operation?.nextDestination?.company?.address,
    operationNextDestinationCompanyContact:
      input.operation?.nextDestination?.company?.contact,
    operationNextDestinationCompanyPhone:
      input.operation?.nextDestination?.company?.phone,
    operationNextDestinationCompanyMail:
      input.operation?.nextDestination?.company?.mail
  };
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
    bsff: null
  };
}

export function expandBsffFromElastic(
  bsff: BsdElastic["rawBsd"]
): GraphQL.Bsff {
  const expanded = expandBsffFromDB(bsff);

  if (!expanded) {
    return null;
  }

  return {
    ...expanded,
    packagings: bsff.packagings
  };
}

export function flattenFicheInterventionBsffInput(
  ficheInterventionInput: GraphQL.BsffFicheInterventionInput
): Prisma.Prisma.BsffFicheInterventionCreateInput {
  return {
    numero: ficheInterventionInput.numero,
    weight: ficheInterventionInput.weight,
    postalCode: ficheInterventionInput.postalCode,

    detenteurCompanyName: ficheInterventionInput.detenteur.company.name ?? "",
    detenteurCompanySiret: ficheInterventionInput.detenteur.company.siret ?? "",
    detenteurCompanyAddress:
      ficheInterventionInput.detenteur.company.address ?? "",
    detenteurCompanyContact:
      ficheInterventionInput.detenteur.company.contact ?? "",
    detenteurCompanyPhone: ficheInterventionInput.detenteur.company.phone ?? "",
    detenteurCompanyMail: ficheInterventionInput.detenteur.company.mail ?? "",

    operateurCompanyName: ficheInterventionInput.operateur.company.name ?? "",
    operateurCompanySiret: ficheInterventionInput.operateur.company.siret ?? "",
    operateurCompanyAddress:
      ficheInterventionInput.operateur.company.address ?? "",
    operateurCompanyContact:
      ficheInterventionInput.operateur.company.contact ?? "",
    operateurCompanyPhone: ficheInterventionInput.operateur.company.phone ?? "",
    operateurCompanyMail: ficheInterventionInput.operateur.company.mail ?? ""
  };
}

export function expandFicheInterventionBsffFromDB(
  prismaFicheIntervention: Prisma.BsffFicheIntervention
): GraphQL.BsffFicheIntervention {
  return {
    id: prismaFicheIntervention.id,
    numero: prismaFicheIntervention.numero,
    weight: prismaFicheIntervention.weight,
    postalCode: prismaFicheIntervention.postalCode,
    detenteur: {
      company: {
        name: prismaFicheIntervention.detenteurCompanyName,
        siret: prismaFicheIntervention.detenteurCompanySiret,
        address: prismaFicheIntervention.detenteurCompanyAddress,
        contact: prismaFicheIntervention.detenteurCompanyContact,
        phone: prismaFicheIntervention.detenteurCompanyPhone,
        mail: prismaFicheIntervention.detenteurCompanyMail
      }
    },
    operateur: {
      company: {
        name: prismaFicheIntervention.operateurCompanyName,
        siret: prismaFicheIntervention.operateurCompanySiret,
        address: prismaFicheIntervention.operateurCompanyAddress,
        contact: prismaFicheIntervention.operateurCompanyContact,
        phone: prismaFicheIntervention.operateurCompanyPhone,
        mail: prismaFicheIntervention.operateurCompanyMail
      }
    }
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
