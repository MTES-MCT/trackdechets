import { WebhookSetting, Prisma } from "@td/prisma";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindManyWebhookSettingFn = (
  where: Prisma.WebhookSettingWhereInput,
  options?: Omit<Prisma.WebhookSettingFindManyArgs, "where">
) => Promise<WebhookSetting[]>;

export function buildFindManyWebhookSetting({
  prisma
}: ReadRepositoryFnDeps): FindManyWebhookSettingFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.webhookSetting.findMany(input);
  };
}
