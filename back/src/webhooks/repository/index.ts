import { prisma } from "@td/prisma";
import { transactionWrapper } from "../../common/repository/helper";
import { WebhookSettingActions } from "./types";
import { buildFindUniqueWebhookSetting } from "./webhookSetting/findUnique";
import { buildFindManyWebhookSetting } from "./webhookSetting/findMany";
import { buildCountWebhookSettings } from "./webhookSetting/count";
import { buildCreateWebhookSetting } from "./webhookSetting/create";
import { buildDeleteWebhookSetting } from "./webhookSetting/delete";
import { buildUpdatWebhookSettings } from "./webhookSetting/update";

import {
  RepositoryFnBuilder,
  RepositoryTransaction
} from "../../common/repository/types";

export type WebhookSettingRepository = WebhookSettingActions;

export function getReadonlyWebhookSettingRepository() {
  return {
    count: buildCountWebhookSettings({ prisma }),
    findUnique: buildFindUniqueWebhookSetting({ prisma }),
    findMany: buildFindManyWebhookSetting({ prisma })
  };
}

export function getWebhookSettingRepository(
  user: Express.User,
  transaction?: RepositoryTransaction
): WebhookSettingRepository {
  function useTransaction<FnResult>(builder: RepositoryFnBuilder<FnResult>) {
    return transactionWrapper(builder, { user, transaction });
  }

  return {
    ...getReadonlyWebhookSettingRepository(),
    create: useTransaction(buildCreateWebhookSetting),
    delete: useTransaction(buildDeleteWebhookSetting),
    update: useTransaction(buildUpdatWebhookSettings)
  };
}
