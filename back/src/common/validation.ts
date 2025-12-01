import {
  CompanyVerificationStatus,
  TransportMode,
  WasteAcceptationStatus
} from "@td/prisma";
import * as yup from "yup";
import { ConditionBuilder, ConditionConfig } from "yup/lib/Condition";
import {
  isBroker,
  isCollector,
  isTrader,
  isTransporter,
  isWasteCenter,
  isWasteProcessor,
  isWasteVehicles
} from "../companies/validation";
import type { CompanyInput } from "@td/codegen-back";
import { prisma } from "@td/prisma";
import {
  isForeignVat,
  isFRVat,
  isSiret,
  isVat,
  isDangerous
} from "@td/constants";
import { isBase64 } from "../utils";
import { Decimal } from "decimal.js";
import {
  canProcessDangerousWaste,
  canProcessNonDangerousWaste
} from "../companies/companyProfilesRules";
import { INVALID_DESTINATION_SUBPROFILE } from "../forms/errors";

// Poids maximum en tonnes tout mode de transport confondu
export const MAX_WEIGHT_TONNES = 50000;

// Poids maximum en tonnes quand le transport se fait sur route
export const MAX_WEIGHT_BY_ROAD_TONNES = 40;

export enum WeightUnits {
  Tonne,
  Kilogramme
}

export const weight = (unit = WeightUnits.Kilogramme) =>
  yup
    .number()
    .transform(value => {
      return Decimal.isDecimal(value) ? value.toNumber() : value;
    })
    .nullable()
    .min(0, "${path} : le poids doit être supérieur ou égal à 0")
    .max(
      unit == WeightUnits.Kilogramme
        ? MAX_WEIGHT_TONNES * 1000
        : MAX_WEIGHT_TONNES,
      `\${path} : le poids doit être inférieur à ${MAX_WEIGHT_TONNES} tonnes`
    );

// Differents conditions than can be applied to a weight based on the
// value of other sibling fields
type WeightConditions = {
  bsddWasteAcceptationStatus: ConditionBuilder<yup.NumberSchema>;
  wasteAcceptationStatus: ConditionBuilder<yup.NumberSchema>;
  transportMode: (unit: WeightUnits) => ConditionConfig<yup.NumberSchema>;
  // Same condition as `transportMode` except that is take
  // into account all transporters (including multi-modal)
  transporters: (unit: WeightUnits) => ConditionConfig<yup.NumberSchema>;
};

const maxWeightByRoad = (unit: WeightUnits) =>
  unit == WeightUnits.Kilogramme
    ? MAX_WEIGHT_BY_ROAD_TONNES * 1000
    : MAX_WEIGHT_BY_ROAD_TONNES;

const maxWeightByRoadErrorMessage =
  `\${path} : le poids doit être inférieur à ${MAX_WEIGHT_BY_ROAD_TONNES}` +
  ` tonnes lorsque le transport se fait par la route`;

export const weightConditions: WeightConditions = {
  // Specific for BSDDs, for the quantityRefused migration. quantityReceived
  // must now be the actual received quantity, so it must be > 0 even when REFUSED
  bsddWasteAcceptationStatus: (status, weight) => {
    if (
      [
        WasteAcceptationStatus.ACCEPTED,
        WasteAcceptationStatus.PARTIALLY_REFUSED
      ].includes(status)
    ) {
      return weight
        .required(
          "${path} : le poids est requis lorsque le déchet est accepté ou accepté partiellement."
        )
        .positive(
          "${path} : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
        );
    }
    return weight;
  },
  wasteAcceptationStatus: (status, weight) => {
    if (status === WasteAcceptationStatus.REFUSED) {
      return weight.test({
        name: "is-0",
        test: weight => weight === 0,
        message:
          "${path} : le poids doit être égal à 0 lorsque le déchet est refusé"
      });
    } else if (
      [
        WasteAcceptationStatus.ACCEPTED,
        WasteAcceptationStatus.PARTIALLY_REFUSED
      ].includes(status)
    ) {
      return weight.positive(
        "${path} : le poids doit être supérieur à 0 lorsque le déchet est accepté ou accepté partiellement"
      );
    }
    return weight;
  },
  transportMode: unit => ({
    is: (mode: TransportMode) => {
      return mode === TransportMode.ROAD;
    },
    then: weight =>
      weight.max(maxWeightByRoad(unit), maxWeightByRoadErrorMessage)
  }),
  // Same condition as `transportMode` except that is take into account all
  // transporters (including multi-modal)
  transporters: unit => ({
    is: (transporters: { transporterTransportMode: TransportMode }[]) => {
      return (
        transporters &&
        transporters.some(
          t => t.transporterTransportMode === TransportMode.ROAD
        )
      );
    },
    then: weight =>
      weight.max(maxWeightByRoad(unit), maxWeightByRoadErrorMessage)
  })
};

