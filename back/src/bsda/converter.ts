import { chain, nullIfNoValues, safeInput } from "../forms/form-converter";
import {
  FormCompany,
  Signature,
  Bsda as GraphqlBsda,
  BsdaEmitter,
  BsdaEmission,
  BsdaPackaging,
  BsdaWaste,
  BsdaQuantity,
  BsdaDestination,
  BsdaReception,
  BsdaOperation,
  BsdaWorker,
  BsdaTransporter,
  BsdaTransport,
  BsdaRecepisse,
  BsdaInput,
  BsdaWork
} from "../generated/graphql/types";
import { Prisma, Bsda as PrismaBsda } from "@prisma/client";

export function expandBsdaFormFromDb(form: PrismaBsda): GraphqlBsda {
  return {
    id: form.id,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isDraft: form.isDraft,
    status: form.status,
    type: form.type,
    emitter: nullIfNoValues<BsdaEmitter>({
      company: nullIfNoValues<FormCompany>({
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      }),
      emission: nullIfNoValues<BsdaEmission>({
        signature: nullIfNoValues<Signature>({
          author: form.emitterEmissionSignatureAuthor,
          date: form.emitterEmissionSignatureDate
        })
      })
    }),
    packagings: form.packagings as BsdaPackaging[],
    waste: nullIfNoValues<BsdaWaste>({
      code: form.wasteCode,
      consistence: form.wasteConsistence,
      familyCode: form.wasteFamilyCode,
      materialName: form.wasteMaterialName,
      name: form.wasteName,
      sealNumbers: form.wasteSealNumbers,
      adr: form.wasteAdr
    }),
    quantity: nullIfNoValues<BsdaQuantity>({
      type: form.quantityType,
      value: form.quantityValue
    }),
    destination: nullIfNoValues<BsdaDestination>({
      company: nullIfNoValues<FormCompany>({
        name: form.destinationCompanyName,
        siret: form.destinationCompanySiret,
        address: form.destinationCompanyAddress,
        contact: form.destinationCompanyContact,
        phone: form.destinationCompanyPhone,
        mail: form.destinationCompanyMail
      }),
      cap: form.destinationCap,
      plannedOperationCode: form.destinationPlannedOperationCode,
      reception: nullIfNoValues<BsdaReception>({
        acceptationStatus: form.destinationReceptionAcceptationStatus,
        refusalReason: form.destinationReceptionRefusalReason,
        date: form.destinationReceptionDate,
        quantity: nullIfNoValues<BsdaQuantity>({
          type: form.destinationReceptionQuantityType,
          value: form.destinationReceptionQuantityValue
        }),
        signature: nullIfNoValues<Signature>({
          author: form.destinationReceptionSignatureAuthor,
          date: form.destinationReceptionSignatureDate
        })
      }),
      operation: nullIfNoValues<BsdaOperation>({
        code: form.destinationOperationCode,
        date: form.destinationOperationDate,
        signature: nullIfNoValues<Signature>({
          author: form.destinationOperationSignatureAuthor,
          date: form.destinationOperationSignatureDate
        })
      })
    }),
    worker: nullIfNoValues<BsdaWorker>({
      company: nullIfNoValues<FormCompany>({
        name: form.workerCompanyName,
        siret: form.workerCompanySiret,
        address: form.workerCompanyAddress,
        contact: form.workerCompanyContact,
        phone: form.workerCompanyPhone,
        mail: form.workerCompanyMail
      }),
      work: nullIfNoValues<BsdaWork>({
        hasEmitterPaperSignature: form.workerWorkHasEmitterPaperSignature,
        signature: nullIfNoValues<Signature>({
          author: form.workerWorkSignatureAuthor,
          date: form.workerWorkSignatureDate
        })
      })
    }),
    transporter: nullIfNoValues<BsdaTransporter>({
      company: nullIfNoValues<FormCompany>({
        name: form.transporterCompanyName,
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail,
        vatNumber: form.transporterCompanyVatNumber
      }),
      recepisse: nullIfNoValues<BsdaRecepisse>({
        department: form.transporterRecepisseDepartment,
        number: form.transporterRecepisseNumber,
        validityLimit: form.transporterRecepisseValidityLimit
      }),
      transport: nullIfNoValues<BsdaTransport>({
        signature: nullIfNoValues<Signature>({
          author: form.transporterTransportSignatureAuthor,
          date: form.transporterTransportSignatureDate
        })
      })
    })
  };
}

export function flattenBsdaInput(
  formInput: BsdaInput
): Partial<Prisma.BsdaCreateInput> {
  return safeInput({
    type: chain(formInput, f => f.type),
    ...flattenBsdaEmitterInput(formInput),
    ...flattenBsdaDestinationInput(formInput),
    ...flattenBsdaTransporterInput(formInput),
    ...flattenBsdaWorkerInput(formInput),
    ...flattenBsdaWasteInput(formInput),
    packagings: chain(formInput, f => f.packagings),
    ...flattenBsdaQuantityInput(formInput)
  });
}

