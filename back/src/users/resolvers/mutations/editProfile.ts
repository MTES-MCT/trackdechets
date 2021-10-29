import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import { MutationResolvers } from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { sanitizeEmail } from "../../../utils";

const editProfileResolver: MutationResolvers["editProfile"] = async (
  parent,
  { name, phone, email },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);

  const data = {
    ...(name ? { name } : {}),
    ...(phone ? { phone } : {}),
    ...(email ? { email: sanitizeEmail(email) } : {})
  };

  if (data.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new UserInputError(
        `L'adresse email "${email}" est associée à un compte existant.`
      );
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data
  });

  return {
    ...updatedUser,
    // companies are resolved through a separate resolver (User.companies)
    companies: []
  };
};

export default editProfileResolver;
