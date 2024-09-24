import {
  CollectorType,
  CompanyType,
  WasteProcessorType,
  WasteVehiclesType
} from "@td/codegen-ui";
import { format, isValid } from "date-fns";
// eslint-disable-next-line import/no-duplicates
import fr from "date-fns/locale/fr";
import { parseDate } from "../../../common/datetime";

export type CompanySubType =
  | CollectorType
  | WasteProcessorType
  | WasteVehiclesType;

export type AllCompanyType = CompanyType | CompanySubType;

export type CompanySubTypeOption = {
  label: string;
  value: CompanySubType;
};

export type CompanyTypeOption = {
  label: string;
  value: CompanyType;
  helpText?: string;
  subTypes?: CompanySubTypeOption[];
  subTypesName?: string;
};

export const COLLECTOR_TYPE_OPTIONS: CompanySubTypeOption[] = [
  {
    label: "Déchets non Dangereux (Rubriques 2713, 2714, 2715, 2716)",
    value: CollectorType.NonDangerousWastes
  },
  {
    label: "Déchets Dangereux (Rubrique 2718)",
    value: CollectorType.DangerousWastes
  },
  {
    label: "Déchets DEEE (Rubrique 2711)",
    value: CollectorType.DeeeWastes
  },
  {
    label: "Autres cas déchets non dangereux (Rubrique 2731)",
    value: CollectorType.OtherNonDangerousWastes
  },
  {
    label:
      "Autres cas déchets dangereux (Rubriques 2719, 2792-1, 2793-1, 2793-2, 2797-1, 2798)",
    value: CollectorType.OtherDangerousWastes
  }
];

export const COLLECTOR_TYPE_VALUES = COLLECTOR_TYPE_OPTIONS.map(
  option => option.value
) as CollectorType[];

export const WASTE_PROCESSOR_TYPE_OPTIONS: CompanySubTypeOption[] = [
  {
    label: "Incinération de déchets dangereux (Rubrique 2770)",
    value: WasteProcessorType.DangerousWastesIncineration
  },
  {
    label: "Incinération de déchets non dangereux (Rubriques 2771, 2740)",
    value: WasteProcessorType.NonDangerousWastesIncineration
  },
  {
    label: "Crémation",
    value: WasteProcessorType.Cremation
  },
  {
    label:
      "Installation de stockage de déchets dangereux (Rubriques 2720-1, 2760-1, 2760-4, 2797-2)",
    value: WasteProcessorType.DangerousWastesStorage
  },
  {
    label:
      "Installation de stockage de déchets non dangereux, y compris casiers dédiés amiante, plâtre (Rubriques 2720-2, 2760-2-a, 2760-2-b)",
    value: WasteProcessorType.NonDangerousWastesStorage
  },
  {
    label: "Installation de stockage de déchets inertes (Rubrique 2760-3)",
    value: WasteProcessorType.InertWastesStorage
  },
  {
    label:
      "Autres traitements de déchets non dangereux (Rubriques 2791, 2781, 2782, 2780)",
    value: WasteProcessorType.OtherNonDangerousWastes
  },
  {
    label:
      "Autres traitements de déchets dangereux (Rubriques 2790, 2792-2, 2793-3)",
    value: WasteProcessorType.OtherDangerousWastes
  }
];

export const WASTE_PROCESSOR_TYPE_VALUES = WASTE_PROCESSOR_TYPE_OPTIONS.map(
  option => option.value
) as WasteProcessorType[];

export const WASTE_VEHICLES_TYPE_OPTIONS: CompanySubTypeOption[] = [
  { label: "Broyeur VHU", value: WasteVehiclesType.Broyeur },
  {
    label: "Casse automobile / démolisseur",
    value: WasteVehiclesType.Demolisseur
  }
];

export const WASTE_VEHICLES_TYPE_VALUES = WASTE_VEHICLES_TYPE_OPTIONS.map(
  option => option.value
) as WasteVehiclesType[];

