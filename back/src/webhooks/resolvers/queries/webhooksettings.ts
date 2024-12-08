import { checkIsAuthenticated } from "../../../common/permissions";
import { GraphQLContext } from "../../../types";
import { getConnection } from "../../../common/pagination";
import type { QueryResolvers } from "@td/codegen-back";
import { getWebhookSettingRepository } from "../../repository";
import { formatWebhookSettingFromDB } from "../../converter";
import { getUserWebhookCompanyOrgIds } from "../../database";

const webhookSettingsResolver: QueryResolvers["webhooksettings"] = async (
  _,
  args,
  context: GraphQLContext
) => {
  const user = checkIsAuthenticated(context);

  const { ...gqlPaginationArgs } = args;

  // ensure query returns only webhookConfigs belonging to current user
  const companyOrgIds = await getUserWebhookCompanyOrgIds({ userId: user.id });

  const where = { orgId: { in: companyOrgIds } };
  const webhookSettingRepository = getWebhookSettingRepository(user);

  const totalCount = await webhookSettingRepository.count(where);

  return getConnection({
    totalCount,
    findMany: prismaPaginationArgs =>
      webhookSettingRepository.findMany(where, {
        ...prismaPaginationArgs,
        orderBy: { createdAt: "desc" }
      }),
    formatNode: formatWebhookSettingFromDB,
    ...gqlPaginationArgs
  });
};

export default webhookSettingsResolver;
