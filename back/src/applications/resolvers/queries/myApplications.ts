import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import prisma from "../../../prisma";

const myApplications: QueryResolvers["myApplications"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  return prisma.user.findFirst({ where: { id: user.id } }).applications();
};

export default myApplications;
