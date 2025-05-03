import { z } from "zod";
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
  filteredArray
} from "../builder/validation";
import { CompanySelector } from "../common/CompanySelector";
import { InseeCodes } from "../common/InseeCodes";
import { Address } from "../common/Address";
import { FrenchCompanySelector } from "../common/FrenchCompanySelector";
import {
  INCOMING_TEXS_WASTE_CODES,
  INCOMING_WASTE_PROCESSING_OPERATIONS_CODES
} from "@td/constants";
import { TransporterSelector } from "../common/TransporterSelector/TransporterSelector";
import { RegistryCompanyType } from "@td/codegen-ui";
import { TransportMode } from "@td/codegen-ui";
import { EcoOrganismes } from "../common/EcoOrganismes";
import { Parcels } from "../common/Parcels";

export const outgoingTexsFormShape: FormShape = [
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
          reportForLabel: "SIRET de l'expéditeur ou du détenteur",
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
        props: { name: "wasteCode", whiteList: INCOMING_TEXS_WASTE_CODES },
        shape: "custom",
        names: ["wasteCode"],
        required: false,
        validation: {
          wasteCode: optionalString
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
          wasteIsDangerous: booleanString
        }
      },
      {
        name: "dispatchDate",
        shape: "generic",
        label: "Date d'expédition",
        required: true,
        validation: {
          dispatchDate: nonEmptyString
        },
        type: "date",
        style: { className: "fr-col-4" }
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
    tabId: "initialEmitter",
    tabTitle: "Producteur",
    fields: [
      {
        Component: CompanySelector,
        props: {
          prefix: "initialEmitter",
          label: "producteur initial (optionnel)",
          required: true
        },
        validation: {
          initialEmitterCompanyType: optionalString,
          initialEmitterCompanyOrgId: optionalString,
          initialEmitterCompanyName: optionalString,
          initialEmitterCompanyAddress: optionalString,
          initialEmitterCompanyPostalCode: optionalString,
          initialEmitterCompanyCity: optionalString,
          initialEmitterCompanyCountryCode: optionalString,
          initialEmitterMunicipalitiesInseeCodes: filteredArray
        },
        shape: "custom",
        names: [
          "initialEmitterCompanyType",
          "initialEmitterCompanyOrgId",
          "initialEmitterCompanyName",
          "initialEmitterCompanyAddress",
          "initialEmitterCompanyPostalCode",
          "initialEmitterCompanyCity",
          "initialEmitterCompanyCountryCode",
          "initialEmitterMunicipalitiesInseeCodes"
        ]
      },
      {
        Component: InseeCodes,
        props: {
          prefix: "initialEmitter",
          title: "Code(s) INSEE de(s) commune(s)"
        },
        validation: {
          initialEmitterMunicipalitiesInseeCodes: filteredArray
        },
        shape: "custom",
        names: ["initialEmitterMunicipalitiesInseeCodes"]
      },
      {
        Component: Parcels,
        props: {
          prefix: "parcel"
        },
        names: ["parcelNumbers", "parcelInseeCodes", "parcelCoordinates"],
        validation: {
          parcelNumbers: filteredArray,
          parcelInseeCodes: filteredArray,
          parcelCoordinates: filteredArray
        },
        shape: "custom"
      },
      {
        name: "sisIdentifier",
        shape: "generic",
        label: "Identifiant SIS du terrain",
        validation: {
          sisIdentifier: optionalString
        },
        type: "text",
        style: { className: "fr-col-4" }
      }
    ]
  },
  {
    tabId: "emitter",
    tabTitle: "Expéditeur",
    fields: [
      {
        Component: Address,
        props: {
          prefix: "reportForPickupSite",
          nameEnabled: true,
          title: "Chantier ou lieu de collecte (optionnel)"
        },
        validation: {
          reportForPickupSiteName: optionalString,
          reportForPickupSiteAddress: optionalString,
          reportForPickupSitePostalCode: optionalString,
          reportForPickupSiteCity: optionalString,
          reportForPickupSiteCountryCode: optionalString
        },
        shape: "custom",
        names: [
          "reportForPickupSiteName",
          "reportForPickupSiteAddress",
          "reportForPickupSitePostalCode",
          "reportForPickupSiteCity",
          "reportForPickupSiteCountryCode"
        ]
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
          prefix: "brokerCompany",
          shortMode: true,
          title: "Courtier (optionnel)",
          reducedMargin: true,
          onCompanySelected: (company, setValue) => {
            if (company.brokerReceipt?.receiptNumber) {
              setValue(
                "brokerRecepisseNumber",
                company.brokerReceipt.receiptNumber
              );
            }
          }
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
          prefix: "traderCompany",
          shortMode: true,
          title: "Négociant (optionnel)",
          reducedMargin: true,
          onCompanySelected: (company, setValue) => {
            if (company.traderReceipt?.receiptNumber) {
              setValue(
                "traderRecepisseNumber",
                company.traderReceipt.receiptNumber
              );
            }
          }
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
    tabId: "operation",
    tabTitle: "Traitement",
    fields: [
      {
        shape: "layout",
        fields: [
          {
            name: "operationCode",
            shape: "generic",
            type: "select",
            label: "Code de traitement réalisé",
            required: true,
            defaultOption: "Sélectionnez un traitement",
            validation: {
              operationCode: nonEmptyString
            },
            style: { className: "fr-col-4" },
            choices: INCOMING_WASTE_PROCESSING_OPERATIONS_CODES.map(code => ({
              label: code,
              value: code
            }))
          },
          {
            name: "operationMode",
            shape: "generic",
            type: "select",
            label: "Mode de traitement",
            defaultOption: "Sélectionnez un mode",
            required: false,
            validation: {
              operationMode: optionalString
            },
            style: { className: "fr-col-4" },
            choices: [
              { value: "REUTILISATION", label: "Réutilisation" },
              { value: "RECYCLAGE", label: "Recyclage" },
              {
                value: "VALORISATION_ENERGETIQUE",
                label: "Valorisation énergétique"
              },
              { value: "AUTRES_VALORISATIONS", label: "Autres valorisations" },
              { value: "ELIMINATION", label: "Élimination" }
            ]
          }
        ]
      },
      {
        name: "gistridNumber",
        shape: "generic",
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
      },
      {
        name: "isUpcycled",
        shape: "generic",
        type: "checkbox",
        label: "Terres valorisées",
        required: false,
        validation: {
          isUpcycled: booleanString
        }
      },
      {
        Component: Parcels,
        props: {
          prefix: "destinationParcel",
          title: "Parcelles de destination si valorisation"
        },
        names: [
          "destinationParcelInseeCodes",
          "destinationParcelNumbers",
          "destinationParcelCoordinates"
        ],
        validation: {
          destinationParcelNumbers: filteredArray,
          destinationParcelInseeCodes: filteredArray,
          destinationParcelCoordinates: filteredArray
        },
        shape: "custom"
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
          excludeTypes: ["COMMUNES", "PERSONNE_PHYSIQUE"],
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
        name: "isDirectSupply",
        shape: "generic",
        type: "checkbox",
        label: "Approvisionnement direct (pipeline, convoyeur)",
        required: false,
        validation: {
          isDirectSupply: booleanString
        }
      },
      {
        Component: TransporterSelector,
        props: {},
        validation: {
          transporter: z.array(
            z.object({
              TransportMode: z.nativeEnum(TransportMode),
              CompanyType: z.nativeEnum(RegistryCompanyType),
              CompanyOrgId: optionalString,
              RecepisseIsExempted: booleanString,
              RecepisseNumber: optionalString,
              CompanyName: optionalString,
              CompanyAddress: optionalString,
              CompanyPostalCode: optionalString,
              CompanyCity: optionalString,
              CompanyCountryCode: optionalString
            })
          )
        },
        shape: "custom",
        names: ["transporter"]
      }
    ]
  }
];
