import * as Yup from "yup";

const packagingsSchema = Yup.object({
  type: Yup.string().required("Le type de conditionnement est obligatoire"),
  other: Yup.string().optional(),
  quantity: Yup.number()
    .min(1, "La quantité d'un conditionnement doit être supérieure à 1")
    .required("La quantité associée à un conditionnement est obligatoire"),
});

export const bsdaValidationSchema = Yup.object({
  packagings: Yup.array().of(packagingsSchema),
});
