import { UserInputError } from "apollo-server-express";
import prisma from "../../../prisma";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getCompanyAdminUsers,
  getCompanyOrCompanyNotFound,
  isCompanyMember
} from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import { renderMail } from "../../../mailer/templates/renderers";
import {
  membershipRequest as membershipRequestMail,
  membershipRequestConfirmation
} from "../../../mailer/templates";

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
  const alreadyRequested = await prisma.membershipRequest.findFirst({
    where: {
      user: { id: user.id },
      company: { id: company.id }
    }
  });
  if (alreadyRequested) {
    throw new UserInputError(
      "Une demande de rattachement a déjà été faite pour cet établissement"
    );
  }

  const admins = await getCompanyAdminUsers(siret);
  const emails = admins.map(a => a.email);

  const membershipRequest = await prisma.membershipRequest.create({
    data: {
      user: { connect: { id: user.id } },
      company: { connect: { id: company.id } },
      sentTo: emails
    }
  });

  // send membership request to all admins of the company
  const recipients = admins.map(a => ({ email: a.email, name: a.name }));
  const membershipRequestLink = `${UI_URL_SCHEME}://${UI_HOST}/membership-request/${membershipRequest.id}`;

  await sendMail(
    renderMail(membershipRequestMail, {
      to: recipients,
      variables: {
        userEmail: user.email,
        companyName: company.name,
        companySiret: company.siret,
        membershipRequestLink
      }
    })
  );

  // send membership request confirmation to requester
  await sendMail(
    renderMail(membershipRequestConfirmation, {
      to: [{ email: user.email, name: user.name }],
      variables: { companyName: company.name, companySiret: company.siret }
    })
  );

  return {
    ...membershipRequest,
    email: user.email,
    siret: company.siret,
    name: company.name
  };
};

export default sendMembershipRequestResolver;
