import * as yup from "yup";
import { UserInputError } from "apollo-server-express";
import {
  Bsff,
  TransportMode,
  BsffFicheIntervention,
  BsffStatus,
  BsffType
} from "@prisma/client";
import prisma from "../prisma";
import { BsffPackaging } from "../generated/graphql/types";
import { OPERATION, WASTE_CODES } from "./constants";

export const bsffSchema: yup.SchemaOf<Pick<
  Bsff,
  | "isDraft"
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
  | "wasteCode"
  | "quantityKilos"
  | "destinationPlannedOperationCode"
  | "packagings"
  | "wasteAdr"
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
>> = yup.object({
  isDraft: yup.boolean().nullable(),
  emitterCompanyName: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le nom de l'entreprise émettrice est requis")
    }),
  emitterCompanySiret: yup
    .string()
    .nullable()
    .length(
      14,
      "Le SIRET de l'entreprise émettrice n'est pas au bon format (${length} caractères)"
    )
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le SIRET de l'entreprise émettrice est requis")
    }),
  emitterCompanyAddress: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("L'adresse de l'entreprise émettrice est requise")
    }),
  emitterCompanyContact: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "Le nom du contact dans l'entreprise émettrice est requis"
        )
    }),
  emitterCompanyPhone: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "Le numéro de téléphone de l'entreprise émettrice est requis"
        )
    }),
  emitterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("L'adresse email de l'entreprise émettrice est requis")
    }),
  wasteCode: yup
    .string()
    .nullable()
    .oneOf(
      [null, ...WASTE_CODES],
      "Le code déchet ne fait pas partie de la liste reconnue : ${values}"
    )
    .when("isDraft", {
      is: true,
      otherwise: schema => schema.required("Le code déchet est requis")
    }),
  quantityKilos: yup
    .number()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le poids total du déchet est requis")
    }),
  destinationPlannedOperationCode: yup
    .string()
    .nullable()
    .oneOf(
      [null, ...Object.keys(OPERATION)],
      "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
    ),
  packagings: yup
    .array()
    .nullable()
    .of<yup.SchemaOf<Omit<BsffPackaging, "__typename">>>(
      yup.object({
        name: yup
          .string()
          .nullable()
          .required("La dénomination du contenant est requise"),
        volume: yup.number().nullable(),
        numero: yup
          .string()
          .nullable()
          .required("Le numéro identifiant du contenant est requis"),
        kilos: yup
          .number()
          .nullable()
          .required("Le poids du contenant est requis")
      })
    )
    .when("isDraft", {
      is: true,
      otherwise: schema => schema.required("Le conditionnement est requis")
    }),
  wasteAdr: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema => schema.required("La mention ADR est requise")
    }),
  transporterCompanyName: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema => schema.required("Le nom du transporteur est requis")
    }),
  transporterCompanySiret: yup
    .string()
    .nullable()
    .length(
      14,
      "Le SIRET du transporteur n'est pas au bon format (${length} caractères)"
    )
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le SIRET du transporteur est requis")
    }),
  transporterCompanyAddress: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("L'adresse du transporteur est requise")
    }),
  transporterCompanyContact: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "Le nom du contact dans l'entreprise émettrice est requis"
        )
    }),
  transporterCompanyPhone: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le numéro de téléphone du transporteur est requis")
    }),
  transporterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("L'adresse email du transporteur est requis")
    }),
  destinationCompanyName: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le nom de l'installation de destination est requis")
    }),
  destinationCompanySiret: yup
    .string()
    .nullable()
    .length(
      14,
      "Le SIRET de l'installation de destination n'est pas au bon format (${length} caractères)"
    )
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required("Le SIRET de l'installation de destination est requis")
    }),
  destinationCompanyAddress: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "L'adresse de l'installation de destination est requise"
        )
    }),
  destinationCompanyContact: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "Le nom du contact dans l'entreprise émettrice est requis"
        )
    }),
  destinationCompanyPhone: yup
    .string()
    .nullable()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "Le numéro de téléphone de l'installation de destination est requis"
        )
    }),
  destinationCompanyMail: yup
    .string()
    .nullable()
    .email()
    .when("isDraft", {
      is: true,
      otherwise: schema =>
        schema.required(
          "L'adresse email de l'installation de destination est requis"
        )
    })
});

export const beforeEmissionSchema: yup.SchemaOf<Pick<
  Bsff,
  "emitterEmissionSignatureDate" | "isDraft"
>> = yup.object({
  emitterEmissionSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'entreprise émettrice a déjà signé ce bordereau",
      value => value == null
    ) as any, // https://github.com/jquense/yup/issues/1302
  isDraft: yup
    .boolean()
    .oneOf(
      [false],
      "Il n'est pas possible de signer un BSFF à l'état de brouillon"
    )
});

export const beforeTransportSchema: yup.SchemaOf<Pick<
  Bsff,
  | "emitterEmissionSignatureDate"
  | "transporterTransportSignatureDate"
  | "transporterTransportMode"
>> = yup.object({
  emitterEmissionSignatureDate: yup
    .date()
    .nullable()
    .required(
      "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
    ) as any, // https://github.com/jquense/yup/issues/1302
  transporterTransportSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "Le transporteur a déjà signé ce bordereau",
      value => value == null
    ) as any, // https://github.com/jquense/yup/issues/1302
  transporterTransportMode: yup
    .mixed<TransportMode>()
    .nullable()
    .oneOf(
      [null, ...Object.values(TransportMode)],
      "Le mode de transport ne fait pas partie de la liste reconnue : ${values}"
    )
    .required("Le mode de transport utilisé par le transporteur est requis")
});

