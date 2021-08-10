import * as yup from "yup";
import { UserInputError } from "apollo-server-express";
import {
  Bsff,
  TransportMode,
  BsffFicheIntervention,
  BsffStatus
} from "@prisma/client";
import prisma from "../prisma";
import { BsffPackaging } from "../generated/graphql/types";
import { GROUPING_CODES, OPERATION_CODES, WASTE_CODES } from "./constants";

export const beforeEmissionSchema: yup.SchemaOf<Pick<
  Bsff,
  | "emitterCompanyName"
  | "emitterCompanySiret"
  | "emitterCompanyAddress"
  | "emitterCompanyContact"
  | "emitterCompanyPhone"
  | "emitterCompanyMail"
  | "emitterEmissionSignatureDate"
  | "wasteCode"
  | "quantityKilos"
  | "destinationPlannedOperationCode"
>> = yup.object({
  emitterCompanyName: yup
    .string()
    .nullable()
    .required("Le nom de l'entreprise émettrice est requis"),
  emitterCompanySiret: yup
    .string()
    .nullable()
    .required("Le SIRET de l'entreprise émettrice est requis")
    .length(
      14,
      "Le SIRET de l'entreprise émettrice n'est pas au bon format (${length} caractères)"
    ),
  emitterCompanyAddress: yup
    .string()
    .nullable()
    .required("L'adresse de l'entreprise émettrice est requise"),
  emitterCompanyContact: yup
    .string()
    .nullable()
    .required("Le nom du contact dans l'entreprise émettrice est requis"),
  emitterCompanyPhone: yup
    .string()
    .nullable()
    .required("Le numéro de téléphone de l'entreprise émettrice est requis"),
  emitterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .required("L'adresse email de l'entreprise émettrice est requis"),
  emitterEmissionSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'entreprise émettrice a déjà signé ce bordereau",
      value => value == null
    ) as any, // https://github.com/jquense/yup/issues/1302
  wasteCode: yup
    .string()
    .nullable()
    .required("Le code déchet est requis")
    .oneOf(
      WASTE_CODES,
      "Le code déchet ne fait pas partie de la liste reconnue : ${values}"
    ),
  quantityKilos: yup
    .number()
    .nullable()
    .required("Le poids total du déchet est requis"),
  destinationPlannedOperationCode: yup
    .string()
    .nullable()
    .oneOf(
      Object.values(OPERATION_CODES),
      "Le code de l'opération de traitement prévu ne fait pas partie de la liste reconnue : ${values}"
    )
});

export const beforeTransportSchema: yup.SchemaOf<Pick<
  Bsff,
  | "emitterEmissionSignatureDate"
  | "packagings"
  | "wasteAdr"
  | "transporterCompanyName"
  | "transporterCompanySiret"
  | "transporterCompanyAddress"
  | "transporterCompanyContact"
  | "transporterCompanyPhone"
  | "transporterCompanyMail"
  | "transporterTransportMode"
  | "transporterTransportSignatureDate"
>> = yup.object({
  emitterEmissionSignatureDate: yup
    .date()
    .nullable()
    .required(
      "Le transporteur ne peut pas signer l'enlèvement avant que l'émetteur ait signé le bordereau"
    ) as any, // https://github.com/jquense/yup/issues/1302
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
    .required("Le conditionnement est requis")
    .min(1, "Le conditionnement est requis"),
  wasteAdr: yup.string().nullable().required("La mention ADR est requise"),
  transporterCompanyName: yup
    .string()
    .nullable()
    .required("Le nom du transporteur est requis"),
  transporterCompanySiret: yup
    .string()
    .nullable()
    .required("Le SIRET du transporteur est requis")
    .length(
      14,
      "Le SIRET du transporteur n'est pas au bon format (${length} caractères)"
    ),
  transporterCompanyAddress: yup
    .string()
    .nullable()
    .required("L'adresse du transporteur est requise"),
  transporterCompanyContact: yup
    .string()
    .nullable()
    .required("Le nom du contact dans l'entreprise émettrice est requis"),
  transporterCompanyPhone: yup
    .string()
    .nullable()
    .required("Le numéro de téléphone du transporteur est requis"),
  transporterCompanyMail: yup
    .string()
    .nullable()
    .email()
    .required("L'adresse email du transporteur est requis"),
  transporterTransportMode: yup
    .mixed<TransportMode>()
    .nullable()
    .oneOf(
      Object.values(TransportMode),
      "Le mode de transport ne fait pas partie de la liste reconnue : ${values}"
    )
    .required("Le mode de transport utilisé par le transporteur est requis"),
  transporterTransportSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "Le transporteur a déjà signé ce bordereau",
      value => value == null
    ) as any // https://github.com/jquense/yup/issues/1302
});

