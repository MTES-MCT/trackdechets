import { chain, nullIfNoValues, safeInput } from "../forms/form-converter";
import {
  FormCompany,
  Signature,
  BsvhuEmitter,
  Bsvhu as GraphqlVhuForm,
  BsvhuInput,
  BsvhuIdentification,
  BsvhuWeight,
  BsvhuRecepisse,
  BsvhuTransporter,
  BsvhuEmission,
  BsvhuDestination,
  BsvhuReception,
  BsvhuOperation,
  BsvhuNextDestination,
  BsvhuTransport
} from "../generated/graphql/types";
import {
  Prisma,
  Bsvhu as PrismaVhuForm,
  WasteAcceptationStatus
} from "@prisma/client";

export function expandVhuFormFromDb(form: PrismaVhuForm): GraphqlVhuForm {
  return {
    id: form.id,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isDraft: form.isDraft,
    status: form.status,
    emitter: nullIfNoValues<BsvhuEmitter>({
      agrementNumber: form.emitterAgrementNumber,
      company: nullIfNoValues<FormCompany>({
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      }),
      emission: nullIfNoValues<BsvhuEmission>({
        signature: nullIfNoValues<Signature>({
          author: form.emitterEmissionSignatureAuthor,
          date: form.emitterEmissionSignatureDate
        })
      })
    }),
    packaging: form.packaging,
    wasteCode: form.wasteCode,
    identification: nullIfNoValues<BsvhuIdentification>({
      numbers: form.identificationNumbers,
      type: form.identificationType
    }),
    quantity: form.quantity,
    weight: nullIfNoValues<BsvhuWeight>({
      value: form.weightValue,
      isEstimate: form.weightIsEstimate
    }),
    destination: nullIfNoValues<BsvhuDestination>({
      type: form.destinationType,
      agrementNumber: form.destinationAgrementNumber,
      company: nullIfNoValues<FormCompany>({
        name: form.destinationCompanyName,
        siret: form.destinationCompanySiret,
        address: form.destinationCompanyAddress,
        contact: form.destinationCompanyContact,
        phone: form.destinationCompanyPhone,
        mail: form.destinationCompanyMail
      }),
      plannedOperationCode: form.destinationPlannedOperationCode,
      reception: nullIfNoValues<BsvhuReception>({
        acceptationStatus: form.destinationReceptionAcceptationStatus,
        date: form.destinationReceptionDate,
        identification: nullIfNoValues<BsvhuIdentification>({
          numbers: form.destinationReceptionIdentificationNumbers,
          type: form.destinationReceptionIdentificationType
        }),
        weight: form.destinationReceptionWeight,
        refusalReason: form.destinationReceptionRefusalReason
      }),
      operation: nullIfNoValues<BsvhuOperation>({
        code: form.destinationOperationCode,
        date: form.destinationOperationDate,
        nextDestination: nullIfNoValues<BsvhuNextDestination>({
          company: nullIfNoValues<FormCompany>({
            name: form.destinationOperationNextDestinationCompanyName,
            siret: form.destinationOperationNextDestinationCompanySiret,
            address: form.destinationOperationNextDestinationCompanyAddress,
            contact: form.destinationOperationNextDestinationCompanyContact,
            phone: form.destinationOperationNextDestinationCompanyPhone,
            mail: form.destinationOperationNextDestinationCompanyMail
          })
        }),

        signature: nullIfNoValues<Signature>({
          author: form.destinationOperationSignatureAuthor,
          date: form.destinationOperationSignatureDate
        })
      })
    }),
    transporter: nullIfNoValues<BsvhuTransporter>({
      company: nullIfNoValues<FormCompany>({
        name: form.transporterCompanyName,
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail,
        vatNumber: form.transporterCompanyVatNumber
      }),
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        number: form.transporterRecepisseNumber,
        department: form.transporterRecepisseDepartment,
        validityLimit: form.transporterRecepisseValidityLimit
      }),
      transport: nullIfNoValues<BsvhuTransport>({
        signature: nullIfNoValues<Signature>({
          author: form.transporterTransportSignatureAuthor,
          date: form.transporterTransportSignatureDate
        }),
        takenOverAt: form.transporterTransportTakenOverAt
      })
    }),
    metadata: null
  };
}

export function flattenVhuInput(
  formInput: BsvhuInput
): Partial<Prisma.BsvhuCreateInput> {
  return safeInput({
    ...flattenVhuEmitterInput(formInput),
    ...flattenVhuDestinationInput(formInput),
    ...flattenVhuTransporterInput(formInput),
    packaging: chain(formInput, f => f.packaging),
    wasteCode: chain(formInput, f => f.wasteCode),
    quantity: chain(formInput, f => f.quantity),
    ...flattenVhuIdentificationInput(formInput),
    ...flattenVhuWeightInput(formInput)
  });
}

