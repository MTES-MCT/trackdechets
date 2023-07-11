import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";

const meResolver: QueryResolvers["me"] = async (parent, args, context) => {
  const user = checkIsAuthenticated(context);

  return {
    ...user,
    // companies are resolved through a separate resolver (User.companies)
    companies: [],
    featureFlags: []
  };
};

export default meResolver;
