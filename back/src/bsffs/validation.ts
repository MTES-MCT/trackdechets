import * as yup from "yup";
import { Bsff, TransportMode, BsffFicheIntervention } from ".prisma/client";
import { BsffPackaging, BsffPackagingType } from "../generated/graphql/types";
import {
  OPERATION_CODES,
  OPERATION_QUALIFICATIONS,
  PACKAGING_TYPE,
  WASTE_CODES
} from "./constants";

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
  | "wasteDescription"
  | "quantityKilos"
  | "destinationPlannedOperationCode"
  | "destinationPlannedOperationQualification"
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
  wasteDescription: yup
    .string()
    .nullable()
    .required("La description du déchet est requise"),
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
    .required("Le code de l'opération de traitement est requis"),
  destinationPlannedOperationQualification: yup
    .string()
    .nullable()
    .oneOf(
      Object.values(OPERATION_QUALIFICATIONS),
      "La qualification du traitement prévu ne fait pas partie de la liste reconnue : ${values}"
    )
    .required()
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
        numero: yup
          .string()
          .nullable()
          .required("Le numéro identifiant du contenant est requis"),
        type: yup
          .mixed<BsffPackagingType>()
          .nullable()
          .oneOf(
            Object.values(PACKAGING_TYPE),
            "Le type du contenant ne fait pas partie de la liste reconnue : ${values}"
          )
          .required("Le type de contenant est requis"),
        litres: yup
          .number()
          .nullable()
          .required("Le volume du contenant est requis")
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
    .required("Le poids en kilos du déchet reàu est requis"),
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
  | "destinationOperationQualification"
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
    .nullable()
    .oneOf(
      Object.values(OPERATION_CODES),
      "Le code de l'opération de traitement ne fait pas partie de la liste reconnue : ${values}"
    )
    .required("Le code de l'opération de traitement est requis"),
  destinationOperationQualification: yup
    .string()
    .nullable()
    .oneOf(
      Object.values(OPERATION_QUALIFICATIONS),
      "La qualification du traitement ne fait pas partie de la liste reconnue : ${values}"
    )
    .required(),
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
  | "ownerCompanyName"
  | "ownerCompanySiret"
  | "ownerCompanyAddress"
  | "ownerCompanyContact"
  | "ownerCompanyPhone"
  | "ownerCompanyMail"
>> = yup.object({
  numero: yup
    .string()
    .required("Le numéro de la fiche d'intervention est requis"),
  kilos: yup.number().required("Le poids en kilos est requis"),
  postalCode: yup
    .string()
    .required("Le code postal du lieu de l'intervention est requis"),
  ownerCompanyName: yup
    .string()
    .required("Le nom de l'entreprise du lieu d'intervention est requis"),
  ownerCompanySiret: yup
    .string()
    .required("Le SIRET de l'entreprise du lieu d'intervention est requis")
    .length(
      14,
      "Le SIRET de l'entreprise du lieu d'intervention n'est pas au bon format (${length} caractères)"
    ),
  ownerCompanyAddress: yup
    .string()
    .required("L'addresse du lieu d'intervention est requis"),
  ownerCompanyContact: yup
    .string()
    .required("Le nom du contact du lieu d'intervention est requis"),
  ownerCompanyPhone: yup
    .string()
    .required(
      "Le numéro de téléphone de l'entreprise du lieu d'intervention est requis"
    ),
  ownerCompanyMail: yup
    .string()
    .required(
      "L'addresse email de l'entreprise du lieu d'intervention est requis"
    )
});
