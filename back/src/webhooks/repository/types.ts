import { CountWebhookSettingFn } from "./webhookSetting/count";
import { CreateWebhookSettingFn } from "./webhookSetting/create";
import { DeleteWebhookSettingFn } from "./webhookSetting/delete";
import { FindManyWebhookSettingFn } from "./webhookSetting/findMany";
import { FindUniqueWebhookSettingFn } from "./webhookSetting/findUnique";
import { UpdateWebhookSettingFn } from "./webhookSetting/update";
import { UpdateManyWebhookSettingFn } from "./webhookSetting/updateMany";

export type WebhookSettingActions = {
  findUnique: FindUniqueWebhookSettingFn;
  findMany: FindManyWebhookSettingFn;
  create: CreateWebhookSettingFn;
  update: UpdateWebhookSettingFn;
  updateMany: UpdateManyWebhookSettingFn;
  delete: DeleteWebhookSettingFn;
  count: CountWebhookSettingFn;
};
