import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "@td/prisma";
import { sendMail } from "../../../mailer/mailing";
import { applyAuthStrategies, AuthType } from "../../../auth";
import {
  checkIsAdmin,
  checkIsAuthenticated
} from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { renderMail, inviteUserToJoin } from "@td/mail";
import { checkUserPermissions, Permission } from "../../../permissions";
import {
  NotCompanyAdminErrorMsg,
  UserInputError
} from "../../../common/errors";

const resendInvitationResolver: MutationResolvers["resendInvitation"] = async (
  parent,
  { email, siret },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ orgId: siret });
  let isTDAdmin = false;
  try {
    isTDAdmin = !!checkIsAdmin(context);
  } catch (error) {
    // do nothing
  }
  try {
    await checkUserPermissions(
      user,
      company.orgId,
      Permission.CompanyCanManageMembers,
      NotCompanyAdminErrorMsg(company.orgId)
    );
  } catch (error) {
    if (!isTDAdmin) {
      throw error;
    }
  }

  const invitations = await prisma.userAccountHash.findMany({
    where: { email, companySiret: siret }
  });

  if (invitations.length === 0) {
    throw new UserInputError("Invitation non trouvée");
  }

  const invitation = invitations[0];

  const mail = renderMail(inviteUserToJoin, {
    to: [{ email, name: email }],
    variables: {
      hash: invitation.hash,
      companyName: company.name,
      companyOrgId: siret
    }
  });
  await sendMail(mail);
  return true;
};

export default resendInvitationResolver;
