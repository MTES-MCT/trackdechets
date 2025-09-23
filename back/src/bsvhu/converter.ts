import {
  nullIfNoValues,
  safeInput,
  processDate,
  chain,
  undefinedOrDefault
} from "../common/converter";
import type {
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
  BsvhuTransport,
  BsvhuTransportInput,
  CompanyInput,
  BsvhuEcoOrganisme,
  BsvhuBroker,
  BsvhuTrader
} from "@td/codegen-back";
import {
  Prisma,
  Bsvhu as PrismaVhuForm,
  WasteAcceptationStatus
} from "@prisma/client";
import { getTransporterCompanyOrgId } from "@td/constants";

export const getAddress = ({
  address,
  street,
  city,
  postalCode
}: {
  address?: string | null;
  street?: string | null;
  city?: string | null;
  postalCode?: string | null;
}): string | null => {
  if (street && city && postalCode) {
    return `${street} ${postalCode} ${city}`;
  }
  return address ?? null;
};

export function expandVhuFormFromDb(bsvhu: PrismaVhuForm): GraphqlVhuForm {
  return {
    id: bsvhu.id,
    customId: bsvhu.customId,
    createdAt: processDate(bsvhu.createdAt),
    updatedAt: processDate(bsvhu.updatedAt),
    isDraft: bsvhu.isDraft,
    status: bsvhu.status,
    isDuplicateOf: bsvhu.isDuplicateOf,
    containsElectricOrHybridVehicles: bsvhu.containsElectricOrHybridVehicles,
    emitter: nullIfNoValues<BsvhuEmitter>({
      agrementNumber: bsvhu.emitterAgrementNumber,
      irregularSituation: bsvhu.emitterIrregularSituation ?? false,
      noSiret: bsvhu.emitterNoSiret ?? false,
      notOnTD: bsvhu.emitterNotOnTD ?? false,
      company: nullIfNoValues<FormCompany>({
        name: bsvhu.emitterCompanyName,
        siret: bsvhu.emitterCompanySiret,
        address: getAddress({
          address: bsvhu.emitterCompanyAddress,
          street: bsvhu.emitterCompanyStreet,
          city: bsvhu.emitterCompanyCity,
          postalCode: bsvhu.emitterCompanyPostalCode
        }),
        contact: bsvhu.emitterCompanyContact,
        phone: bsvhu.emitterCompanyPhone,
        mail: bsvhu.emitterCompanyMail
      }),
      emission: nullIfNoValues<BsvhuEmission>({
        signature: nullIfNoValues<Signature>({
          author: bsvhu.emitterEmissionSignatureAuthor,
          date: processDate(bsvhu.emitterEmissionSignatureDate)
        })
      })
    }),
    packaging: bsvhu.packaging,
    wasteCode: bsvhu.wasteCode,
    identification: nullIfNoValues<BsvhuIdentification>({
      numbers: bsvhu.identificationNumbers,
      type: bsvhu.identificationType
    }),
    quantity: bsvhu.quantity,
    weight: nullIfNoValues<BsvhuWeight>({
      value: bsvhu.weightValue ? bsvhu.weightValue / 1000 : bsvhu.weightValue,
      isEstimate: bsvhu.weightIsEstimate
    }),
    destination: nullIfNoValues<BsvhuDestination>({
      type: bsvhu.destinationType,
      agrementNumber: bsvhu.destinationAgrementNumber,
      company: nullIfNoValues<FormCompany>({
        name: bsvhu.destinationCompanyName,
        siret: bsvhu.destinationCompanySiret,
        address: bsvhu.destinationCompanyAddress,
        contact: bsvhu.destinationCompanyContact,
        phone: bsvhu.destinationCompanyPhone,
        mail: bsvhu.destinationCompanyMail
      }),
      plannedOperationCode: bsvhu.destinationPlannedOperationCode,
      reception: nullIfNoValues<BsvhuReception>({
        acceptationStatus: bsvhu.destinationReceptionAcceptationStatus,
        date: processDate(bsvhu.destinationReceptionDate),
        identification: nullIfNoValues<BsvhuIdentification>({
          numbers: bsvhu.destinationReceptionIdentificationNumbers,
          type: bsvhu.destinationReceptionIdentificationType
        }),
        weight: bsvhu.destinationReceptionWeight
          ? bsvhu.destinationReceptionWeight / 1000
          : bsvhu.destinationReceptionWeight,
        refusalReason: bsvhu.destinationReceptionRefusalReason,
        signature: nullIfNoValues<Signature>({
          date: processDate(bsvhu.destinationReceptionSignatureDate),
          author: bsvhu.destinationReceptionSignatureAuthor
        })
      }),
      operation: nullIfNoValues<BsvhuOperation>({
        code: bsvhu.destinationOperationCode,
        mode: bsvhu.destinationOperationMode,
        date: processDate(bsvhu.destinationOperationDate),
        nextDestination: nullIfNoValues<BsvhuNextDestination>({
          company: nullIfNoValues<FormCompany>({
            name: bsvhu.destinationOperationNextDestinationCompanyName,
            siret: bsvhu.destinationOperationNextDestinationCompanySiret,
            address: bsvhu.destinationOperationNextDestinationCompanyAddress,
            contact: bsvhu.destinationOperationNextDestinationCompanyContact,
            phone: bsvhu.destinationOperationNextDestinationCompanyPhone,
            mail: bsvhu.destinationOperationNextDestinationCompanyMail
          })
        }),

        signature: nullIfNoValues<Signature>({
          author: bsvhu.destinationOperationSignatureAuthor,
          date: processDate(bsvhu.destinationOperationSignatureDate)
        })
      })
    }),
    transporter: nullIfNoValues<BsvhuTransporter>({
      company: nullIfNoValues<FormCompany>({
        name: bsvhu.transporterCompanyName,
        orgId: getTransporterCompanyOrgId(bsvhu),
        siret: bsvhu.transporterCompanySiret,
        address: bsvhu.transporterCompanyAddress,
        contact: bsvhu.transporterCompanyContact,
        phone: bsvhu.transporterCompanyPhone,
        mail: bsvhu.transporterCompanyMail,
        vatNumber: bsvhu.transporterCompanyVatNumber
      }),
      customInfo: bsvhu.transporterCustomInfo,
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        number: bsvhu.transporterRecepisseNumber,
        department: bsvhu.transporterRecepisseDepartment,
        validityLimit: processDate(bsvhu.transporterRecepisseValidityLimit),
        isExempted: bsvhu.transporterRecepisseIsExempted
      }),
      transport: nullIfNoValues<BsvhuTransport>({
        mode: bsvhu.transporterTransportMode,
        plates: bsvhu.transporterTransportPlates,
        signature: nullIfNoValues<Signature>({
          author: bsvhu.transporterTransportSignatureAuthor,
          date: processDate(bsvhu.transporterTransportSignatureDate)
        }),
        takenOverAt: processDate(bsvhu.transporterTransportTakenOverAt)
      })
    }),
    ecoOrganisme: nullIfNoValues<BsvhuEcoOrganisme>({
      name: bsvhu.ecoOrganismeName,
      siret: bsvhu.ecoOrganismeSiret
    }),
    broker: nullIfNoValues<BsvhuBroker>({
      company: nullIfNoValues<FormCompany>({
        name: bsvhu.brokerCompanyName,
        siret: bsvhu.brokerCompanySiret,
        address: bsvhu.brokerCompanyAddress,
        contact: bsvhu.brokerCompanyContact,
        phone: bsvhu.brokerCompanyPhone,
        mail: bsvhu.brokerCompanyMail
      }),
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        department: bsvhu.brokerRecepisseDepartment,
        number: bsvhu.brokerRecepisseNumber,
        validityLimit: processDate(bsvhu.brokerRecepisseValidityLimit)
      })
    }),
    trader: nullIfNoValues<BsvhuTrader>({
      company: nullIfNoValues<FormCompany>({
        name: bsvhu.traderCompanyName,
        siret: bsvhu.traderCompanySiret,
        address: bsvhu.traderCompanyAddress,
        contact: bsvhu.traderCompanyContact,
        phone: bsvhu.traderCompanyPhone,
        mail: bsvhu.traderCompanyMail
      }),
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        department: bsvhu.traderRecepisseDepartment,
        number: bsvhu.traderRecepisseNumber,
        validityLimit: processDate(bsvhu.traderRecepisseValidityLimit)
      })
    }),
    metadata: null as any
  };
}

