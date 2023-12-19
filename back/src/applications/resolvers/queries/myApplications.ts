import { QueryResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { UserInputError } from "../../../common/errors";

const myApplications: QueryResolvers["myApplications"] = async (
  _,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const applications = await prisma.user
    .findUnique({ where: { id: user.id } })
    .applications();

  if (!applications) {
    throw new UserInputError("Aucune application pour cet utilisateur.");
  }

  return applications;
};

export default myApplications;
