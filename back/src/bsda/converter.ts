import {
  nullIfNoValues,
  safeInput,
  processDate,
  chain,
  undefinedOrDefault
} from "../common/converter";

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
  BsdaEcoOrganisme,
  BsdaNextDestination,
  BsdaRevisionRequestContentInput,
  BsdaRevisionRequestContent,
  BsdaRevisionRequestEmitter,
  BsdaRevisionRequestWaste,
  BsdaRevisionRequestDestination,
  BsdaRevisionRequestOperation,
  BsdaRevisionRequestReception,
  BsdaWorkerCertification,
  CompanyInput
} from "../generated/graphql/types";
import {
  Prisma,
  Bsda as PrismaBsda,
  BsdaRevisionRequest
} from "@prisma/client";
import { BsdElastic } from "../common/elastic";
import { getTransporterCompanyOrgId } from "../common/constants/companySearchHelpers";
import { Decimal } from "decimal.js-light";

export function expandBsdaFromDb(form: PrismaBsda): GraphqlBsda {
  return {
    id: form.id,
    createdAt: processDate(form.createdAt),
    updatedAt: processDate(form.updatedAt),
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
          date: processDate(form.emitterEmissionSignatureDate)
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
      name: form.wasteMaterialName, // TODO To remove - keeps support for `name` for now
      consistence: form.wasteConsistence,
      familyCode: form.wasteFamilyCode,
      materialName: form.wasteMaterialName,
      sealNumbers: form.wasteSealNumbers,
      adr: form.wasteAdr,
      pop: form.wastePop
    }),
    weight: nullIfNoValues<BsdaWeight>({
      isEstimate: form.weightIsEstimate,
      value: form.weightValue
        ? new Decimal(form.weightValue).dividedBy(1000).toNumber()
        : form.weightValue
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
        date: processDate(form.destinationReceptionDate),
        weight: form.destinationReceptionWeight
          ? new Decimal(form.destinationReceptionWeight)
              .dividedBy(1000)
              .toNumber()
          : form.destinationReceptionWeight
      }),
      operation: nullIfNoValues<BsdaOperation>({
        code: form.destinationOperationCode,
        description: form.destinationOperationDescription,
        date: form.destinationOperationDate,
        signature: nullIfNoValues<Signature>({
          author: form.destinationOperationSignatureAuthor,
          date: processDate(form.destinationOperationSignatureDate)
        }),
        nextDestination: nullIfNoValues<BsdaNextDestination>({
          company: nullIfNoValues<FormCompany>({
            name: form.destinationOperationNextDestinationCompanyName,
            siret: form.destinationOperationNextDestinationCompanySiret,
            address: form.destinationOperationNextDestinationCompanyAddress,
            contact: form.destinationOperationNextDestinationCompanyContact,
            phone: form.destinationOperationNextDestinationCompanyPhone,
            mail: form.destinationOperationNextDestinationCompanyMail
          }),
          cap: form.destinationOperationNextDestinationCap,
          plannedOperationCode:
            form.destinationOperationNextDestinationPlannedOperationCode
        })
      })
    }),
    worker: nullIfNoValues<BsdaWorker>({
      isDisabled: Boolean(form.workerIsDisabled),
      company: nullIfNoValues<FormCompany>({
        name: form.workerCompanyName,
        siret: form.workerCompanySiret,
        address: form.workerCompanyAddress,
        contact: form.workerCompanyContact,
        phone: form.workerCompanyPhone,
        mail: form.workerCompanyMail
      }),
      certification: nullIfNoValues<BsdaWorkerCertification>({
        hasSubSectionFour: form.workerCertificationHasSubSectionFour,
        hasSubSectionThree: form.workerCertificationHasSubSectionThree,
        certificationNumber: form.workerCertificationCertificationNumber,
        validityLimit: form.workerCertificationValidityLimit,
        organisation: form.workerCertificationOrganisation
      }),
      work: nullIfNoValues<BsdaWork>({
        hasEmitterPaperSignature: form.workerWorkHasEmitterPaperSignature,
        signature: nullIfNoValues<Signature>({
          author: form.workerWorkSignatureAuthor,
          date: processDate(form.workerWorkSignatureDate)
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
        validityLimit: processDate(form.brokerRecepisseValidityLimit)
      })
    }),
    transporter: nullIfNoValues<BsdaTransporter>({
      company: nullIfNoValues<FormCompany>({
        name: form.transporterCompanyName,
        orgId: getTransporterCompanyOrgId(form),
        siret: form.transporterCompanySiret,
        vatNumber: form.transporterCompanyVatNumber,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail
      }),
      customInfo: form.transporterCustomInfo,
      recepisse: nullIfNoValues<BsdaRecepisse>({
        department: form.transporterRecepisseDepartment,
        number: form.transporterRecepisseNumber,
        validityLimit: processDate(form.transporterRecepisseValidityLimit),
        isExempted: form.transporterRecepisseIsExempted
      }),
      transport: nullIfNoValues<BsdaTransport>({
        mode: form.transporterTransportMode,
        plates: form.transporterTransportPlates,
        takenOverAt: processDate(form.transporterTransportTakenOverAt),
        signature: nullIfNoValues<Signature>({
          author: form.transporterTransportSignatureAuthor,
          date: processDate(form.transporterTransportSignatureDate)
        })
      })
    }),
    grouping: [],
    metadata: undefined as any
  };
}
export function expandBsdaFromElastic(
  bsda: BsdElastic["rawBsd"]
): GraphqlBsda & { groupedIn?: string; forwardedIn?: string } {
  const expanded = expandBsdaFromDb(bsda);

  // pass down related field to sub-resolvers
  return {
    ...expanded,
    groupedIn: bsda?.groupedIn,
    forwardedIn: bsda?.forwardedIn
  };
}