export const beforeReceptionSchema: yup.SchemaOf<Pick<
  Bsff,
  | "destinationCompanyName"
  | "destinationCompanySiret"
  | "destinationCompanyAddress"
  | "destinationCompanyContact"
  | "destinationCompanyPhone"
  | "destinationCompanyMail"
  | "destinationReceptionDate"
  | "destinationReceptionKilos"
  | "destinationReceptionSignatureDate"
>> = yup.object({
  destinationCompanyName: yup
    .string()
    .nullable()
    .required("Le nom de l'installation de destination est requis"),
  destinationCompanySiret: yup
    .string()
    .nullable()
    .required("Le SIRET de l'installation de destination est requis")
    .length(
      14,
      "Le SIRET de l'installation de destination n'est pas au bon format (${length} caractères)"
    ),
  destinationCompanyAddress: yup
    .string()
    .nullable()
    .required("L'adresse de l'installation de destination est requise"),
  destinationCompanyContact: yup
    .string()
    .nullable()
    .required("Le nom du contact dans l'entreprise émettrice est requis"),
  destinationCompanyPhone: yup
    .string()
    .nullable()
    .required(
      "Le numéro de téléphone de l'installation de destination est requis"
    ),
  destinationCompanyMail: yup
    .string()
    .nullable()
    .email()
    .required("L'adresse email de l'installation de destination est requis"),
  destinationReceptionDate: yup
    .date()
    .nullable()
    .required("La date de réception du déchet est requise") as any, // https://github.com/jquense/yup/issues/1302
  destinationReceptionKilos: yup
    .number()
    .nullable()
    .required("Le poids en kilos du déchet reçu est requis"),
  destinationReceptionSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'installation de destination a déjà signé la réception du déchet",
      value => value == null
    ) as any // https://github.com/jquense/yup/issues/1302
});

export const beforeOperationSchema: yup.SchemaOf<Pick<
  Bsff,
  | "destinationReceptionSignatureDate"
  | "destinationOperationCode"
  | "destinationOperationSignatureDate"
>> = yup.object({
  destinationReceptionSignatureDate: yup
    .date()
    .nullable()
    .required(
      "L'installation de destination ne peut pas signer le traitement avant la réception du déchet"
    ) as any, // https://github.com/jquense/yup/issues/1302
  destinationOperationCode: yup
    .string()
    // Operation code can be null when the waste is temporarily stored and sent somewhere else.
    // It received no treatment, it was only stored in its current form.
    .nullable()
    .oneOf(
      [null, ...Object.values(OPERATION_CODES)],
      "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : ${values}"
    ),
  destinationOperationSignatureDate: yup
    .date()
    .nullable()
    .test(
      "is-not-signed",
      "L'installation de destination a déjà signé le traitement du déchet",
      value => value == null
    ) as any // https://github.com/jquense/yup/issues/1302
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

export async function isValidPreviousBsffs(ids: string[]) {
  const previousBsffs = await prisma.bsff.findMany({
    where: {
      id: {
        in: ids
      }
    }
  });

  if (previousBsffs.some(bsff => bsff.status !== BsffStatus.PROCESSED)) {
    throw new UserInputError(
      `Certains des bordereaux à associer n'ont pas toutes les signatures requises`
    );
  }

  if (
    !previousBsffs.every(
      bsff =>
        // operation code is null when the waste is temporarily stored and receives no treatment
        bsff.destinationOperationCode == null ||
        GROUPING_CODES.includes(bsff.destinationOperationCode)
    )
  ) {
    throw new UserInputError(
      `Les bordereaux à associer ont déclaré un traitement qui ne permet pas de leur donner suite`
    );
  }
}