export const siret = yup
  .string()
  .nullable() // makes sure `null` does not throw a type error
  .test(
    "is-siret",
    "${path}: ${originalValue} n'est pas un SIRET valide",
    value => !value || isSiret(value)
  );

export const base64 = yup
  .string()
  .nullable()
  .test(
    "is-base-64",
    "'${path}' n'est pas encodé en base 64",
    value => !value || isBase64(value)
  );

// Differents conditions than can be applied to a siret number based on the
// value of other sibling fields
type SiretConditions = {
  isForeignShip: ConditionBuilder<yup.StringSchema>;
  isPrivateIndividual: ConditionBuilder<yup.StringSchema>;
  companyVatNumber: ConditionBuilder<yup.StringSchema>;
};

// Different tests that can be applied to a siret number
type SiretTests = {
  isRegistered: (
    role?:
      | "DESTINATION"
      | "TRANSPORTER"
      | "WASTE_VEHICLES"
      | "BROKER"
      | "TRADER"
  ) => yup.TestConfig<string>;
  isNotDormant: yup.TestConfig<string>;
  destinationHasAppropriateSubProfiles: yup.TestConfig<string>;
};

export const siretConditions: SiretConditions = {
  isForeignShip: (isForeignShip: boolean, schema: yup.StringSchema) => {
    if (isForeignShip === true) {
      return schema
        .notRequired()
        .test(
          "is-null-or-undefined-when-is-foreign-ship",
          "Émetteur : vous ne pouvez pas enregistrer un SIRET en cas d'émetteur navire étranger",
          value => !value
        );
    }
    return schema;
  },
  isPrivateIndividual: (
    isPrivateIndividual: boolean,
    schema: yup.StringSchema
  ) => {
    if (isPrivateIndividual === true) {
      return schema
        .notRequired()
        .test(
          "is-null-or-undefined-when-is-private-individual",
          "${path} : vous ne pouvez pas renseigner de SIRET lorsque l'émetteur ou le détenteur est un particulier",
          value => !value
        );
    }
    return schema;
  },
  companyVatNumber: (vatNumber, schema) => {
    if (isForeignVat(vatNumber)) {
      return schema.notRequired();
    }
    return schema;
  }
};

const {
  VERIFY_COMPANY,
  VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER,
  OVERRIDE_V20250201,
  OVERRIDE_V20251101
} = process.env;

// Date de la MAJ 2024.11.1 qui rend obligatoire certtains sous profils pour traiter les déchets dangereux et non dangereux
export const v20241101 = new Date(
  VERIFY_DESTINATION_PROFILES_FOR_BSDD_CREATED_AFTER ||
    "2024-11-19T00:00:00.000Z"
);

// Date de la MAJ 2025.02.1 qui rend obligatoire pour les
// courtiers et négociants d'être inscrit avec le bon profil
// et d'avoir renseigné un récépissé
export const v20250201 = new Date(
  OVERRIDE_V20250201 || "2025-02-12T00:00:00.000Z"
);

export const v20251101 = new Date(
  OVERRIDE_V20251101 || "2025-11-18T00:00:00.000Z"
);

