import { z } from "zod";
import { FormShape } from "../builder/types";
import { ReportFor } from "../common/ReportFor";
import { Address } from "../common/Address";
import { FrenchCompanySelector } from "../common/FrenchCompanySelector";
import { EcoOrganismes } from "../common/EcoOrganismes";
import { Parcels } from "../common/Parcels";

export const incomingTexsFormShape: FormShape = [
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
          publicId: z.string().min(1)
        },
        style: { className: "fr-col-8" }
      },
      {
        Component: ReportFor,
        props: {
          reportForLabel: "SIRET de l'émetteur",
          reportAsLabel: "SIRET du déclarant"
        },
        names: ["reportForCompanySiret", "reportAsCompanySiret"],
        validation: {
          reportForCompanySiret: z.string().min(1),
          reportAsCompanySiret: z.string().nullish()
        },
        shape: "custom"
      },
      {
        name: "test",
        shape: "generic",
        type: "checkbox",
        label: "Test toggle",
        required: true,
        validation: {
          test: z.boolean().optional()
        }
      },
      {
        Component: Address,
        props: {
          prefix: "destinationDropSite"
        },
        names: ["testAddress"],
        validation: {
          testAddress: z.string().nullable()
        },
        shape: "custom"
      },
      {
        Component: FrenchCompanySelector,
        props: {
          prefix: "broker",
          shortMode: true
        },
        names: ["brokerSiret"],
        validation: {
          brokerSiret: z.string().nullable()
        },
        shape: "custom"
      },
      {
        Component: EcoOrganismes,
        props: {},
        names: ["ecoOrganismeSiret"],
        validation: {
          ecoOrganismeSiret: z.string().nullable()
        },
        shape: "custom"
      }
      ,
      {
        Component: Parcels,
        props: {
          prefix: "parcel"
        },
        names: ["parcelNumbers", "parcelInseeCodes", "parcelCoordinates"],
        validation: {
          parcelNumbers: z.array(z.string()).nullable(),
          parcelInseeCodes: z.array(z.string()).nullable(),
          parcelCoordinates: z.array(z.string()).nullable()
        },
        shape: "custom"
      }
    ]
  }
];
