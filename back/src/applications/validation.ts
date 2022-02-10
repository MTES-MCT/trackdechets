import * as yup from "yup";
import { CreateApplicationInput } from "../generated/graphql/types";

export const ApplicationInputSchema: yup.SchemaOf<CreateApplicationInput> =
  yup.object({
    name: yup.string().required(),
    logoUrl: yup
      .string()
      .matches(/^https?:\/\//i, "URL invalide")
      .required(),
    goal: yup.mixed().required(),
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
