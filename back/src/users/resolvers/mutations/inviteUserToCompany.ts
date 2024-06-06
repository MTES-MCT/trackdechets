import { applyAuthStrategies, AuthType } from "../../../auth";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";

import {
  checkIsAdmin,
  checkIsAuthenticated
} from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkUserPermissions, Permission } from "../../../permissions";
import { inviteUserToCompanyFn } from "./inviteUserToCompanyService";

const inviteUserToCompanyResolver: MutationResolvers["inviteUserToCompany"] =
  async (parent, args, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const company = await getCompanyOrCompanyNotFound({ orgId: args.siret });
    let isTDAdmin = false;
    try {
      isTDAdmin = !!checkIsAdmin(context);
    } catch (error) {
      // do nothing
    }
    try {
      await checkUserPermissions(
        user,
        company.orgId,
        Permission.CompanyCanManageMembers,
        NotCompanyAdminErrorMsg(company.orgId)
      );
    } catch (error) {
      if (!isTDAdmin) {
        throw error;
      }
    }

    return inviteUserToCompanyFn(args);
  };

export default inviteUserToCompanyResolver;
