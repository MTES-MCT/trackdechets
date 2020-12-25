import { chain, nullIfNoValues, safeInput } from "src/forms/form-converter";
import {
  FormCompany,
  VhuEmitter,
  VhuForm as GraphqlVhuForm,
  VhuRecipient,
  VhuRecipientAcceptance,
  VhuRecipientOperation,
  VhuTransporter,
  VhuWasteDetails
} from "src/generated/graphql/types";
import {
  Prisma,
  VhuForm as PrismaVhuForm,
  WasteAcceptationStatus
} from "@prisma/client";

export function expandVhuFormFromDb(form: PrismaVhuForm): GraphqlVhuForm {
  return {
    id: form.id,
    createdAt: form.createdAt.toISOString(),
    updatedAt: form.updatedAt.toISOString(),
    isDeleted: form.isDeleted,
    isDraft: form.isDraft,

    emitter: nullIfNoValues<VhuEmitter>({
      agreement: form.emitterAgreement,
      validityLimit: form.emitterValidityLimit?.toISOString(),
      company: nullIfNoValues<FormCompany>({
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      }),
      signature: null
    }),
    wasteDetails: nullIfNoValues<VhuWasteDetails>({
      packagingType: form.wasteDetailsPackagingType,
      identificationNumbers: form.wasteDetailsIdentificationNumbers,
      identificationType: form.wasteDetailsIdentificationType,
      quantity: form.wasteDetailsQuantity,
      quantityUnit: form.wasteDetailsQuantityUnit
    }),
    recipient: nullIfNoValues<VhuRecipient>({
      agreement: form.recipientAgreement,
      validityLimit: form.recipientValidityLimit?.toISOString(),
      company: nullIfNoValues<FormCompany>({
        name: form.recipientCompanyName,
        siret: form.recipientCompanySiret,
        address: form.recipientCompanyAddress,
        contact: form.recipientCompanyContact,
        phone: form.recipientCompanyPhone,
        mail: form.recipientCompanyMail
      }),
      acceptance: nullIfNoValues<VhuRecipientAcceptance>({
        quantity: form.recipientAcceptanceQuantity,
        status: form.recipientAcceptanceStatus,
        refusalReason: form.recipientAcceptanceRefusalReason,
        signature: null
      }),
      operation: nullIfNoValues<VhuRecipientOperation>({
        planned: form.recipientOperationPlanned,
        done: form.recipientOperationDone,
        signature: null
      })
    }),
    transporter: nullIfNoValues<VhuTransporter>({
      agreement: form.transporterAgreement,
      receipt: form.transporterReceipt,
      department: form.transporterDepartment,
      validityLimit: form.transporterValidityLimit?.toISOString(),
      transportType: form.transporterTransportType,
      company: nullIfNoValues<FormCompany>({
        name: form.transporterCompanyName,
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail
      }),
      signature: null
    })
  };
}

export function flattenVhuInput(formInput): Partial<Prisma.VhuFormCreateInput> {
  return safeInput({
    isDraft: formInput.isDraft,
    ...flattenVhuEmitterInput(formInput),
    ...flattenVhuRecipientInput(formInput),
    ...flattenVhuTransporterInput(formInput),
    ...flattenVhuWasteDetailsInput(formInput)
  });
}

function flattenVhuEmitterInput({ emitter }: Pick<GraphqlVhuForm, "emitter">) {
  return {
    emitterAgreement: chain(emitter, e => e.agreement),
    emitterValidityLimit: chain(emitter, e => e.validityLimit),
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
    recipientAgreement: chain(recipient, r => r.agreement),
    recipientValidityLimit: chain(recipient, r => r.validityLimit),
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
    )
  };
}

function flattenVhuTransporterInput({
  transporter
}: Pick<GraphqlVhuForm, "transporter">) {
  return {
    transporterAgreement: chain(transporter, t => t.agreement),
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
    transporterReceipt: chain(transporter, t => t.receipt),
    transporterDepartment: chain(transporter, t => t.department),
    transporterValidityLimit: chain(transporter, t => t.validityLimit),
    transporterTransportType: chain(transporter, t => t.transportType)
  };
}

function flattenVhuWasteDetailsInput({
  wasteDetails
}: Pick<GraphqlVhuForm, "wasteDetails">) {
  return {
    wasteDetailsPackagingType: chain(wasteDetails, w => w.packagingType),
    wasteDetailsIdentificationNumbers: chain(
      wasteDetails,
      w => w.identificationNumbers
    ),
    wasteDetailsIdentificationType: chain(
      wasteDetails,
      w => w.identificationType
    ),
    wasteDetailsQuantity: chain(wasteDetails, w => w.quantity),
    wasteDetailsQuantityUnit: chain(wasteDetails, w => w.quantityUnit)
  };
}
