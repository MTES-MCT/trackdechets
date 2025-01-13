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

export function expandVhuFormFromDb(form: PrismaVhuForm): GraphqlVhuForm {
  return {
    id: form.id,
    customId: form.customId,
    createdAt: processDate(form.createdAt),
    updatedAt: processDate(form.updatedAt),
    isDraft: form.isDraft,
    status: form.status,
    emitter: nullIfNoValues<BsvhuEmitter>({
      agrementNumber: form.emitterAgrementNumber,
      irregularSituation: form.emitterIrregularSituation ?? false,
      noSiret: form.emitterNoSiret ?? false,
      company: nullIfNoValues<FormCompany>({
        name: form.emitterCompanyName,
        siret: form.emitterCompanySiret,
        address: getAddress({
          address: form.emitterCompanyAddress,
          street: form.emitterCompanyStreet,
          city: form.emitterCompanyCity,
          postalCode: form.emitterCompanyPostalCode
        }),
        contact: form.emitterCompanyContact,
        phone: form.emitterCompanyPhone,
        mail: form.emitterCompanyMail
      }),
      emission: nullIfNoValues<BsvhuEmission>({
        signature: nullIfNoValues<Signature>({
          author: form.emitterEmissionSignatureAuthor,
          date: processDate(form.emitterEmissionSignatureDate)
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
      value: form.weightValue ? form.weightValue / 1000 : form.weightValue,
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
        date: processDate(form.destinationReceptionDate),
        identification: nullIfNoValues<BsvhuIdentification>({
          numbers: form.destinationReceptionIdentificationNumbers,
          type: form.destinationReceptionIdentificationType
        }),
        weight: form.destinationReceptionWeight
          ? form.destinationReceptionWeight / 1000
          : form.destinationReceptionWeight,
        refusalReason: form.destinationReceptionRefusalReason
      }),
      operation: nullIfNoValues<BsvhuOperation>({
        code: form.destinationOperationCode,
        mode: form.destinationOperationMode,
        date: processDate(form.destinationOperationDate),
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
          date: processDate(form.destinationOperationSignatureDate)
        })
      })
    }),
    transporter: nullIfNoValues<BsvhuTransporter>({
      company: nullIfNoValues<FormCompany>({
        name: form.transporterCompanyName,
        orgId: getTransporterCompanyOrgId(form),
        siret: form.transporterCompanySiret,
        address: form.transporterCompanyAddress,
        contact: form.transporterCompanyContact,
        phone: form.transporterCompanyPhone,
        mail: form.transporterCompanyMail,
        vatNumber: form.transporterCompanyVatNumber
      }),
      customInfo: form.transporterCustomInfo,
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        number: form.transporterRecepisseNumber,
        department: form.transporterRecepisseDepartment,
        validityLimit: processDate(form.transporterRecepisseValidityLimit),
        isExempted: form.transporterRecepisseIsExempted
      }),
      transport: nullIfNoValues<BsvhuTransport>({
        mode: form.transporterTransportMode,
        plates: form.transporterTransportPlates,
        signature: nullIfNoValues<Signature>({
          author: form.transporterTransportSignatureAuthor,
          date: processDate(form.transporterTransportSignatureDate)
        }),
        takenOverAt: processDate(form.transporterTransportTakenOverAt)
      })
    }),
    ecoOrganisme: nullIfNoValues<BsvhuEcoOrganisme>({
      name: form.ecoOrganismeName,
      siret: form.ecoOrganismeSiret
    }),
    broker: nullIfNoValues<BsvhuBroker>({
      company: nullIfNoValues<FormCompany>({
        name: form.brokerCompanyName,
        siret: form.brokerCompanySiret,
        address: form.brokerCompanyAddress,
        contact: form.brokerCompanyContact,
        phone: form.brokerCompanyPhone,
        mail: form.brokerCompanyMail
      }),
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        department: form.brokerRecepisseDepartment,
        number: form.brokerRecepisseNumber,
        validityLimit: processDate(form.brokerRecepisseValidityLimit)
      })
    }),
    trader: nullIfNoValues<BsvhuTrader>({
      company: nullIfNoValues<FormCompany>({
        name: form.traderCompanyName,
        siret: form.traderCompanySiret,
        address: form.traderCompanyAddress,
        contact: form.traderCompanyContact,
        phone: form.traderCompanyPhone,
        mail: form.traderCompanyMail
      }),
      recepisse: nullIfNoValues<BsvhuRecepisse>({
        department: form.traderRecepisseDepartment,
        number: form.traderRecepisseNumber,
        validityLimit: processDate(form.traderRecepisseValidityLimit)
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
    customId: chain(formInput, f => f.customId)
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
