import { Prisma } from "@prisma/client";
import { ReadRepositoryFnDeps } from "../../../common/repository/types";

export type FindUniqueWebhookSettingFn = (
  where: Prisma.WebhookSettingWhereUniqueInput,
  options?: Omit<Prisma.WebhookSettingFindUniqueArgs, "where">
) => Promise<any>;

export function buildFindUniqueWebhookSetting({
  prisma
}: ReadRepositoryFnDeps): FindUniqueWebhookSettingFn {
  return (where, options?) => {
    const input = { where, ...options };
    return prisma.webhookSetting.findUnique(input);
  };
}
