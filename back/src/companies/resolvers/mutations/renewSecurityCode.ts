import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "@td/codegen-back";
import { checkUserPermissions, Permission } from "../../../permissions";
import { getCompanyOrCompanyNotFound } from "../../database";
import { renewSecurityCodeFn } from "./renewSecurityCodeService";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";

const renewSecurityCodeResolver: MutationResolvers["renewSecurityCode"] =
  async (parent, { siret }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const company = await getCompanyOrCompanyNotFound(
      { orgId: siret },
      { orgId: true }
    );

    await checkUserPermissions(
      user,
      company.orgId,
      Permission.CompanyCanRenewSecurityCode,
      NotCompanyAdminErrorMsg(company.orgId)
    );
    return renewSecurityCodeFn(siret);
  };

export default renewSecurityCodeResolver;
