import { UserRole } from "@td/prisma";
import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { getCompanyActiveUsers } from "../../database";
import { checkIsAuthenticated } from "../../../common/permissions";
import type { MutationResolvers } from "@td/codegen-back";
import { deleteCachedUserRoles } from "../../../common/redis/users";
import { UserInputError } from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../converters";

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

  await prisma.$transaction(async tx => {
    await tx.companyAssociation.deleteMany({ where: { companyId: id } });
    await tx.membershipRequest.deleteMany({ where: { companyId: id } });
    await tx.company.delete({ where: { id } });

    await tx.event.create({
      data: {
        streamId: companyAssociation.company.orgId,
        actor: user.id,
        type: "CompanyDeleted",
        data: { content: { companyId: id } },
        metadata: { authType: user.auth }
      }
    });
  });

  return toGqlCompanyPrivate(companyAssociation.company);
};

export default deleteCompanyResolver;