function flattenBsdaEmitterInput({ emitter }: Pick<BsdaInput, "emitter">) {
  return {
    emitterIsPrivateIndividual: chain(emitter, e => e.isPrivateIndividual),
    emitterCompanyName: chain(emitter, e => chain(e.company, c => c.name)),
    emitterCompanySiret: chain(emitter, e => chain(e.company, c => c.siret)),
    emitterCompanyAddress: chain(emitter, e =>
      chain(e.company, c => c.address)
    ),
    emitterCompanyContact: chain(emitter, e =>
      chain(e.company, c => c.contact)
    ),
    emitterCompanyPhone: chain(emitter, e => chain(e.company, c => c.phone)),
    emitterCompanyMail: chain(emitter, e => chain(e.company, c => c.mail)),
    emitterWorkSiteName: chain(emitter, e => chain(e.worksite, w => w.name)),
    emitterWorkSiteAddress: chain(emitter, e =>
      chain(e.worksite, w => w.address)
    ),
    emitterWorkSiteCity: chain(emitter, e => chain(e.worksite, w => w.city)),
    emitterWorkSitePostalCode: chain(emitter, e =>
      chain(e.worksite, w => w.postalCode)
    ),
    emitterWorkSiteInfos: chain(emitter, e => chain(e.worksite, w => w.infos))
  };
}

function flattenBsdaDestinationInput({
  destination
}: Pick<BsdaInput, "destination">) {
  return {
    destinationCompanyName: chain(destination, d =>
      chain(d.company, c => c.name)
    ),
    destinationCompanySiret: chain(destination, d =>
      chain(d.company, c => c.siret)
    ),
    destinationCompanyAddress: chain(destination, d =>
      chain(d.company, c => c.address)
    ),
    destinationCompanyContact: chain(destination, d =>
      chain(d.company, c => c.contact)
    ),
    destinationCompanyPhone: chain(destination, d =>
      chain(d.company, c => c.phone)
    ),
    destinationCompanyMail: chain(destination, d =>
      chain(d.company, c => c.mail)
    ),
    destinationCap: chain(destination, d => d.cap),
    destinationPlannedOperationCode: chain(
      destination,
      d => d.plannedOperationCode
    ),

    destinationReceptionDate: chain(destination, d =>
      chain(d.reception, r => r.date)
    ),
    destinationReceptionQuantityType: chain(destination, d =>
      chain(d.reception, r => chain(r.quantity, q => q.type))
    ),
    destinationReceptionQuantityValue: chain(destination, d =>
      chain(d.reception, r => chain(r.quantity, q => q.value))
    ),
    destinationReceptionAcceptationStatus: chain(destination, d =>
      chain(d.reception, r => r.acceptationStatus)
    ),
    destinationReceptionRefusalReason: chain(destination, d =>
      chain(d.reception, r => r.refusalReason)
    ),

    destinationOperationCode: chain(destination, d =>
      chain(d.operation, o => o.code)
    ),
    destinationOperationDate: chain(destination, d =>
      chain(d.operation, o => o.date)
    )
  };
}

function flattenBsdaTransporterInput({
  transporter
}: Pick<BsdaInput, "transporter">) {
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

function flattenBsdaWorkerInput({ worker }: Pick<BsdaInput, "worker">) {
  return {
    workerCompanyName: chain(worker, w => chain(w.company, c => c.name)),
    workerCompanySiret: chain(worker, w => chain(w.company, c => c.siret)),
    workerCompanyAddress: chain(worker, w => chain(w.company, c => c.address)),
    workerCompanyContact: chain(worker, w => chain(w.company, c => c.contact)),
    workerCompanyPhone: chain(worker, w => chain(w.company, c => c.phone)),
    workerCompanyMail: chain(worker, w => chain(w.company, c => c.mail)),
    workerWorkHasEmitterPaperSignature: chain(worker, w =>
      chain(w.work, wo => wo.hasEmitterPaperSignature)
    )
  };
}

function flattenBsdaQuantityInput({ quantity }: Pick<BsdaInput, "quantity">) {
  return {
    quantityType: chain(quantity, q => q.type),
    quantityValue: chain(quantity, q => q.value)
  };
}

function flattenBsdaWasteInput({ waste }: Pick<BsdaInput, "waste">) {
  return {
    wasteCode: chain(waste, w => w.code),
    wasteAdr: chain(waste, w => w.adr),
    wasteName: chain(waste, w => w.name),
    wasteFamilyCode: chain(waste, w => w.familyCode),
    wasteMaterialName: chain(waste, w => w.materialName),
    wasteConsistence: chain(waste, w => w.consistence),
    wasteSealNumbers: chain(waste, w => w.sealNumbers)
  };
}
