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
import { getEmailDomain, canSeeEmail } from "../../utils";

const sendMembershipRequestResolver: MutationResolvers["sendMembershipRequest"] =
  async (parent, { siret }, context) => {
    const user = checkIsAuthenticated(context);

    const company = await getCompanyOrCompanyNotFound({ orgId: siret });

    // check user is not already member of company
    const isMember = await isCompanyMember(user, company);
    if (isMember) {
      throw new UserInputError("Vous êtes déjà membre de cet établissement");
    }
    const admins = await getCompanyAdminUsers(siret);
    const adminEmails = admins.map(a => a.email);
    const userEmailDomain = getEmailDomain(user?.email);
    const displayableAdminEmails = adminEmails
      .filter(email => canSeeEmail(email, userEmailDomain))
      .join(", ");
    // check there is no existing membership request for this
    // user and company
    const alreadyRequested = await prisma.membershipRequest.findFirst({
      where: {
        user: { id: user.id },
        company: { id: company.id }
      }
    });
    if (alreadyRequested) {
      const adminEmailsText = !!displayableAdminEmails
        ? ` Vous pouvez contacter directement: ${displayableAdminEmails}`
        : "";
      throw new UserInputError(
        `Une demande de rattachement a déjà été faite pour cet établissement.${adminEmailsText}`
      );
    }

    const emails = admins.map(a => a.email);

    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        sentTo: emails
      }
    });

    // send membership request to all admins of the company
    const recipients = admins.map(a => ({ email: a.email, name: a.name! }));

    await sendMail(
      renderMail(membershipRequestMail, {
        to: recipients,
        variables: {
          userEmail: user.email,
          companyName: company.name,
          companySiret: company.orgId,
          membershipRequestId: membershipRequest.id
        }
      })
    );

    // send membership request confirmation to requester
    // Iot let him/her know about admin emails, we filter them (same domain name, no public email providers)

    const adminEmailsInfo = !!displayableAdminEmails
      ? `Si vous n'avez pas de retour au bout de quelques jours, vous pourrez contacter: ${displayableAdminEmails}`
      : "";

    await sendMail(
      renderMail(membershipRequestConfirmation, {
        to: [{ email: user.email, name: user.name }],
        variables: {
          companyName: company.name,
          companySiret: company.orgId,
          adminEmailsInfo: adminEmailsInfo
        }
      })
    );

    return {
      ...membershipRequest,
      email: user.email,
      siret: company.orgId,
      name: company.name
    };
  };

export default sendMembershipRequestResolver;
