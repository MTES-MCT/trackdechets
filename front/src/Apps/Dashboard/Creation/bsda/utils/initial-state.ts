import {
  BsdaEmitterInput,
  BsdaInput,
  BsdaTransporterInput,
  BsdaType,
  TransportMode
} from "@td/codegen-ui";
import { getInitialCompany } from "../../../../common/data/initialState";
import { emptyBsdaPackaging } from "../../../../Forms/Components/PackagingList/helpers";

const getInitialEmitterCompany = (emitter?: BsdaEmitterInput | null) => {
  return {
    siret: emitter?.company?.siret ?? "",
    name: emitter?.company?.name ?? "",
    address: emitter?.company?.address ?? "",
    city: "",
    contact: emitter?.company?.contact ?? "",
    mail: emitter?.company?.mail ?? "",
    phone: emitter?.company?.phone ?? "",
    vatNumber: emitter?.company?.vatNumber ?? "",
    country: emitter?.company?.country ?? "",
    omiNumber: emitter?.company?.omiNumber ?? ""
  };
};

// Les données transporteurs du formulaire représente soit un transporteur BSDA
// déjà crée en base de données qui dispose d'un identifiant, soit un transporteur
// non encore crée en base ne disposant pas encore d'identifiant. Par ailleurs on a
// besoin de connaitre la valeur de `takenOverAt` pour l'affichage des infos transporteur
// en mode formulaire ou statique dans la liste.
export type CreateOrUpdateBsdaTransporterInput = BsdaTransporterInput & {
  id?: string | null;
  takenOverAt?: string | null;
};

export type BsdaValues = Omit<BsdaInput, "transporters"> & {
  transporters: CreateOrUpdateBsdaTransporterInput[];
} & { id?: string | null };

export default {
  emitter: {
    company: getInitialEmitterCompany(),
    isPrivateIndividual: false,
    customInfo: "",
    pickupSite: {
      name: "",
      address: "",
      city: "",
      postalCode: "",
      infos: ""
    }
  },
  ecoOrganisme: null,
  waste: {
    code: null,
    familyCode: "",
    materialName: "",
    consistence: null,
    consistenceDescription: null,
    sealNumbers: [],
    isSubjectToADR: true,
    adr: null,
    nonRoadRegulationMention: null,
    pop: false
  },
  packagings: [emptyBsdaPackaging],
  weight: {
    isEstimate: false,
    value: null
  },
  broker: {
    company: getInitialCompany()
  },
  destination: {
    company: getInitialCompany(),
    cap: null,
    plannedOperationCode: null,
    customInfo: null,
    reception: {
      date: null,
      weight: null,
      refusedWeight: null,
      acceptationStatus: null,
      refusalReason: null
    },
    operation: {
      code: null,
      mode: null,
      description: null,
      date: null,
      nextDestination: null
    }
  },
  worker: {
    isDisabled: false,
    company: getInitialCompany(),
    certification: {
      hasSubSectionFour: false,
      hasSubSectionThree: false,
      certificationNumber: null,
      validityLimit: null,
      organisation: null
    },
    work: {
      hasEmitterPaperSignature: false
    }
  },
  transporters: [
    {
      transport: {
        mode: TransportMode.Road,
        plates: []
      },
      recepisse: { isExempted: false },
      company: getInitialCompany()
    }
  ],
  grouping: [],
  forwarding: null,
  intermediaries: null,
  type: BsdaType.OtherCollections
};
