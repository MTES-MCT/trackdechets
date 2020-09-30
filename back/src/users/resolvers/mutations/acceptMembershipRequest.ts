import { applyAuthStrategies, AuthType } from "../../../auth";
import { sendMail } from "../../../common/mails.helper";
import { checkIsAuthenticated } from "../../../common/permissions";
import { MutationResolvers } from "../../../generated/graphql/types";
import { prisma } from "../../../generated/prisma-client";
import {
  associateUserToCompany,
  getMembershipRequestOrNotFoundError
} from "../../database";
import {
  InvitationRequestAlreadyAccepted,
  InvitationRequestAlreadyRefused
} from "../../errors";
import { userMails } from "../../mails";
import { checkIsCompanyAdmin } from "../../permissions";

const acceptMembershipRequestResolver: MutationResolvers["acceptMembershipRequest"] = async (
  parent,
  { id, role },
  context
) => {
  applyAuthStrategies(context, [AuthType.Session]);

  const user = checkIsAuthenticated(context);

  // throw error if invitation does not exist
  const membershipRequest = await getMembershipRequestOrNotFoundError({ id });

  const company = await prisma
    .membershipRequest({ id: membershipRequest.id })
    .company();

  // check authenticated user is admin of the company
  await checkIsCompanyAdmin(user, company);

  // throw error if invitation was already accepted
  if (membershipRequest.status === "ACCEPTED") {
    throw new InvitationRequestAlreadyAccepted();
  }

  // throw error if invitation was already refused
  if (membershipRequest.status === "REFUSED") {
    throw new InvitationRequestAlreadyRefused();
  }

  const requester = await prisma
    .membershipRequest({ id: membershipRequest.id })
    .user();

  // associate invitation requester to company with the role decided by the admin
  await associateUserToCompany(requester.id, company.siret, role);

  await prisma.updateMembershipRequest({
    where: { id },
    data: {
      status: "ACCEPTED",
      statusUpdatedBy: user.email
    }
  });

  // notify requester of acceptance
  await sendMail(userMails.membershipRequestAccepted(requester, company));

  return prisma.company({ id: company.id });
};

export default acceptMembershipRequestResolver;
