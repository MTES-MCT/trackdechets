import prisma from "src/prisma";
import { checkIsAuthenticated } from "../../../common/permissions";
import { QueryResolvers } from "../../../generated/graphql/types";

const meResolver: QueryResolvers["me"] = async (parent, args, context) => {
  const me = checkIsAuthenticated(context);
  const user = await prisma.user.findUnique({ where: { id: me.id } });

  return {
    ...user,
    // companies are resolved through a separate resolver (User.companies)
    companies: []
  };
};

export default meResolver;
