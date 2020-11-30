import { UserInputError } from "apollo-server-express";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { sendMail } from "../../../mailer/mailing";
import { userMails } from "../../mails";
import { applyAuthStrategies, AuthType } from "../../../auth";
import { checkIsAuthenticated } from "../../../common/permissions";
import { getCompanyOrCompanyNotFound } from "../../../companies/database";

const resendInvitationResolver: MutationResolvers["resendInvitation"] = async (
  parent,
  { email, siret },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);
  const user = checkIsAuthenticated(context);
  const company = await getCompanyOrCompanyNotFound({ siret });

  const invitations = await prisma.userAccountHashes({
    where: { email, companySiret: siret }
  });

  if (invitations.length === 0) {
    throw new UserInputError("Invitation non trouvée");
  }
  await sendMail(
    userMails.inviteUserToJoin(
      email,
      user.name,
      company.name,
      invitations[0].hash
    )
  );
  return true;
};

export default resendInvitationResolver;
