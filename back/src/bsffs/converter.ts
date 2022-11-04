import * as Prisma from "@prisma/client";
import { nullIfNoValues, safeInput, processDate } from "../common/converter";
import * as GraphQL from "../generated/graphql/types";
import { BsdElastic } from "../common/elastic";
import { BsffPackaging } from "@prisma/client";

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

    emitterCompanyName: bsffInput.emitter?.company?.name,
    emitterCompanySiret: bsffInput.emitter?.company?.siret,
    emitterCompanyAddress: bsffInput.emitter?.company?.address,
    emitterCompanyContact: bsffInput.emitter?.company?.contact,
    emitterCompanyPhone: bsffInput.emitter?.company?.phone,
    emitterCompanyMail: bsffInput.emitter?.company?.mail,
    emitterCustomInfo: bsffInput.emitter?.customInfo,

    wasteCode: bsffInput.waste?.code,
    wasteDescription: bsffInput.waste?.description,
    wasteAdr: bsffInput.waste?.adr,

    weightValue: bsffInput.weight?.value,
    weightIsEstimate: bsffInput.weight?.isEstimate,

    transporterCompanyName: bsffInput.transporter?.company?.name,
    transporterCompanySiret: bsffInput.transporter?.company?.siret,
    transporterCompanyVatNumber: bsffInput.transporter?.company?.vatNumber,
    transporterCompanyAddress: bsffInput.transporter?.company?.address,
    transporterCompanyContact: bsffInput.transporter?.company?.contact,
    transporterCompanyPhone: bsffInput.transporter?.company?.phone,
    transporterCompanyMail: bsffInput.transporter?.company?.mail,
    transporterCustomInfo: bsffInput.transporter?.customInfo,
    transporterTransportPlates: bsffInput.transporter?.transport?.plates,

    transporterRecepisseNumber: bsffInput.transporter?.recepisse?.number,
    transporterRecepisseDepartment:
      bsffInput.transporter?.recepisse?.department,
    transporterRecepisseValidityLimit:
      bsffInput.transporter?.recepisse?.validityLimit,

    transporterTransportMode: bsffInput.transporter?.transport?.mode,
    transporterTransportTakenOverAt:
      bsffInput.transporter?.transport?.takenOverAt,

    destinationCompanyName: bsffInput.destination?.company?.name,
    destinationCompanySiret: bsffInput.destination?.company?.siret,
    destinationCompanyAddress: bsffInput.destination?.company?.address,
    destinationCompanyContact: bsffInput.destination?.company?.contact,
    destinationCompanyPhone: bsffInput.destination?.company?.phone,
    destinationCompanyMail: bsffInput.destination?.company?.mail,
    destinationCap: bsffInput.destination?.cap,
    destinationCustomInfo: bsffInput.destination?.customInfo,

    destinationReceptionDate: bsffInput.destination?.reception?.date,

    destinationPlannedOperationCode: bsffInput.destination?.plannedOperationCode
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
    name: prismaBsffPackaging.name,
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
