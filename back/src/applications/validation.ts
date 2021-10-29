import * as yup from "yup";
import { ApplicationInput } from "../generated/graphql/types";

export const ApplicationInputSchema: yup.SchemaOf<ApplicationInput> = yup.object(
  {
    name: yup.string().required(),
    logoUrl: yup.string().url().required(),
    redirectUris: yup
      .array()
      .of(yup.string().url().required())
      .required()
      .min(1)
  }
);
