import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "../../../generated/prisma-client";

const meResolver: QueryResolvers["me"] = async (parent, args, context) => {
  const me = checkIsAuthenticated(context);
  const user = await prisma.user({ id: me.id });

  return {
    ...user,
    // companies are resolved through a separate resolver (User.companies)
    companies: []
  };
};

export default meResolver;
