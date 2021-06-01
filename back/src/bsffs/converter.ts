import slugify from "slugify";
import * as Prisma from ".prisma/client";
import { nullIfNoValues, safeInput } from "../forms/form-converter";
import * as GraphQL from "../generated/graphql/types";

export function flattenBsffInput(
  bsffInput: GraphQL.BsffInput
): Omit<Prisma.Prisma.BsffCreateInput, "id" | "bsffs" | "Bsff"> {
  return safeInput({
    emitterCompanyName: bsffInput.emitter?.company.name,
    emitterCompanySiret: bsffInput.emitter?.company.siret,
    emitterCompanyAddress: bsffInput.emitter?.company.address,
    emitterCompanyContact: bsffInput.emitter?.company.contact,
    emitterCompanyPhone: bsffInput.emitter?.company.phone,
    emitterCompanyMail: bsffInput.emitter?.company.mail,

    packagings: bsffInput.packagings,

    wasteCode: bsffInput.waste?.code,
    wasteDescription: bsffInput.waste?.description,
    wasteAdr: bsffInput.waste?.adr,

    quantityKilos: bsffInput.quantity?.kilos,
    quantityIsEstimate: bsffInput.quantity?.isEstimate,

    transporterCompanyName: bsffInput.transporter?.company.name,
    transporterCompanySiret: bsffInput.transporter?.company.siret,
    transporterCompanyVatNumber: bsffInput.transporter?.company.vatNumber,
    transporterCompanyAddress: bsffInput.transporter?.company.address,
    transporterCompanyContact: bsffInput.transporter?.company.contact,
    transporterCompanyPhone: bsffInput.transporter?.company.phone,
    transporterCompanyMail: bsffInput.transporter?.company.mail,

    transporterRecepisseNumber: bsffInput.transporter?.recepisse?.number,
    transporterRecepisseDepartment:
      bsffInput.transporter?.recepisse?.department,
    transporterRecepisseValidityLimit:
      bsffInput.transporter?.recepisse?.validityLimit,

    transporterTransportMode: bsffInput.transporter?.transport?.mode,

    destinationCompanyName: bsffInput.destination?.company.name,
    destinationCompanySiret: bsffInput.destination?.company.siret,
    destinationCompanyAddress: bsffInput.destination?.company.address,
    destinationCompanyContact: bsffInput.destination?.company.contact,
    destinationCompanyPhone: bsffInput.destination?.company.phone,
    destinationCompanyMail: bsffInput.destination?.company.mail,

    destinationReceptionDate: bsffInput.destination?.reception?.date,
    destinationReceptionKilos: bsffInput.destination?.reception?.kilos,
    destinationReceptionRefusal: bsffInput.destination?.reception?.refusal,

    destinationPlannedOperationCode:
      bsffInput.destination?.plannedOperation?.code,
    destinationPlannedOperationQualification:
      bsffInput.destination?.plannedOperation?.qualification,

    destinationOperationCode: bsffInput.destination?.operation?.code,
    destinationOperationQualification:
      bsffInput.destination?.operation?.qualification,

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

export function unflattenBsff(
  prismaBsff: Prisma.Bsff
): Omit<GraphQL.Bsff, "ficheInterventions" | "bsffs"> {
  return {
    id: prismaBsff.id,
    emitter: nullIfNoValues<GraphQL.BsffEmitter>({
      company: nullIfNoValues<GraphQL.FormCompany>({
        name: prismaBsff.emitterCompanyName,
        siret: prismaBsff.emitterCompanySiret,
        address: prismaBsff.emitterCompanyAddress,
        contact: prismaBsff.emitterCompanyContact,
        phone: prismaBsff.emitterCompanyPhone,
        mail: prismaBsff.emitterCompanyMail
      }),
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
    quantity: nullIfNoValues<GraphQL.BsffQuantity>({
      kilos: prismaBsff.quantityKilos,
      isEstimate: prismaBsff.quantityIsEstimate
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
      reception: nullIfNoValues<GraphQL.BsffReception>({
        date: prismaBsff.destinationReceptionDate,
        kilos: prismaBsff.destinationReceptionKilos,
        refusal: prismaBsff.destinationReceptionRefusal,
        signature: nullIfNoValues<GraphQL.Signature>({
          author: prismaBsff.destinationReceptionSignatureAuthor,
          date: prismaBsff.destinationReceptionSignatureDate
        })
      }),
      operation: nullIfNoValues<GraphQL.BsffOperation>({
        code: prismaBsff.destinationOperationCode as GraphQL.BsffOperationCode,
        qualification: prismaBsff.destinationOperationQualification as GraphQL.BsffOperationQualification,
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
      plannedOperation: nullIfNoValues<GraphQL.BsffPlannedOperation>({
        code: prismaBsff.destinationPlannedOperationCode as GraphQL.BsffOperationCode,
        qualification: prismaBsff.destinationPlannedOperationQualification as GraphQL.BsffOperationQualification
      }),
      cap: prismaBsff.destinationCap
    })
  };
}

export function flattenFicheInterventionBsffInput(
  ficheInterventionInput: GraphQL.BsffFicheInterventionInput
): Omit<Prisma.Prisma.BsffFicheInterventionCreateInput, "id" | "numero"> {
  return {
    kilos: ficheInterventionInput.kilos,
    postalCode: ficheInterventionInput.postalCode,
    ownerCompanyName: ficheInterventionInput.owner.company.name ?? "",
    ownerCompanySiret: ficheInterventionInput.owner.company.siret ?? "",
    ownerCompanyAddress: ficheInterventionInput.owner.company.address ?? "",
    ownerCompanyContact: ficheInterventionInput.owner.company.contact ?? "",
    ownerCompanyPhone: ficheInterventionInput.owner.company.phone ?? "",
    ownerCompanyMail: ficheInterventionInput.owner.company.mail ?? ""
  };
}

export function unflattenFicheInterventionBsff(
  prismaFicheIntervention: Prisma.BsffFicheIntervention
): GraphQL.BsffFicheIntervention {
  return {
    numero: prismaFicheIntervention.numero,
    kilos: prismaFicheIntervention.kilos,
    postalCode: prismaFicheIntervention.postalCode,
    owner: {
      company: {
        name: prismaFicheIntervention.ownerCompanyName,
        siret: prismaFicheIntervention.ownerCompanySiret,
        address: prismaFicheIntervention.ownerCompanyAddress,
        contact: prismaFicheIntervention.ownerCompanyContact,
        phone: prismaFicheIntervention.ownerCompanyPhone,
        mail: prismaFicheIntervention.ownerCompanyMail
      }
    }
  };
}

export function getFicheInterventionId(
  bsffId: string,
  ficheInterventionNumero: string
): string {
  return `${bsffId}-${slugify(ficheInterventionNumero, { replacement: "" })}`;
}
