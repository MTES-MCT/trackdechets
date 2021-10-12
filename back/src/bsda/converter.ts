import { chain, nullIfNoValues, safeInput } from "../forms/form-converter";
import {
  FormCompany,
  Signature,
  Bsda as GraphqlBsda,
  InitialBsda as GraphQLInitialBsda,
  BsdaEmitter,
  BsdaEmission,
  BsdaPackaging,
  BsdaWaste,
  BsdaDestination,
  BsdaReception,
  BsdaOperation,
  BsdaWorker,
  BsdaTransporter,
  BsdaTransport,
  BsdaRecepisse,
  BsdaInput,
  BsdaWork,
  BsdaBroker,
  BsdaPickupSite,
  BsdaWeight,
  BsdaEcoOrganisme
} from "../generated/graphql/types";
import { Prisma, Bsda as PrismaBsda } from "@prisma/client";

export function expandBsdaFromDb(form: PrismaBsda): GraphqlBsda {
  return {
    id: form.id,
    createdAt: form.createdAt,
    updatedAt: form.updatedAt,
    isDraft: form.isDraft,
    status: form.status,
    type: form.type,
    emitter: nullIfNoValues<BsdaEmitter>({
      isPrivateIndividual: form.emitterIsPrivateIndividual,
      company: nullIfNoValues<FormCompany>({
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: form.emitterCompanyAddress,
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      }),
      customInfo: form.emitterCustomInfo,
      emission: nullIfNoValues<BsdaEmission>({
        signature: nullIfNoValues<Signature>({
          author: form.emitterEmissionSignatureAuthor,
          date: form.emitterEmissionSignatureDate
        })
      }),
      pickupSite: nullIfNoValues<BsdaPickupSite>({
        address: form.emitterPickupSiteAddress,
        city: form.emitterPickupSiteCity,
        infos: form.emitterPickupSiteInfos,
        name: form.emitterPickupSiteName,
        postalCode: form.emitterPickupSitePostalCode
      })
    }),
    ecoOrganisme: nullIfNoValues<BsdaEcoOrganisme>({
      name: form.ecoOrganismeName,
      siret: form.ecoOrganismeSiret
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
    weight: nullIfNoValues<BsdaWeight>({
      isEstimate: form.weightIsEstimate,
      value: form.weightValue
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
      customInfo: form.destinationCustomInfo,
      cap: form.destinationCap,
      plannedOperationCode: form.destinationPlannedOperationCode,
      reception: nullIfNoValues<BsdaReception>({
        acceptationStatus: form.destinationReceptionAcceptationStatus,
        refusalReason: form.destinationReceptionRefusalReason,
        date: form.destinationReceptionDate,
        weight: form.destinationReceptionWeight
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
    broker: nullIfNoValues<BsdaBroker>({
      company: nullIfNoValues<FormCompany>({
        name: form.brokerCompanyName,
        siret: form.brokerCompanySiret,
        address: form.brokerCompanyAddress,
        contact: form.brokerCompanyContact,
        phone: form.brokerCompanyPhone,
        mail: form.brokerCompanyMail
      }),
      recepisse: nullIfNoValues<BsdaRecepisse>({
        department: form.brokerRecepisseDepartment,
        number: form.brokerRecepisseNumber,
        validityLimit: form.brokerRecepisseValidityLimit
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
      customInfo: form.transporterCustomInfo,
      recepisse: nullIfNoValues<BsdaRecepisse>({
        department: form.transporterRecepisseDepartment,
        number: form.transporterRecepisseNumber,
        validityLimit: form.transporterRecepisseValidityLimit
      }),
      transport: nullIfNoValues<BsdaTransport>({
        mode: form.transporterTransportMode,
        plates: form.transporterTransportPlates,
        takenOverAt: form.transporterTransportTakenOverAt,
        signature: nullIfNoValues<Signature>({
          author: form.transporterTransportSignatureAuthor,
          date: form.transporterTransportSignatureDate
        })
      })
    }),
    grouping: [],
    metadata: null
  };
}

export function flattenBsdaInput(
  formInput: BsdaInput
): Partial<Prisma.BsdaCreateInput> {
  return safeInput({
    type: chain(formInput, f => f.type),
    ...flattenBsdaEmitterInput(formInput),
    ...flattenBsdaEcoOrganismeInput(formInput),
    ...flattenBsdaDestinationInput(formInput),
    ...flattenBsdaTransporterInput(formInput),
    ...flattenBsdaWorkerInput(formInput),
    ...flattenBsdaBrokerInput(formInput),
    ...flattenBsdaWasteInput(formInput),
    packagings: chain(formInput, f => f.packagings),
    ...flattenBsdaWeightInput(formInput)
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
    emitterCustomInfo: chain(emitter, e => e.customInfo),
    emitterPickupSiteName: chain(emitter, e =>
      chain(e.pickupSite, w => w.name)
    ),
    emitterPickupSiteAddress: chain(emitter, e =>
      chain(e.pickupSite, w => w.address)
    ),
    emitterPickupSiteCity: chain(emitter, e =>
      chain(e.pickupSite, w => w.city)
    ),
    emitterPickupSitePostalCode: chain(emitter, e =>
      chain(e.pickupSite, w => w.postalCode)
    ),
    emitterPickupSiteInfos: chain(emitter, e =>
      chain(e.pickupSite, w => w.infos)
    )
  };
}

function flattenBsdaEcoOrganismeInput({
  ecoOrganisme
}: Pick<BsdaInput, "ecoOrganisme">) {
  return {
    ecoOrganismeName: chain(ecoOrganisme, e => e.name),
    ecoOrganismeSiret: chain(ecoOrganisme, e => e.siret)
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
    destinationCustomInfo: chain(destination, d => d.customInfo),
    destinationCap: chain(destination, d => d.cap),
    destinationPlannedOperationCode: chain(
      destination,
      d => d.plannedOperationCode
    ),

    destinationReceptionDate: chain(destination, d =>
      chain(d.reception, r => r.date)
    ),
    destinationReceptionWeight: chain(destination, d =>
      chain(d.reception, r => r.weight)
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
    ),
    destinationOperationNextDestinationCompanyName: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.name))
      )
    ),
    destinationOperationNextDestinationCompanySiret: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.siret))
      )
    ),
    destinationOperationNextDestinationCompanyVatNumber: chain(destination, d =>
      chain(d.operation, o =>
        chain(o.nextDestination, nd => chain(nd.company, c => c.vatNumber))
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
    destinationOperationNextDestinationCap: chain(destination, d =>
      chain(d.operation, o => chain(o.nextDestination, nd => nd.cap))
    ),
    destinationOperationNextDestinationPlannedOperationCode: chain(
      destination,
      d =>
        chain(d.operation, o =>
          chain(o.nextDestination, nd => nd.plannedOperationCode)
        )
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
    transporterCustomInfo: chain(transporter, t => t.customInfo),
    transporterRecepisseIsExempted: chain(transporter, t =>
      chain(t.recepisse, r => r.isExempted)
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
    transporterTransportMode: chain(transporter, t =>
      chain(t.transport, tr => tr.mode)
    ),
    transporterTransportPlates: chain(transporter, t =>
      chain(t.transport, tr => tr.plates)
    ),
    transporterTransportTakenOverAt: chain(transporter, t =>
      chain(t.transport, tr => tr.takenOverAt)
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

function flattenBsdaBrokerInput({ broker }: Pick<BsdaInput, "broker">) {
  return {
    brokerCompanyName: chain(broker, b => chain(b.company, c => c.name)),
    brokerCompanySiret: chain(broker, b => chain(b.company, c => c.siret)),
    brokerCompanyAddress: chain(broker, b => chain(b.company, c => c.address)),
    brokerCompanyContact: chain(broker, b => chain(b.company, c => c.contact)),
    brokerCompanyPhone: chain(broker, b => chain(b.company, c => c.phone)),
    brokerCompanyMail: chain(broker, b => chain(b.company, c => c.mail)),
    brokerRecepisseNumber: chain(broker, b =>
      chain(b.recepisse, r => r.number)
    ),
    brokerRecepisseDepartment: chain(broker, b =>
      chain(b.recepisse, r => r.department)
    ),
    brokerRecepisseValidityLimit: chain(broker, b =>
      chain(b.recepisse, r => r.validityLimit)
    )
  };
}

function flattenBsdaWeightInput({ weight }: Pick<BsdaInput, "weight">) {
  return {
    weightIsEstimate: chain(weight, q => q.isEstimate),
    weightValue: chain(weight, q => q.value)
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

/**
 * Only returns fields that can be read from the child BSDA in
 * case of a forwarding or grouping
 */
export function toInitialBsda(bsda: GraphqlBsda): GraphQLInitialBsda {
  return {
    id: bsda.id,
    // emitter can only be read by someone who is contributor of the initial BSda, this
    // logic is implemented in the InitialBsda resolver
    emitter: bsda.emitter,
    waste: bsda.waste,
    weight: bsda.weight,
    destination: bsda.destination,
    packagings: bsda.packagings
  };
}
