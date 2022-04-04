import { QueryResolvers } from "@trackdechets/codegen/src/back.gen";
import { checkIsAuthenticated } from "../../../common/permissions";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";

const myApplications: QueryResolvers["myApplications"] = async (
  _,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  return prisma.user.findUnique({ where: { id: user.id } }).applications();
};

export default myApplications;
