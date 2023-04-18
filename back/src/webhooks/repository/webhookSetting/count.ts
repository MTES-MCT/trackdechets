import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type CountWebhookSettingFn = (
  where: Prisma.WebhookSettingWhereInput
) => Promise<number>;

export function buildCountWebhookSettings({
  prisma
}: ReadRepositoryFnDeps): CountWebhookSettingFn {
  return where => {
    return prisma.webhookSetting.count({ where });
  };
}
