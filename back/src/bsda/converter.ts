import {
  nullIfNoValues,
  safeInput,
  processDate,
  chain,
  undefinedOrDefault,
  processDecimal
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
  CompanyInput,
  Bsda,
  BsdaTransporterInput
} from "@td/codegen-back";
import {
  Prisma,
  BsdaTransporter as PrismaBsdaTransporter,
  BsdaRevisionRequest
} from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";
import { Decimal } from "decimal.js";
import { BsdaForElastic } from "./elastic";
import { BsdaWithTransporters } from "./types";
import { getFirstTransporterSync } from "./database";

export function expandBsdaFromDb(bsda: BsdaWithTransporters): GraphqlBsda {
  const transporter = getFirstTransporterSync(bsda);
  return {
    id: bsda.id,
    createdAt: processDate(bsda.createdAt),
    updatedAt: processDate(bsda.updatedAt),
    isDraft: bsda.isDraft,
    status: bsda.status,
    type: bsda.type,
    emitter: nullIfNoValues<BsdaEmitter>({
      isPrivateIndividual: bsda.emitterIsPrivateIndividual,
      company: nullIfNoValues<FormCompany>({
        name: bsda.emitterCompanyName,
        siret: bsda.emitterCompanySiret,
        address: bsda.emitterCompanyAddress,
        contact: bsda.emitterCompanyContact,
        phone: bsda.emitterCompanyPhone,
        mail: bsda.emitterCompanyMail
      }),
      customInfo: bsda.emitterCustomInfo,
      emission: nullIfNoValues<BsdaEmission>({
        signature: nullIfNoValues<Signature>({
          author: bsda.emitterEmissionSignatureAuthor,
          date: processDate(bsda.emitterEmissionSignatureDate)
        })
      }),
      pickupSite: nullIfNoValues<BsdaPickupSite>({
        address: bsda.emitterPickupSiteAddress,
        city: bsda.emitterPickupSiteCity,
        infos: bsda.emitterPickupSiteInfos,
        name: bsda.emitterPickupSiteName,
        postalCode: bsda.emitterPickupSitePostalCode
      })
    }),
    ecoOrganisme: nullIfNoValues<BsdaEcoOrganisme>({
      name: bsda.ecoOrganismeName,
      siret: bsda.ecoOrganismeSiret
    }),
    packagings: bsda.packagings as BsdaPackaging[],
    waste: nullIfNoValues<BsdaWaste>({
      code: bsda.wasteCode,
      name: bsda.wasteMaterialName, // TODO To remove - keeps support for `name` for now
      consistence: bsda.wasteConsistence,
      familyCode: bsda.wasteFamilyCode,
      materialName: bsda.wasteMaterialName,
      sealNumbers: bsda.wasteSealNumbers,
      adr: bsda.wasteAdr,
      pop: bsda.wastePop
    }),
    weight: nullIfNoValues<BsdaWeight>({
      isEstimate: bsda.weightIsEstimate,
      value: bsda.weightValue
        ? processDecimal(bsda.weightValue)!.dividedBy(1000).toNumber()
        : null
    }),
    destination: nullIfNoValues<BsdaDestination>({
      company: nullIfNoValues<FormCompany>({
        name: bsda.destinationCompanyName,
        siret: bsda.destinationCompanySiret,
        address: bsda.destinationCompanyAddress,
        contact: bsda.destinationCompanyContact,
        phone: bsda.destinationCompanyPhone,
        mail: bsda.destinationCompanyMail
      }),
      customInfo: bsda.destinationCustomInfo,
      cap: bsda.destinationCap,
      plannedOperationCode: bsda.destinationPlannedOperationCode,
      reception: nullIfNoValues<BsdaReception>({
        acceptationStatus: bsda.destinationReceptionAcceptationStatus,
        refusalReason: bsda.destinationReceptionRefusalReason,
        date: processDate(bsda.destinationReceptionDate),
        weight: bsda.destinationReceptionWeight
          ? processDecimal(bsda.destinationReceptionWeight)
              .dividedBy(1000)
              .toNumber()
          : null
      }),
      operation: nullIfNoValues<BsdaOperation>({
        code: bsda.destinationOperationCode,
        mode: bsda.destinationOperationMode,
        description: bsda.destinationOperationDescription,
        date: bsda.destinationOperationDate,
        signature: nullIfNoValues<Signature>({
          author: bsda.destinationOperationSignatureAuthor,
          date: processDate(bsda.destinationOperationSignatureDate)
        }),
        nextDestination: nullIfNoValues<BsdaNextDestination>({
          company: nullIfNoValues<FormCompany>({
            name: bsda.destinationOperationNextDestinationCompanyName,
            siret: bsda.destinationOperationNextDestinationCompanySiret,
            address: bsda.destinationOperationNextDestinationCompanyAddress,
            contact: bsda.destinationOperationNextDestinationCompanyContact,
            phone: bsda.destinationOperationNextDestinationCompanyPhone,
            mail: bsda.destinationOperationNextDestinationCompanyMail
          }),
          cap: bsda.destinationOperationNextDestinationCap,
          plannedOperationCode:
            bsda.destinationOperationNextDestinationPlannedOperationCode
        })
      })
    }),
    worker: nullIfNoValues<BsdaWorker>({
      isDisabled: Boolean(bsda.workerIsDisabled),
      company: nullIfNoValues<FormCompany>({
        name: bsda.workerCompanyName,
        siret: bsda.workerCompanySiret,
        address: bsda.workerCompanyAddress,
        contact: bsda.workerCompanyContact,
        phone: bsda.workerCompanyPhone,
        mail: bsda.workerCompanyMail
      }),
      certification: nullIfNoValues<BsdaWorkerCertification>({
        hasSubSectionFour: bsda.workerCertificationHasSubSectionFour,
        hasSubSectionThree: bsda.workerCertificationHasSubSectionThree,
        certificationNumber: bsda.workerCertificationCertificationNumber,
        validityLimit: bsda.workerCertificationValidityLimit,
        organisation: bsda.workerCertificationOrganisation
      }),
      work: nullIfNoValues<BsdaWork>({
        hasEmitterPaperSignature: bsda.workerWorkHasEmitterPaperSignature,
        signature: nullIfNoValues<Signature>({
          author: bsda.workerWorkSignatureAuthor,
          date: processDate(bsda.workerWorkSignatureDate)
        })
      })
    }),
    broker: nullIfNoValues<BsdaBroker>({
      company: nullIfNoValues<FormCompany>({
        name: bsda.brokerCompanyName,
        siret: bsda.brokerCompanySiret,
        address: bsda.brokerCompanyAddress,
        contact: bsda.brokerCompanyContact,
        phone: bsda.brokerCompanyPhone,
        mail: bsda.brokerCompanyMail
      }),
      recepisse: nullIfNoValues<BsdaRecepisse>({
        department: bsda.brokerRecepisseDepartment,
        number: bsda.brokerRecepisseNumber,
        validityLimit: processDate(bsda.brokerRecepisseValidityLimit)
      })
    }),
    transporter: transporter ? expandTransporterFromDb(transporter) : null,
    transporters: (bsda.transporters ?? [])
      .map(t => expandTransporterFromDb(t))
      .filter(Boolean),
    grouping: [],
    metadata: undefined as any
  };
}

