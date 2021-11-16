import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import prisma from "../../../prisma";

const myApplication: QueryResolvers["myApplication"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const application = user.applicationId
    ? await prisma.application.findUnique({ where: { id: user.applicationId } })
    : null;

  return application;
};

export default myApplication;
