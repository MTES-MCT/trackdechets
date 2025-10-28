import { WebhookSetting } from "@td/prisma";
import { prisma } from "@td/prisma";
import { UserInputError } from "../common/errors";

/**
 * Retrieve active WebhookSettings associated to and orgId
 * @param orgId
 * @returns WebhookSetting[]
 */
export async function getCompanyWebhookSettingsByOrgId({
  orgId
}: {
  orgId: string;
}): Promise<WebhookSetting[]> {
  if (!orgId) {
    throw new UserInputError("You should specify an orgId");
  }

  return prisma.webhookSetting.findMany({
    where: { orgId, activated: true }
  });
}