type FlattenedBsdaInput = Partial<
  Omit<Prisma.BsdaCreateInput, "intermediariesOrgIds">
>;

export function flattenBsdaInput(formInput: BsdaInput) {
  return safeInput<FlattenedBsdaInput>({
    type: formInput?.type ?? undefined,
    ...flattenBsdaEmitterInput(formInput),
    ...flattenBsdaEcoOrganismeInput(formInput),
    ...flattenBsdaDestinationInput(formInput),
    ...flattenBsdaTransporterInput(formInput),
    ...flattenBsdaWorkerInput(formInput),
    ...flattenBsdaBrokerInput(formInput),
    ...flattenBsdaWasteInput(formInput),
    packagings: undefinedOrDefault(
      chain(formInput, f => f.packagings),
      []
    ),
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

export function flattenBsdaDestinationInput({
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
      chain(d.reception, r =>
        r.weight ? new Decimal(r.weight).times(1000).toNumber() : r.weight
      )
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
    destinationOperationDescription: chain(destination, d =>
      chain(d.operation, o => o.description)
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
    transporterTransportPlates: undefinedOrDefault(
      chain(transporter, t => chain(t.transport, tr => tr.plates)),
      []
    ),
    transporterTransportTakenOverAt: chain(transporter, t =>
      chain(t.transport, tr => tr.takenOverAt)
    )
  };
}

function flattenBsdaWorkerInput({ worker }: Pick<BsdaInput, "worker">) {
  return {
    workerIsDisabled: chain(worker, w => Boolean(w.isDisabled)),
    workerCompanyName: chain(worker, w => chain(w.company, c => c.name)),
    workerCompanySiret: chain(worker, w => chain(w.company, c => c.siret)),
    workerCompanyAddress: chain(worker, w => chain(w.company, c => c.address)),
    workerCompanyContact: chain(worker, w => chain(w.company, c => c.contact)),
    workerCompanyPhone: chain(worker, w => chain(w.company, c => c.phone)),
    workerCompanyMail: chain(worker, w => chain(w.company, c => c.mail)),
    workerWorkHasEmitterPaperSignature: chain(worker, w =>
      chain(w.work, wo => wo.hasEmitterPaperSignature)
    ),
    workerCertificationHasSubSectionFour: chain(worker, w =>
      chain(w.certification, c => c.hasSubSectionFour)
    ),
    workerCertificationHasSubSectionThree: chain(worker, w =>
      chain(w.certification, c => c.hasSubSectionThree)
    ),
    workerCertificationCertificationNumber: chain(worker, w =>
      chain(w.certification, c => c.certificationNumber)
    ),
    workerCertificationValidityLimit: chain(worker, w =>
      chain(w.certification, c => c.validityLimit)
    ),
    workerCertificationOrganisation: chain(worker, w =>
      chain(w.certification, c => c.organisation)
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
    weightValue: chain(weight, q =>
      q.value ? new Decimal(q.value).times(1000).toNumber() : q.value
    )
  };
}

function flattenBsdaWasteInput({ waste }: Pick<BsdaInput, "waste">) {
  return {
    wasteCode: chain(waste, w => w.code),
    wasteAdr: chain(waste, w => w.adr),
    wasteFamilyCode: chain(waste, w => w.familyCode),
    // TODO: name is deprecated, but still supported as an input for now.
    // As `name` was previously mandatory, and `materialName` optional, to avoid breaking integrations we fallback to `name` for now.
    // Remove the `?? ...` part when `name` is removed from the input.
    wasteMaterialName:
      chain(waste, w => w.materialName) ?? chain(waste, w => w.name),
    wasteConsistence: chain(waste, w => w.consistence),
    wasteSealNumbers: undefinedOrDefault(
      chain(waste, w => w.sealNumbers),
      []
    ),
    wastePop: undefinedOrDefault(
      chain(waste, w => w.pop),
      false
    )
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
    packagings: bsda.packagings ?? []
  };
}

export function flattenBsdaRevisionRequestInput(
  reviewContent: BsdaRevisionRequestContentInput
): Partial<Prisma.BsdaRevisionRequestCreateInput> {
  return safeInput({
    brokerCompanyAddress: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.company, c => c.address))
    ),
    brokerCompanyContact: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.company, c => c.contact))
    ),
    brokerCompanyMail: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.company, c => c.mail))
    ),
    brokerCompanyName: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.company, c => c.name))
    ),
    brokerCompanyPhone: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.company, c => c.phone))
    ),
    brokerCompanySiret: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.company, c => c.siret))
    ),
    brokerRecepisseNumber: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.recepisse, re => re.number))
    ),
    brokerRecepisseDepartment: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.recepisse, re => re.department))
    ),
    brokerRecepisseValidityLimit: chain(reviewContent, r =>
      chain(r.broker, b => chain(b.recepisse, re => re.validityLimit))
    ),
    emitterPickupSiteName: chain(reviewContent, c =>
      chain(c.emitter, e => chain(e.pickupSite, w => w.name))
    ),
    emitterPickupSiteAddress: chain(reviewContent, c =>
      chain(c.emitter, e => chain(e.pickupSite, w => w.address))
    ),
    emitterPickupSiteCity: chain(reviewContent, c =>
      chain(c.emitter, e => chain(e.pickupSite, w => w.city))
    ),
    emitterPickupSitePostalCode: chain(reviewContent, c =>
      chain(c.emitter, e => chain(e.pickupSite, w => w.postalCode))
    ),
    emitterPickupSiteInfos: chain(reviewContent, c =>
      chain(c.emitter, e => chain(e.pickupSite, w => w.infos))
    ),
    wasteCode: chain(reviewContent, r => chain(r.waste, w => w.code)),
    wasteMaterialName: chain(reviewContent, r =>
      chain(r.waste, w => w.materialName)
    ),
    wasteSealNumbers: undefinedOrDefault(
      chain(reviewContent, r => chain(r.waste, w => w.sealNumbers)),
      []
    ),
    wastePop: chain(reviewContent, r => chain(r.waste, w => w.pop)),
    packagings: undefinedOrDefault(
      chain(reviewContent, r => r.packagings),
      []
    ),
    destinationOperationCode: chain(reviewContent, r =>
      chain(r.destination, d => chain(d.operation, o => o.code))
    ),
    destinationOperationDescription: chain(reviewContent, r =>
      chain(r.destination, d => chain(d.operation, o => o.description))
    ),
    destinationCap: chain(reviewContent, r => chain(r.destination, d => d.cap)),
    destinationReceptionWeight: chain(reviewContent, r =>
      chain(r.destination, d =>
        chain(d.reception, r =>
          r.weight ? new Decimal(r.weight).times(1000).toNumber() : r.weight
        )
      )
    ),
    isCanceled: undefinedOrDefault(
      chain(reviewContent, c => chain(c, r => r.isCanceled)),
      false
    )
  });
}

