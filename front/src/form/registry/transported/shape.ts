import { FormShape } from "../builder/types";
import { ReportFor } from "../common/ReportFor";
import { WasteCodeSelector } from "../common/WasteCodeSelector";
import { WeightSelector } from "../common/WeightSelector";
import {
  nonEmptyString,
  optionalNumber,
  nonEmptyNumber,
  booleanString,
  optionalString,
  filteredArray,
  optionalBooleanString
} from "../builder/validation";
import { CompanySelector } from "../common/CompanySelector";
import { Address } from "../common/Address";
import { FrenchCompanySelector } from "../common/FrenchCompanySelector";
import { TRANSPORT_MODES } from "../common/TransporterSelector/TransporterForm";
import { TransporterTags } from "../common/TransporterTags";
import { EcoOrganismes } from "../common/EcoOrganismes";

export const transportedFormShape: FormShape = [
  {
    tabId: "declaration",
    tabTitle: "Déclaration",
    fields: [
      {
        name: "publicId",
        shape: "generic",
        type: "text",
        label: "Identifiant unique",
        required: true,
        validation: {
          publicId: nonEmptyString
        },
        style: { className: "fr-col-8" }
      },
      {
        Component: ReportFor,
        props: {
          reportForLabel: "SIRET du transporteur",
          reportAsLabel: "SIRET du déclarant"
        },
        names: ["reportForCompanySiret", "reportAsCompanySiret"],
        validation: {
          reportForCompanySiret: nonEmptyString,
          reportAsCompanySiret: optionalString
        },
        shape: "custom"
      }
    ]
  },
  {
    tabId: "waste",
    tabTitle: "Déchet",
    fields: [
      {
        Component: WasteCodeSelector,
        props: { name: "wasteCode" },
        shape: "custom",
        names: ["wasteCode"],
        required: true,
        validation: {
          wasteCode: nonEmptyString
        },
        style: { parentClassName: "fr-grid-row--bottom tw-relative" }
      },
      {
        name: "wasteDescription",
        shape: "generic",
        label:
          "Dénomination usuelle des terres excavées et sédiments ou des déchets",
        required: true,
        validation: {
          wasteDescription: nonEmptyString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "wasteCodeBale",
        shape: "generic",
        label: "Code déchet Bâle",
        validation: {
          wasteCodeBale: optionalString
        },
        type: "text",
        style: { className: "fr-col-4" }
      },
      {
        name: "wastePop",
        shape: "generic",
        type: "checkbox",
        label: "Le déchet contient des polluants organiques persistants (POP)",
        required: true,
        validation: {
          wastePop: booleanString
        }
      },
      {
        name: "wasteIsDangerous",
        shape: "generic",
        type: "checkbox",
        label: "Le déchet est dangereux",
        required: false,
        validation: {
          wasteIsDangerous: optionalBooleanString
        }
      },
      {
        shape: "layout",
        fields: [
          {
            name: "collectionDate",
            shape: "generic",
            label: "Date d'enlèvement",
            required: true,
            validation: {
              collectionDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-4" }
          },
          {
            name: "unloadingDate",
            shape: "generic",
            label: "Date de déchargement",
            required: true,
            validation: {
              unloadingDate: nonEmptyString
            },
            type: "date",
            style: { className: "fr-col-4" }
          }
        ]
      },
      {
        Component: WeightSelector,
        shape: "custom",
        names: ["weightValue", "weightIsEstimate", "volume"],
        validation: {
          weightValue: nonEmptyNumber,
          volume: optionalNumber,
          weightIsEstimate: booleanString
        }
      }
    ]
  },
  {
    tabId: "emitter",
    tabTitle: "Expéditeur",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "emitter",
          label: "expéditeur",
          excludeTypes: ["COMMUNES"],
          required: true
        },
        validation: {
          emitterCompanyType: nonEmptyString,
          emitterCompanyOrgId: optionalString,
          emitterCompanyName: optionalString,
          emitterCompanyAddress: optionalString,
          emitterCompanyPostalCode: optionalString,
          emitterCompanyCity: optionalString,
          emitterCompanyCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "emitterCompanyType",
          "emitterCompanyOrgId",
          "emitterCompanyName",
          "emitterCompanyAddress",
          "emitterCompanyPostalCode",
          "emitterCompanyCity",
          "emitterCompanyCountryCode"
        ]
      },
      {
        Component: Address,
        props: {
          prefix: "emitterPickupSite",
          nameEnabled: true,
          title: "Chantier ou lieu de collecte (optionnel)"
        },
        validation: {
          emitterPickupSiteName: optionalString,
          emitterPickupSiteAddress: optionalString,
          emitterPickupSitePostalCode: optionalString,
          emitterPickupSiteCity: optionalString,
          emitterPickupSiteCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "emitterPickupSiteName",
          "emitterPickupSiteAddress",
          "emitterPickupSitePostalCode",
          "emitterPickupSiteCity",
          "emitterPickupSiteCountryCode"
        ]
      },
      {
        name: "gistridNumber",
        shape: "generic",
        title: "Transfert transfrontalier de déchets",
        label: "Numéro de notification ou de déclaration GISTRID",
        required: false,
        validation: {
          gistridNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "movementNumber",
        shape: "generic",
        label: "Numéro de mouvement",
        required: false,
        validation: {
          movementNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      }
    ]
  },
  {
    tabId: "intermediaries",
    tabTitle: "Intervenants",
    fields: [
      {
        Component: EcoOrganismes,
        props: {
          reducedMargin: true
        },
        validation: {
          ecoOrganismeSiret: optionalString,
          ecoOrganismeName: optionalString
        },
        shape: "custom",
        names: ["ecoOrganismeSiret", "ecoOrganismeName"]
      },
      {
        Component: FrenchCompanySelector,
        props: {
          prefix: "broker",
          shortMode: true,
          title: "Courtier (optionnel)",
          reducedMargin: true
        },
        validation: {
          brokerCompanySiret: optionalString,
          brokerCompanyName: optionalString
        },
        shape: "custom",
        names: ["brokerCompanySiret", "brokerCompanyName"]
      },
      {
        name: "brokerRecepisseNumber",
        shape: "generic",
        label: "Numéro de récépissé",
        required: true,
        validation: {
          brokerRecepisseNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        Component: FrenchCompanySelector,
        props: {
          prefix: "trader",
          shortMode: true,
          title: "Négociant (optionnel)",
          reducedMargin: true
        },
        validation: {
          traderCompanySiret: optionalString,
          traderCompanyName: optionalString
        },
        shape: "custom",
        names: ["traderCompanySiret", "traderCompanyName"]
      },
      {
        name: "traderRecepisseNumber",
        shape: "generic",
        label: "Numéro de récépissé",
        required: true,
        validation: {
          traderRecepisseNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      }
    ]
  },
  {
    tabId: "destination",
    tabTitle: "Destinataire",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "destination",
          label: "destination",
          excludeTypes: ["COMMUNES"],
          required: true
        },
        validation: {
          destinationCompanyType: nonEmptyString,
          destinationCompanyOrgId: optionalString,
          destinationCompanyName: optionalString,
          destinationCompanyAddress: optionalString,
          destinationCompanyPostalCode: optionalString,
          destinationCompanyCity: optionalString,
          destinationCompanyCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "destinationCompanyType",
          "destinationCompanyOrgId",
          "destinationCompanyName",
          "destinationCompanyAddress",
          "destinationCompanyPostalCode",
          "destinationCompanyCity",
          "destinationCompanyCountryCode"
        ]
      },
      {
        Component: Address,
        props: {
          prefix: "destinationDropSite",
          nameEnabled: false,
          title: "Lieu de dépôt du destinataire"
        },
        validation: {
          destinationDropSiteAddress: optionalString,
          destinationDropSitePostalCode: optionalString,
          destinationDropSiteCity: optionalString,
          destinationDropSiteCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "destinationDropSiteAddress",
          "destinationDropSitePostalCode",
          "destinationDropSiteCity",
          "destinationDropSiteCountryCode"
        ]
      }
    ]
  },
  {
    tabId: "transporter",
    tabTitle: "Transport",
    fields: [
      {
        name: "reportForTransportMode",
        shape: "generic",
        type: "select",
        label: "Mode de transport",
        required: true,
        defaultOption: "Sélectionnez un mode de transport",
        validation: {
          reportForTransportMode: nonEmptyString
        },
        style: { className: "fr-col-5" },
        choices: TRANSPORT_MODES
      },
      {
        name: "reportForTransportIsWaste",
        shape: "generic",
        type: "checkbox",
        label: "Transport de déchet",
        required: true,
        validation: {
          reportForTransportIsWaste: booleanString
        }
      },
      {
        name: "reportForRecepisseIsExempted",
        shape: "generic",
        type: "checkbox",
        label:
          "Le transporteur déclare être exempté de récépissé conformément aux dispositions de l'article R.541-50 du code de l'environnement",
        required: false,
        validation: {
          reportForRecepisseIsExempted: optionalBooleanString
        }
      },
      {
        name: "reportForRecepisseNumber",
        shape: "generic",
        label: "Numéro de récépissé",
        required: false,
        validation: {
          reportForRecepisseNumber: optionalString
        },
        type: "text",
        style: { className: "fr-col-4" }
      },
      {
        name: "reportForTransportAdr",
        shape: "generic",
        label: "Mention ADR",
        required: false,
        validation: {
          reportForTransportAdr: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        name: "reportForTransportOtherTmdCode",
        shape: "generic",
        label: "Mention RID, ADN, IMDG",
        required: false,
        validation: {
          reportForTransportOtherTmdCode: optionalString
        },
        type: "text",
        style: { className: "fr-col-10" }
      },
      {
        Component: TransporterTags,
        props: {
          label: "Immatriculations",
          prefix: "reportForTransport"
        },
        validation: {
          reportForTransportPlates: filteredArray
        },
        shape: "custom",
        names: ["reportForTransportPlates"]
      }
    ]
  }
];
