import { UserInputError } from "apollo-server-express";
import { MutationResolvers } from "../../../generated/graphql/types";
import prisma from "../../../prisma";
import { sendMail } from "../../../mailer/mailing";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";
import { renderMail } from "../../../mailer/templates/renderers";
import { inviteUserToJoin } from "../../../mailer/templates";
import { checkIsCompanyAdmin } from "../../permissions";

const resendInvitationResolver: MutationResolvers["resendInvitation"] = async (
  parent,
  { email, siret },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ orgId: siret });
  await checkIsCompanyAdmin(user, company);

  const invitations = await prisma.userAccountHash.findMany({
    where: { email, companySiret: siret }
  });

  if (invitations.length === 0) {
    throw new UserInputError("Invitation non trouvée");
  }

  const invitation = invitations[0];

  const mail = renderMail(inviteUserToJoin, {
    to: [{ email, name: email }],
    variables: { hash: invitation.hash, companyName: company.name }
  });
  await sendMail(mail);
  return true;
};

export default resendInvitationResolver;
