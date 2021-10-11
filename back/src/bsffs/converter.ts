import * as Prisma from "@prisma/client";
import { nullIfNoValues, safeInput } from "../forms/form-converter";
import * as GraphQL from "../generated/graphql/types";

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

    emitterCompanyName: bsffInput.emitter?.company.name,
    emitterCompanySiret: bsffInput.emitter?.company.siret,
    emitterCompanyAddress: bsffInput.emitter?.company.address,
    emitterCompanyContact: bsffInput.emitter?.company.contact,
    emitterCompanyPhone: bsffInput.emitter?.company.phone,
    emitterCompanyMail: bsffInput.emitter?.company.mail,
    emitterCustomInfo: bsffInput.emitter?.customInfo,

    packagings: bsffInput.packagings,

    wasteCode: bsffInput.waste?.code,
    wasteDescription: bsffInput.waste?.description,
    wasteAdr: bsffInput.waste?.adr,

    weightValue: bsffInput.weight?.value,
    weightIsEstimate: bsffInput.weight?.isEstimate,

    transporterCompanyName: bsffInput.transporter?.company.name,
    transporterCompanySiret: bsffInput.transporter?.company.siret,
    transporterCompanyVatNumber: bsffInput.transporter?.company.vatNumber,
    transporterCompanyAddress: bsffInput.transporter?.company.address,
    transporterCompanyContact: bsffInput.transporter?.company.contact,
    transporterCompanyPhone: bsffInput.transporter?.company.phone,
    transporterCompanyMail: bsffInput.transporter?.company.mail,
    transporterCustomInfo: bsffInput.transporter?.customInfo,

    transporterRecepisseNumber: bsffInput.transporter?.recepisse?.number,
    transporterRecepisseDepartment:
      bsffInput.transporter?.recepisse?.department,
    transporterRecepisseValidityLimit:
      bsffInput.transporter?.recepisse?.validityLimit,

    transporterTransportMode: bsffInput.transporter?.transport?.mode,

    destinationCompanyName: bsffInput.destination?.company?.name,
    destinationCompanySiret: bsffInput.destination?.company?.siret,
    destinationCompanyAddress: bsffInput.destination?.company?.address,
    destinationCompanyContact: bsffInput.destination?.company?.contact,
    destinationCompanyPhone: bsffInput.destination?.company?.phone,
    destinationCompanyMail: bsffInput.destination?.company?.mail,
    destinationCustomInfo: bsffInput.destination?.customInfo,

    destinationReceptionDate: bsffInput.destination?.reception?.date,
    destinationReceptionWeight: bsffInput.destination?.reception?.weight,
    destinationReceptionAcceptationStatus:
      bsffInput.destination?.reception?.acceptation?.status,
    destinationReceptionRefusalReason:
      bsffInput.destination?.reception?.acceptation?.refusalReason,

    destinationPlannedOperationCode:
      bsffInput.destination?.plannedOperationCode,

    destinationOperationCode: bsffInput.destination?.operation?.code,

    destinationOperationNextDestinationCompanyName:
      bsffInput.destination?.operation?.nextDestination?.company.name,
    destinationOperationNextDestinationCompanySiret:
      bsffInput.destination?.operation?.nextDestination?.company.siret,
    destinationOperationNextDestinationCompanyVatNumber:
      bsffInput.destination?.operation?.nextDestination?.company.vatNumber,
    destinationOperationNextDestinationCompanyAddress:
      bsffInput.destination?.operation?.nextDestination?.company.address,
    destinationOperationNextDestinationCompanyContact:
      bsffInput.destination?.operation?.nextDestination?.company.contact,
    destinationOperationNextDestinationCompanyPhone:
      bsffInput.destination?.operation?.nextDestination?.company.phone,
    destinationOperationNextDestinationCompanyMail:
      bsffInput.destination?.operation?.nextDestination?.company.mail,

    destinationCap: bsffInput.destination?.cap
  });
}

export function unflattenBsff(prismaBsff: Prisma.Bsff): GraphQL.Bsff {
  return {
    id: prismaBsff.id,
    createdAt: prismaBsff.createdAt,
    updatedAt: prismaBsff.updatedAt,
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
          date: prismaBsff.emitterEmissionSignatureDate
        })
      })
    }),
    packagings: prismaBsff.packagings as GraphQL.BsffPackaging[],
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
        validityLimit: prismaBsff.transporterRecepisseValidityLimit
      }),
      customInfo: prismaBsff.transporterCustomInfo,
      transport: nullIfNoValues<GraphQL.BsffTransport>({
        mode: prismaBsff.transporterTransportMode,
        signature: nullIfNoValues<GraphQL.Signature>({
          author: prismaBsff.transporterTransportSignatureAuthor,
          date: prismaBsff.transporterTransportSignatureDate
        })
      })
    }),
    destination: nullIfNoValues<GraphQL.BsffDestination>({
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
        date: prismaBsff.destinationReceptionDate,
        weight: prismaBsff.destinationReceptionWeight,
        acceptation: nullIfNoValues<GraphQL.BsffAcceptation>({
          status: prismaBsff.destinationReceptionAcceptationStatus,
          refusalReason: prismaBsff.destinationReceptionRefusalReason
        }),
        signature: nullIfNoValues<GraphQL.Signature>({
          author: prismaBsff.destinationReceptionSignatureAuthor,
          date: prismaBsff.destinationReceptionSignatureDate
        })
      }),
      operation: nullIfNoValues<GraphQL.BsffOperation>({
        code: prismaBsff.destinationOperationCode as GraphQL.BsffOperationCode,
        nextDestination: nullIfNoValues<GraphQL.BsffNextDestination>({
          company: nullIfNoValues<GraphQL.FormCompany>({
            name: prismaBsff.destinationOperationNextDestinationCompanyName,
            siret: prismaBsff.destinationOperationNextDestinationCompanySiret,
            vatNumber:
              prismaBsff.destinationOperationNextDestinationCompanyVatNumber,
            address:
              prismaBsff.destinationOperationNextDestinationCompanyAddress,
            contact:
              prismaBsff.destinationOperationNextDestinationCompanyContact,
            phone: prismaBsff.destinationOperationNextDestinationCompanyPhone,
            mail: prismaBsff.destinationOperationNextDestinationCompanyMail
          })
        }),
        signature: nullIfNoValues<GraphQL.Signature>({
          author: prismaBsff.destinationOperationSignatureAuthor,
          date: prismaBsff.destinationOperationSignatureDate
        })
      }),
      plannedOperationCode: prismaBsff.destinationPlannedOperationCode as GraphQL.BsffOperationCode,
      cap: prismaBsff.destinationCap
    }),
    // the following relations will be set in Bsff resolver
    ficheInterventions: [],
    grouping: [],
    repackaging: []
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

export function unflattenFicheInterventionBsff(
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
