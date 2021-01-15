import prisma from "../../../prisma";
import {
  MutationEditProfileArgs,
  MutationResolvers
} from "../../../generated/graphql/types";
import { checkIsAuthenticated } from "../../../common/permissions";
import { applyAuthStrategies, AuthType } from "../../../auth";

/**
 * Edit user profile
 * Each field can be edited separately so we need to handle
 * undefined values
 * @param userId
 * @param payload
 */
export async function editProfileFn(
  userId: string,
  payload: MutationEditProfileArgs
) {
  const { name, phone, email } = payload;

  const data = {
    ...(name !== undefined ? { name } : {}),
    ...(phone !== undefined ? { phone } : {}),
    ...(email !== undefined ? { email } : {})
  };
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data
  });

  return {
    ...updatedUser,
    // companies are resolved through a separate resolver (User.companies)
    companies: []
  };
}

const editProfileResolver: MutationResolvers["editProfile"] = (
  parent,
  args,
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  return editProfileFn(user.id, args);
};

export default editProfileResolver;
