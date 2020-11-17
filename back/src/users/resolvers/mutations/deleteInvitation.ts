import prisma from "src/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { getUserAccountHashOrNotFound } from "../../database";
import { checkIsCompanyAdmin } from "../../permissions";

const deleteInvitationResolver: MutationResolvers["deleteInvitation"] = async (
  parent,
  { email, siret },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret });
  await checkIsCompanyAdmin(user, company);
  const hash = await getUserAccountHashOrNotFound({
    email,
    companySiret: siret
  });
  await prisma.userAccountHash.delete({ where: { id: hash.id } });
  return prisma.company.findOne({ where: { siret } });
};

export default deleteInvitationResolver;
