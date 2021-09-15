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
  if (!dasri?.transporter?.transport?.packagingInfos?.length) {
    dasri.transporter.transport.packagingInfos =
      dasri?.emitter?.emission?.packagingInfos;
  }
  if (!dasri?.destination?.reception?.packagingInfos?.length) {
    dasri.destination.reception.packagingInfos =
      dasri?.transporter?.transport?.packagingInfos;
  }
  return dasri;
};
