import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { checkIsCompanyAdmin } from "../../permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { getUserAccountHashOrNotFound } from "../../database";

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
  await prisma.deleteUserAccountHash({ id: hash.id });
  return prisma.company({ siret });
};

export default deleteInvitationResolver;