export const COMPANY_TYPE_OPTIONS: CompanyTypeOption[] = [
  {
    value: CompanyType.Producer,
    label: "Producteurs de déchets, y compris terres et sédiments",
    helpText:
      "Tous les établissements produisant des déchets et producteurs subséquents. Exemples: Ateliers de réparation véhicules, laboratoires, ateliers de traitement de surfaces, détenteurs d'équipements contenant des fluides frigorigènes et les opérateurs, producteurs de DASRI (hôpitaux, EHPAD, médecin, infirmier(e), tatoueurs, dentiste, etc.), maitre ouvrage amiante, etc. Les ménages sont exclus de la traçabilité. Un intermédiaire est un établissement qui a besoin d'avoir accès au bordereau, avec l'accord des parties prenantes dudit BSD (exemple : un maître d'oeuvre ou un intervenant tiers)."
  },
  {
    value: CompanyType.Intermediary,
    label: "Intermédiaire",
    helpText:
      "Etablissement qui peut être ajouté à une traçabilité, sans responsabilité réglementaire (y compris entreprises de travaux hors amiante)"
  },
  {
    value: CompanyType.Collector,
    label:
      "Installation de Tri, transit regroupement de déchets y compris non classée",
    helpText:
      "Installations sur lesquelles sont regroupés, triés ou en transit les déchets dangereux et/ou non dangereux - installations relevant des rubriques suivantes de la nomenclature ICPE:  2711, 2713, 2714, 2715, 2716, 2718, 2719, 2731, 2792-1, 2793-1, 2793-2, 2797-1, 2798.",
    subTypes: COLLECTOR_TYPE_OPTIONS,
    subTypesName: "collectorTypes"
  },
  {
    value: CompanyType.Wasteprocessor,
    label: "Installation de traitement",
    helpText:
      "Installations sur lesquelles sont traités les déchets, et relevant des rubriques suivantes de la nomenclature ICPE :  2720, 2730, 2740, 2750, 2751, 2752, 2760, 2770, 2771, 2780, 2781, 2782, 2790, 2791, 2792-2, 2793-3, 2794, 2795, 2797-2 et 3510, 3520, 3531, 3532, 3540, 3550, 3560.",
    subTypes: WASTE_PROCESSOR_TYPE_OPTIONS,
    subTypesName: "wasteProcessorTypes"
  },
  {
    value: CompanyType.DisposalFacility,
    label: "Installation de valorisation de terres et sédiments",
    helpText: ""
  },
  {
    value: CompanyType.WasteCenter,
    label:
      "Installation de collecte de déchets apportés par le producteur initial (Rubrique 2710)",
    helpText:
      "Déchetteries et installations relevant de la rubrique 2710 de la nomenclature ICPE"
  },
  {
    value: CompanyType.WasteVehicles,
    label: "Installation de traitement de VHU",
    helpText:
      "Casse automobile, installations d'entreposage, dépollution, démontage de tout type de véhicules hors d'usage - installations relevant de la rubrique 2712 de la nomenclature ICPE",
    subTypes: WASTE_VEHICLES_TYPE_OPTIONS,
    subTypesName: "wasteVehiclesTypes"
  },
  {
    value: CompanyType.Transporter,
    label: "Transporteur",
    helpText:
      "Entreprises de transport routier immatriculées au registre national des transports, ou transporteurs pour compte propre; disposant d'un récépissé de déclaration en Préfecture de l'activité de transport par route de déchets"
  },
  {
    value: CompanyType.Trader,
    label: "Négociant",
    helpText:
      "Négociant, prenant part à la relation producteur / traiteur, disposant d'un récépissé préfectoral"
  },
  {
    value: CompanyType.Broker,
    label: "Courtier",
    helpText:
      "Courtier, acteur de la gestion des déchets qui organise la valorisation ou l'élimination de déchets pour le compte de tiers, disposant d'un récépissé préfectoral"
  },
  {
    value: CompanyType.EcoOrganisme,
    label: "Éco-organisme",
    helpText:
      "Société prenant en charge la gestion des déchets, dans le cadre de la REP (Responsabilité élargie du producteur)"
  },
  {
    value: CompanyType.Worker,
    label: "Entreprise de travaux amiante",
    helpText:
      "Entreprise qui réalise des travaux amiante relevant de la sous-section 3 ou 4, conformément aux dispositions des articles R.4412-94 à 146 du code du travail"
  },
  {
    value: CompanyType.RecoveryFacility,
    label:
      "Installation dans laquelle les déchets perdent leur statut de déchet",
    helpText: ""
  }
];

export const COMPANY_TYPE_VALUES = COMPANY_TYPE_OPTIONS.map(
  option => option.value
);

export const WORKER_AGREMENT_ORGANISATION_OPTIONS = [
  {
    value: "AFNOR Certification",
    label: "AFNOR Certification"
  },
  {
    value: "QUALIBAT",
    label: "QUALIBAT"
  },
  {
    value: "GLOBAL CERTIFICATION",
    label: "GLOBAL CERTIFICATION"
  }
];

export const parsedDate = date => {
  const parsedDate = date ? parseDate(date) : null;
  if (isValid(parsedDate)) {
    return parsedDate;
  }
};

export const formatDate = date => {
  return date
    ? format(parsedDate(date) as Date, "yyyy-MM-dd", {
        locale: fr
      })
    : "";
};

export const formatDateViewDisplay = date => {
  return date
    ? format(parsedDate(date) as Date, "dd/MM/yyyy", {
        locale: fr
      })
    : "";
};
