import * as yup from "yup";
import { Prisma } from "@prisma/client";

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
      .url()
      .max(300)
      .test(
        "webhook-url-https",
        "L'url doit être en https",
        value => value === undefined || value.startsWith("https://")
      ),
    token: yup.string().notRequired().min(20).max(100),
    activated: yup.boolean()
  });

const webhookSettingCreateSchema: yup.SchemaOf<WebhookSettingCreateInput> =
  yup.object({
    companyId: yup.string().required("L'id de l'établissement est requis'"),
    endpointUri: yup
      .string()
      .url()
      .max(300)
      .required("L'url de notification du webhook est requise")
      .test("webhook-url-https", "L'url doit être en https", (value: string) =>
        value.startsWith("https://")
      ),
    token: yup.string().notRequired().min(20).max(100) as any,
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
