import * as yup from "yup";
import type { CreateApplicationInput } from "@td/codegen-back";
import { validateSecureUri } from "../common/validation/secureUri";

export const applicationSchema: yup.SchemaOf<CreateApplicationInput> =
  yup.object({
    name: yup.string().required(),
    goal: yup.mixed().required(),
    redirectUris: yup
      .array()
      .of(
        yup
          .string()
          .required()
          .test(
            "secure-redirect-uri",
            "URL de redirection non sécurisée",
            validateSecureUri
          )
      )
      .required()
      .min(1, "Vous devez préciser au moins une URL de redirection")
  });
