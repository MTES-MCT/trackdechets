import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "../../../generated/prisma-client";

const meResolver: QueryResolvers["me"] = (parent, args, context) => {
  const me = checkIsAuthenticated(context);
  return prisma.user({ id: me.id });
};

export default meResolver;
