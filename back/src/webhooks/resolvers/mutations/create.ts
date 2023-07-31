import {
  MutationCreateWebhookSettingArgs,
  ResolversParentTypes
} from "../../../generated/graphql/types";
import { GraphQLContext } from "../../../types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getWebhookSettingRepository } from "../../repository";
import { formatWebhookSettingFromDB } from "../../converter";
import { getUserWebhookCompanyOrgIds } from "../../database";
import { validateWebhookCreateInput } from "../../validation";
import { aesEncrypt } from "../../../utils";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { UserInputError } from "../../../common/errors";

const createWebhookSettingResolver = async (
  _: ResolversParentTypes["Mutation"],
  args: MutationCreateWebhookSettingArgs,
  context: GraphQLContext
) => {
  const { input } = args;
  const user = checkIsAuthenticated(context);

  await validateWebhookCreateInput(input);

  const allowedCompaniesOrgIds = await getUserWebhookCompanyOrgIds({
    userId: user.id
  });

  const { companyId, endpointUri, token } = input;

  const company = await getCompanyOrCompanyNotFound({ id: companyId });

  if (!allowedCompaniesOrgIds.includes(company.orgId)) {
    throw new UserInputError(
      "Vous n'avez pas la permission de gérer les webhooks de cet établissement."
    );
  }

  if (!company) {
    throw new UserInputError(
      "Vous n'avez pas la permission de gérer les webhooks de cet établissement"
    );
  }
  const webhookSettingRepository = getWebhookSettingRepository(user);
  const hasWebhookSettings = await webhookSettingRepository.count({
    orgId: company.orgId
  });

  if (hasWebhookSettings) {
    throw new UserInputError(
      "Un webhook est déjà programmé pour cet établissement."
    );
  }

  const encryptedToken = aesEncrypt(token);

  const webhookSetting = await webhookSettingRepository.create({
    endpointUri,
    token: encryptedToken,
    activated: input.activated,
    orgId: company.orgId
  });

  return formatWebhookSettingFromDB(webhookSetting);
};

export default createWebhookSettingResolver;
