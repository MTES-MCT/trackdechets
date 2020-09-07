import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyAdmin } from "../../permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { getCompanyAssociationOrNotFound } from "../../database";

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
  await prisma.deleteCompanyAssociation({ id: companyAssociation.id });
  return prisma.company({ siret });
};

export default removeUserFromCompanyResolver;
