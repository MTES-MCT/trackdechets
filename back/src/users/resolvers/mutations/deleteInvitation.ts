import { prisma } from "@td/prisma";
import { applyAuthStrategies, AuthType } from "../../../auth/auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import type { MutationResolvers } from "@td/codegen-back";
import { getUserAccountHashOrNotFound } from "../../database";
import {
  checkUserIsAdminOrPermissions,
  Permission
} from "../../../permissions";
import { NotCompanyAdminErrorMsg } from "../../../common/errors";
import { toGqlCompanyPrivate } from "../../../companies/converters";

const deleteInvitationResolver: MutationResolvers["deleteInvitation"] = async (
  parent,
  { email, siret },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ orgId: siret });
  await checkUserIsAdminOrPermissions(
    user,
    company.orgId,
    Permission.CompanyCanManageMembers,
    NotCompanyAdminErrorMsg(company.orgId)
  );

  const hash = await getUserAccountHashOrNotFound({
    email,
    companySiret: siret
  });
  await prisma.userAccountHash.delete({ where: { id: hash.id } });
  const dbCompany = await prisma.company.findUnique({
    where: { orgId: siret }
  });
  return toGqlCompanyPrivate(dbCompany!);
};

export default deleteInvitationResolver;