export const beforeReceptionSchema: yup.SchemaOf<Pick<
  Bsff,
  | "transporterTransportSignatureDate"
  | "destinationReceptionSignatureDate"
  | "destinationReceptionDate"
  | "destinationReceptionKilos"
>> = yup.object({
  transporterTransportSignatureDate: yup
    .date()
    .nullable()
    .required(
      "L'installation de destination ne peut pas signer la réception avant que le transporteur ait signé le bordereau"
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationReceptionSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'installation de destination a déjà signé la réception du déchet",
      value => value == null
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationReceptionDate: yup
    .date()
    .nullable()
    .required("La date de réception du déchet est requise") as any, // https://github.com/jquense/yup/issues/1302
  destinationReceptionKilos: yup
    .number()
    .nullable()
    .required("Le poids en kilos du déchet reçu est requis")
});

export const beforeOperationSchema: yup.SchemaOf<Pick<
  Bsff,
  | "destinationReceptionSignatureDate"
  | "destinationOperationSignatureDate"
  | "destinationOperationCode"
>> = yup.object({
  destinationReceptionSignatureDate: yup
    .date()
    .nullable()
    .required(
      "L'installation de destination ne peut pas signer le traitement avant la réception du déchet"
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationOperationSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'installation de destination a déjà signé le traitement du déchet",
      value => value == null
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationOperationCode: yup
    .string()
    .oneOf(
      Object.keys(OPERATION),
      "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : ${values}"
    )
});

export const ficheInterventionSchema: yup.SchemaOf<Pick<
  BsffFicheIntervention,
  | "numero"
  | "kilos"
  | "postalCode"
  | "detenteurCompanyName"
  | "detenteurCompanySiret"
  | "detenteurCompanyAddress"
  | "detenteurCompanyContact"
  | "detenteurCompanyPhone"
  | "detenteurCompanyMail"
  | "operateurCompanyName"
  | "operateurCompanySiret"
  | "operateurCompanyAddress"
  | "operateurCompanyContact"
  | "operateurCompanyPhone"
  | "operateurCompanyMail"
>> = yup.object({
  numero: yup
    .string()
    .required("Le numéro de la fiche d'intervention est requis"),
  kilos: yup.number().required("Le poids en kilos est requis"),
  postalCode: yup
    .string()
    .required("Le code postal du lieu de l'intervention est requis"),
  detenteurCompanyName: yup
    .string()
    .required("Le nom de l'entreprise détentrice de l'équipement est requis"),
  detenteurCompanySiret: yup
    .string()
    .required("Le SIRET de l'entreprise détentrice de l'équipement est requis")
    .length(
      14,
      "Le SIRET de l'entreprise détentrice de l'équipement n'est pas au bon format (${length} caractères)"
    ),
  detenteurCompanyAddress: yup
    .string()
    .required(
      "L'addresse de l'entreprise détentrice de l'équipement est requise"
    ),
  detenteurCompanyContact: yup
    .string()
    .required(
      "Le nom du contact de l'entreprise détentrice de l'équipement est requis"
    ),
  detenteurCompanyPhone: yup
    .string()
    .required(
      "Le numéro de téléphone de l'entreprise détentrice de l'équipement est requis"
    ),
  detenteurCompanyMail: yup
    .string()
    .required(
      "L'addresse email de l'entreprise détentrice de l'équipement est requis"
    ),
  operateurCompanyName: yup
    .string()
    .required("Le nom de l'entreprise de l'opérateur est requis"),
  operateurCompanySiret: yup
    .string()
    .required("Le SIRET de l'entreprise de l'opérateur est requis")
    .length(
      14,
      "Le SIRET de l'entreprise de l'opérateur n'est pas au bon format (${length} caractères)"
    ),
  operateurCompanyAddress: yup
    .string()
    .required("L'addresse de l'entreprise de l'opérateur est requis"),
  operateurCompanyContact: yup
    .string()
    .required("Le nom du contact de l'entreprise de l'opérateur est requis"),
  operateurCompanyPhone: yup
    .string()
    .required(
      "Le numéro de téléphone de l'entreprise de l'opérateur est requis"
    ),
  operateurCompanyMail: yup
    .string()
    .required("L'addresse email de l'entreprise de l'opérateur est requis")
});

export async function isValidPreviousBsffs(type: BsffType, ids: string[]) {
  const previousBsffs = await prisma.bsff.findMany({
    where: {
      id: {
        in: ids
      }
    }
  });

  const errors = previousBsffs.reduce<string[]>((acc, previousBsff) => {
    if (previousBsff.status === BsffStatus.PROCESSED) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} a déjà reçu son traitement final.`
      ]);
    }

    if (previousBsff.status !== BsffStatus.INTERMEDIATELY_PROCESSED) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} n'a pas toutes les signatures requises.`
      ]);
    }

    if (previousBsff.nextBsffId) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} est déjà lié à un autre bordereau.`
      ]);
    }

    if (
      !OPERATION[previousBsff.destinationOperationCode].successors.includes(
        type
      )
    ) {
      return acc.concat([
        `Le bordereau n°${previousBsff.id} a déclaré un traitement qui ne permet pas de lui donner la suite voulue.`
      ]);
    }

    return acc;
  }, []);

  if (errors.length > 0) {
    throw new UserInputError(errors.join("\n"));
  }
}
