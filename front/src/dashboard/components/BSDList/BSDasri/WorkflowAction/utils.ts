import * as yup from "yup";
import { BsdasriQuantity, Bsdasri } from "generated/graphql/types";

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

export const getInitialQuantityFn = (quantity?: BsdasriQuantity | null) => ({
  value: quantity?.value,
  type: quantity?.type,
});

export const prefillWasteDetails = dasri => {
  if (!dasri?.transport?.wasteDetails?.packagingInfos?.length) {
    dasri.transport.wasteDetails.packagingInfos =
      dasri?.emission?.wasteDetails?.packagingInfos;
  }
  if (!dasri?.reception?.wasteDetails?.packagingInfos?.length) {
    dasri.reception.wasteDetails.packagingInfos =
      dasri?.transport?.wasteDetails?.packagingInfos;
  }
  return dasri;
};