export const siretTests: SiretTests = {
  isRegistered: role => ({
    name: "is-registered-with-right-profile",
    message: ({ path, value }) =>
      `${path} : l'établissement avec le SIRET ${value} n'est pas inscrit sur Trackdéchets`,
    test: async (siret, ctx) => {
      if (!siret) return true;
      const company = await prisma.company.findUnique({
        where: { siret }
      });
      if (company === null) {
        return false;
      }
      if (role === "DESTINATION" || role === "WASTE_VEHICLES") {
        if (
          role === "DESTINATION" &&
          !(
            isCollector(company) ||
            isWasteProcessor(company) ||
            isWasteCenter(company)
          )
        ) {
          return ctx.createError({
            message:
              `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${siret}" n'est pas inscrite` +
              ` sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut` +
              ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
              ` modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
          });
        }

        if (role === "WASTE_VEHICLES" && !isWasteVehicles(company)) {
          return ctx.createError({
            message:
              `L'installation de destination avec le SIRET "${siret}" n'est pas inscrite` +
              ` sur Trackdéchets en tant qu'installation de traitement de VHU. Cette installation ne peut` +
              ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
              ` modifie le profil de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
          });
        }

        if (
          VERIFY_COMPANY === "true" &&
          company.verificationStatus !== CompanyVerificationStatus.VERIFIED
        ) {
          return ctx.createError({
            message:
              `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue` +
              ` avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau.`
          });
        }
      }
      if (role === "TRANSPORTER" && !isTransporter(company)) {
        const {
          transporterIsExemptedOfReceipt, // For BSDDs
          transporterRecepisseIsExempted // For other BSDs
        } = ctx.parent;

        if (transporterIsExemptedOfReceipt || transporterRecepisseIsExempted)
          return true;

        return ctx.createError({
          message:
            `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
            ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
            ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
            ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
        });
      }

      // On ne vérifie les profils courtier et négociant que pour les bordereaux crées
      // à partir de la release 2025021 pour ne pas bloquer les bordereaux existants
      // pour lesquels ces données ne sont plus modifiables.
      const isCreatedAfterV2025021 = () => {
        const bsddCreatedAt =
          ctx.parent.createdAt ||
          // pas de date renseignée sur les nouveaux BSDD
          new Date();
        return bsddCreatedAt.getTime() > v20250201.getTime();
      };

      if (role === "BROKER" && !isBroker(company) && isCreatedAfterV2025021()) {
        return ctx.createError({
          message:
            `Le courtier saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
            " en tant qu'établissement de courtage et ne peut donc pas être visé sur le bordereau." +
            " Veuillez vous rapprocher de l'administrateur de cet établissement pour qu'elle ou il" +
            " modifie le profil de l'établissement depuis l'interface Trackdéchets"
        });
      }
      if (role === "TRADER" && !isTrader(company) && isCreatedAfterV2025021()) {
        return ctx.createError({
          message:
            `Le négociant saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
            " en tant qu'établissement de négoce et ne peut donc pas être visé sur le bordereau." +
            " Veuillez vous rapprocher de l'administrateur de cet établissement pour qu'elle ou il" +
            " modifie le profil de l'établissement depuis l'interface Trackdéchets"
        });
      }
      return true;
    }
  }),
  isNotDormant: {
    name: "is-not-dormant",
    message: ({ path, value }) =>
      `${path} : l'établissement avec le SIRET ${value} est en sommeil`,
    test: async siret => {
      if (!siret) return true;
      const company = await prisma.company.findUnique({
        where: { siret }
      });
      if (company === null) {
        return true;
      }
      return company.isDormantSince == null;
    }
  },
  destinationHasAppropriateSubProfiles: {
    name: "destination-has-appropriate-subprofiles",
    message: () => INVALID_DESTINATION_SUBPROFILE,
    test: async (siret, ctx) => {
      if (!siret) return true;

      // do not run on existing bsdds created before release v20241101
      const bsddCreatedAt = ctx.parent.createdAt || new Date(); // new bsd do not have a createdAt yet
      const isCreatedAfterV202411011 =
        bsddCreatedAt.getTime() > v20241101.getTime();

      if (!isCreatedAfterV202411011) {
        return true;
      }

      const hasDangerousWaste =
        isDangerous(ctx.parent.wasteDetailsCode) ||
        ctx.parent.wasteDetailsPop ||
        ctx.parent.wasteDetailsIsDangerous;

      const company = await prisma.company.findUnique({
        where: { siret }
      });
      if (company === null) {
        return true; // catched by siretTests.isRegistered
      }

      return hasDangerousWaste
        ? canProcessDangerousWaste(company)
        : canProcessNonDangerousWaste(company);
    }
  }
};

export async function validateRecipientSubprofiles(siret, bsdd) {
  if (!siret) return true;

  // do not run on existing bsdds created before release v20241101
  const bsddCreatedAt = bsdd.createdAt || new Date(); // new bsd do not have a createdAt yet
  const isCreatedAfterV202411011 =
    bsddCreatedAt.getTime() - v20241101.getTime() > 0;

  if (!isCreatedAfterV202411011) {
    return true;
  }

  const hasDangerousWaste =
    isDangerous(bsdd.wasteDetailsCode) ||
    bsdd.wasteDetailsPop ||
    bsdd.wasteDetailsIsDangerous;

  const company = await prisma.company.findUnique({
    where: { siret }
  });
  if (company === null) {
    return true; // catched by siretTests.isRegistered
  }

  return hasDangerousWaste
    ? canProcessDangerousWaste(company)
    : canProcessNonDangerousWaste(company);
}

// Different tests that can be applied to a vat number
type VatNumberTests = {
  isRegisteredTransporter: yup.TestConfig<string>;
};

export const vatNumber = yup
  .string()
  .nullable()
  .test(
    "is-vat",
    "${path}: ${originalValue} n'est pas un numéro de TVA valide",
    value => {
      if (!value) {
        return true;
      }
      return isVat(value);
    }
  );

export const foreignVatNumber = vatNumber.test(
  "is-foreign-vat",
  "${path} : Impossible d'utiliser le numéro de TVA pour un établissement français, veuillez renseigner son SIRET uniquement",
  value => {
    if (!value) return true;
    return isForeignVat(value);
  }
);

export const vatNumberTests: VatNumberTests = {
  isRegisteredTransporter: {
    name: "is-registered-foreign-transporter",
    message: ({ path, value }) =>
      `${path} : le transporteur avec le n°de TVA ${value} n'est pas inscrit sur Trackdéchets`,
    test: async (vatNumber, ctx) => {
      if (!vatNumber) return true;
      const company = await prisma.company.findUnique({
        where: { vatNumber }
      });
      if (company === null) {
        return false;
      }
      if (!isTransporter(company)) {
        return ctx.createError({
          message:
            `Le transporteur saisi sur le bordereau (numéro de TVA: ${vatNumber}) n'est pas inscrit sur Trackdéchets` +
            ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
            ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
            ` de l'établissement depuis l'interface Trackdéchets dans Mes établissements`
        });
      }
      return true;
    }
  }
};

/**
 * Constraints on CompanyInput that apply to intermediary company input
 * - SIRET is mandatory
 * - Only french companies are allowed
 */
export const intermediarySchema: yup.SchemaOf<CompanyInput> = yup.object({
  siret: siret
    .label("Intermédiaires")
    .required("Intermédiaires : le SIRET est obligatoire"),
  contact: yup
    .string()
    .required(
      "Intermédiaires : les nom et prénom de contact sont obligatoires"
    ),
  vatNumber: yup
    .string()
    .notRequired()
    .nullable()
    .test(
      "is-fr-vat",
      "Intermédiaires : seul les numéros de TVA en France sont valides",
      vat => !vat || (isVat(vat) && isFRVat(vat))
    ),
  address: yup
    .string()
    .required("Intermédiaires : l'adresse de l'établissement est obligatoire"), // should be auto-completed through sirenify
  name: yup.string().required(
    "Intermédiaires : la raison sociale de l'établissement est obligatoire" // should be auto-completed through sirenify
  ),
  phone: yup.string().notRequired().nullable(),
  mail: yup.string().notRequired().nullable(),
  country: yup.string().notRequired().nullable(), // is ignored in db schema
  omiNumber: yup.string().notRequired().nullable(), // is ignored in db schema
  orgId: yup.string().notRequired().nullable(), // is ignored in db schema
  extraEuropeanId: yup.string().notRequired().nullable() // is ignored in db schema
});

/**
 * Common transporter receipt error message
 */
export const REQUIRED_RECEIPT_VALIDITYLIMIT = `Transporteur: la date limite de validité du récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets`;
export const REQUIRED_RECEIPT_NUMBER = `Transporteur: le numéro de récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets`;
export const REQUIRED_RECEIPT_DEPARTMENT = `Transporteur: le département associé au récépissé est obligatoire - l'établissement doit renseigner son récépissé dans Trackdéchets`;

/**
 * Common transporter receipt schema for BSVHU, BSDASRI, BSDA and BSFF
 */
export const transporterRecepisseSchema = context => ({
  transporterRecepisseIsExempted: yup.boolean().nullable(),
  transporterRecepisseDepartment: yup
    .string()
    .when(
      [
        "transporterRecepisseIsExempted",
        "transporterCompanyVatNumber",
        "transporterTransportMode"
      ],
      {
        is: (isExempted, vat, transportMode) =>
          isExempted ||
          isForeignVat(vat) ||
          (transportMode && transportMode !== TransportMode.ROAD),
        then: schema => schema.nullable().notRequired(),
        otherwise: schema =>
          schema.requiredIf(
            context.transportSignature,
            REQUIRED_RECEIPT_DEPARTMENT
          )
      }
    ),
  transporterRecepisseNumber: yup
    .string()
    .when(
      [
        "transporterRecepisseIsExempted",
        "transporterCompanyVatNumber",
        "transporterTransportMode"
      ],
      {
        is: (isExempted, vat, transportMode) =>
          isExempted ||
          isForeignVat(vat) ||
          (transportMode && transportMode !== TransportMode.ROAD),
        then: schema => schema.nullable().notRequired(),
        otherwise: schema =>
          schema.requiredIf(context.transportSignature, REQUIRED_RECEIPT_NUMBER)
      }
    ),
  transporterRecepisseValidityLimit: yup
    .date()
    .when(
      [
        "transporterRecepisseIsExempted",
        "transporterCompanyVatNumber",
        "transporterTransportMode"
      ],
      {
        is: (isExempted, vat, transportMode) =>
          isExempted ||
          isForeignVat(vat) ||
          (transportMode && transportMode !== TransportMode.ROAD),
        then: schema => schema.nullable().notRequired(),
        otherwise: schema =>
          schema.requiredIf(
            context.transportSignature,
            REQUIRED_RECEIPT_VALIDITYLIMIT
          )
      }
    )
});
