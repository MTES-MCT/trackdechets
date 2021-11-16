import { UserInputError } from "apollo-server-express";
import { UserRole } from "@prisma/client";
import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { convertUrls } from "../../database";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";

const deleteCompanyResolver: MutationResolvers["deleteCompany"] = async (
  _,
  { id },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const companyAssocation = await prisma.companyAssociation.findFirst({
    where: { companyId: id, userId: user.id, role: UserRole.ADMIN },
    include: { company: true }
  });

  if (companyAssocation == null) {
    throw new UserInputError(
      `Vous devez être administrateur d'un établissement pour pouvoir le supprimer`
    );
  }

  await prisma.companyAssociation.deleteMany({ where: { companyId: id } });
  await prisma.company.delete({ where: { id } });

  return convertUrls(companyAssocation.company);
};

export default deleteCompanyResolver;
