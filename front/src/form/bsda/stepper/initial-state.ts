import { getInitialCompany } from "../../bsdd/utils/initial-state";
import {
  Bsda,
  BsdaConsistence,
  BsdaInput,
  BsdaTransporterInput,
  BsdaType,
  FormCompany,
  TransportMode
} from "@td/codegen-ui";
import { getInitialEmitterPickupSite } from "./steps/Emitter";

// Les données transporteurs du formulaire représente soit un transporteur BSDA
// déjà crée en base de données qui dispose d'un identifiant, soit un transporteur
// non encore crée en base ne disposant pas encore d'identifiant. Par ailleurs on a
// besoin de connaitre la valeur de `takenOverAt` pour l'affichage des infos transporteur
// en mode formulaire ou statique dans la liste.
export type CreateOrUpdateBsdaTransporterInput = BsdaTransporterInput & {
  id?: string | null;
  takenOverAt?: string | null;
};

export type BsdaFormikValues = Omit<BsdaInput, "transporters"> & {
  transporters: CreateOrUpdateBsdaTransporterInput[];
} & { id?: string | null };

function getInitialEmitterCompany(company?: FormCompany | null) {
  const { country, vatNumber, ...initialEmitterCompany } =
    getInitialCompany(company);
  return initialEmitterCompany;
}

function getInitialWorkerCompany(company?: FormCompany | null) {
  const { country, vatNumber, ...initialWorkerCompany } =
    getInitialCompany(company);
  return initialWorkerCompany;
}

function getInitialDestinationCompany(company?: FormCompany | null) {
  const { country, vatNumber, ...initialDestinationCompany } =
    getInitialCompany(company);
  return initialDestinationCompany;
}

export const initialBsdaTransporter: BsdaTransporterInput = {
  transport: {
    mode: TransportMode.Road,
    plates: []
  },
  recepisse: { isExempted: false },
  company: getInitialCompany()
};

export function getInitialState(bsda?: Bsda | null): BsdaFormikValues {
  const initialTransporters: CreateOrUpdateBsdaTransporterInput[] =
    bsda?.transporters && bsda?.transporters.length > 0
      ? bsda.transporters.map(t => ({
          ...t,
          takenOverAt: t.transport?.signature?.date
        }))
      : [initialBsdaTransporter];

  return {
    id: bsda?.id ?? null,
    type: bsda?.type ?? BsdaType.OtherCollections,
    emitter: {
      company: getInitialEmitterCompany(bsda?.emitter?.company),
      isPrivateIndividual: bsda?.emitter?.isPrivateIndividual ?? false,
      pickupSite: bsda?.emitter?.pickupSite ?? getInitialEmitterPickupSite()
    },
    ecoOrganisme: bsda?.ecoOrganisme ?? null,
    waste: {
      code: bsda?.waste?.code ?? "",
      familyCode: bsda?.waste?.familyCode ?? "",
      materialName: bsda?.waste?.materialName ?? "",
      consistence: bsda?.waste?.consistence ?? BsdaConsistence.Solide,
      sealNumbers: bsda?.waste?.sealNumbers ?? [],
      adr: bsda?.waste?.adr ?? "",
      pop: bsda?.waste?.pop ?? false
    },
    packagings: bsda?.packagings ?? [],
    weight: {
      isEstimate: bsda?.weight?.isEstimate,
      value: bsda?.weight?.value
    },
    worker: {
      isDisabled: bsda?.worker?.isDisabled,
      company: getInitialWorkerCompany(bsda?.worker?.company),
      certification: {
        hasSubSectionFour:
          bsda?.worker?.certification?.hasSubSectionFour ?? false,
        hasSubSectionThree:
          bsda?.worker?.certification?.hasSubSectionThree ?? false,
        certificationNumber:
          bsda?.worker?.certification?.certificationNumber ?? "",
        validityLimit: bsda?.worker?.certification?.validityLimit ?? null,
        organisation: bsda?.worker?.certification?.organisation ?? ""
      },
      work: {
        hasEmitterPaperSignature:
          bsda?.worker?.work?.hasEmitterPaperSignature ?? false
      }
    },
    transporters: initialTransporters,
    broker: bsda?.broker ?? null,
    destination: {
      cap: bsda?.destination?.cap ?? "",
      plannedOperationCode: bsda?.destination?.plannedOperationCode ?? "",
      company: getInitialDestinationCompany(bsda?.destination?.company),
      operation: {
        description: bsda?.destination?.operation?.description ?? "",
        nextDestination: bsda?.destination?.operation?.nextDestination ?? null
      }
    },
    grouping: bsda?.grouping?.map(g => g.id) ?? [],
    forwarding: bsda?.forwarding?.id ?? null,
    intermediaries: bsda?.intermediaries ?? []
  };
}
