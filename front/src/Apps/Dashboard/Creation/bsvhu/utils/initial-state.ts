/* eslint-disable import/no-anonymous-default-export */

import {
  BsvhuCompanyInput,
  BsvhuTransporterInput,
  TransportMode,
  WasteVehiclesType
} from "@td/codegen-ui";
import { getInitialCompany } from "../../../../common/data/initialState";

const getInitialEmitterCompany = (company?: BsvhuCompanyInput | null) => {
  return {
    siret: company?.siret ?? "",
    name: company?.name ?? "",
    address: company?.address ?? "",
    city: company?.city ?? "",
    street: company?.street ?? "",
    postalCode: company?.postalCode ?? "",
    contact: company?.contact ?? "",
    mail: company?.mail ?? "",
    phone: company?.phone ?? "",
    vatNumber: company?.vatNumber ?? "",
    country: company?.country ?? "",
    omiNumber: company?.omiNumber ?? ""
  };
};

export default {
  customId: "",
  emitter: {
    company: getInitialEmitterCompany(),
    agrementNumber: "",
    emission: {
      signature: {
        author: null,
        date: null
      }
    },
    irregularSituation: false,
    noSiret: false
  },
  destination: {
    type: WasteVehiclesType.Broyeur,
    company: getInitialCompany(),
    agrementNumber: "",
    plannedOperationCode: "R 4",
    reception: {
      date: null,
      acceptationStatus: null,
      refusalReason: "",
      weight: null,
      quantity: null,
      identification: {
        numbers: []
      }
    },
    operation: {
      date: null,
      code: "",
      mode: null
    }
  },
  packaging: "UNITE",
  wasteCode: "16 01 06",
  identification: {
    numbers: [],
    type: null
  },
  quantity: null,
  weight: {
    value: null,
    isEstimate: false
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
  ecoOrganisme: {
    name: "",
    siret: ""
  },
  broker: {
    company: getInitialCompany()
  },
  trader: {
    company: getInitialCompany()
  },
  intermediaries: [getInitialCompany()],
  containsElectricOrHybridVehicles: null
};

// Les données transporteurs du formulaire représente soit un transporteur BSVHU
// déjà crée en base de données qui dispose d'un identifiant, soit un transporteur
// non encore crée en base ne disposant pas encore d'identifiant. Par ailleurs on a
// besoin de connaitre la valeur de `takenOverAt` pour l'affichage des infos transporteur
// en mode formulaire ou statique dans la liste.
export type CreateOrUpdateBsvhuTransporterInput = BsvhuTransporterInput & {
  id?: string | null;
  takenOverAt?: string | null;
};
