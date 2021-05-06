import * as Prisma from ".prisma/client";
import { nullIfNoValues, safeInput } from "../forms/form-converter";
import * as GraphQL from "../generated/graphql/types";

export function flattenBsffInput(
  bsffInput: GraphQL.BsffInput
): Omit<Prisma.Prisma.BsffCreateInput, "id"> {
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
    transporterCompanyAddress: bsffInput.transporter?.company.address,
    transporterCompanyContact: bsffInput.transporter?.company.contact,
    transporterCompanyPhone: bsffInput.transporter?.company.phone,
    transporterCompanyMail: bsffInput.transporter?.company.mail,

    transporterRecepisseNumber: bsffInput.transporter?.recepisse?.number,
    transporterRecepisseDepartment:
      bsffInput.transporter?.recepisse?.department,
    transporterRecepisseValidityLimit:
      bsffInput.transporter?.recepisse?.validityLimit,

    destinationCompanyName: bsffInput.destination?.company.name,
    destinationCompanySiret: bsffInput.destination?.company.siret,
    destinationCompanyAddress: bsffInput.destination?.company.address,
    destinationCompanyContact: bsffInput.destination?.company.contact,
    destinationCompanyPhone: bsffInput.destination?.company.phone,
    destinationCompanyMail: bsffInput.destination?.company.mail,
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
