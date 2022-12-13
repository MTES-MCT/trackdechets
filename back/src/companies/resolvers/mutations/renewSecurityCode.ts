import { applyAuthStrategies, AuthType } from "../../../auth";

import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsCompanyAdmin } from "../../../users/permissions";

import { getCompanyOrCompanyNotFound } from "../../database";

import { renewSecurityCodeFn } from "./renewSecurityCodeService";

const renewSecurityCodeResolver: MutationResolvers["renewSecurityCode"] =
  async (parent, { siret }, context) => {
    applyAuthStrategies(context, [AuthType.Session]);
    const user = checkIsAuthenticated(context);
    const company = await getCompanyOrCompanyNotFound({ siret });
    await checkIsCompanyAdmin(user, company);
    return renewSecurityCodeFn(siret);
  };

export default renewSecurityCodeResolver;
