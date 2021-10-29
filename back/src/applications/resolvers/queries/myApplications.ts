import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import prisma from "../../../prisma";

const myApplications: QueryResolvers["myApplications"] = async (
  _,
  args,
  context
) => {
  const user = checkIsAuthenticated(context);
  const applications = await prisma.application.findMany({
    where: {
      admins: {
        some: {
          id: user.id
        }
      }
    }
  });

  return applications;
};

export default myApplications;
