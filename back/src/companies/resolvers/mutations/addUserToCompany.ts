import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAdmin } from "../../../common/permissions";
import { prisma } from "@td/prisma";
import { getCompanyOrCompanyNotFound } from "../../database";
import { UserInputError } from "../../../common/errors";
import { GraphQLContext } from "../../../types";

export async function addUserToCompany(
  _,
  { input: { orgId, email, role } },
  context: GraphQLContext
) {
  applyAuthStrategies(context, [AuthType.Session]);
  checkIsAdmin(context);

  const company = await getCompanyOrCompanyNotFound({ orgId });

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    throw new UserInputError("Cet utilisateur n'existe pas");
  }

  const userIsPartOfOrg = await prisma.companyAssociation.findFirst({
    where: { companyId: company.id, userId: user.id }
  });

  if (userIsPartOfOrg) {
    throw new UserInputError(
      "Cet utilisateur appartient déjà à cette entreprise"
    );
  }

  await prisma.company.update({
    where: { id: company.id },
    data: {
      companyAssociations: {
        create: {
          userId: user.id,
          role,
          automaticallyAccepted: true
        }
      }
    }
  });

  return true;
}
