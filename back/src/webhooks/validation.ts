import * as yup from "yup";
import { Prisma } from "@td/prisma";
import { validateSecureUri } from "../common/validation/secureUri";

type WebhookSettingCreateInput = Pick<
  Prisma.WebhookSettingCreateInput,
  "endpointUri" | "token" | "activated"
> & { companyId: string };
type WebhookSettingUpdateInput = Pick<
  Prisma.WebhookSettingUpdateInput,
  "endpointUri" | "token" | "activated"
>;

const webhookSettingUpdateSchema: yup.SchemaOf<WebhookSettingUpdateInput> =
  yup.object({
    endpointUri: yup
      .string()
      .max(300)
      .test(
        "secure-webhook-uri",
        "URL de webhook non sécurisée ou invalide",
        value => value === undefined || validateSecureUri(value)
      ),
    token: yup.string().notRequired().min(20).max(100),
    activated: yup.boolean()
  });

const webhookSettingCreateSchema: yup.SchemaOf<WebhookSettingCreateInput> =
  yup.object({
    companyId: yup.string().required("L'id de l'établissement est requis'"),
    endpointUri: yup
      .string()
      .max(300)
      .required("L'url de notification du webhook est requise")
      .test(
        "secure-webhook-uri",
        "URL de webhook non sécurisée ou invalide",
        validateSecureUri
      ),
    token: yup.string().required().min(20).max(100) as any,
    activated: yup.boolean()
  });

export function validateWebhookCreateInput(
  input: Partial<WebhookSettingCreateInput>
) {
  return webhookSettingCreateSchema.validate(input, { abortEarly: false });
}

export function validateWebhookUpdateInput(input: WebhookSettingUpdateInput) {
  return webhookSettingUpdateSchema.validate(input, { abortEarly: false });
}
