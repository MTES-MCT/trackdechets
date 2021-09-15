import * as yup from "yup";
import { Bsdasri } from "generated/graphql/types";

export const signatureValidationSchema = (form: Bsdasri) =>
  yup.object({
    signature: yup.object({
      author: yup
        .string()
        .nullable()
        .required("Le nom du signataire est requis"),
    }),
  });

export const emissionSignatureSecretCodeValidationSchema = yup.object({
  signature: yup.object({
    author: yup.string().nullable().required("Le nom du signataire est requis"),
    securityCode: yup.number().required("Le code de signature est obligatoire"),
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
