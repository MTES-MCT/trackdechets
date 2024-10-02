import { prisma } from "@td/prisma";
import { sendMail } from "../../../mailer/mailing";
import { checkIsAuthenticated } from "../../../common/permissions";
import {
  getCompanyAdminUsers,
  getCompanyOrCompanyNotFound,
  isCompanyMember
} from "../../../companies/database";
import { MutationResolvers } from "../../../generated/graphql/types";
import {
  renderMail,
  membershipRequest as membershipRequestMail,
  membershipRequestConfirmation
} from "@td/mail";
import { getEmailDomain, canSeeEmail } from "../../utils";
import { UserInputError } from "../../../common/errors";
import { getMailNotificationSubscribers } from "../../notifications";
import { UserNotification } from "@prisma/client";

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

    const subscribers = await getMailNotificationSubscribers(
      UserNotification.MEMBERSHIP_REQUEST,
      [siret]
    );

    const membershipRequest = await prisma.membershipRequest.create({
      data: {
        user: { connect: { id: user.id } },
        company: { connect: { id: company.id } },
        sentTo: subscribers.map(r => r.email)
      }
    });

    await sendMail(
      renderMail(membershipRequestMail, {
        to: subscribers,
        variables: {
          userEmail: user.email,
          companyName: company.name,
          companySiret: company.orgId,
          companyGivenName: company.givenName,
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
