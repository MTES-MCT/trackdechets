import * as yup from "yup";
import { ApplicationInput } from "../generated/graphql/types";

export const ApplicationInputSchema: yup.SchemaOf<ApplicationInput> =
  yup.object({
    name: yup.string().required(),
    logoUrl: yup
      .string()
      .matches(/^https?:\/\//i, "URL invalide")
      .required(),
    goal: yup.string().required(),
    redirectUris: yup
      .array()
      .of(
        yup
          .string()
          .matches(/^https?:\/\//i, "URL invalide")
          .required()
      )
      .required()
      .min(1, "Vous devez préciser au moins une URL de redirection")
  });
