import { UserInputError } from "apollo-server-express";
import { WebhookSetting } from "@prisma/client";
import prisma from "../prisma";

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