function flattenVhuEmitterInput({ emitter }: Pick<BsvhuInput, "emitter">) {
  return {
    emitterAgrementNumber: chain(emitter, e => e.agrementNumber),
    emitterCompanyName: chain(emitter, e => chain(e.company, c => c.name)),
    emitterCompanySiret: chain(emitter, e => chain(e.company, c => c.siret)),
    emitterCompanyAddress: chain(emitter, e =>
      chain(e.company, c => c.address)
    ),
    emitterCompanyContact: chain(emitter, e =>
      chain(e.company, c => c.contact)
    ),
    emitterCompanyPhone: chain(emitter, e => chain(e.company, c => c.phone)),
    emitterCompanyMail: chain(emitter, e => chain(e.company, c => c.mail))
  };
}

function flattenVhuDestinationInput({
  destination
}: Pick<BsvhuInput, "destination">) {
  return {
    destinationType: chain(destination, r => r.type),
    destinationAgrementNumber: chain(destination, r => r.agrementNumber),
    destinationCompanyName: chain(destination, r =>
      chain(r.company, c => c.name)
    ),
    destinationCompanySiret: chain(destination, r =>
      chain(r.company, c => c.siret)
    ),
    destinationCompanyAddress: chain(destination, r =>
      chain(r.company, c => c.address)
    ),
    destinationCompanyContact: chain(destination, r =>
      chain(r.company, c => c.contact)
    ),
    destinationCompanyPhone: chain(destination, r =>
      chain(r.company, c => c.phone)
    ),
    destinationCompanyMail: chain(destination, r =>
      chain(r.company, c => c.mail)
    ),
    destinationPlannedOperationCode: chain(
      destination,
      r => r.plannedOperationCode
    ),
    destinationReceptionQuantity: chain(destination, d =>
      chain(d.reception, r => r.quantity)
    ),
    destinationReceptionWeight: chain(destination, d =>
      chain(d.reception, r => r.weight)
    ),
    destinationReceptionIdentificationNumbers: chain(destination, d =>
      chain(d.reception, r => chain(r.identification, i => i.numbers))
    ),
    destinationReceptionIdentificationType: chain(destination, d =>
      chain(d.reception, r => chain(r.identification, i => i.type))
    ),
    destinationReceptionAcceptationStatus: chain(destination, r =>
      chain(r.reception, o => o.acceptationStatus)
    ) as WasteAcceptationStatus,
    destinationReceptionRefusalReason: chain(destination, r =>
      chain(r.reception, o => o.refusalReason)
    ),
    destinationReceptionDate: chain(destination, d =>
      chain(d.reception, r => r.date)
    ),
    destinationOperationCode: chain(destination, r =>
      chain(r.operation, o => o.code)
    ),
    destinationOperationNextDestinationCompanyName: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.name))
      )
    ),
    destinationOperationDate: chain(destination, d =>
      chain(d.operation, o => o.date)
    ),
    destinationOperationNextDestinationCompanySiret: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.siret))
      )
    ),
    destinationOperationNextDestinationCompanyAddress: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.address))
      )
    ),
    destinationOperationNextDestinationCompanyContact: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.contact))
      )
    ),
    destinationOperationNextDestinationCompanyPhone: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.phone))
      )
    ),
    destinationOperationNextDestinationCompanyMail: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.mail))
      )
    ),
    destinationOperationNextDestinationCompanyVatNumber: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.vatNumber))
      )
    )
  };
}

function flattenVhuTransporterInput({
  transporter
}: Pick<BsvhuInput, "transporter">) {
  return {
    transporterCompanyName: chain(transporter, t =>
      chain(t.company, c => c.name)
    ),
    transporterCompanySiret: chain(transporter, t =>
      chain(t.company, c => c.siret)
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
    transporterCompanyVatNumber: chain(transporter, t =>
      chain(t.company, c => c.vatNumber)
    ),
    transporterRecepisseNumber: chain(transporter, t =>
      chain(t.recepisse, r => r.number)
    ),
    transporterRecepisseDepartment: chain(transporter, t =>
      chain(t.recepisse, r => r.department)
    ),
    transporterRecepisseValidityLimit: chain(transporter, t =>
      chain(t.recepisse, r => r.validityLimit)
    )
  };
}

function flattenVhuIdentificationInput({
  identification
}: Pick<BsvhuInput, "identification">) {
  return {
    identificationNumbers: chain(identification, i => i.numbers),
    identificationType: chain(identification, i => i.type)
  };
}

function flattenVhuWeightInput({ weight }: Pick<BsvhuInput, "weight">) {
  return {
    weightValue: chain(weight, q => q.value),
    weightIsEstimate: chain(weight, q => q.isEstimate)
  };
}
