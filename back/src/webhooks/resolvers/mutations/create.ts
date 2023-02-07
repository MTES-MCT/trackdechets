import {
  MutationCreateWebhookSettingArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getWebhookSettingRepository } from "../../repository";
import { UserInputError } from "apollo-server-express";
import { formatWebhookSettingFromDB } from "../../converter";
import { getUserWebhookCompanyIds } from "../../database";
import prisma from "../../../prisma";
import { validateWebhookCreateInput } from "../../validation";
import { aesEncrypt } from "../../../utils";

import { setWebhookSetting } from "../../../common/redis/webhooksettings";

const createWebhookSettingResolver = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationCreateWebhookSettingArgs,
  context: GraphQLContext
) => {
  const { input } = args;
  const user = checkIsAuthenticated(context);

  await validateWebhookCreateInput(input);

  const allowedCompanies = await getUserWebhookCompanyIds({ userId: user.id });

  const { companyId, endpointUri, token } = input;

  if (!allowedCompanies.includes(companyId)) {
    throw new UserInputError(
      "Vous n'avez pas la permission de gérer les webhooks de cet établissement."
    );
  }

  const company = await prisma.company.findUnique({
    where: {
      id: companyId
    }
  });

  if (!company) {
    throw new UserInputError(
      "Vous n'avez pas la permission de gérer les webhooks de cet établissement"
    );
  }
  const webhookSettingRepository = getWebhookSettingRepository(user);
  const hasWebhookSettings = await webhookSettingRepository.count({
    companyId
  });

  if (hasWebhookSettings) {
    throw new UserInputError(
      "Un webhook est déjà programmé pour cet établissement."
    );
  }

  const encryptedToken = aesEncrypt(token);

  const webhookSetting = await webhookSettingRepository.create({
    company: { connect: { id: companyId } },
    endpointUri,
    token: encryptedToken,
    activated: input.activated,
    orgId: company.orgId
  });

  if (webhookSetting.activated) {
    await setWebhookSetting(webhookSetting);
  }
  return formatWebhookSettingFromDB(webhookSetting);
};

export default createWebhookSettingResolver;