export function flattenVhuInput(formInput: BsvhuInput) {
  return safeInput({
    ...flattenVhuEmitterInput(formInput),
    ...flattenVhuDestinationInput(formInput),
    ...flattenVhuTransporterInput(formInput),
    ...flattenVhuEcoOrganismeInput(formInput),
    ...flattenVhuBrokerInput(formInput),
    ...flattenVhuTraderInput(formInput),
    packaging: chain(formInput, f => f.packaging),
    wasteCode: chain(formInput, f => f.wasteCode),
    quantity: chain(formInput, f => f.quantity),

    ...flattenVhuIdentificationInput(formInput),
    ...flattenVhuWeightInput(formInput),
    intermediaries: formInput.intermediaries,
    customId: chain(formInput, f => f.customId),
    containsElectricOrHybridVehicles: chain(
      formInput,
      f => f.containsElectricOrHybridVehicles
    )
  });
}

function flattenVhuEmitterInput({ emitter }: Pick<BsvhuInput, "emitter">) {
  return {
    emitterAgrementNumber: chain(emitter, e => e.agrementNumber),
    emitterIrregularSituation: chain(emitter, e => e.irregularSituation),
    emitterNoSiret: chain(emitter, e => e.noSiret),
    emitterCompanyName: chain(emitter, e => chain(e.company, c => c.name)),
    emitterCompanySiret: chain(emitter, e => chain(e.company, c => c.siret)),
    emitterCompanyAddress: chain(emitter, e =>
      chain(e.company, c => c.address)
    ),
    emitterCompanyStreet: chain(emitter, e => chain(e.company, c => c.street)),
    emitterCompanyCity: chain(emitter, e => chain(e.company, c => c.city)),
    emitterCompanyPostalCode: chain(emitter, e =>
      chain(e.company, c => c.postalCode)
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
      chain(d.reception, r => (r.weight ? r.weight * 1000 : r.weight))
    ),
    destinationReceptionIdentificationNumbers: undefinedOrDefault(
      chain(destination, d =>
        chain(d.reception, r => chain(r.identification, i => i.numbers))
      ),
      []
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
    destinationOperationMode: chain(destination, r =>
      chain(r.operation, o => o.mode)
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
    transporterCustomInfo: chain(transporter, t => t.customInfo),
    transporterRecepisseNumber: chain(transporter, t =>
      chain(t.recepisse, r => r.number)
    ),
    transporterRecepisseDepartment: chain(transporter, t =>
      chain(t.recepisse, r => r.department)
    ),
    transporterRecepisseValidityLimit: chain(transporter, t =>
      chain(t.recepisse, r => r.validityLimit)
    ),
    transporterRecepisseIsExempted: chain(transporter, t =>
      chain(t.recepisse, r => r.isExempted)
    ),
    ...flattenTransporterTransportInput(transporter)
  };
}

function flattenVhuEcoOrganismeInput({
  ecoOrganisme
}: Pick<BsvhuInput, "ecoOrganisme">) {
  return {
    ecoOrganismeName: chain(ecoOrganisme, e => e.name),
    ecoOrganismeSiret: chain(ecoOrganisme, e => e.siret)
  };
}

function flattenVhuBrokerInput({ broker }: Pick<BsvhuInput, "broker">) {
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

function flattenVhuTraderInput({ trader }: Pick<BsvhuInput, "trader">) {
  return {
    traderCompanyName: chain(trader, b => chain(b.company, c => c.name)),
    traderCompanySiret: chain(trader, b => chain(b.company, c => c.siret)),
    traderCompanyAddress: chain(trader, b => chain(b.company, c => c.address)),
    traderCompanyContact: chain(trader, b => chain(b.company, c => c.contact)),
    traderCompanyPhone: chain(trader, b => chain(b.company, c => c.phone)),
    traderCompanyMail: chain(trader, b => chain(b.company, c => c.mail)),
    traderRecepisseNumber: chain(trader, b =>
      chain(b.recepisse, r => r.number)
    ),
    traderRecepisseDepartment: chain(trader, b =>
      chain(b.recepisse, r => r.department)
    ),
    traderRecepisseValidityLimit: chain(trader, b =>
      chain(b.recepisse, r => r.validityLimit)
    )
  };
}

function flattenTransporterTransportInput(
  input:
    | {
        transport?: BsvhuTransportInput | null;
      }
    | null
    | undefined
) {
  if (!input?.transport) {
    return {};
  }

  return {
    transporterTransportTakenOverAt: chain(input.transport, t => t.takenOverAt),
    transporterTransportMode: chain(input, t =>
      chain(t.transport, tr => tr.mode)
    ),
    transporterTransportPlates: undefinedOrDefault(
      chain(input, t => chain(t.transport, tr => tr.plates)),
      []
    )
  };
}

function flattenVhuIdentificationInput({
  identification
}: Pick<BsvhuInput, "identification">) {
  return {
    identificationNumbers: undefinedOrDefault(
      chain(identification, i => i.numbers),
      []
    ),
    identificationType: chain(identification, i => i.type)
  };
}

function flattenVhuWeightInput({ weight }: Pick<BsvhuInput, "weight">) {
  return {
    weightValue: chain(weight, q => (q.value ? q.value * 1000 : q.value)),
    weightIsEstimate: chain(weight, q => q.isEstimate)
  };
}

export function companyToIntermediaryInput(
  companies: CompanyInput[]
): Prisma.IntermediaryBsvhuAssociationCreateManyBsvhuInput[] {
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
