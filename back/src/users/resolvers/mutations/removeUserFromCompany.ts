import prisma from "src/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getCompanyAssociationOrNotFound } from "../../database";
import { checkIsCompanyAdmin } from "../../permissions";

const removeUserFromCompanyResolver: MutationResolvers["removeUserFromCompany"] = async (
  parent,
  { userId, siret },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret });
  await checkIsCompanyAdmin(user, company);
  const companyAssociation = await getCompanyAssociationOrNotFound({
    user: { id: userId },
    company: { id: company.id }
  });
  await prisma.companyAssociation.delete({
    where: { id: companyAssociation.id }
  });
  return prisma.company.findOne({ where: { siret } });
};

export default removeUserFromCompanyResolver;