export function expandTransporterFromDb(
  transporter: PrismaBsdaTransporter
): BsdaTransporter | null {
  return nullIfNoValues<BsdaTransporter>({
    id: transporter.id,
    company: nullIfNoValues<FormCompany>({
      name: transporter.transporterCompanyName,
      orgId: getTransporterCompanyOrgId(transporter),
      siret: transporter.transporterCompanySiret,
      vatNumber: transporter.transporterCompanyVatNumber,
      address: transporter.transporterCompanyAddress,
      contact: transporter.transporterCompanyContact,
      phone: transporter.transporterCompanyPhone,
      mail: transporter.transporterCompanyMail
    }),
    customInfo: transporter.transporterCustomInfo,
    recepisse: nullIfNoValues<BsdaRecepisse>({
      department: transporter.transporterRecepisseDepartment,
      number: transporter.transporterRecepisseNumber,
      validityLimit: processDate(transporter.transporterRecepisseValidityLimit),
      isExempted: transporter.transporterRecepisseIsExempted
    }),
    transport: nullIfNoValues<BsdaTransport>({
      mode: transporter.transporterTransportMode,
      plates: transporter.transporterTransportPlates,
      takenOverAt: processDate(transporter.transporterTransportTakenOverAt),
      signature: nullIfNoValues<Signature>({
        author: transporter.transporterTransportSignatureAuthor,
        date: processDate(transporter.transporterTransportSignatureDate)
      })
    })
  });
}