export function expandBsdaRevisionRequestContent(
  bsdaRevisionRequest: BsdaRevisionRequest
): BsdaRevisionRequestContent {
  return {
    emitter: nullIfNoValues<BsdaRevisionRequestEmitter>({
      pickupSite: nullIfNoValues<BsdaPickupSite>({
        address: bsdaRevisionRequest.emitterPickupSiteAddress,
        city: bsdaRevisionRequest.emitterPickupSiteCity,
        infos: bsdaRevisionRequest.emitterPickupSiteInfos,
        name: bsdaRevisionRequest.emitterPickupSiteName,
        postalCode: bsdaRevisionRequest.emitterPickupSitePostalCode
      })
    }),
    packagings: bsdaRevisionRequest.packagings as BsdaPackaging[],
    waste: nullIfNoValues<BsdaRevisionRequestWaste>({
      code: bsdaRevisionRequest.wasteCode,
      materialName: bsdaRevisionRequest.wasteMaterialName,
      pop: bsdaRevisionRequest.wastePop,
      sealNumbers: bsdaRevisionRequest.wasteSealNumbers
    }),
    broker: nullIfNoValues<BsdaBroker>({
      company: nullIfNoValues<FormCompany>({
        name: bsdaRevisionRequest.brokerCompanyName,
        siret: bsdaRevisionRequest.brokerCompanySiret,
        address: bsdaRevisionRequest.brokerCompanyAddress,
        contact: bsdaRevisionRequest.brokerCompanyContact,
        phone: bsdaRevisionRequest.brokerCompanyPhone,
        mail: bsdaRevisionRequest.brokerCompanyMail
      }),
      recepisse: nullIfNoValues<BsdaRecepisse>({
        department: bsdaRevisionRequest.brokerRecepisseDepartment,
        number: bsdaRevisionRequest.brokerRecepisseNumber,
        validityLimit: bsdaRevisionRequest.brokerRecepisseValidityLimit
      })
    }),
    destination: nullIfNoValues<BsdaRevisionRequestDestination>({
      cap: bsdaRevisionRequest.destinationCap,
      operation: nullIfNoValues<BsdaRevisionRequestOperation>({
        code: bsdaRevisionRequest.destinationOperationCode,
        description: bsdaRevisionRequest.destinationOperationDescription
      }),
      reception: nullIfNoValues<BsdaRevisionRequestReception>({
        weight: bsdaRevisionRequest.destinationReceptionWeight
          ? new Decimal(bsdaRevisionRequest.destinationReceptionWeight)
              .dividedBy(1000)
              .toNumber()
          : bsdaRevisionRequest.destinationReceptionWeight
      })
    }),
    isCanceled: bsdaRevisionRequest.isCanceled
  };
}

export function companyToIntermediaryInput(
  companies: CompanyInput[]
): Prisma.IntermediaryBsdaAssociationCreateManyBsdaInput[] {
  if (!companies) return [];

  return companies.map(company => {
    return {
      name: company.name!,
      siret: company.siret!,
      vatNumber: company.vatNumber,
      address: company.address,
      contact: company.contact!,
      phone: company.phone,
      mail: company.mail
    };
  });
}
