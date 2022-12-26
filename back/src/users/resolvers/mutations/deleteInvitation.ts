import prisma from "../../../prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  convertUrls,
  getCompanyOrCompanyNotFound
} from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getUserAccountHashOrNotFound } from "../../database";
import { checkIsCompanyAdmin } from "../../permissions";

const deleteInvitationResolver: MutationResolvers["deleteInvitation"] = async (
  parent,
  { email, orgId },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ orgId });
  await checkIsCompanyAdmin(user, company);
  const hash = await getUserAccountHashOrNotFound({
    email,
    companyId: company.id
  });
  await prisma.userAccountHash.delete({ where: { id: hash.id } });
  const dbCompany = await prisma.company.findUnique({
    where: { id: company.id }
  });
  return convertUrls(dbCompany);
};

export default deleteInvitationResolver;