export function expandBsdaFromElastic(bsda: BsdaForElastic): GraphqlBsda {
  const expanded = expandBsdaFromDb(bsda);

  const groupedIn = bsda.groupedIn
    ? // Dans le cas de la requête `bsds`, et pour des raisons de perfs, on souhaite utiliser directement le champ
      // `groupedIn` du BsdaForElastic (Cf resolver Bsda). Or ce champ ne contient que l'identifiant du
      // Bsda. On est donc obligé de faire un typecasting ici en gardant bien en tête côté front qu'on ne peut
      // requêter que l'identifiant
      (bsda.groupedIn as Bsda)
    : null;

  const forwardedIn = bsda.forwardedIn
    ? // Dans le cas de la requête `bsds`, et pour des raisons de perfs, on souhaite utiliser directement le champ
      // `groupedIn` du BsdaForElastic (Cf resolver Bsda). Or ce champ ne contient que l'identifiant du
      // Bsda. On est donc obligé de faire un typecasting ici en gardant bien en tête côté front qu'on ne peut
      // requêter que l'identifiant
      (bsda.forwardedIn as Bsda)
    : null;

  return {
    ...expanded,
    groupedIn,
    forwardedIn,
    metadata: {
      latestRevision: computeLatestRevision(bsda.bsdaRevisionRequests) as any
    }
  };
}

export function computeLatestRevision(
  revisionRequests: BsdaRevisionRequest[] | null
) {
  if (!revisionRequests || revisionRequests.length === 0) {
    return null;
  }

  return revisionRequests.reduce((latestRevision, currentRevision) => {
    if (
      !latestRevision ||
      currentRevision.createdAt > latestRevision.createdAt
    ) {
      return currentRevision;
    }
    return latestRevision;
  });
}

export function flattenBsdaInput(formInput: BsdaInput) {
  return safeInput({
    type: formInput?.type ?? undefined,
    ...flattenBsdaEmitterInput(formInput),
    ...flattenBsdaEcoOrganismeInput(formInput),
    ...flattenBsdaDestinationInput(formInput),
    ...flattenBsdaWorkerInput(formInput),
    ...flattenBsdaBrokerInput(formInput),
    ...flattenBsdaWasteInput(formInput),
    packagings: undefinedOrDefault(
      chain(formInput, f => f.packagings),
      []
    ),
    ...flattenBsdaWeightInput(formInput),
    grouping: formInput.grouping,
    forwarding: formInput.forwarding,
    intermediaries: formInput.intermediaries
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
    destinationOperationMode: chain(destination, d =>
      chain(d.operation, o => o.mode)
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

export function flattenBsdaTransporterInput(input: BsdaTransporterInput) {
  return safeInput({
    transporterCompanyName: chain(input, t => chain(t.company, c => c.name)),
    transporterCompanySiret: chain(input, t => chain(t.company, c => c.siret)),
    transporterCompanyAddress: chain(input, t =>
      chain(t.company, c => c.address)
    ),
    transporterCompanyContact: chain(input, t =>
      chain(t.company, c => c.contact)
    ),
    transporterCompanyPhone: chain(input, t => chain(t.company, c => c.phone)),
    transporterCompanyMail: chain(input, t => chain(t.company, c => c.mail)),
    transporterCompanyVatNumber: chain(input, t =>
      chain(t.company, c => c.vatNumber)
    ),
    transporterCustomInfo: chain(input, t => t.customInfo),
    transporterRecepisseIsExempted: chain(input, t =>
      chain(t.recepisse, r => r.isExempted)
    ),
    transporterRecepisseNumber: chain(input, t =>
      chain(t.recepisse, r => r.number)
    ),
    transporterRecepisseDepartment: chain(input, t =>
      chain(t.recepisse, r => r.department)
    ),
    transporterRecepisseValidityLimit: chain(input, t =>
      chain(t.recepisse, r => r.validityLimit)
    ),
    transporterTransportMode: chain(input, t =>
      chain(t.transport, tr => tr.mode)
    ),
    transporterTransportPlates: undefinedOrDefault(
      chain(input, t => chain(t.transport, tr => tr.plates)),
      []
    ),
    transporterTransportTakenOverAt: chain(input, t =>
      chain(t.transport, tr => tr.takenOverAt)
    )
  });
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
    destinationOperationMode: chain(reviewContent, r =>
      chain(r.destination, d => chain(d.operation, o => o.mode))
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
        mode: bsdaRevisionRequest.destinationOperationMode,
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
