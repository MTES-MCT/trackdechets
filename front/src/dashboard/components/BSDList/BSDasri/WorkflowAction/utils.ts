import * as yup from "yup";
import { Bsdasri } from "generated/graphql/types";
import { subMonths } from "date-fns";

export const signatureValidationSchema = (form: Bsdasri, today: Date) =>
  yup.object({
    signature: yup.object({
      date: yup
        .date()
        .required("La date d'émission est requise")
        .max(today, "La date d'émission ne peut être dans le futur")
        .min(
          subMonths(today, 2),
          "La date d'émission ne peut être antérieure à 2 mois"
        ),
      author: yup
        .string()
        .nullable()
        .required("Le nom du signataire est requis"),
    }),
  });

export const emissionSignatureSecretCodeValidationSchema = yup.object({
  signature: yup.object({
    author: yup.string().nullable().required("Le nom du signataire est requis"),
    securityCode: yup
      .string()
      .required("Le code de signature est obligatoire")
      .matches(/[1-9][0-9]{3}/, "Format invalide"),
  }),
});

export const prefillWasteDetails = dasri => {
  if (!dasri?.transporter?.transport?.packagings?.length) {
    dasri.transporter.transport.packagings =
      dasri?.emitter?.emission?.packagings;
  }
  if (!dasri?.destination?.reception?.packagings?.length) {
    dasri.destination.reception.packagings =
      dasri?.transporter?.transport?.packagings;
  }
  return dasri;
};
