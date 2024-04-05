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

  if (!allowedCompaniesOrgIds.includes(company.orgId) || !company) {
    throw new UserInputError(
      "Vous n'avez pas la permission de gérer les webhooks de cet établissement."
    );
  }

  const webhookSettingRepository = getWebhookSettingRepository(user);
  const companyWebhookSettings = await webhookSettingRepository.findMany(
    { orgId: company.orgId },
    { select: { endpointUri: true } }
  );
  if (companyWebhookSettings.length >= company.webhookSettingsLimit) {
    throw new UserInputError(
      "Cet établissement ne peut pas créer davantage de webhooks."
    );
  }

  if (
    companyWebhookSettings.find(
      settings => settings.endpointUri === endpointUri
    )
  ) {
    throw new UserInputError(
      `Cet établissement a déjà un webhook avec l'endpoint "${endpointUri}"`
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
