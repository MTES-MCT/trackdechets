import { applyAuthStrategies, AuthType } from "../../../auth";

import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";

import { checkIsCompanyAdmin } from "../../permissions";

import { inviteUserToCompanyFn } from "./inviteUserToCompanyService";

const inviteUserToCompanyResolver: MutationResolvers["inviteUserToCompany"] =
  async (parent, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const company = await getCompanyOrCompanyNotFound({ orgId: args.orgId });
    await checkIsCompanyAdmin(user, company);
    return inviteUserToCompanyFn(user, args);
  };

export default inviteUserToCompanyResolver;
