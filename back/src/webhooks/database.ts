import { WebhookSettingNotFound } from "./errors";
import { UserInputError } from "apollo-server-express";
import { getReadonlyWebhookSettingRepository } from "./repository";
import { WebhookSetting, Company } from "@prisma/client";
import prisma from "../prisma";

/**
 * Retrieves a webhookConfig by id or throw a WebhookSettingNotFound error
 */
export async function getWebhookSettingOrNotFound({
  id
}: {
  id: string;
}): Promise<WebhookSetting> {
  if (!id) {
    throw new UserInputError("You should specify an id");
  }

  const webhookConfigRepository = getReadonlyWebhookSettingRepository();
  const webhookConfig = await webhookConfigRepository.findUnique({
    id
  });

  if (webhookConfig == null) {
    throw new WebhookSettingNotFound(id.toString());
  }
  return webhookConfig;
}

export async function getUserWebhookCompanies({
  userId
}: {
  userId: string;
}): Promise<Company[]> {
  if (!userId) {
    throw new UserInputError("You should specify an id");
  }

  const associations = await prisma.companyAssociation.findMany({
    where: { userId: userId, role: "ADMIN" },
    include: { company: true }
  });

  return associations.map(a => a.company);
}

export async function getUserWebhookCompanyIds({
  userId
}: {
  userId: string;
}): Promise<string[]> {
  if (!userId) {
    throw new UserInputError("You should specify an id");
  }

  const associations = await prisma.companyAssociation.findMany({
    where: { userId: userId, role: "ADMIN" },
    select: { companyId: true }
  });

  return associations.map(a => a.companyId);
}
