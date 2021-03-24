import { chain, nullIfNoValues, safeInput } from "../forms/form-converter";
import {
  FormCompany,
  Signature,
  BsvhuEmitter,
  Bsvhu as GraphqlVhuForm,
  BsvhuInput,
  BsvhuIdentification,
  BsvhuQuantity,
  BsvhuRecepisse,
  BsvhuRecipient,
  BsvhuRecipientAcceptance,
  BsvhuRecipientOperation,
  BsvhuTransporter
} from "../generated/graphql/types";
import {
  Prisma,
  BsvhuForm as PrismaVhuForm,
  WasteAcceptationStatus
} from "@prisma/client";

export function expandVhuFormFromDb(form: PrismaVhuForm): GraphqlVhuForm {
  return {
    id: form.id,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isDeleted: form.isDeleted,
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
      signature: nullIfNoValues<Signature>({
        author: form.emitterSignatureAuthor,
        date: form.emitterSignatureDate
      })
    }),
    packaging: form.packaging,
    wasteCode: form.wasteCode,
    identification: nullIfNoValues<BsvhuIdentification>({
      numbers: form.identificationNumbers,
      type: form.identificationType
    }),
    quantity: nullIfNoValues<BsvhuQuantity>({
      number: form.quantityNumber,
      tons: form.quantityTons
    }),
    recipient: nullIfNoValues<BsvhuRecipient>({
      type: form.recipientType,
      agrementNumber: form.recipientAgrementNumber,
      company: nullIfNoValues<FormCompany>({
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        contact: form.recipientCompanyContact,
        phone: form.recipientCompanyPhone,
        mail: form.recipientCompanyMail
      }),
      acceptance: nullIfNoValues<BsvhuRecipientAcceptance>({
        quantity: form.recipientAcceptanceQuantity,
        status: form.recipientAcceptanceStatus,
        refusalReason: form.recipientAcceptanceRefusalReason,
        identification: nullIfNoValues<BsvhuIdentification>({
          numbers: form.recipientAcceptanceIdentificationNumbers,
          type: form.recipientAcceptanceIdentificationType
        })
      }),
      operation: nullIfNoValues<BsvhuRecipientOperation>({
        planned: form.recipientOperationPlanned,
        done: form.recipientOperationDone
      }),
      plannedBroyeurCompany: nullIfNoValues<FormCompany>({
        name: form.recipientPlannedBroyeurCompanyName,
        siret: form.recipientPlannedBroyeurCompanySiret,
        address: form.recipientPlannedBroyeurCompanyAddress,
        contact: form.recipientPlannedBroyeurCompanyContact,
        phone: form.recipientPlannedBroyeurCompanyPhone,
        mail: form.recipientPlannedBroyeurCompanyMail
      }),
      signature: nullIfNoValues<Signature>({
        author: form.recipientSignatureAuthor,
        date: form.recipientSignatureDate
      })
    }),
    transporter: nullIfNoValues<BsvhuTransporter>({
      tvaIntracommunautaire: form.transporterTvaIntracommunautaire,
      company: nullIfNoValues<FormCompany>({
        name: form.transporterCompanyName,
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail
      }),
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        number: form.transporterRecepisseNumber,
        department: form.transporterRecepisseDepartment,
        validityLimit: form.transporterRecepisseValidityLimit
      }),
      signature: nullIfNoValues<Signature>({
        author: form.transporterSignatureAuthor,
        date: form.transporterSignatureDate
      })
    }),
    metadata: null
  };
}

export function flattenVhuInput(
  formInput: BsvhuInput
): Partial<Prisma.BsvhuFormCreateInput> {
  return safeInput({
    ...flattenVhuEmitterInput(formInput),
    ...flattenVhuRecipientInput(formInput),
    ...flattenVhuTransporterInput(formInput),
    packaging: chain(formInput, f => f.packaging),
    wasteCode: chain(formInput, f => f.wasteCode),
    ...flattenVhuIdentificationInput(formInput),
    ...flattenVhuQuantityInput(formInput)
  });
}

function flattenVhuEmitterInput({ emitter }: Pick<GraphqlVhuForm, "emitter">) {
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

function flattenVhuRecipientInput({
  recipient
}: Pick<GraphqlVhuForm, "recipient">) {
  return {
    recipientType: chain(recipient, r => r.type),
    recipientAgrementNumber: chain(recipient, r => r.agrementNumber),
    recipientCompanyName: chain(recipient, r => chain(r.company, c => c.name)),
    recipientCompanySiret: chain(recipient, r =>
      chain(r.company, c => c.siret)
    ),
    recipientCompanyAddress: chain(recipient, r =>
      chain(r.company, c => c.address)
    ),
    recipientCompanyContact: chain(recipient, r =>
      chain(r.company, c => c.contact)
    ),
    recipientCompanyPhone: chain(recipient, r =>
      chain(r.company, c => c.phone)
    ),
    recipientCompanyMail: chain(recipient, r => chain(r.company, c => c.mail)),
    recipientAcceptanceQuantity: chain(recipient, r =>
      chain(r.acceptance, o => o.quantity)
    ),
    recipientAcceptanceStatus: chain(recipient, r =>
      chain(r.acceptance, o => o.status)
    ) as WasteAcceptationStatus,
    recipientAcceptanceRefusalReason: chain(recipient, r =>
      chain(r.acceptance, o => o.refusalReason)
    ),
    recipientOperationPlanned: chain(recipient, r =>
      chain(r.operation, o => o.planned)
    ),
    recipientOperationDone: chain(recipient, r =>
      chain(r.operation, o => o.done)
    ),
    recipientPlannedBroyeurCompanyName: chain(recipient, r =>
      chain(r.plannedBroyeurCompany, c => c.name)
    ),
    recipientPlannedBroyeurCompanySiret: chain(recipient, r =>
      chain(r.plannedBroyeurCompany, c => c.siret)
    ),
    recipientPlannedBroyeurCompanyAddress: chain(recipient, r =>
      chain(r.plannedBroyeurCompany, c => c.address)
    ),
    recipientPlannedBroyeurCompanyContact: chain(recipient, r =>
      chain(r.plannedBroyeurCompany, c => c.contact)
    ),
    recipientPlannedBroyeurCompanyPhone: chain(recipient, r =>
      chain(r.plannedBroyeurCompany, c => c.phone)
    ),
    recipientPlannedBroyeurCompanyMail: chain(recipient, r =>
      chain(r.plannedBroyeurCompany, c => c.mail)
    )
  };
}

function flattenVhuTransporterInput({
  transporter
}: Pick<GraphqlVhuForm, "transporter">) {
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
    transporterRecepisseNumber: chain(transporter, t =>
      chain(t.recepisse, r => r.number)
    ),
    transporterRecepisseDepartment: chain(transporter, t =>
      chain(t.recepisse, r => r.department)
    ),
    transporterRecepisseValidityLimit: chain(transporter, t =>
      chain(t.recepisse, r => r.validityLimit)
    ),
    transporterTvaIntracommunautaire: chain(
      transporter,
      t => t.tvaIntracommunautaire
    )
  };
}

function flattenVhuIdentificationInput({
  identification
}: Pick<GraphqlVhuForm, "identification">) {
  return {
    identificationNumbers: chain(identification, i => i.numbers),
    identificationType: chain(identification, i => i.type)
  };
}

function flattenVhuQuantityInput({
  quantity
}: Pick<GraphqlVhuForm, "quantity">) {
  return {
    quantityNumber: chain(quantity, q => q.number),
    quantityTons: chain(quantity, q => q.tons)
  };
}
