import { UserInputError } from "apollo-server-express";
import { sendMail } from "../../../common/mails.helper";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getCompanyAdminUsers,
  getCompanyOrCompanyNotFound,
  isCompanyMember
} from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import { userMails } from "../../mails";

const { UI_HOST, UI_URL_SCHEME } = process.env;

const sendMembershipRequestResolver: MutationResolvers["sendMembershipRequest"] = async (
  parent,
  { siret },
  context
) => {
  const user = checkIsAuthenticated(context);

  const company = await getCompanyOrCompanyNotFound({ siret });

  // check user is not already member of company
  const isMember = await isCompanyMember(user, company);
  if (isMember) {
    throw new UserInputError("Vous êtes déjà membre de cet établissement");
  }

  // check there is no existing membership request for this
  // user and company
  const alreadyRequested = await prisma.$exists.membershipRequest({
    user: { id: user.id },
    company: { id: company.id }
  });
  if (alreadyRequested) {
    throw new UserInputError(
      "Une demande de rattachement a déjà été faite pour cet établissement"
    );
  }

  const admins = await getCompanyAdminUsers(siret);
  const emails = admins.map(a => a.email);

  const membershipRequest = await prisma.createMembershipRequest({
    user: { connect: { id: user.id } },
    company: { connect: { id: company.id } },
    sentTo: { set: emails }
  });

  // send membership request to all admins of the company
  const recipients = admins.map(a => ({ email: a.email, name: a.name }));
  const membershipRequestLink = `${UI_URL_SCHEME}://${UI_HOST}/membership-request/${membershipRequest.id}`;
  await sendMail(
    userMails.membershipRequest(
      recipients,
      membershipRequestLink,
      user,
      company
    )
  );

  // send membership request confirmation to requester
  await sendMail(userMails.membershipRequestConfirmation(user, company));

  return {
    ...membershipRequest,
    email: user.email,
    siret: company.siret,
    name: company.name
  };
};

export default sendMembershipRequestResolver;
