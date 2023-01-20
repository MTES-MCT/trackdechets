import {
  CompanyVerificationStatus,
  TransportMode,
  WasteAcceptationStatus
} from "@prisma/client";
import * as yup from "yup";
import { ConditionBuilder, ConditionConfig } from "yup/lib/Condition";
import {
  isCollector,
  isTransporter,
  isWasteCenter,
  isWasteProcessor,
  isWasteVehicles
} from "../companies/validation";
import prisma from "../prisma";
import { isForeignVat, isSiret, isVat } from "./constants/companySearchHelpers";

// Poids maximum en tonnes tout mode de transport confondu
const MAX_WEIGHT_TONNES = 50000;

// Poids maximum en tonnes quand le transport se fait sur route
const MAX_WEIGHT_BY_ROAD_TONNES = 40;

// De nombreux bordereaux en transit présentent des valeurs
// de poids qui dépassent la valeur max autorisée en transport routier
// Ces bordereaux ne passerait pas la validation après la MEP et causeraient
// de nombreuses demandes au support. Cette variable permet de configurer
// une date de création de bordereau `createdAt` avant laquelle la validation de poids
// en cas de transport routier ne s'applique pas.
const MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER = new Date(
  process.env.MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER ?? 0
);

export enum WeightUnits {
  Tonne,
  Kilogramme
}

export const weight = (unit = WeightUnits.Kilogramme) =>
  yup
    .number()
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
  wasteAcceptationStatus: ConditionBuilder<yup.NumberSchema>;
  transportMode: (unit: WeightUnits) => ConditionConfig<yup.NumberSchema>;
};

export const weightConditions: WeightConditions = {
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
    is: (mode: TransportMode, createdAt?: Date) => {
      return (
        mode === TransportMode.ROAD &&
        (!createdAt || createdAt > MAX_WEIGHT_BY_ROAD_VALIDATE_AFTER)
      );
    },
    then: weight =>
      weight.max(
        unit == WeightUnits.Kilogramme
          ? MAX_WEIGHT_BY_ROAD_TONNES * 1000
          : MAX_WEIGHT_BY_ROAD_TONNES,
        `\${path} : le poids doit être inférieur à ${MAX_WEIGHT_BY_ROAD_TONNES}` +
          ` tonnes lorsque le transport se fait par la route`
      )
  })
};

export const siret = yup
  .string()
  .nullable() // makes sure `null` does not throw a type error
  .test(
    "is-siret",
    "${path}: ${originalValue} n'est pas un numéro de SIRET valide",
    value => !value || isSiret(value)
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
    role?: "DESTINATION" | "TRANSPORTER"
  ) => yup.TestConfig<string>;
};

export const siretConditions: SiretConditions = {
  isForeignShip: (isForeignShip: boolean, schema: yup.StringSchema) => {
    if (isForeignShip === true) {
      return schema
        .notRequired()
        .test(
          "is-null-or-undefined-when-is-foreign-ship",
          "Émetteur : vous ne pouvez pas enregistrer un numéro de SIRET en cas d'émetteur navire étranger",
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
          "${path} : vous ne pouvez pas renseigner de n°SIRET lorsque l'émetteur ou le détenteur est un particulier",
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

const { VERIFY_COMPANY } = process.env;

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
      if (role === "DESTINATION") {
        if (
          !(
            isCollector(company) ||
            isWasteProcessor(company) ||
            isWasteCenter(company) ||
            isWasteVehicles(company)
          )
        ) {
          return ctx.createError({
            message:
              `L'installation de destination ou d’entreposage ou de reconditionnement avec le SIRET "${siret}" n'est pas inscrite` +
              ` sur Trackdéchets en tant qu'installation de traitement ou de tri transit regroupement. Cette installation ne peut` +
              ` donc pas être visée sur le bordereau. Veuillez vous rapprocher de l'administrateur de cette installation pour qu'il` +
              ` modifie le profil de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
          });
        }
        if (
          VERIFY_COMPANY === "true" &&
          company.verificationStatus !== CompanyVerificationStatus.VERIFIED
        ) {
          return ctx.createError({
            message:
              `Le compte de l'installation de destination ou d’entreposage ou de reconditionnement prévue` +
              ` avec le SIRET ${siret} n'a pas encore été vérifié. Cette installation ne peut pas être visée sur le bordereau bordereau.`
          });
        }
      }
      if (role === "TRANSPORTER" && !isTransporter(company)) {
        return ctx.createError({
          message:
            `Le transporteur saisi sur le bordereau (SIRET: ${siret}) n'est pas inscrit sur Trackdéchets` +
            ` en tant qu'entreprise de transport. Cette entreprise ne peut donc pas être visée sur le bordereau.` +
            ` Veuillez vous rapprocher de l'administrateur de cette entreprise pour qu'il modifie le profil` +
            ` de l'établissement depuis l'interface Trackdéchets Mon Compte > Établissements`
        });
      }
      return true;
    }
  })
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
