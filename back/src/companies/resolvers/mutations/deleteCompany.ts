import { UserRole } from "@prisma/client";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { convertUrls, getCompanyActiveUsers } from "../../database";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { deleteCachedUserRoles } from "../../../common/redis/users";
import { UserInputError } from "../../../common/errors";

const deleteCompanyResolver: MutationResolvers["deleteCompany"] = async (
  _,
  { id },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const companyAssociation = await prisma.companyAssociation.findFirst({
    where: { companyId: id, userId: user.id, role: UserRole.ADMIN },
    include: { company: true }
  });

  if (companyAssociation == null) {
    throw new UserInputError(
      `Vous devez être administrateur d'un établissement pour pouvoir le supprimer`
    );
  }

  const associatedUsers = await getCompanyActiveUsers(
    companyAssociation.company.orgId
  );

  // clear cache

  await Promise.all(
    associatedUsers.map(user => deleteCachedUserRoles(user.id))
  );

  await prisma.companyAssociation.deleteMany({ where: { companyId: id } });
  await prisma.membershipRequest.deleteMany({ where: { companyId: id } });
  await prisma.company.delete({ where: { id } });

  return convertUrls(companyAssociation.company);
};

export default deleteCompanyResolver;
